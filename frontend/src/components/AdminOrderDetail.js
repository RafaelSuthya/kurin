import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const fmt = (n) => 'Rp.' + Number(n || 0).toLocaleString('id-ID');

const API_URL = 'http://127.0.0.1:8000/api';

export default function AdminOrderDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order || null;
  const grp = location.state?.group || null;
  const [productImages, setProductImages] = React.useState({});

  const items = React.useMemo(() => {
    const srcItems = order ? (order.items || []) : (grp?.orders?.flatMap(o => o.items || []) || []);
    return srcItems.map((it) => ({
      ...it,
      total: (Number(it.price || 0) * Number(it.quantity || 1))
    }));
  }, [order, grp]);

  // Total harga produk (untuk display di bawah tabel)
  const produkTotalDisplay = React.useMemo(() => items.reduce((acc, it) => acc + (it.total || 0), 0), [items]);
  // Key grup untuk simpan total ke localStorage
  const grpKey = React.useMemo(() => {
    const name = order?.buyer_name || grp?.buyer_name || 'Tanpa Nama';
    const phone = order?.buyer_phone || grp?.buyer_phone || '';
    return `${name}|${phone}`;
  }, [order, grp]);
  // Form untuk input total (produk + ongkir)
  const [produkTotal, setProdukTotal] = React.useState(0);
  const [ongkir, setOngkir] = React.useState(0);
  const [locked, setLocked] = React.useState(false);

  // Baca total tersimpan (localStorage) untuk grup; kunci jika ongkir > 0
  const savedTotals = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('ordersTotal:' + grpKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }, [grpKey]);

  // Kunci form berdasarkan status pesanan: Dikirim/Sampai/Selesai
  const statusLock = React.useMemo(() => {
    try {
      if (order) {
        const s = String(order?.status?.name || order?.status || '').toLowerCase();
        return s === 'shipped' || s === 'delivered' || s === 'completed';
      }
      if (grp && Array.isArray(grp.orders)) {
        return (grp.orders || []).some(o => {
          const s = String(o?.status?.name || o?.status || '').toLowerCase();
          return s === 'shipped' || s === 'delivered' || s === 'completed';
        });
      }
    } catch (_) {}
    return false;
  }, [order, grp]);

  React.useEffect(() => {
    const base = items.reduce((acc, it) => acc + (it.total || 0), 0);
    if (savedTotals) {
      setProdukTotal(Number(savedTotals.produkTotal ?? base));
      setOngkir(Number(savedTotals.ongkir ?? 0));
      setLocked((Number(savedTotals.ongkir || 0) > 0) || statusLock);
    } else {
      setProdukTotal(base);
      setOngkir(0);
      setLocked(!!statusLock);
    }
  }, [items, savedTotals, statusLock]);

  const totalDenganOngkir = (Number(produkTotal || 0) + Number(ongkir || 0));

  // Ambil gambar produk bila tidak tersedia di item
  React.useEffect(() => {
    const hasData = !!(order || grp);
    if (!hasData) return;
    let cancelled = false;
    const idsToFetch = new Set();
    const sourceOrders = order ? [order] : (grp?.orders || []);
    sourceOrders.forEach(o => (o.items || []).forEach(it => {
      const needsFetch = !it.product_image && it.product_id && !productImages[it.product_id];
      if (needsFetch) idsToFetch.add(it.product_id);
    }));
    if (idsToFetch.size === 0) return;
    const run = async () => {
      const results = await Promise.all([...idsToFetch].map(async (id) => {
        try {
          const res = await fetch(`${API_URL}/admin/products/${id}`, { headers: { 'Accept': 'application/json' } });
          const p = await res.json();
          const img = Array.isArray(p?.images) && p.images.length ? p.images[0] : null;
          return { id, img };
        } catch {
          return { id, img: null };
        }
      }));
      if (cancelled) return;
      setProductImages(prev => {
        const next = { ...prev };
        results.forEach(({ id, img }) => { if (img) next[id] = img; });
        return next;
      });
    };
    run();
    return () => { cancelled = true; };
  }, [order, grp, productImages]);

  // Sinkronisasi otomatis ke server jika form terkunci dan total tersimpan tersedia
  const [hasSynced, setHasSynced] = React.useState(false);
  React.useEffect(() => {
    const trySync = async () => {
      if (!order?.id) return;
      const totalBayarSaved = Number((savedTotals?.totalBayar ?? ((Number(savedTotals?.produkTotal || 0) + Number(savedTotals?.ongkir || 0)) || 0)) || 0);
      if (!(totalBayarSaved > 0)) return;
      try {
        const token = localStorage.getItem('adminToken');
        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
        await fetch(`${API_URL}/admin/orders/${order.id}/total`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ total: totalBayarSaved })
        });
        // abaikan respons; tujuan hanya sinkronisasi
      } catch (_) {
        // diamkan error agar UI tetap berjalan
      }
    };
    if (!hasSynced && locked && savedTotals) {
      trySync().finally(() => setHasSynced(true));
    }
  }, [hasSynced, locked, savedTotals, order?.id]);

  const getItemImage = (it) => {
    const img = (it.product_image || '').trim();
    if (img) return img;
    if (it.product_id && productImages[it.product_id]) return productImages[it.product_id];
    return '/kurin.png';
  };

  // Status gabungan / per order (fallback ke "Belum Bayar")
  const statusLabel = React.useMemo(() => {
    const raw = order ? (order.status?.name || order.status || 'Belum Bayar') : (grp ? (grp.status?.name || grp.status || 'Belum Bayar') : 'Belum Bayar');
    const normalized = (typeof raw === 'object' && raw !== null) ? (raw.name || raw.description || 'Belum Bayar') : (raw || 'Belum Bayar');
    const s = (normalized || '').toLowerCase();
    if (s === 'pending') return 'Belum Bayar';
    if (s === 'processing') return 'Diproses';
    if (s === 'shipped') return 'Dikirim';
    if (s === 'delivered') return 'Sampai';
    if (s === 'completed') return 'Selesai';
    if (s === 'in refund process') return 'Dalam proses refund';
    if (s === 'cancelled') return 'Dibatalkan';
    return normalized;
  }, [order, grp]);

  // Label status refund gabungan (ambil dari order atau grup orders)
  const refundLabel = React.useMemo(() => {
    const sourceOrders = order ? [order] : (grp?.orders || []);
    const all = sourceOrders.flatMap(o => {
      const list = Array.isArray(o?.return_orders) ? o.return_orders : (Array.isArray(o?.returnOrders) ? o.returnOrders : []);
      return list || [];
    });
    if (!all.length) return null;
    const latest = [...all].sort((a,b) => {
      const tb = new Date(b.return_date || b.created_at || 0).getTime();
      const ta = new Date(a.return_date || a.created_at || 0).getTime();
      return tb - ta;
    })[0];
    const d = String(latest?.decision || '').toLowerCase();
    if (!d) return 'Mengajukan refund';
    if (d === 'approved') return 'Refund disetujui';
    if (d === 'rejected') return 'Refund ditolak';
    return 'Refund';
  }, [order, grp]);

  const buyerName = order?.buyer_name || grp?.buyer_name;
  const buyerPhone = order?.buyer_phone || grp?.buyer_phone;
  const buyerAddress = order?.buyer_address || grp?.buyer_address;

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 30px', borderBottom:'1px solid #f0f0f0' }}>
          <div>
            <h1 style={{ fontSize:'28px', margin:0, fontWeight:'normal' }}>Detail Pesanan</h1>
            <p style={{ margin:'5px 0 0', color:'#666' }}>Ringkasan per item dan total</p>
          </div>
          <div>
            <button onClick={() => navigate(-1)} style={{ background:'#e52b2b', color:'#fff', padding:'10px 16px', border:'none', borderRadius:6, cursor:'pointer' }}>Kembali</button>
          </div>
        </div>

        <div style={{ padding:'24px 30px' }}>
          {!(order || grp) && (
            <div style={{ border:'1px dashed #ddd', padding:16, borderRadius:8 }}>
              Data pesanan tidak ditemukan. Silakan kembali ke daftar pesanan.
            </div>
          )}

          {(order || grp) && (
            <div>
              {/* Informasi pembeli */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontWeight:700, color:'#c33', marginBottom:6 }}>{buyerName} • {buyerPhone}</div>
                <div style={{ color:'#555' }}>{buyerAddress}</div>
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'6px 10px', fontWeight:700 }}>Status: {statusLabel}</div>
                  {refundLabel && (
                    <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'6px 10px', fontWeight:700 }}>Status Refund: {refundLabel}</div>
                  )}
                </div>
              </div>

              {/* Tabel gabungan per user */}
              <div style={{ background:'#e52b2b', color:'#fff', borderRadius:10, overflow:'hidden', marginBottom:16 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ padding:12, textAlign:'left', width:420 }}>Pesanan</th>
                      <th style={{ padding:12, textAlign:'left', width:160 }}>Harga</th>
                      <th style={{ padding:12, textAlign:'left', width:120 }}>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ padding:12, verticalAlign:'middle' }}>
                          <div style={{ display:'flex', alignItems:'center' }}>
                            <img
                              src={getItemImage(it)}
                              alt={it.product_name}
                              style={{ width:60, height:60, objectFit:'cover', borderRadius:8, marginRight:10, background:'#fff', cursor:'pointer' }}
                              onClick={() => it.product_id && navigate(`/produk/${it.product_id}`, { state: { readonly: true } })}
                            />
                            <div
                              style={{ fontWeight:600, cursor:'pointer' }}
                              onClick={() => it.product_id && navigate(`/produk/${it.product_id}`, { state: { readonly: true } })}
                            >
                              {it.product_name}
                              {it.variant ? <span style={{ fontWeight:500, marginLeft:6 }}>• {it.variant}</span> : null}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:12, verticalAlign:'middle' }}>{fmt(it.total)}</td>
                        <td style={{ padding:12, verticalAlign:'middle' }}>{it.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total harga produk di bawah tabel */}
              <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:10, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ color:'#555', fontWeight:600 }}>Total Harga Produk</div>
                <div style={{ fontWeight:700 }}>{fmt(produkTotalDisplay)}</div>
              </div>

              {/* Ringkasan akhir (Produk + Ongkir) */}
              <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:10, padding:16, display:'grid', gridTemplateColumns:'1fr auto', gap:8, alignItems:'center', marginBottom:16 }}>
                <div style={{ color:'#555', fontWeight:600 }}>Total Produk</div>
                <div style={{ fontWeight:700 }}>{fmt(produkTotal)}</div>
                <div style={{ color:'#555', fontWeight:600 }}>Ongkir</div>
                <div style={{ fontWeight:700 }}>{fmt(ongkir)}</div>
                <div style={{ color:'#555', fontWeight:600 }}>Total Bayar</div>
                <div style={{ fontWeight:700 }}>{fmt(totalDenganOngkir)}</div>
              </div>
              {/* Form input total harga termasuk ongkir */}
              <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:10, padding:16 }}>
                <div style={{ fontWeight:700, color:'#c33', marginBottom:10 }}>Input Total Harga</div>
                {locked && (
                  <div style={{ background:'#fff3f3', border:'1px solid #f3cdcd', color:'#a00', borderRadius:6, padding:'8px 12px', marginBottom:10 }}>
                    Form terkunci karena ongkir sudah diinput atau status pesanan Dikirim/Sampai/Selesai.
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:10, alignItems:'center', marginBottom:10 }}>
                  <label style={{ color:'#555' }}>Total Produk</label>
                  <input
                    type="number"
                    value={produkTotal}
                    onChange={(e) => !locked && setProdukTotal(Number(e.target.value))}
                    placeholder="contoh: 110000"
                    style={{ padding:'10px 12px', border:'1px solid #ddd', borderRadius:6 }}
                    disabled={locked}
                  />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:10, alignItems:'center', marginBottom:10 }}>
                  <label style={{ color:'#555' }}>Ongkir</label>
                  <input
                    type="number"
                    value={ongkir}
                    onChange={(e) => !locked && setOngkir(Number(e.target.value))}
                    placeholder="contoh: 20000"
                    style={{ padding:'10px 12px', border:'1px solid #ddd', borderRadius:6 }}
                    disabled={locked}
                  />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:10, alignItems:'center', marginBottom:16 }}>
                  <label style={{ color:'#555' }}>Total + Ongkir</label>
                  <div style={{ padding:'10px 12px', background:'#f8f8f8', border:'1px solid #eee', borderRadius:6 }}>{fmt(totalDenganOngkir)}</div>
                </div>
                <div style={{ display:'flex', justifyContent:'flex-start' }}>
                  <button style={{ background: locked ? '#bbb' : '#e52b2b', color:'#fff', border:'none', borderRadius:6, padding:'10px 18px', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.7 : 1 }}
                    disabled={locked}
                    onClick={async () => {
                      if (locked) { alert('Total harga terkunci karena ongkir sudah diinput.'); return; }
                      try {
                        const payload = { produkTotal: Number(produkTotal || 0), ongkir: Number(ongkir || 0), totalBayar: Number(totalDenganOngkir || 0), updatedAt: Date.now() };
                        localStorage.setItem('ordersTotal:' + grpKey, JSON.stringify(payload));
                        // Persist ke server untuk order tunggal jika ada
                        if (order?.id) {
                          try {
                            const token = localStorage.getItem('adminToken');
                            const headers = {
                              'Accept': 'application/json',
                              'Content-Type': 'application/json',
                              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                            };
                            const res = await fetch(`${API_URL}/admin/orders/${order.id}/total`, {
                              method: 'POST',
                              headers,
                              body: JSON.stringify({ total: Number(totalDenganOngkir || 0) })
                            });
                            const js = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              alert('Gagal menyimpan ke server: ' + (js.message || res.status));
                            }
                          } catch (err) {
                            alert('Kesalahan jaringan saat menyimpan total ke server.');
                          }
                        }
                        // lock setelah tersimpan bila ongkir > 0
                        if (payload.ongkir > 0) setLocked(true);
                      } catch(e) {}
                      alert('Total disimpan untuk user.');
                    }}
                  >Yes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}