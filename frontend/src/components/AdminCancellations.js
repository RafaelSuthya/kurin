import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';

const API_URL = 'http://127.0.0.1:8000/api';
const fmt = (n) => 'Rp.' + Number(n || 0).toLocaleString('id-ID');

export default function AdminCancellations() {
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productImages, setProductImages] = useState({});
  const [selected, setSelected] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/cancellations`, { headers: { 'Accept': 'application/json' } });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.message || 'Gagal memuat pembatalan');
      setCancellations(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e.message || 'Kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Fetch missing product images via Product API
  useEffect(() => {
    let cancelled = false;
    const idsToFetch = new Set();
    cancellations.forEach(c => c.order?.items?.forEach(it => {
      const needs = !it.product_image && it.product_id && !productImages[it.product_id];
      if (needs) idsToFetch.add(it.product_id);
    }));
    if (idsToFetch.size === 0) return;

    (async () => {
      const results = await Promise.all([...idsToFetch].map(async (id) => {
        try {
          const res = await fetch(`${API_URL}/admin/products/${id}`);
          const p = await res.json();
          const img = Array.isArray(p?.images) && p.images.length ? p.images[0] : null;
          return { id, img };
        } catch { return { id, img: null }; }
      }));
      if (cancelled) return;
      setProductImages(prev => {
        const next = { ...prev };
        results.forEach(({ id, img }) => { if (img) next[id] = img; });
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, [cancellations, productImages]);

  const getItemImage = (it) => {
    const img = (it.product_image || '').trim();
    if (img) return img;
    if (it.product_id && productImages[it.product_id]) return productImages[it.product_id];
    return '/kurin.png';
  };

  const groups = useMemo(() => {
    return cancellations.map(c => {
      const o = c.order || {};
      return {
        id: c.id,
        buyer_name: o.buyer_name,
        buyer_phone: o.buyer_phone,
        buyer_address: o.buyer_address,
        items: o.items || [],
        reason: c.reason,
        initiator: c.initiator,
        decision: c.decision,
        order_status: (o.status?.name || ''),
        total: (o.items || []).reduce((sum, it) => sum + (Number(it.price)||0)*(Number(it.quantity)||0), 0),
      };
    });
  }, [cancellations]);

  const approve = async (id) => {
    const ok = window.confirm('Setujui pembatalan ini?');
    if (!ok) return;
    try {
      const res = await fetch(`${API_URL}/admin/cancellations/${id}/approve`, { method: 'POST', headers: { 'Accept': 'application/json' } });
      const j = await res.json();
      if (!res.ok || j.ok === false) throw new Error(j.message || 'Gagal menyetujui');
      setSelected(null);
      await fetchData();
    } catch (e) { alert(e.message || 'Kesalahan jaringan'); }
  };

  const reject = async (id) => {
    const ok = window.confirm('Tolak pembatalan ini?');
    if (!ok) return;
    try {
      const res = await fetch(`${API_URL}/admin/cancellations/${id}/reject`, { method: 'POST', headers: { 'Accept': 'application/json' } });
      const j = await res.json();
      if (!res.ok || j.ok === false) throw new Error(j.message || 'Gagal menolak');
      setSelected(null);
      await fetchData();
    } catch (e) { alert(e.message || 'Kesalahan jaringan'); }
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 30px', borderBottom:'1px solid #f0f0f0' }}>
          <div>
            <h1 style={{ fontSize:'28px', margin:0, fontWeight:'normal' }}>Pembatalan</h1>
            <p style={{ margin:'5px 0 0', color:'#666' }}>Daftar pengajuan pembatalan dari user</p>
          </div>
          <a href="/home" style={{ background:'#e52b2b', color:'#fff', padding:'10px 25px', borderRadius:'5px', textDecoration:'none', fontWeight:'bold' }}>Website</a>
        </div>

        <div style={{ padding:'24px 30px' }}>
          {loading && <div>Memuat...</div>}
          {error && <div style={{ color:'#c33' }}>{error}</div>}
          {!loading && !error && groups.length === 0 && (
            <div style={{ border:'1px dashed #ddd', padding:'16px', borderRadius:'8px' }}>Belum ada pengajuan pembatalan.</div>
          )}

          {!loading && !error && groups.map((grp) => {
            const isCancelled = ((grp.order_status || '').toLowerCase() === 'cancelled') || (grp.decision === 'approved');
            const init = (grp.initiator || '').toLowerCase();
            const statusText = isCancelled ? (init === 'buyer' ? 'Dibatalkan oleh Pembeli' : 'Dibatalkan oleh Admin') : 'Menunggu keputusan admin';
            const hideActions = isCancelled || init === 'seller' || init === 'admin';
            return (
              <div key={grp.id} style={{ background:'#e52b2b', color:'#fff', borderRadius:'10px', overflow:'hidden', marginBottom:12 }}>
                <div style={{ padding:'12px 12px 0' }}>
                  <div style={{ fontWeight:700 }}>{grp.buyer_name} • {grp.buyer_phone}</div>
                  <div style={{ opacity:0.9 }}>{grp.buyer_address}</div>
                  <div style={{ marginTop:6 }}>
                    <span style={{ background:'#fff', color:'#c33', borderRadius:14, padding:'4px 10px', fontWeight:600 }}>{statusText}</span>
                  </div>
                </div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding:12, textAlign:'left' }}>Pesanan</th>
                      <th style={{ padding:12, textAlign:'left' }}>Harga</th>
                      <th style={{ padding:12, textAlign:'left' }}>Jumlah</th>
                      <th style={{ padding:12, textAlign:'left' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grp.items.map((it, idx) => (
                      <tr key={`${grp.id}-${idx}`}>
                        <td style={{ padding:12 }}>
                          <div style={{ display:'flex', alignItems:'center' }}>
                            <img src={getItemImage(it)} alt={it.product_name} style={{ width:60, height:60, objectFit:'cover', borderRadius:8, marginRight:10, background:'#fff' }} />
                            <div>
                              <div style={{ fontWeight:600 }}>{it.product_name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:12 }}>{fmt(it.price)}</td>
                        <td style={{ padding:12 }}>{it.quantity}</td>
                        {idx === 0 && (
                          <td style={{ padding:12, verticalAlign:'top' }} rowSpan={grp.items.length}>
                            <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-start' }}>
                              <button style={{ background:'#fff', color:'#c33', border:'none', borderRadius:6, padding:'10px 14px', cursor:'pointer', width:240 }} onClick={() => setSelected(grp)}>Lihat Detail</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {selected?.id === grp.id && (
                  <div style={{ background:'#fff', color:'#c33', padding:16 }}>
                    <div style={{ fontWeight:700, marginBottom:8 }}>Alasan Batal</div>
                    <div style={{ background:'#fff7f7', borderRadius:8, padding:12, minHeight:60 }}>{grp.reason || '-'}</div>
                    {!hideActions && (
                      <div style={{ display:'flex', gap:10, marginTop:12 }}>
                        <button style={{ background:'#e52b2b', color:'#fff', border:'none', borderRadius:6, padding:'10px 14px', cursor:'pointer' }} onClick={() => approve(grp.id)}>Setuju</button>
                        <button style={{ background:'#c33', color:'#fff', border:'none', borderRadius:6, padding:'10px 14px', cursor:'pointer' }} onClick={() => reject(grp.id)}>Tidak</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}