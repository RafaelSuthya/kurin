import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const API_URL = 'http://127.0.0.1:8000/api';
const fmt = (n) => 'Rp.' + Number(n || 0).toLocaleString('id-ID');
 // Tambah pemetaan label status ke Bahasa Indonesia
 const statusLabel = (name) => {
   const s = (name || '').toLowerCase();
   if (s === 'pending') return 'Belum Bayar';
   if (s === 'processing') return 'Diproses';
   if (s === 'shipped') return 'Dikirim';
   if (s === 'delivered') return 'Sampai';
   if (s === 'completed') return 'Selesai';
   if (s === 'in refund process') return 'Dalam proses refund';
   if (s === 'cancelled') return 'Dibatalkan';
   return name || '—';
 };
 

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Tambah cache gambar produk berdasarkan product_id
  const [productImages, setProductImages] = useState({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelOrders, setCancelOrders] = useState([]);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  // Status selector per grup
  const [statusSelect, setStatusSelect] = useState({});
  const [statusBusy, setStatusBusy] = useState({});
  const [statusError, setStatusError] = useState({});
  // Tracking number modal state
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingBusy, setTrackingBusy] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  // Delete group state per grup
  const [deleteOrderBusy, setDeleteOrderBusy] = useState({});
  const [deleteOrderError, setDeleteOrderError] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmBusy, setDeleteConfirmBusy] = useState(false);
  const [deleteConfirmError, setDeleteConfirmError] = useState(null);

  // Receipt modal state
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/admin/orders`);
        const json = await res.json();
        if (!res.ok || json.ok === false) {
          setError('Gagal memuat pesanan');
        } else {
          setOrders(Array.isArray(json.data) ? json.data : []);
        }
      } catch (e) {
        setError('Kesalahan jaringan');
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

  const groups = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      const key = (o.buyer_name || 'Tanpa Nama') + '|' + (o.buyer_phone || '');
      if (!map.has(key)) map.set(key, { buyer_name: o.buyer_name, buyer_phone: o.buyer_phone, buyer_address: o.buyer_address, orders: [] });
      map.get(key).orders.push(o);
    });
    // Filter keluar contoh/grup bernama 'Tester'
    return Array.from(map.values()).filter(grp => !(/tester/i.test(grp.buyer_name || '')));
  }, [orders]);

  // Helper untuk menentukan gambar item
  const getItemImage = (it) => {
    const img = (it.product_image || '').trim();
    if (img) return img;
    if (it.product_id && productImages[it.product_id]) return productImages[it.product_id];
    return '/kurin.png';
  };

  // Hitung total produk, ongkir, total bayar untuk sebuah order
  const getTotalsForOrder = (order) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    const productTotal = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0), 0);
    const total = Number(order?.total || productTotal);
    const shipping = Math.max(0, total - productTotal);
    return { productTotal, shipping, total };
  };

  // Cetak struk sederhana ke window baru, tunggu konten siap
  const printReceipt = (order) => {
    if (!order) return;
    const items = Array.isArray(order.items) ? order.items : [];
    const { productTotal, shipping, total } = getTotalsForOrder(order);

    const html = `<!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>KURIN - Struk Pesanan #${order.id || ''}</title>
      <style>
        body{font-family: Arial, sans-serif; padding:20px;}
        .header{display:flex; align-items:center; gap:10px; margin-bottom:16px;}
        .header img{height:40px;}
        h2{margin:0;}
        table{width:100%; border-collapse:collapse; margin-top:10px;}
        th,td{border:1px solid #ddd; padding:8px;}
        th{text-align:left; background:#f8f8f8;}
        .right{text-align:right;}
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/kurin.png" alt="KURIN" />
        <h2>Struk Pesanan</h2>
      </div>
      <div>Nomor Pesanan: <strong>#${order.id || ''}</strong></div>
      <div>Tanggal: ${order.order_date || ''}</div>
      <div style="margin-top:8px;">Pembeli: <strong>${order.buyer_name || '-'}</strong></div>
      <div>Telp: ${order.buyer_phone || '-'}</div>
      <div>Alamat: ${order.buyer_address || '-'}</div>

      <table>
        <thead>
          <tr>
            <th>Produk</th>
            <th>Harga</th>
            <th>Jumlah</th>
            <th class="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(it => `<tr>
              <td>${it.product_name || '-'}</td>
              <td>Rp.${Number(it.price||0).toLocaleString('id-ID')}</td>
              <td>${it.quantity || 0}</td>
              <td class="right">Rp.${(Number(it.price||0)*Number(it.quantity||0)).toLocaleString('id-ID')}</td>
            </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="right"><strong>Total Produk</strong></td>
            <td class="right"><strong>Rp.${productTotal.toLocaleString('id-ID')}</strong></td>
          </tr>
          <tr>
            <td colspan="3" class="right">Ongkir</td>
            <td class="right">Rp.${shipping.toLocaleString('id-ID')}</td>
          </tr>
          <tr>
            <td colspan="3" class="right"><strong>Total Bayar</strong></td>
            <td class="right"><strong>Rp.${total.toLocaleString('id-ID')}</strong></td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top:20px;">Terima kasih telah berbelanja di KURIN.</div>
      <script>
        window.addEventListener('load', function(){
          setTimeout(function(){
            window.print();
          }, 150);
        });
      </script>
    </body>
    </html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
    } else {
      // Fallback iframe apabila popup diblokir
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow || iframe.contentDocument;
      const idoc = doc.document || doc;
      idoc.open();
      idoc.write(html);
      idoc.close();
      setTimeout(() => {
        try { (iframe.contentWindow || iframe).focus(); (iframe.contentWindow || iframe).print(); } catch {}
        setTimeout(() => { document.body.removeChild(iframe); }, 1000);
      }, 300);
    }
  };

  const openCancelModal = (orderIds) => {
    setCancelOrders(orderIds);
    setShowCancelConfirm(true);
  };

  const closeCancelModal = () => {
    if (!cancelBusy) {
      setShowCancelConfirm(false);
      setCancelOrders([]);
      setCancelError(null);
    }
  };

  const handleConfirmCancel = async () => {
    setCancelBusy(true);
    setCancelError(null);
    try {
      for (const id of cancelOrders) {
        const res = await fetch(`${API_URL}/admin/orders/${id}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ reason: 'Dibatalkan oleh admin' })
        });
        if (!res.ok) {
          let msg = 'Gagal membatalkan pesanan';
          try { const j = await res.json(); msg = j.message || msg; } catch {}
          throw new Error(msg);
        }
      }
      closeCancelModal();
      // Refresh orders
      setLoading(true);
      try {
        const res2 = await fetch(`${API_URL}/admin/orders`);
        const json2 = await res2.json();
        setOrders(Array.isArray(json2.data) ? json2.data : []);
      } catch (e) {
        setError('Kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    } catch (err) {
      setCancelError(err.message || 'Terjadi kesalahan');
      setCancelBusy(false);
    }
  };

  // Handler untuk update status per pesanan
  const handleUpdateOrderStatus = async (order, newLabel) => {
    const orderKey = `${order.buyer_name || ''}|${order.buyer_phone || ''}|${order.id}`;
    setStatusBusy(prev => ({ ...prev, [orderKey]: true }));
    setStatusError(prev => ({ ...prev, [orderKey]: null }));
    try {
      const current = (order.status?.name || '').toLowerCase();
      if (current === 'cancelled') throw new Error('Pesanan sudah dibatalkan');
      const res = await fetch(`${API_URL}/admin/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ status: newLabel })
      });
      if (!res.ok) {
        let msg = 'Gagal mengubah status pesanan';
        try { const j = await res.json(); msg = j.message || msg; } catch {}
        throw new Error(msg);
      }
      // Refresh orders
      setLoading(true);
      try {
        const res2 = await fetch(`${API_URL}/admin/orders`);
        const json2 = await res2.json();
        setOrders(Array.isArray(json2.data) ? json2.data : []);
      } catch (e) {
        setError('Kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    } catch (err) {
      setStatusError(prev => ({ ...prev, [orderKey]: err.message || 'Terjadi kesalahan' }));
    } finally {
      setStatusBusy(prev => ({ ...prev, [orderKey]: false }));
    }
  };

  const closeTrackingModal = () => {
    if (!trackingBusy) {
      setShowTrackingModal(false);
      setTrackingOrder(null);
      setTrackingInput('');
      setTrackingError(null);
    }
  };

  const handleConfirmTracking = async () => {
    const num = String(trackingInput || '').trim();
    if (!num) { setTrackingError('Masukkan nomor resi'); return; }
    if (!trackingOrder || !trackingOrder.id) { setTrackingError('Pesanan tidak valid'); return; }
    setTrackingBusy(true);
    setTrackingError(null);
    try {
      const res = await fetch(`${API_URL}/admin/orders/${trackingOrder.id}/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ tracking_number: num })
      });
      if (!res.ok) {
        let msg = 'Gagal menyimpan nomor resi';
        try { const j = await res.json(); msg = j.message || msg; } catch {}
        throw new Error(msg);
      }
      // Refresh orders
      setLoading(true);
      try {
        const res2 = await fetch(`${API_URL}/admin/orders`);
        const json2 = await res2.json();
        setOrders(Array.isArray(json2.data) ? json2.data : []);
      } catch (e) {
        setError('Kesalahan jaringan');
      } finally {
        setLoading(false);
      }
      closeTrackingModal();
    } catch (err) {
      setTrackingError(err.message || 'Terjadi kesalahan');
    } finally {
      setTrackingBusy(false);
    }
  };

  // Delete confirmation modal controls

  const openDeleteModal = (order) => {
    setDeleteTarget(order);
    setDeleteConfirmError(null);
    setShowDeleteConfirm(true);
  };

  const closeDeleteModal = () => {
    if (!deleteConfirmBusy) {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setDeleteConfirmError(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteConfirmBusy(true);
    setDeleteConfirmError(null);
    const ok = await handleDeleteOrder(deleteTarget);
    setDeleteConfirmBusy(false);
    if (ok) {
      closeDeleteModal();
    } else {
      const orderKey = `${deleteTarget.buyer_name || ''}|${deleteTarget.buyer_phone || ''}|${deleteTarget.id}`;
      setDeleteConfirmError(deleteOrderError[orderKey] || 'Gagal menghapus pesanan');
    }
  };


  const handleDeleteOrder = async (order) => {
    const orderKey = `${order.buyer_name || ''}|${order.buyer_phone || ''}|${order.id}`;
    setDeleteOrderBusy(prev => ({ ...prev, [orderKey]: true }));
    setDeleteOrderError(prev => ({ ...prev, [orderKey]: null }));
    try {
      const res = await fetch(`${API_URL}/admin/orders/${order.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        let msg = 'Gagal menghapus pesanan';
        try { const j = await res.json(); msg = j.message || msg; } catch {}
        throw new Error(msg);
      }
      setLoading(true);
      try {
        const res2 = await fetch(`${API_URL}/admin/orders`);
        const json2 = await res2.json();
        setOrders(Array.isArray(json2?.data) ? json2.data : []);
      } catch (e) {
        setError('Terjadi kesalahan saat memuat ulang data');
      } finally {
        setLoading(false);
      }
      return true;
    } catch (err) {
      setDeleteOrderError(prev => ({ ...prev, [orderKey]: err.message || 'Terjadi kesalahan' }));
      return false;
    } finally {
      setDeleteOrderBusy(prev => ({ ...prev, [orderKey]: false }));
    }
  };

  return (
    <div style={{ display:'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 30px', borderBottom:'1px solid #f0f0f0' }}>
          <div>
            <h1 style={{ fontSize: '28px', margin: 0, fontWeight: 'normal' }}>Pesanan</h1>
            <p style={{ margin: '5px 0 0', color: '#666' }}>Daftar pesanan dari pembeli</p>
          </div>
          <a href="/home" style={{ background:'#e52b2b', color:'#fff', padding:'10px 25px', borderRadius:'5px', textDecoration:'none', fontWeight:'bold' }}>Website</a>
        </div>

        <div style={{ padding: '24px 30px' }}>
          {loading && <div>Memuat...</div>}
          {error && <div style={{ color:'#c33' }}>{error}</div>}

          {!loading && !error && groups.length === 0 && (
            <div style={{ border:'1px dashed #ddd', padding:'16px', borderRadius:'8px' }}>Belum ada pesanan.</div>
          )}

          {!loading && !error && groups.map((grp, idx) => (
            <div key={idx} style={{ marginBottom: 24 }}>
              <div style={{ fontWeight:700, color:'#c33', marginBottom:8 }}>
                {grp.buyer_name} • {grp.buyer_phone}
              </div>
              <div style={{ color:'#555', marginBottom:8 }}>{grp.buyer_address}</div>

              <div style={{ background:'#e52b2b', color:'#fff', borderRadius:'10px', overflow:'hidden' }}>
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
                    {
                      grp.orders.flatMap((o) => {
                          const items = Array.isArray(o.items) ? o.items : [];
                          const orderKey = `${grp.buyer_name || ''}|${grp.buyer_phone || ''}|${o.id}`;
                          const selectVal = statusSelect[orderKey] || '';
                          const busy = !!statusBusy[orderKey];
                          const err = statusError[orderKey];
                          const delBusy = !!deleteOrderBusy[orderKey];
                          const delErr = deleteOrderError[orderKey];
                          const base = (o?.status?.name || o?.status || '').toLowerCase();
                          const returns = Array.isArray(o?.return_orders) ? o.return_orders : (Array.isArray(o?.returnOrders) ? o.returnOrders : []);
                          let orderSt = base;
                          if (returns && returns.length > 0) {
                            const latest = [...returns].sort((a,b) => {
                              const tb = new Date(b.return_date || b.created_at || 0).getTime();
                              const ta = new Date(a.return_date || a.created_at || 0).getTime();
                              return tb - ta;
                            })[0];
                            const dec = String(latest?.decision || '').toLowerCase();
                            if (dec === 'approved') orderSt = 'in refund process';
                            else if (dec === 'rejected') orderSt = 'completed';
                          }
                          return items.map((it, gIdx) => (
                          <tr key={`${grp.buyer_name}-${grp.buyer_phone}-${o.id}-${gIdx}`}>
                            <td style={{ padding:12 }}>
                              <div style={{ display:'flex', alignItems:'center' }}>
                                <img src={getItemImage(it)} alt={it.product_name} style={{ width:60, height:60, objectFit:'cover', borderRadius:8, marginRight:10, background:'#fff' }} />
                                <div style={{ fontWeight:600 }}>
                                  {it.product_name}
                                  {it.variant ? <span style={{ fontWeight:500, marginLeft:6 }}>• {it.variant}</span> : null}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding:12 }}>{fmt(it.price)}</td>
                            <td style={{ padding:12 }}>{it.quantity}</td>
                            {gIdx === 0 && (
                              <td style={{ padding:12, verticalAlign:'top' }} rowSpan={items.length}>
                                <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-start' }}>
                                  <button style={{ background:'#fff', color:'#c33', border:'none', borderRadius:6, padding:'10px 14px', cursor:'pointer', width:240 }} onClick={() => navigate('/admin/pesanan/detail', { state: { order: o } })}>Detail</button>
                                  {orderSt === 'processing' && (
                                    <button
                                      style={{ background:'#fff', color:'#c33', border:'none', borderRadius:6, padding:'10px 14px', cursor:'pointer', width:240 }}
                                      onClick={() => { setReceiptOrder(o); setShowReceipt(true); }}
                                    >Cetak Struk</button>
                                  )}
                                  <button
                                    style={{
                                      background:'#fff',
                                      color:'#c33',
                                      border:'none',
                                      borderRadius:6,
                                      padding:'10px 14px',
                                      cursor: ((orderSt === 'pending' || orderSt === 'delivered' || orderSt === 'completed') ? 'not-allowed' : 'pointer'),
                                      opacity: ((orderSt === 'pending' || orderSt === 'delivered' || orderSt === 'completed') ? 0.7 : 1),
                                      width:240
                                    }}
                                    disabled={(orderSt === 'pending' || orderSt === 'delivered' || orderSt === 'completed')}
                                    onClick={() => {
                                      const dis = (orderSt === 'pending' || orderSt === 'delivered' || orderSt === 'completed');
                                      if (dis) return;
                                      setTrackingOrder(o);
                                      setTrackingInput(String(o?.tracking_number || ''));
                                      setTrackingError(null);
                                      setShowTrackingModal(true);
                                    }}
                                  >Input No. Resi</button>
                                  <button style={{ background:'#fff', color:'#c33', border:'1px solid rgba(255,255,255,0.7)', borderRadius:6, padding:'10px 14px', cursor:'pointer', width:240 }} onClick={() => openCancelModal([o.id])}>Pembatalan</button>
                                  {/* Status per pesanan & kontrol update */}
                                  <div style={{ marginTop:10 }}>
                                    <div style={{ marginTop:10, display:'flex', gap:8, alignItems:'center' }}>
                                      <select
                                        value={selectVal}
                                        onChange={(e) => setStatusSelect(prev => ({ ...prev, [orderKey]: e.target.value }))}
                                        disabled={String(o?.status?.name || '').toLowerCase()==='cancelled' || busy}
                                        style={{ padding:'8px 10px', borderRadius:6, border:'none', width:240 }}
                                      >
                                        <option value="">Pilih status...</option>
                                        <option value="Belum Bayar">Belum Bayar</option>
                                        <option value="Diproses">Diproses</option>
                                        <option value="Dikirim">Dikirim</option>
                                        <option value="Sampai">Sampai</option>
                                        <option value="Selesai">Selesai</option>
                                      </select>
                                      <button
                                        onClick={() => selectVal && handleUpdateOrderStatus(o, selectVal)}
                                        disabled={!selectVal || String(o?.status?.name || '').toLowerCase()==='cancelled' || busy}
                                        style={{ background:'#fff', color:'#c33', border:'none', borderRadius:6, padding:'8px 12px', cursor: (!selectVal || String(o?.status?.name || '').toLowerCase()==='cancelled' || busy) ? 'not-allowed' : 'pointer' }}
                                      >{busy ? 'Memproses...' : 'Ubah Status'}</button>
                                    </div>
                                    {err && (
                                      <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'6px 10px', marginTop:8 }}>{err}</div>
                                    )}
                                  </div>
                                  {(orderSt === 'completed' || orderSt === 'cancelled') && (
                                    <button
                                      style={{
                                        background: '#fff',
                                        color: '#c33',
                                        border: '1px solid rgba(255,255,255,0.7)',
                                        borderRadius: 6,
                                        padding: '10px 14px',
                                        cursor: delBusy ? 'not-allowed' : 'pointer',
                                        width: 240,
                                        marginTop: 8
                                      }}
                                      onClick={() => openDeleteModal(o)}
                                      disabled={delBusy}
                                    >
                                      {delBusy ? 'Menghapus...' : 'Hapus Pesanan'}
                                    </button>
                                  )}
                                  {delErr && (
                                    <div style={{
                                      background: '#fff',
                                      color: '#c33',
                                      borderRadius: 6,
                                      padding: '6px 10px',
                                      marginTop: 8,
                                      maxWidth: 240
                                    }}>
                                      {delErr}
                                    </div>
                                  )}
                                </div>
                              </td>
                            )}
                            {gIdx === 0 && (
                              <td style={{ padding:12, verticalAlign:'top' }} rowSpan={items.length}>
                                <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'8px 12px', display:'inline-block', fontWeight:700 }}>
                                  {statusLabel(orderSt)}
                                </div>
                                {(() => {
                                  const tn = o?.tracking_number || o?.trackingNumber || '';
                                  if (!tn) return null;
                                  return (
                                    <div style={{ marginTop:8, background:'#fff', color:'#c33', borderRadius:6, padding:'6px 10px', display:'block', fontWeight:600 }}>
                                      No. Resi: {tn}
                                    </div>
                                  );
                                })()}
                                {((orderSt === 'delivered' || orderSt === 'completed') && (returns || []).some(r => !r.decision || String(r.decision || '').toLowerCase() === 'pending')) && (
                                  <div style={{ marginTop:8, background:'#fff', color:'#c33', borderRadius:6, padding:'6px 10px', display:'inline-block', fontWeight:600 }}>
                                    User ajukan refund — cek halaman refund
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        ));
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        {showCancelConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Konfirmasi Pembatalan</h3>
              <p>Apakah Anda yakin ingin membatalkan pesanan pembeli ini?</p>
              {cancelError && (
                <div style={{ color:'#c33', background:'#fff', padding:8, borderRadius:6, marginBottom:8 }}>{cancelError}</div>
              )}
              <div className="modal-buttons">
                <button className="cancel-button" onClick={closeCancelModal} disabled={cancelBusy}>Batal</button>
                <button className="confirm-button" onClick={handleConfirmCancel} disabled={cancelBusy}>{cancelBusy ? 'Memproses...' : 'Ya, Batalkan'}</button>
              </div>
            </div>
          </div>
        )}

        {showTrackingModal && (
          <div className="modal-overlay" onClick={() => !trackingBusy && closeTrackingModal()}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Input No. Resi (KURIN)</h3>
              <p>Masukkan nomor resi pengiriman untuk pembeli: <b>{trackingOrder?.buyer_name}</b></p>
              {trackingError && (
                <div style={{ color:'#c33', background:'#fff', padding:8, borderRadius:6, marginBottom:8 }}>{trackingError}</div>
              )}
              <div style={{ marginTop: 8 }}>
                <input
                  type="text"
                  placeholder="Contoh: 0123-4567-89"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd' }}
                  disabled={trackingBusy || !(['processing','shipped'].includes(String(trackingOrder?.status?.name || trackingOrder?.status || '').toLowerCase()))}
                />
              <div style={{ marginTop: 6, color:'#888', fontSize: 13 }}>
                Hanya bisa input/ubah saat status <b>Diproses</b> atau <b>Dikirim</b>.
              </div>
              </div>
              <div className="modal-buttons">
                <button className="cancel-button" onClick={closeTrackingModal} disabled={trackingBusy}>Tutup</button>
                <button className="confirm-button" onClick={handleConfirmTracking} disabled={trackingBusy || !(['processing','shipped'].includes(String(trackingOrder?.status?.name || trackingOrder?.status || '').toLowerCase()))}>{trackingBusy ? 'Menyimpan...' : 'Simpan Resi'}</button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => !deleteConfirmBusy && closeDeleteModal()}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Konfirmasi Hapus (KURIN)</h3>
              <p>Hapus pesanan ini dari daftar?</p>
              {deleteConfirmError && (
                <div style={{ color:'#c33', background:'#fff', padding:8, borderRadius:6, marginBottom:8 }}>{deleteConfirmError}</div>
              )}
              <div className="modal-buttons">
                <button className="cancel-button" onClick={closeDeleteModal} disabled={deleteConfirmBusy}>Batal</button>
                <button className="confirm-button" onClick={handleConfirmDelete} disabled={deleteConfirmBusy}>{deleteConfirmBusy ? 'Menghapus...' : 'Ya, Hapus'}</button>
              </div>
            </div>
          </div>
        )}

        {showReceipt && receiptOrder && (
          <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
            <div className="modal-content" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: 720 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <img src="/kurin.png" alt="KURIN" style={{ height:32 }} />
                <h3 style={{ margin:0 }}>Struk Pesanan</h3>
              </div>
              <div style={{ fontSize:14, color:'#555' }}>
                <div>Nomor Pesanan: <strong>#{receiptOrder.id || ''}</strong></div>
                <div>Tanggal: {receiptOrder.order_date || '-'}</div>
                <div style={{ marginTop:8 }}>Pembeli: <strong>{receiptOrder.buyer_name || '-'}</strong></div>
                <div>Telp: {receiptOrder.buyer_phone || '-'}</div>
                <div>Alamat: {receiptOrder.buyer_address || '-'}</div>
              </div>
              <div style={{ marginTop:12 }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign:'left', borderBottom:'1px solid #eee', padding:'6px 0' }}>Produk</th>
                      <th style={{ textAlign:'left', borderBottom:'1px solid #eee', padding:'6px 0' }}>Harga</th>
                      <th style={{ textAlign:'left', borderBottom:'1px solid #eee', padding:'6px 0' }}>Jumlah</th>
                      <th style={{ textAlign:'right', borderBottom:'1px solid #eee', padding:'6px 0' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(receiptOrder.items||[]).map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ padding:'6px 0' }}>{it.product_name || '-'}</td>
                        <td style={{ padding:'6px 0' }}>Rp.{Number(it.price||0).toLocaleString('id-ID')}</td>
                        <td style={{ padding:'6px 0' }}>{it.quantity || 0}</td>
                        <td style={{ padding:'6px 0', textAlign:'right' }}>Rp.{(Number(it.price||0)*Number(it.quantity||0)).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(() => {
                const t = getTotalsForOrder(receiptOrder);
                return (
                  <div style={{ marginTop:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}>
                      <div>Total Produk</div>
                      <div>Rp.{t.productTotal.toLocaleString('id-ID')}</div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}>
                      <div>Ongkir</div>
                      <div>Rp.{t.shipping.toLocaleString('id-ID')}</div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontWeight:700 }}>
                      <div>Total Bayar</div>
                      <div>Rp.{t.total.toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                );
              })()}
              <div className="modal-buttons" style={{ marginTop:16 }}>
                <button className="cancel-button" onClick={() => setShowReceipt(false)}>Tutup</button>
                <button className="confirm-button" onClick={() => printReceipt(receiptOrder)}>Cetak PDF</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}