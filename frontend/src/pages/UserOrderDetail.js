import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { API_URL } from '../api/admin';

const fmt = (n) => 'Rp.' + Number(n || 0).toLocaleString('id-ID');

// Tampilkan status yang mempertimbangkan pengajuan pembatalan dan keputusan refund
const displayStatus = (o) => {
  const s = (o?.status?.name || o?.status || '').toLowerCase();
  // Cek pembatalan
  const cancels = Array.isArray(o?.cancellations) ? o.cancellations : [];
  const pendingBuyerCancel = cancels.some(c => (c.initiator || '').toLowerCase() === 'buyer' && !c.decision);
  const buyerCancelApproved = cancels.some(c => (c.initiator || '').toLowerCase() === 'buyer' && String(c.decision || '').toLowerCase() === 'approved');
  // Admin membatalkan langsung: backend menandai initiator sebagai 'seller'.
  // Jika status sudah 'cancelled' dan bukan hasil persetujuan pembeli, tampilkan sebagai dibatalkan oleh admin.
  const adminCancelled = (!buyerCancelApproved && s === 'cancelled') || cancels.some(c => (c.initiator || '').toLowerCase() === 'seller');
  if (pendingBuyerCancel) return 'Menunggu keputusan admin';
  if (buyerCancelApproved) return 'Pembatalan disetujui';
  if (adminCancelled) return 'Dibatalkan oleh admin';

  // Keputusan refund terbaru override status visual: approved => proses refund, rejected => selesai
  const returns = Array.isArray(o?.return_orders) ? o.return_orders : (Array.isArray(o?.returnOrders) ? o.returnOrders : []);
  let latestDecision = null;
  if (returns && returns.length > 0) {
    const latest = [...returns].sort((a,b) => {
      const tb = new Date(b.return_date || b.created_at || 0).getTime();
      const ta = new Date(a.return_date || a.created_at || 0).getTime();
      return tb - ta;
    })[0];
    latestDecision = String(latest?.decision || '').toLowerCase();
  }
  if (latestDecision === 'approved') return 'Dalam proses refund';
  if (latestDecision === 'rejected') return 'Selesai';

  // Fallback ke status backend
  if (s === 'pending') return 'Belum Bayar';
  if (s === 'processing') return 'Diproses';
  if (s === 'shipped') return 'Dikirim';
  if (s === 'delivered') return 'Sampai';
  if (s === 'completed') return 'Selesai';
  if (s === 'in refund process') return 'Dalam proses refund';
  if (s === 'cancelled') return 'Dibatalkan oleh admin';
  return o?.status?.name || '—';
};

export default function UserOrderDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  // const order = state?.order || null;
  const [orderData, setOrderData] = React.useState(state?.order || null);
  const [productImages, setProductImages] = React.useState({});

  // Refresh order dari backend agar status terbaru terlihat
  React.useEffect(() => {
    const initId = state?.order?.id;
    if (!initId) return;
    let cancelled = false;
    const token = localStorage.getItem('userToken');
    const headers = token ? { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Accept': 'application/json' };
    const endpoint = token ? `${API_URL}/user/orders` : `${API_URL}/admin/orders`;
    (async () => {
      try {
        const res = await fetch(endpoint, { headers });
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
        const found = list.find(o => o.id === initId);
        if (!cancelled && found) setOrderData(found);
      } catch (e) {
        // abaikan kesalahan jaringan agar halaman tetap tampil
      }
    })();
    return () => { cancelled = true; };
  }, [state?.order?.id]);

  // Simpan order terakhir ke localStorage sebagai fallback untuk halaman refund
  React.useEffect(() => {
    if (!orderData) return;
    try {
      localStorage.setItem('lastOrderForRefund', JSON.stringify(orderData));
    } catch (e) {
      // abaikan kesalahan penyimpanan
    }
  }, [orderData]);

  const items = React.useMemo(() => {
    if (Array.isArray(orderData?.items)) return orderData.items;
    if (Array.isArray(orderData?.order_items)) return orderData.order_items;
    if (Array.isArray(orderData?.orderItems)) return orderData.orderItems;
    return [];
  }, [orderData]);

  React.useEffect(() => {
    let cancelled = false;
    const idsToFetch = new Set();
    items.forEach(it => {
      const needsFetch = !it.product_image && it.product_id && !productImages[it.product_id];
      if (needsFetch) idsToFetch.add(it.product_id);
    });
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
  }, [items, productImages]);

  const getItemImage = (it) => {
    const img = (it.product_image || '').trim();
    if (img) return img;
    if (it.product_id && productImages[it.product_id]) return productImages[it.product_id];
    return '/kurin.png';
  };

  const orderTotal = React.useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
  }, [items]);

  const serverTotal = Number(orderData?.total || 0);
  const statusStr = React.useMemo(() => displayStatus(orderData || {}), [orderData]);
  const refundDisabled = React.useMemo(() => statusStr === 'Selesai', [statusStr]);
  const refundLabel = React.useMemo(() => {
    const list = Array.isArray(orderData?.return_orders) ? orderData.return_orders : (Array.isArray(orderData?.returnOrders) ? orderData.returnOrders : []);
    if (!list || list.length === 0) return null;
    const latest = [...list].sort((a,b) => {
      const tb = new Date(b.return_date || b.created_at || 0).getTime();
      const ta = new Date(a.return_date || a.created_at || 0).getTime();
      return tb - ta;
    })[0];
    const d = String(latest?.decision || '').toLowerCase();
    if (!d) return 'Mengajukan refund';
    if (d === 'approved') return 'Refund disetujui';
    if (d === 'rejected') return 'Refund ditolak';
    return 'Refund';
  }, [orderData]);

  // Ambil total dan ongkir yang disimpan admin per grup (nama|telp)
  const groupKey = React.useMemo(() => ((orderData?.buyer_name || 'Tanpa Nama') + '|' + (orderData?.buyer_phone || '')), [orderData]);
  const savedTotals = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('ordersTotal:' + groupKey);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }, [groupKey]);
  const derivedOngkirServer = serverTotal > 0 ? Math.max(0, serverTotal - Number(orderTotal || 0)) : 0;
  const ongkirAdmin = derivedOngkirServer > 0 ? derivedOngkirServer : Number(savedTotals?.ongkir ?? 0);
  const totalProdukFromAdmin = (savedTotals && typeof savedTotals.produkTotal !== 'undefined' && savedTotals.produkTotal !== null) ? Number(savedTotals.produkTotal) : null;
  const totalProdukDisplay = (totalProdukFromAdmin !== null) ? totalProdukFromAdmin : orderTotal;
  const totalBayarFromAdmin = (savedTotals && typeof savedTotals.totalBayar !== 'undefined' && savedTotals.totalBayar !== null) ? Number(savedTotals.totalBayar) : null;
  const grandTotal = serverTotal > 0 ? serverTotal : ((totalBayarFromAdmin !== null) ? totalBayarFromAdmin : (Number(totalProdukDisplay || 0) + Number(ongkirAdmin || 0)));

  // Disable pembayaran bila:
  // - pembatalan disetujui atau status 'cancelled'
  // - pesanan sudah berjalan/bayar (status bukan 'pending')
  // - ongkir yang tampil ke user belum diinput oleh admin (<= 0)
  const payDisabled = React.useMemo(() => {
    const sName = ((orderData?.status?.name || orderData?.status || '') + '').toLowerCase();
    const cancels = Array.isArray(orderData?.cancellations) ? orderData.cancellations : [];
    const hasApprovedCancel = cancels.some(c => (c.decision || '').toLowerCase() === 'approved');
    const shippingMissing = Number(ongkirAdmin || 0) <= 0;
    const alreadyPaid = sName && sName !== 'pending';
    return hasApprovedCancel || sName === 'cancelled' || shippingMissing || alreadyPaid;
  }, [orderData, ongkirAdmin]);

  return (
    <div className="page-root" style={{ background: '#f8f8f8', minHeight: '100vh' }}>
      <style>{`
        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: #fff; border-bottom: 1px solid #eee; }
        .nav { display: flex; gap: 24px; }
        .nav a { color: #c33; text-decoration: none; font-weight: 600; }
        .container { max-width: 1000px; margin: 20px auto; padding: 0 20px; }
        .title { font-size: 24px; color: #c33; margin: 0 0 4px; }
        .note { color: #666; margin-bottom: 12px; }
      `}</style>

      <div className='topbar'>
        <img src='/kurin.png' alt='Kurin' style={{ height: 54 }} />
        <div className='nav'>
          <a href='/home'>Home</a>
          <a href='/company-profile'>About Us</a>
          <a href='/terms'>Syarat & Ketentuan</a>
          <a href='/contact'>Contact</a>
          <a href='/profile'>Profile</a>
        </div>
      </div>

      <div className='container'>
        <div className='title'>Detail Pesanan</div>
        <div className='note'>Ringkasan item dan status pesanan Anda.</div>

        {!orderData && (
          <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:8, padding:16 }}>Data pesanan tidak ditemukan.</div>
        )}

        {orderData && (
          <div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontWeight:700, color:'#c33' }}>{orderData.buyer_name} • {orderData.buyer_phone}</div>
              <div style={{ color:'#555' }}>{orderData.buyer_address}</div>
            </div>

            <div style={{ background:'#e52b2b', color:'#fff', borderRadius:'10px', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding:12, textAlign:'left' }}>Pesanan</th>
                    <th style={{ padding:12, textAlign:'left' }}>Harga</th>
                    <th style={{ padding:12, textAlign:'left' }}>Jumlah</th>
                    <th style={{ padding:12, textAlign:'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? items.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ padding:12 }}>
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
                      <td style={{ padding:12 }}>{fmt(it.price)}</td>
                      <td style={{ padding:12 }}>{it.quantity}</td>
                      {idx === 0 && (
                        <td style={{ padding:12, verticalAlign:'top' }} rowSpan={items.length}>
                          <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'8px 12px', display:'inline-block', fontWeight:700 }}>{statusStr}</div>
                        {refundLabel && (
                          <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'6px 10px', display:'inline-block', fontWeight:700, marginTop:6, marginLeft:8 }}>Status Refund: {refundLabel}</div>
                        )}
                        </td>
                      )}
                    </tr>
                  )) : (
                    <tr>
                      <td style={{ padding:12 }}>Tidak ada item</td>
                      <td style={{ padding:12 }}>-</td>
                      <td style={{ padding:12 }}>-</td>
                      <td style={{ padding:12 }}>
                        <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'8px 12px', display:'inline-block', fontWeight:700 }}>{statusStr}</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {orderData?.tracking_number && (
              <div style={{ marginTop:8 }}>
                <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'8px 12px', display:'inline-block', fontWeight:700 }}>
                  No Resi: {orderData.tracking_number}
                </div>
              </div>
            )}

            {/* Tombol Refund & Rating/Ulasan saat status Sampai atau Selesai */}
            {(statusStr === 'Sampai' || statusStr === 'Selesai') && (
              <div style={{ marginTop:12, display:'flex', gap:8 }}>
                <button
                  disabled={refundDisabled}
                  onClick={() => !refundDisabled && navigate('/pesanan/refund', { state: { order: orderData } })}
                  style={{ background: refundDisabled ? '#bbb' : '#fff', color: refundDisabled ? '#666' : '#c33', border:'1px solid #c33', borderRadius:6, padding:'8px 12px', cursor: refundDisabled ? 'not-allowed' : 'pointer', fontWeight:700, opacity: refundDisabled ? 0.7 : 1 }}
                >Refund</button>
                <button
                  onClick={() => navigate('/pesanan/ulasan', { state: { order: orderData } })}
                  style={{ background:'#c33', color:'#fff', border:'none', borderRadius:6, padding:'8px 12px', cursor:'pointer', fontWeight:700 }}
                >Rating/Ulasan</button>
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 4px' }}>
              <button onClick={() => navigate(-1)} style={{ background:'#fff', color:'#c33', border:'1px solid #c33', borderRadius:6, padding:'8px 12px', cursor:'pointer' }}>Kembali</button>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'8px 12px', fontWeight:700 }}>Total Produk: {fmt(totalProdukDisplay)}</div>
                <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'8px 12px', fontWeight:700 }}>Ongkir: {fmt(ongkirAdmin)}</div>
                <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'8px 12px', fontWeight:700 }}>
                  {(serverTotal > 0 || ongkirAdmin > 0)
                    ? <>Total Bayar: {fmt(grandTotal)}</>
                    : <>Total Harga: {fmt(totalProdukDisplay)} <span style={{ fontWeight:500 }}>(belum termasuk ongkir)</span></>}
                </div>
                <button
                  disabled={payDisabled}
                  onClick={() => !payDisabled && navigate('/pembayaran', { state: { order: orderData, totalProduk: totalProdukDisplay, ongkir: ongkirAdmin, totalBayar: grandTotal } })}
                  style={{ background: payDisabled ? '#bbb' : '#c33', color:'#fff', border:'none', borderRadius:6, padding:'8px 12px', cursor: payDisabled ? 'not-allowed' : 'pointer', fontWeight:700, opacity: payDisabled ? 0.7 : 1 }}
                >Pembayaran</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}