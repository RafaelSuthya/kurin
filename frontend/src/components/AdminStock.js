import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Sidebar from './Sidebar';
// navigate tidak digunakan di komponen ini

// Gunakan fallback proxy CRA: jika REACT_APP_API_URL kosong, pakai path relatif '/api'
const API_BASE = (process.env.REACT_APP_API_URL || '').trim();
const API_URL = API_BASE ? `${API_BASE}/api` : '/api';
const BASE_URL = API_URL.replace(/\/api$/, '');
const STORAGE_BASE = `${BASE_URL}/storage`;

export default function AdminStock() {
  const [products, setProducts] = useState([]);
  const [originalStocks, setOriginalStocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [selectedVariantById, setSelectedVariantById] = useState({}); // { [productId]: index }

  const token = localStorage.getItem('adminToken');
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }), [token]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/products?per_page=500`, { headers: getHeaders() });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setProducts(arr.map(p => ({ ...p, stock: parseInt(p.stock || 0) })));
      const map = {};
      arr.forEach(p => { map[p.id] = parseInt(p.stock || 0); });
      setOriginalStocks(map);
      // Inisialisasi pilihan varian warna per produk (pakai indeks pertama jika tersedia)
      const selMap = {};
      arr.forEach(p => {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        const colorVars = variants.filter(v => (v.color || '').trim());
        if (colorVars.length > 0) selMap[p.id] = 0;
      });
      setSelectedVariantById(selMap);
    } catch (e) {
      console.error('Fetch products error:', e);
      setError('Gagal memuat produk');
    }
    setLoading(false);
  }, [getHeaders]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const changedItems = useMemo(() => {
    const out = [];
    products.forEach(p => {
      const orig = originalStocks[p.id];
      if (orig !== undefined && parseInt(p.stock) !== parseInt(orig)) {
        out.push({ id: p.id, name: p.name, stock: parseInt(p.stock) });
      }
    });
    return out;
  }, [products, originalStocks]);

  const updateOne = async (item) => {
    if (savingId) return;
    setSavingId(item.id);
    setError(null);
    try {
      await fetch(`${API_URL}/admin/products/${item.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(item.body || { stock: item.stock })
      });
      if (typeof item.stock === 'number') {
        setOriginalStocks(prev => ({ ...prev, [item.id]: item.stock }));
      }
    } catch (e) {
      console.error('Update stock error:', e);
      setError('Gagal menyimpan perubahan stok');
    }
    setSavingId(null);
  };

  const isVideoSrc = (s) => typeof s === 'string' && (/^data:video\//.test(s) || /\.(mp4|webm|mov|avi)(\?.*)?$/i.test(s));
  const fmtImage = (img) => {
    if (!img) return null;
    const s = String(img);
    // Data URL (base64) langsung dipakai
    if (s.startsWith('data:image/')) return s;
    if (s.startsWith('http')) return s;
    if (s.startsWith('/storage/')) return `${BASE_URL}${s}`;
    if (s.startsWith('storage/')) return `${BASE_URL}/${s}`;
    if (s.startsWith('/kurinproduk/')) return s; // served by frontend public
    if (s.startsWith('/')) return `${BASE_URL}${s}`;
    return `${STORAGE_BASE}/${s.replace(/^\//,'')}`;
  };

  const getDisplayImage = (p) => {
    const arr = Array.isArray(p.images) ? p.images : [];
    const firstNonVideo = arr.find((m) => !isVideoSrc(m));
    return fmtImage(firstNonVideo) || '/kurin.png';
  };

  const getColorVariants = (p) => {
    const vars = Array.isArray(p.variants) ? p.variants : [];
    return vars.filter(v => (v.color || '').trim());
  };

  const sumVariantStock = (variants) => {
    return (Array.isArray(variants) ? variants : []).reduce((t, v) => t + parseInt(v.stock || 0), 0);
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <div style={{ flex:1, background:'#fff' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 30px', borderBottom:'1px solid #f0f0f0' }}>
          <div>
            <h1 style={{ fontSize: '28px', margin: 0, fontWeight: 'normal' }}>Kelola Stok</h1>
            <p style={{ margin:'5px 0 0', color:'#666' }}>Atur jumlah stok per produk</p>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <a href="/" style={{ background:'#e52b2b', color:'#fff', padding:'10px 14px', borderRadius:8, textDecoration:'none', fontWeight:700 }}>Website</a>
          </div>
        </div>

        {error && (
          <div style={{ color:'#c33', padding:'10px 16px' }}>{error}</div>
        )}

        {/* Tabel Stok */}
        <div style={{ margin: 20 }}>
          <div style={{ background:'#e52b2b', color:'#fff', borderRadius:10, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: 12, textAlign:'left', width: 600 }}>Produk</th>
                  <th style={{ padding: 12, textAlign:'left', width: 200 }}>Stok</th>
                  <th style={{ padding: 12, textAlign:'left', width: 160 }}>Aksi</th>
                </tr>
              </thead>
              <tbody style={{ background:'#fff', color:'#333' }}>
                {loading && (
                  <tr><td colSpan={3} style={{ padding: 12, textAlign:'center' }}>Memuat data...</td></tr>
                )}
                {!loading && products.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: 12, textAlign:'center' }}>Belum ada produk</td></tr>
                )}
                {!loading && products.map(p => (
                  <tr key={p.id} style={{ borderTop:'1px solid #eee' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                        {/* Gambar produk */}
                        {Array.isArray(p.images) && p.images.length > 0 ? (
                          <img src={getDisplayImage(p)} alt={p.name} style={{ width:60, height:60, objectFit:'cover', borderRadius:6, flex:'0 0 60px' }} />
                        ) : (
                          <img src={'/kurin.png'} alt={p.name} style={{ width:60, height:60, objectFit:'cover', borderRadius:6, flex:'0 0 60px', background:'#fff' }} />
                        )}
                        <div style={{ fontWeight: 500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      {getColorVariants(p).length > 0 ? (
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 140px', gap:8, alignItems:'center' }}>
                          <select
                            value={selectedVariantById[p.id] ?? 0}
                            onChange={(e) => {
                              const idx = parseInt(e.target.value || 0);
                              setSelectedVariantById(prev => ({ ...prev, [p.id]: idx }));
                            }}
                            style={{ padding:'8px 10px', border:'1px solid #ddd', borderRadius:6 }}
                          >
                            {getColorVariants(p).map((v, idx) => (
                              <option key={idx} value={idx}>{String(v.color).trim()}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={parseInt(getColorVariants(p)[selectedVariantById[p.id] ?? 0]?.stock || 0)}
                            onChange={(e) => {
                              const val = parseInt(e.target.value || 0);
                              setProducts(prev => prev.map(x => {
                                if (x.id !== p.id) return x;
                                const idx = selectedVariantById[p.id] ?? 0;
                                // Update stok pada varian yang dipilih
                                const updatedVariants = (Array.isArray(x.variants) ? x.variants : []).map(v => ({...v}));
                                // Cari varian berdasarkan warna yang cocok dengan dropdown
                                let seen = 0;
                                for (let i=0;i<updatedVariants.length;i++) {
                                  const v = updatedVariants[i];
                                  if ((v.color || '').trim()) {
                                    if (seen === idx) { updatedVariants[i] = { ...v, stock: val }; break; }
                                    seen++;
                                  }
                                }
                                // Opsional: update stok total produk = jumlah stok varian
                                const newTotal = sumVariantStock(updatedVariants);
                                return { ...x, variants: updatedVariants, stock: newTotal };
                              }));
                            }}
                            style={{ width: 140, padding:'8px 10px', border:'1px solid #ddd', borderRadius:6 }}
                          />
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={p.stock}
                          onChange={(e) => {
                            const val = parseInt(e.target.value || 0);
                            setProducts(prev => prev.map(x => x.id===p.id ? { ...x, stock: val } : x));
                          }}
                          style={{ width: 140, padding:'8px 10px', border:'1px solid #ddd', borderRadius:6 }}
                        />
                      )}
                    </td>
                    <td style={{ padding: 12 }}>
                      {getColorVariants(p).length > 0 ? (
                        <button
                          onClick={() => {
                            const updated = products.find(x => x.id===p.id);
                            const updatedVariants = (Array.isArray(updated?.variants) ? updated.variants : []).map(v => ({...v}));
                            // total stok sebagai jumlah varian
                            const newTotal = sumVariantStock(updatedVariants);
                            updateOne({ id: p.id, body: { variants: updatedVariants, stock: newTotal } });
                          }}
                          disabled={savingId === p.id}
                          style={{ background:'#e52b2b', color:'#fff', border:'none', borderRadius:6, padding:'8px 12px', cursor: savingId===p.id ? 'not-allowed' : 'pointer' }}
                        >{savingId===p.id ? 'Menyimpan...' : 'Update'}</button>
                      ) : (
                        <button
                          onClick={() => updateOne({ id: p.id, stock: parseInt(p.stock || 0) })}
                          disabled={savingId === p.id}
                          style={{ background:'#e52b2b', color:'#fff', border:'none', borderRadius:6, padding:'8px 12px', cursor: savingId===p.id ? 'not-allowed' : 'pointer' }}
                        >{savingId===p.id ? 'Menyimpan...' : 'Update'}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Info perubahan */}
          <div style={{ marginTop: 12, color:'#666' }}>
            {changedItems.length>0 ? (
              <span>{changedItems.length} produk berubah.</span>
            ) : (
              <span>Tidak ada perubahan.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}