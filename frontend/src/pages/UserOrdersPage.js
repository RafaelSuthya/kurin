import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../api/admin';
import Footer from '../components/Footer';

const fmt = (n) => 'Rp.' + Number(n || 0).toLocaleString('id-ID');

// Tampilkan status yang mempertimbangkan pengajuan pembatalan
const displayStatus = (o) => {
  const s = (o?.status?.name || '').toLowerCase();
  // Prioritaskan status refund disetujui untuk user
  const returns = Array.isArray(o?.return_orders) ? o.return_orders : (Array.isArray(o?.returnOrders) ? o.returnOrders : []);
  const hasApprovedRefund = (returns || []).some(r => String(r?.decision || '').toLowerCase() === 'approved');
  if (hasApprovedRefund) return 'Refund disetujui';
  const cancels = Array.isArray(o?.cancellations) ? o.cancellations : [];
  const hasPendingBuyerCancel = cancels.some(c => (c.initiator || '').toLowerCase() === 'buyer' && !c.decision);
  const buyerCancelApproved = cancels.some(c => (c.initiator || '').toLowerCase() === 'buyer' && String(c.decision || '').toLowerCase() === 'approved');
  // Admin membatalkan langsung: initiator kemungkinan 'seller'. Jika status 'cancelled' tapi bukan hasil persetujuan pembeli, atau ada pembatalan oleh seller, tampilkan label admin.
  const adminCancelled = (!buyerCancelApproved && s === 'cancelled') || cancels.some(c => (c.initiator || '').toLowerCase() === 'seller');
  if (hasPendingBuyerCancel) return 'Menunggu keputusan admin';
  if (buyerCancelApproved) return 'Pembatalan disetujui';
  if (adminCancelled) return 'Dibatalkan oleh admin';
  if (s === 'pending') return 'Belum Bayar';
  if (s === 'processing') return 'Diproses';
  if (s === 'shipped') return 'Dikirim';
  // changed: pisahkan delivered dan completed
  if (s === 'delivered') return 'Sampai';
  if (s === 'completed') return 'Selesai';
  return o?.status?.name || '—';
};

// Label status refund per order
const refundStatusLabel = (o) => {
  const list = Array.isArray(o?.return_orders) ? o.return_orders : (Array.isArray(o?.returnOrders) ? o.returnOrders : []);
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
};

// Helper: ambil daftar item dengan fallback berbagai nama properti
const getOrderItems = (o) => {
  if (Array.isArray(o?.items)) return o.items;
  if (Array.isArray(o?.order_items)) return o.order_items;
  if (Array.isArray(o?.orderItems)) return o.orderItems;
  return [];
};

// Helper perhitungan total produk per order
const orderTotal = (o) => getOrderItems(o).reduce((sum, it) => sum + (Number(it.price)||0)*(Number(it.quantity)||0), 0);

// Helper: render total dengan kondisi ongkir dari admin (localStorage)
const renderTotalBlock = (o) => {
  const serverTotal = Number(o?.total ?? 0);
  const key = ((o?.buyer_name || 'Tanpa Nama') + '|' + (o?.buyer_phone || ''));
  let saved = null;
  try {
    const raw = localStorage.getItem('ordersTotal:' + key);
    saved = raw ? JSON.parse(raw) : null;
  } catch (e) { saved = null; }
  const produkTotal = (typeof saved?.produkTotal !== 'undefined' && saved?.produkTotal !== null) ? Number(saved.produkTotal) : orderTotal(o);
  const derivedOngkirServer = serverTotal > 0 ? Math.max(0, serverTotal - orderTotal(o)) : 0;
  const ongkir = derivedOngkirServer > 0 ? derivedOngkirServer : Number(saved?.ongkir ?? 0);
  const totalBayar = (serverTotal > 0) ? serverTotal : ((typeof saved?.totalBayar !== 'undefined' && saved?.totalBayar !== null) ? Number(saved.totalBayar) : (produkTotal + ongkir));
  const hasFinalTotal = (serverTotal > 0) || (ongkir > 0);
  return (
    <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'8px 12px', fontWeight:700 }}>
      {hasFinalTotal
        ? (<span>Total Harga: {fmt(totalBayar)}</span>)
        : (<span>Total Harga: {fmt(produkTotal)} <span style={{ fontWeight:500 }}>(belum termasuk ongkir)</span></span>)}
    </div>
  );
};

const UserOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productImages, setProductImages] = useState({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/user/orders`, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } });
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        const activeUserIdStr = localStorage.getItem('userId');
        const activeUserId = activeUserIdStr ? Number(activeUserIdStr) : NaN;
        const filtered = Number.isFinite(activeUserId)
          ? list.filter(o => Number(o.user_id) === activeUserId)
          : list;
        setOrders(filtered);
      } catch (e) {
        setError('Kesalahan jaringan saat memuat pesanan');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Ambil gambar produk jika item tidak memiliki product_image, gunakan Product API
  useEffect(() => {
    let cancelled = false;
    const idsToFetch = new Set();
    orders.forEach(o => o.items?.forEach(it => {
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
  }, [orders, productImages]);

  const filteredGroups = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      const key = (o.buyer_name || 'Tanpa Nama') + '|' + (o.buyer_phone || '');
      if (!map.has(key)) map.set(key, { buyer_name: o.buyer_name, buyer_phone: o.buyer_phone, buyer_address: o.buyer_address, orders: [] });
      map.get(key).orders.push(o);
    });
    // Hapus grup contoh 'Tester'
    return Array.from(map.values()).filter(grp => !(/tester/i.test(grp.buyer_name || '')));
  }, [orders]);

  const getItemImage = (it) => {
    const img = (it.product_image || '').trim();
    if (img) return img;
    if (it.product_id && productImages[it.product_id]) return productImages[it.product_id];
    return '/kurin.png';
  };

  // gunakan helper global orderTotal dan renderTotalBlock di bawah

  const getTotalsForOrder = (o) => {
    const serverTotal = Number(o?.total ?? 0);
    const key = ((o?.buyer_name || 'Tanpa Nama') + '|' + (o?.buyer_phone || ''));
    let saved = null;
    try {
      const raw = localStorage.getItem('ordersTotal:' + key);
      saved = raw ? JSON.parse(raw) : null;
    } catch (e) { saved = null; }
    const produkTotal = (typeof saved?.produkTotal !== 'undefined' && saved?.produkTotal !== null) ? Number(saved.produkTotal) : orderTotal(o);
    const derivedOngkirServer = serverTotal > 0 ? Math.max(0, serverTotal - orderTotal(o)) : 0;
    const ongkir = derivedOngkirServer > 0 ? derivedOngkirServer : Number(saved?.ongkir ?? 0);
    const totalBayar = (serverTotal > 0) ? serverTotal : ((typeof saved?.totalBayar !== 'undefined' && saved?.totalBayar !== null) ? Number(saved.totalBayar) : (produkTotal + ongkir));
    return { produkTotal, ongkir, totalBayar };
  };

  const openReceipt = (o) => {
    setReceiptOrder(o);
    setShowReceipt(true);
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setReceiptOrder(null);
  };

  const printReceipt = () => {
    if (!receiptOrder) return;
    const { produkTotal, ongkir, totalBayar } = getTotalsForOrder(receiptOrder);
    const itemsRows = (Array.isArray(receiptOrder.items) ? receiptOrder.items : []).map(it => `
      <tr>
        <td style="padding:6px 0;">${(it.product_name || '')}</td>
        <td style="padding:6px 0; text-align:center;">${Number(it.quantity||0)}</td>
        <td style="padding:6px 0; text-align:right;">${fmt(it.price)}</td>
        <td style="padding:6px 0; text-align:right;">${fmt(Number(it.price||0)*Number(it.quantity||0))}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Struk Pembelian</title>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .wrap { width: 720px; margin: 0 auto; }
            .header { display:flex; align-items:center; gap:12px; border-bottom:1px solid #eee; padding-bottom:10px; }
            .header img { height: 48px; }
            .title { font-size:20px; font-weight:700; color:#c33; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border-bottom: 1px solid #eee; }
            .total { font-weight:700; }
            @media print { @page { margin: 12mm; } }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="header">
              <img src="${window.location.origin}/kurin.png" alt="KURIN"/>
              <div>
                <div class="title">Struk Pembelian - KURIN</div>
                <div style="font-size:12px; color:#666;">${new Date().toLocaleString('id-ID')} • Order #${receiptOrder.id || '-'}</div>
              </div>
            </div>
            <div style="margin-top:10px; font-size:14px;">
              <div><b>Pembeli:</b> ${receiptOrder.buyer_name || '-'}</div>
              <div><b>Telepon:</b> ${receiptOrder.buyer_phone || '-'}</div>
              <div><b>Alamat:</b> ${receiptOrder.buyer_address || '-'}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="text-align:left; padding:6px 0;">Produk</th>
                  <th style="text-align:center; padding:6px 0;">Qty</th>
                  <th style="text-align:right; padding:6px 0;">Harga</th>
                  <th style="text-align:right; padding:6px 0;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
                <tr>
                  <td colspan="3" style="padding:6px 0; text-align:right;">Total Produk</td>
                  <td style="padding:6px 0; text-align:right;">${fmt(produkTotal)}</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding:6px 0; text-align:right;">Ongkir</td>
                  <td style="padding:6px 0; text-align:right;">${fmt(ongkir)}</td>
                </tr>
                <tr class="total">
                  <td colspan="3" style="padding:6px 0; text-align:right;">Total Bayar</td>
                  <td style="padding:6px 0; text-align:right;">${fmt(totalBayar)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function(){ window.focus(); window.print(); }, 200);
            });
          </script>
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      return;
    }
    // Fallback jika popup diblokir: gunakan iframe tersembunyi
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.onload = () => {
      try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch {}
      setTimeout(() => { document.body.removeChild(iframe); }, 1500);
    };
  };

  return (
    <div className="page-root" style={{ background: '#f8f8f8', minHeight: '100vh' }}>
      <style>{`
        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: #fff; border-bottom: 1px solid #eee; }
        .nav { display: flex; gap: 24px; }
        .nav a { color: #c33; text-decoration: none; font-weight: 600; }
        .container { max-width: 1000px; margin: 20px auto; padding: 0 20px; }
        .title { font-size: 24px; color: #c33; margin: 0 0 4px; }
        .note { color: #666; margin-bottom: 12px; }
        .card { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 16px; }
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
        <div className='title'>Pesanan Saya</div>
        <div className='note'>Menampilkan pesanan milik akun ini.</div>

        {loading && (
          <div className='card'>Memuat pesanan...</div>
        )}
        {error && (
          <div className='card' style={{ color:'#c33' }}>{error}</div>
        )}

        {!loading && !error && filteredGroups.length === 0 && (
          <div className='card'>
            <div style={{ color: '#555' }}>Belum ada pesanan untuk ditampilkan. Pastikan Anda memproses pesanan di halaman Checkout lalu kembali ke sini.</div>
            <div style={{ marginTop: 12 }}>
              <button onClick={() => navigate('/home')} style={{ background: '#c33', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 16px', cursor: 'pointer' }}>Kembali ke Home</button>
            </div>
          </div>
        )}

        {!loading && !error && filteredGroups.map((grp, idx) => (
          <div key={idx} style={{ marginBottom: 24 }}>
            <div style={{ fontWeight:700, color:'#c33', marginBottom:8 }}>
              {grp.buyer_name} • {grp.buyer_phone}
            </div>
            <div style={{ color:'#555', marginBottom:8 }}>{grp.buyer_address}</div>

            {/* Untuk setiap order dalam grup, tampilkan tabelnya sendiri agar status per order akurat */}
            {grp.orders.map((o, oidx) => (
              <div key={o.id || oidx} style={{ background:'#e52b2b', color:'#fff', borderRadius:'10px', overflow:'hidden', marginBottom: 12 }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding:12, textAlign:'left' }}>Pesanan</th>
                      <th style={{ padding:12, textAlign:'left' }}>Harga</th>
                      <th style={{ padding:12, textAlign:'left' }}>Jumlah</th>
                      <th style={{ padding:12, textAlign:'left' }}>Aksi</th>
                      <th style={{ padding:12, textAlign:'left' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => { const listItems = getOrderItems(o); return listItems.length > 0 ? listItems.map((it, iidx) => (
                      <tr key={`${o.id}-${iidx}`}>
                        <td style={{ padding:12 }}>
                          <div style={{ display:'flex', alignItems:'center' }}>
                            <img src={getItemImage(it)} alt={it.product_name} style={{ width:60, height:60, objectFit:'cover', borderRadius:8, marginRight:10, background:'#fff' }} />
                            <div style={{ fontWeight:600 }}>
                              {it.product_name}
                              {it.variant ? (
                                <div style={{ fontSize:12, fontWeight:500, marginTop:4 }}>Warna: {String(it.variant)}</div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:12 }}>{fmt(it.price)}</td>
                        <td style={{ padding:12 }}>{it.quantity}</td>
                        {iidx === 0 && (
                          <td style={{ padding:12, verticalAlign:'top' }} rowSpan={listItems.length}>
                            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                              <button
                                style={{ background:'#fff', color:'#c33', border:'none', borderRadius:6, padding:'8px 12px', cursor:'pointer', fontWeight:600 }}
                                onClick={() => navigate('/pesanan/detail', { state: { order: o } })}
                              >Detail Pembelian</button>
                              <button
                                style={{ background:'#fff', color:'#c33', border:'none', borderRadius:6, padding:'8px 12px', cursor: (displayStatus(o) === 'Belum Bayar' ? 'pointer' : 'not-allowed'), fontWeight:600, opacity: (displayStatus(o) === 'Belum Bayar' ? 1 : 0.5) }}
                                onClick={() => navigate('/pesanan/batal', { state: { order: o } })}
                                disabled={displayStatus(o) !== 'Belum Bayar'}
                              >Batal</button>
                              {(['Diproses','Dikirim','Sampai','Selesai'].includes(displayStatus(o))) && (
                                <button
                                  style={{ background:'#fff', color:'#c33', border:'none', borderRadius:6, padding:'8px 12px', cursor:'pointer', fontWeight:700 }}
                                  onClick={() => openReceipt(o)}
                                >Cetak Struk</button>
                              )}
                            </div>
                          </td>
                        )}
                        {iidx === 0 && (
                          <td style={{ padding:12, verticalAlign:'top' }} rowSpan={listItems.length}>
                            <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'8px 12px', display:'inline-block', fontWeight:700 }}>
                              {displayStatus(o)}
                            </div>
                            {refundStatusLabel(o) && (
                              <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'6px 10px', display:'inline-block', fontWeight:700, marginTop:6, marginLeft:8 }}>
                                Status Refund: {refundStatusLabel(o)}
                              </div>
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
                          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                            <button
                              style={{ background:'#fff', color:'#c33', border:'none', borderRadius:6, padding:'8px 12px', cursor:'pointer', fontWeight:600 }}
                              onClick={() => navigate('/pesanan/detail', { state: { order: o } })}
                            >Detail Pembelian</button>
                            <button
                              style={{ background:'#fff', color:'#c33', border:'none', borderRadius:6, padding:'8px 12px', cursor: (displayStatus(o) === 'Belum Bayar' ? 'pointer' : 'not-allowed'), fontWeight:600, opacity: (displayStatus(o) === 'Belum Bayar' ? 1 : 0.5) }}
                              onClick={() => navigate('/pesanan/batal', { state: { order: o } })}
                              disabled={displayStatus(o) !== 'Belum Bayar'}
                            >Batal</button>
                            {(['Diproses','Dikirim','Sampai','Selesai'].includes(displayStatus(o))) && (
                              <button
                                style={{ background:'#fff', color:'#c33', border:'none', borderRadius:6, padding:'8px 12px', cursor:'pointer', fontWeight:700 }}
                                onClick={() => openReceipt(o)}
                              >Cetak Struk</button>
                            )}
                          </div>
                        </td>
                        <td style={{ padding:12 }}>
                          <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'8px 12px', display:'inline-block', fontWeight:700 }}>
                            {displayStatus(o)}
                          </div>
                          {refundStatusLabel(o) && (
                            <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'6px 10px', display:'inline-block', fontWeight:700, marginTop:6, marginLeft:8 }}>
                              Status Refund: {refundStatusLabel(o)}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                    })()}
                  </tbody>
                </table>
                {/* Total harga per order */}
                <div style={{ display:'flex', justifyContent:'flex-end', padding:'12px 16px' }}>
                  {renderTotalBlock(o)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {showReceipt && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'#fff', width:'92%', maxWidth:780, borderRadius:10, overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid #eee' }}>
              <img src='/kurin.png' alt='KURIN' style={{ height:42 }} />
              <div style={{ fontWeight:800, color:'#c33', fontSize:18 }}>Struk Pembelian</div>
              <div style={{ marginLeft:'auto', color:'#999' }}>Order #{receiptOrder?.id || '-'}</div>
            </div>
            <div style={{ padding:'12px 16px' }}>
              <div style={{ marginBottom:8, color:'#444' }}>
                <div><b>Pembeli:</b> {receiptOrder?.buyer_name || '-'}</div>
                <div><b>Telepon:</b> {receiptOrder?.buyer_phone || '-'}</div>
                <div><b>Alamat:</b> {receiptOrder?.buyer_address || '-'}</div>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:'left', padding:'8px 0', borderBottom:'1px solid #eee' }}>Produk</th>
                    <th style={{ textAlign:'center', padding:'8px 0', borderBottom:'1px solid #eee' }}>Qty</th>
                    <th style={{ textAlign:'right', padding:'8px 0', borderBottom:'1px solid #eee' }}>Harga</th>
                    <th style={{ textAlign:'right', padding:'8px 0', borderBottom:'1px solid #eee' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(receiptOrder?.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ padding:'8px 0', borderBottom:'1px solid #f1f1f1' }}>{it.product_name}</td>
                      <td style={{ padding:'8px 0', textAlign:'center', borderBottom:'1px solid #f1f1f1' }}>{it.quantity}</td>
                      <td style={{ padding:'8px 0', textAlign:'right', borderBottom:'1px solid #f1f1f1' }}>{fmt(it.price)}</td>
                      <td style={{ padding:'8px 0', textAlign:'right', borderBottom:'1px solid #f1f1f1' }}>{fmt(Number(it.price||0) * Number(it.quantity||0))}</td>
                    </tr>
                  ))}
                  {(() => { const { produkTotal, ongkir, totalBayar } = getTotalsForOrder(receiptOrder || {}); return (
                    <>
                      <tr>
                        <td colSpan={3} style={{ padding:'8px 0', textAlign:'right' }}>Total Produk</td>
                        <td style={{ padding:'8px 0', textAlign:'right' }}>{fmt(produkTotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} style={{ padding:'8px 0', textAlign:'right' }}>Ongkir</td>
                        <td style={{ padding:'8px 0', textAlign:'right' }}>{fmt(ongkir)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} style={{ padding:'8px 0', textAlign:'right', fontWeight:800 }}>Total Bayar</td>
                        <td style={{ padding:'8px 0', textAlign:'right', fontWeight:800 }}>{fmt(totalBayar)}</td>
                      </tr>
                    </>
                  ); })()}
                </tbody>
              </table>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'12px 16px', borderTop:'1px solid #eee' }}>
              <button onClick={closeReceipt} style={{ background:'#fff', color:'#c33', border:'1px solid #c33', borderRadius:6, padding:'8px 12px', cursor:'pointer', fontWeight:700 }}>Tutup</button>
              <button onClick={printReceipt} style={{ background:'#c33', color:'#fff', border:'none', borderRadius:6, padding:'8px 12px', cursor:'pointer', fontWeight:700 }}>Cetak Struk PDF</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default UserOrdersPage;