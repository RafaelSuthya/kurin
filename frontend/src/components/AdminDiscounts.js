import React, { useEffect, useState } from 'react';
import { API_URL } from '../api/admin';
import '../admin.css';
import Sidebar from './Sidebar';

const formatRupiah = (num) => {
  const n = Number(num || 0);
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);
};

const computeDiscounted = (product) => {
  const base = Number(product?.price || 0);
  const dp = product?.discount_price != null ? Number(product.discount_price) : NaN;
  const pct = product?.discount_percent != null ? Number(product.discount_percent) : NaN;
  if (product?.discount_active) {
    if (!isNaN(dp) && dp > 0) return Math.min(base, dp);
    if (!isNaN(pct) && pct > 0) return Math.max(0, base - (pct / 100) * base);
  }
  return base;
};

export default function AdminDiscounts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState({}); // { [id]: { price: '', percent: '' } }

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/products`, { headers: { 'Accept': 'application/json' }, signal: controller.signal });
        const data = await res.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setProducts(list);
      } catch (e) {
        if (e?.name !== 'AbortError') setError('Gagal memuat produk');
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, []);

  const setEdit = (id, field, value) => {
    setEditing(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  };

  const onUpdate = async (p) => {
    const edit = editing[p.id] || {};
    let discount_price = edit.price !== undefined && edit.price !== '' ? Number(edit.price) : undefined;
    let discount_percent = edit.percent !== undefined && edit.percent !== '' ? Number(edit.percent) : undefined;
    const base = Number(p.price || 0);

    
    if ((discount_price === undefined || isNaN(discount_price)) && !isNaN(discount_percent)) {
      discount_price = Math.max(0, base - (discount_percent / 100) * base);
    }

    const payload = {
      discount_active: true,
    };
    if (!isNaN(discount_price)) payload.discount_price = discount_price;
    if (!isNaN(discount_percent)) payload.discount_percent = discount_percent;

    try {
      const res = await fetch(`${API_URL}/admin/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) { alert(json?.message || 'Gagal mengupdate diskon'); return; }
      alert('Diskon berhasil diupdate');
      setProducts(prev => prev.map(x => x.id === p.id ? json : x));
    } catch (e) {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const onRemove = async (p) => {
    try {
      const res = await fetch(`${API_URL}/admin/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ discount_active: false, discount_price: null, discount_percent: null })
      });
      const json = await res.json();
      if (!res.ok) { alert(json?.message || 'Gagal menghapus diskon'); return; }
      alert('Diskon dinonaktifkan');
      setProducts(prev => prev.map(x => x.id === p.id ? json : x));
      setEditing(prev => ({ ...prev, [p.id]: { price: '', percent: '' } }));
    } catch (e) {
      alert('Terjadi kesalahan jaringan');
    }
  };

  return (
    <div className="admin-dashboard-wrapper" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar />
      {/* Main */}
      <div className="main-content" style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <div className="header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 30px', borderBottom:'1px solid #eee' }}>
          <div>
            <h1 style={{ fontSize: 24, margin: 0 }}>Diskon Produk</h1>
            <div style={{ color:'#666' }}>Atur diskon per produk via harga atau persen</div>
          </div>
          <a href="/" style={{ background:'#e52b2b', color:'#fff', padding:'10px 14px', borderRadius:8, textDecoration:'none', fontWeight:700 }}>Website</a>
        </div>

        {error && <div style={{ color:'#c33', padding:'8px 14px' }}>{error}</div>}

        {/* Tabel */}
        <div style={{ margin: 20 }}>
          <div style={{ background:'#e52b2b', color:'#fff', borderRadius:10, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: 12, textAlign:'left', width: 420 }}>Produk</th>
                  <th style={{ padding: 12, textAlign:'left', width: 160 }}>Harga</th>
                  <th style={{ padding: 12, textAlign:'left', width: 260 }}>Input Harga Diskon</th>
                  <th style={{ padding: 12, textAlign:'left', width: 160 }}>Aksi</th>
                </tr>
              </thead>
              <tbody style={{ background:'#fff', color:'#333' }}>
                {loading && (
                  <tr><td colSpan={4} style={{ padding: 12, textAlign:'center' }}>Memuat data...</td></tr>
                )}
                {!loading && products.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 12, textAlign:'center' }}>Belum ada produk</td></tr>
                )}
                {!loading && products.map(p => {
                  const img = Array.isArray(p.images) && p.images.length ? p.images[0] : null;
                  const discounted = computeDiscounted(p);
                  const isDisc = p.discount_active && discounted < Number(p.price || 0);
                  const edit = editing[p.id] || { price: p.discount_price ?? '', percent: p.discount_percent ?? '' };
                  return (
                    <tr key={p.id} style={{ borderBottom:'1px solid #eee' }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ display:'flex', alignItems:'center' }}>
                          {img ? <img src={img} alt={p.name} style={{ width:60, height:60, objectFit:'cover', borderRadius:8, marginRight:10 }} /> : <div style={{ width:60, height:60, background:'#f0f0f0', borderRadius:8, marginRight:10 }} />}
                          <div style={{ fontWeight:600 }}>{p.name}</div>
                        </div>
                      </td>
                      <td style={{ padding: 12 }}>
                        {isDisc ? (
                          <div>
                            <div style={{ textDecoration:'line-through', color:'#888' }}>{formatRupiah(p.price)}</div>
                            <div style={{ fontWeight:700, color:'#c33' }}>{formatRupiah(discounted)}</div>
                          </div>
                        ) : (
                          <div style={{ fontWeight:700 }}>{formatRupiah(p.price)}</div>
                        )}
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                          <input type="number" min="0" placeholder="Harga"
                            value={edit.price}
                            onChange={e => setEdit(p.id, 'price', e.target.value)}
                            style={{ border:'1px solid #ccc', borderRadius:6, padding:'8px 10px' }} />
                          <input type="number" min="0" max="100" placeholder="Diskon %"
                            value={edit.percent}
                            onChange={e => setEdit(p.id, 'percent', e.target.value)}
                            style={{ border:'1px solid #ccc', borderRadius:6, padding:'8px 10px' }} />
                        </div>
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={() => onUpdate(p)} style={{ background:'#e52b2b', color:'#fff', border:'none', borderRadius:6, padding:'8px 12px', fontWeight:700, cursor:'pointer' }}>Update</button>
                          {p.discount_active && (
                            <button onClick={() => onRemove(p)} style={{ background:'#fff', color:'#e52b2b', border:'1px solid #e52b2b', borderRadius:6, padding:'8px 12px', fontWeight:700, cursor:'pointer' }}>Hapus</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}