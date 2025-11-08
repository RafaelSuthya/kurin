import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { API_URL } from '../api/admin';

const fmt = (n) => 'Rp.' + Number(n || 0).toLocaleString('id-ID');

const displayStatus = (o) => {
  const s = (o?.status?.name || '').toLowerCase();
  // Prioritaskan status refund disetujui untuk user
  const returns = Array.isArray(o?.return_orders) ? o.return_orders : (Array.isArray(o?.returnOrders) ? o.returnOrders : []);
  const hasApprovedRefund = (returns || []).some(r => String(r?.decision || '').toLowerCase() === 'approved');
  if (hasApprovedRefund) return 'Refund disetujui';

  const cancels = Array.isArray(o?.cancellations) ? o.cancellations : [];
  const pendingBuyerCancel = cancels.some(c => (c.initiator || '').toLowerCase() === 'buyer' && !c.decision);
  const buyerCancelApproved = cancels.some(c => (c.initiator || '').toLowerCase() === 'buyer' && String(c.decision || '').toLowerCase() === 'approved');
  const adminCancelled = s === 'cancelled' || cancels.some(c => (c.initiator || '').toLowerCase() === 'admin');

  if (pendingBuyerCancel) return 'Menunggu keputusan admin';
  if (buyerCancelApproved) return 'Pembatalan disetujui';
  if (adminCancelled) return 'Dibatalkan oleh admin';

  if (s === 'pending') return 'Belum Bayar';
  if (s === 'processing') return 'Diproses';
  if (s === 'shipped') return 'Dikirim';
  if (s === 'delivered') return 'Sampai';
  if (s === 'completed') return 'Selesai';
  if (s === 'cancelled') return 'Dibatalkan oleh admin';
  return o?.status?.name || '—';
};

export default function UserReviewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const orderData = state?.order || null;

  const items = React.useMemo(() => {
    if (Array.isArray(orderData?.items)) return orderData.items;
    if (Array.isArray(orderData?.order_items)) return orderData.order_items;
    if (Array.isArray(orderData?.orderItems)) return orderData.orderItems;
    return [];
  }, [orderData]);
  const [productImages, setProductImages] = React.useState({});
  const [selectedIndex] = React.useState(items.length > 0 ? 0 : -1);
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null;
  // state per-produk untuk rating & alasan/ulasan
  const [reviews, setReviews] = React.useState({}); // { [product_id]: { rating, text, locked, hasExisting } }
  // override status label di UI setelah update
  const [statusOverride, setStatusOverride] = React.useState(null);

  const statusStr = React.useMemo(() => statusOverride || displayStatus(orderData || {}), [orderData, statusOverride]);
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
  // state untuk kontrol edit sekali (tidak perlu flag terpisah)

  React.useEffect(() => {
    let cancelled = false;
    const needs = new Set();
    items.forEach(it => { if (it.product_id && !productImages[it.product_id]) needs.add(it.product_id); });
    if (needs.size === 0) return;
    (async () => {
      const out = await Promise.all([...needs].map(async (pid) => {
        try {
          const res = await fetch(`${API_URL}/admin/products/${pid}`, { headers: { 'Accept': 'application/json' } });
          const p = await res.json();
          const img = Array.isArray(p?.images) && p.images.length ? p.images[0] : null;
          return { pid, img };
        } catch {
          return { pid, img: null };
        }
      }));
      if (cancelled) return;
      setProductImages(prev => { const next = { ...prev }; out.forEach(({ pid, img }) => { if (img) next[pid] = img; }); return next; });
    })();
    return () => { cancelled = true; };
  }, [items, productImages]);

  // preload review untuk semua item dalam pesanan
  React.useEffect(() => {
    if (!orderData?.id || !items || items.length === 0) return;
    try {
      const next = {};
      items.forEach(it => {
        const pid = it.product_id;
        if (!pid) return;
        const raw = localStorage.getItem('productReviews:' + pid);
        const arr = raw ? JSON.parse(raw) : [];
        const rec = arr.find(r => r.order_id === orderData.id);
        next[pid] = {
          rating: rec ? Number(rec.rating) || 5 : 5,
          text: rec ? (rec.text || '') : '',
          locked: rec ? ((rec.editCount || 0) >= 1) : false,
          synced: rec ? !!rec.synced : false,
          hasExisting: !!rec,
        };
      });
      setReviews(next);
      // flag hasExisting per-produk sudah tercermin di objek reviews
    } catch {
      // noop
    }
  }, [orderData, items, selectedItem]);

  // sinkronisasi otomatis ke API: jika ada ulasan lama di localStorage dan belum "synced"
  React.useEffect(() => {
    let cancelled = false;
    if (!orderData?.id || !items || items.length === 0) return;
    const token = localStorage.getItem('userToken');
    if (!token) return; // hanya sinkron jika user login

    (async () => {
      for (const it of items) {
        const pid = it.product_id;
        if (!pid) continue;
        try {
          const key = 'productReviews:' + pid;
          const raw = localStorage.getItem(key);
          const arr = raw ? JSON.parse(raw) : [];
          const idx = arr.findIndex(r => r.order_id === (orderData?.id));
          if (idx < 0) continue;
          const rec = arr[idx] || {};
          if (rec.synced) continue; // sudah disinkronkan

          const payload = { rating: Number(rec.rating) || 5, text: String(rec.text || '').trim() };
          const res = await fetch(`${API_URL}/products/${pid}/reviews`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }).catch(() => null);

          if (!res || !res.ok) continue;
          // tandai sebagai tersinkron
          arr[idx] = { ...rec, synced: true };
          localStorage.setItem(key, JSON.stringify(arr));
          if (cancelled) break;
          setReviews(prev => ({ ...prev, [pid]: { ...(prev[pid] || {}), synced: true } }));
        } catch {
          // abaikan kegagalan dan lanjutkan item lain
        }
      }
    })();

    return () => { cancelled = true; };
  }, [orderData, items]);

  const getItemImage = (it) => {
    const img = (it.product_image || '').trim();
    if (img) return img;
    if (it.product_id && productImages[it.product_id]) return productImages[it.product_id];
    return '/kurin.png';
  };

  // new: update status ke Selesai
  const updateOrderCompleted = async () => {
    if (!orderData?.id) return false;
    const tryUpdate = async (label) => {
      try {
        const res = await fetch(`${API_URL}/admin/orders/${orderData.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ status: label })
        });
        let json = {};
        try { json = await res.json(); } catch {}
        if (!res.ok) {
          console.warn('Gagal update status', { http: res.status, body: json });
          return false;
        }
        const returned = String(json?.status || '').toLowerCase();
        if (returned === 'completed' || label.toLowerCase() === 'completed' || label.toLowerCase() === 'selesai') {
          setStatusOverride('Selesai');
        }
        return true;
      } catch (e) {
        console.warn('Error saat update status:', e);
        return false;
      }
    };
    // coba dengan label kanonik terlebih dulu
    if (await tryUpdate('completed')) return true;
    if (await tryUpdate('Selesai')) return true;
    if (await tryUpdate('selesai')) return true;
    return false;
  };

  const saveReviewFor = async (pid) => {
    const entry = reviews[pid] || {};
    if (!pid) { alert('Produk tidak valid.'); return; }
    if (!(Number(entry.rating) >= 1 && Number(entry.rating) <= 5)) { alert('Pilih rating 1-5.'); return; }
    if (!String(entry.text || '').trim()) { alert('Isi alasan/ulasan terlebih dahulu.'); return; }

    try {
      const key = 'productReviews:' + pid;
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      const idx = arr.findIndex(r => r.order_id === (orderData?.id));

      if (idx >= 0) {
        const rec = arr[idx] || {};
        const edits = (rec.editCount || 0);
        if (edits >= 1) {
          alert('Ulasan Anda sudah dikunci. Hanya bisa edit sekali.');
          return;
        }
        arr[idx] = { ...rec, rating: Number(entry.rating), text: String(entry.text || '').trim(), ts: Date.now(), editCount: edits + 1 };
      } else {
        arr.push({ rating: Number(entry.rating), text: String(entry.text || '').trim(), author: (orderData?.buyer_name || 'Anonim'), ts: Date.now(), order_id: orderData?.id, editCount: 0 });
      }

      localStorage.setItem(key, JSON.stringify(arr));

      // Kirim ke API agar ulasan bersifat publik (jika user login)
      try {
        const token = localStorage.getItem('userToken');
        if (token) {
          const res = await fetch(`${API_URL}/products/${pid}/reviews`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ rating: Number(entry.rating), text: String(entry.text || '').trim() }),
          }).catch(() => null);
          // jika sukses, tandai rec sebagai synced di localStorage
          if (res && res.ok) {
            const raw2 = localStorage.getItem(key);
            const arr2 = raw2 ? JSON.parse(raw2) : [];
            const idx2 = arr2.findIndex(r => r.order_id === (orderData?.id));
            if (idx2 >= 0) {
              arr2[idx2] = { ...(arr2[idx2] || {}), synced: true };
              localStorage.setItem(key, JSON.stringify(arr2));
            }
          }
        }
      } catch {}

      // reflect locked in UI
      setReviews(prev => ({ ...prev, [pid]: { ...(prev[pid] || {}), locked: true, hasExisting: true } }));

      // update status ke Selesai
      const ok = await updateOrderCompleted();
      if (ok) {
        alert('Ulasan berhasil disimpan untuk produk ini.');
      } else {
        alert('Ulasan tersimpan, namun gagal memperbarui status pesanan.');
      }
    } catch (e) {
      alert('Gagal menyimpan ulasan.');
    }
  };

  return (
    <div className="page-root" style={{ background:'#fff', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <style>{`
        .topbar { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; background:#fff; border-bottom:1px solid #eee; }
        .nav { display:flex; gap:24px; }
        .nav a { color:#c33; text-decoration:none; font-weight:600; }
        .container { max-width: 1000px; margin: 20px auto; padding: 0 20px; flex: 1; width: 100%; }
        .title { font-size: 28px; color: #c33; margin: 0 0 6px; font-weight: 700; }
        .note { color: #666; margin-bottom: 12px; }
        /* Header merah: gunakan grid 2 kolom agar rapi */
        .band { background:#e52b2b; color:#fff; border-radius: 18px; padding: 16px; display:grid; grid-template-columns: 1fr 180px; align-items:start; gap: 20px; }
        .band .left { display:flex; flex-direction:column; gap:10px; padding-right: 12px; }
        .band .item-row { display:grid; grid-template-columns: 60px 1fr 100px; align-items:center; gap:10px; }
        .band .item-row img { width:60px; height:60px; object-fit:cover; border-radius:8px; background:#fff; }
        .band .item-row .name { font-weight:700; }
        .band .item-row .price { font-weight:700; text-align:right; }
        .band .right { display:flex; flex-direction:column; align-items:flex-end; justify-content:center; gap:8px; align-self:stretch; }
        .band .status { background:#fff; color:#c33; border-radius:6px; padding:6px 10px; font-weight:700; }
        .band .footer { grid-column: 1 / -1; display:flex; justify-content:flex-end; font-weight:700; margin-top:8px; }
        .stars { display:flex; gap:8px; }
        .star { font-size: 28px; cursor:pointer; color:#ddd; }
        .star.active { color: #f7b500; }
        .table { background:#e52b2b; color:#fff; border-radius: 10px; overflow:hidden; margin-bottom: 12px; }
        .table table { width:100%; border-collapse:collapse; }
        .table th, .table td { padding:12px; text-align:left; }
        .form { background:#fff; border:1px solid #eee; border-radius: 10px; padding: 16px; }
        .form textarea { box-sizing: border-box; width: 100%; max-width: 100%; }
        .btn { border:none; border-radius:6px; padding:10px 14px; cursor:pointer; font-weight:700; }
        .btn.primary { background:#c33; color:#fff; }
        .btn.secondary { background:#fff; color:#c33; border:1px solid #c33; }
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
        <div className='title'>Rating & Ulasan</div>
        <div className='note'>Pilih produk yang dibeli, beri bintang dan ulasan Anda.</div>

        {!orderData && (
          <div className='form'>Data pesanan tidak ditemukan.</div>
        )}

        {orderData && selectedItem && (
          <div style={{ marginBottom: 12 }}>
            <div className='band'>
              {/* Kiri: daftar produk rapi per baris */}
              <div className='left'>
                {items.map((it, idx) => (
                  <div key={it.product_id || idx} className='item-row'>
                    <img src={getItemImage(it)} alt={it.product_name} />
                    <div className='name'>
                      {it.product_name}
                      {it.variant ? (
                        <div style={{ fontSize:12, fontWeight:500, marginTop:2, color:'#ffe' }}>Warna: {String(it.variant)}</div>
                      ) : null}
                    </div>
                    <div className='price'>{fmt(it.price)}</div>
                  </div>
                ))}
              </div>
              {/* Kanan: hanya status agar tidak mengganggu layout harga per item */}
              <div className='right'>
                <div className='status'>{statusStr}</div>
                {refundLabel && (
                  <div className='status'>Status Refund: {refundLabel}</div>
                )}
              </div>
              {/* Footer: total dijadikan satu baris di bawah agar rapi */}
              <div className='footer'>Total: {fmt(items.reduce((sum, it) => sum + (Number(it.price) || 0), 0))}</div>
            </div>
          </div>
        )}

        {items.length > 0 && (
          null
        )}

        {/* Form rating & alasan per-produk */}
        {items.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {items.map((it, idx) => {
              const pid = it.product_id;
              const entry = reviews[pid] || { rating: 5, text: '', locked: false };
              return (
                <div key={pid || idx} className='form' style={{ marginBottom: 12 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 100px', alignItems:'center', gap:10, marginBottom: 10 }}>
                    <img src={getItemImage(it)} alt={it.product_name} style={{ width:60, height:60, objectFit:'cover', borderRadius:8, background:'#fff' }} />
                    <div style={{ fontWeight:700 }}>
                      {it.product_name}
                      {it.variant ? (
                        <div style={{ fontSize:12, fontWeight:500, marginTop:2, color:'#666' }}>Warna: {String(it.variant)}</div>
                      ) : null}
                    </div>
                    <div style={{ fontWeight:700, textAlign:'right' }}>{fmt(it.price)}</div>
                  </div>
                  {entry.hasExisting && (
                    <div style={{ background:'#fff7f7', border:'1px solid #f3caca', color:'#c33', borderRadius:8, padding:'8px 12px', marginBottom:12 }}>
                      {entry.locked ? 'Ulasan dikunci. Anda sudah melakukan 1 kali edit.' : 'Anda sudah pernah mengulas produk ini. Anda masih bisa edit sekali.'}
                    </div>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', alignItems:'center', gap:12, marginBottom:10 }}>
                    <div style={{ fontWeight:600 }}>Rating</div>
                    <div className='stars'>
                      {[1,2,3,4,5].map(n => (
                        <span
                          key={n}
                          className={`star ${entry.rating >= n ? 'active' : ''}`}
                          onClick={() => !entry.locked && setReviews(prev => ({ ...prev, [pid]: { ...(prev[pid] || {}), rating: n } }))}
                          style={{ cursor: entry.locked ? 'not-allowed' : 'pointer', opacity: entry.locked ? 0.6 : 1 }}
                        >★</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:12 }}>
                    <div style={{ fontWeight:600 }}>Alasan/Ulasan</div>
                    <textarea
                      rows={3}
                      placeholder='Tulis alasan atau pengalaman Anda menggunakan produk ini...'
                      value={entry.text}
                      onChange={(e) => setReviews(prev => ({ ...prev, [pid]: { ...(prev[pid] || {}), text: e.target.value } }))}
                      style={{ width:'100%', border:'1px solid #ddd', borderRadius:8, padding:'10px 12px' }}
                      disabled={entry.locked}
                    />
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
                    <button className='btn secondary' onClick={() => navigate(-1)}>Kembali</button>
                    <button className='btn primary' onClick={() => saveReviewFor(pid)} disabled={entry.locked}>{entry.locked ? 'Terkunci' : 'Unggah'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Footer dipindahkan keluar container agar lebar penuh dan berada di bawah */}
      <Footer />
    </div>
  );
}