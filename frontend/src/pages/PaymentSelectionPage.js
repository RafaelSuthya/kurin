import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const PaymentSelectionPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order || null;
  const totalBayar = Number(state?.totalBayar || 0);
  const ongkir = Number(state?.ongkir || 0);

  const [snapReady, setSnapReady] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null); // 'pending' | 'success' | 'error'
  const [errorInfo, setErrorInfo] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const paymentMethods = [
    { value: 'credit_card', label: 'Kartu Kredit' },
    { value: 'bank_transfer', label: 'Transfer Bank (VA)' },
    { value: 'gopay', label: 'GoPay' },
    { value: 'shopeepay', label: 'ShopeePay' },
    { value: 'qris', label: 'QRIS' },
    { value: 'akulaku', label: 'Akulaku' },
    { value: 'kredivo', label: 'Kredivo' },
    { value: 'indomaret', label: 'Indomaret' },
    { value: 'alfamart', label: 'Alfamart' },
  ];

  useEffect(() => {
    let script;
    const API_BASE = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

    function loadSnap(clientKey, base) {
      if (!clientKey) { return; }
      const snapBase = (base && typeof base === 'string') ? base : (process.env.REACT_APP_MIDTRANS_BASE || 'https://app.sandbox.midtrans.com');
      script = document.createElement('script');
      script.src = `${snapBase}/snap/snap.js`;
      script.setAttribute('data-client-key', clientKey);
      script.onload = () => setSnapReady(true);
      document.body.appendChild(script);
    }

    // Ambil config dari backend agar base dan client key selaras
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/payments/midtrans/config`);
        const j = await res.json().catch(() => ({}));
        const keyFromApi = j?.client_key;
        const baseFromApi = j?.base;
        if (keyFromApi) {
          loadSnap(keyFromApi, baseFromApi);
        } else {
          const fallbackKey = process.env.REACT_APP_MIDTRANS_CLIENT_KEY || '';
          const fallbackBase = process.env.REACT_APP_MIDTRANS_BASE || 'https://app.sandbox.midtrans.com';
          loadSnap(fallbackKey, fallbackBase);
        }
      } catch (e) {
        console.warn('Gagal mengambil config Midtrans dari backend, menggunakan env', e);
        const fallbackKey = process.env.REACT_APP_MIDTRANS_CLIENT_KEY || '';
        const fallbackBase = process.env.REACT_APP_MIDTRANS_BASE || 'https://app.sandbox.midtrans.com';
        loadSnap(fallbackKey, fallbackBase);
      }
    })();

    return () => { if (script) document.body.removeChild(script); };
  }, []);

  const handlePayment = async () => {
    if (!snapReady) { alert('Sistem pembayaran belum siap'); return; }

    // Hitung grossAmount: utamakan totalBayar (total produk + ongkir) dari state
    const baseAmount = Number.isFinite(totalBayar) && totalBayar > 0
      ? totalBayar
      : (order?.total) ?? (order?.totalBayar) ?? (
          Array.isArray(order?.items)
            ? order.items.reduce((sum, it) => sum + (Number(it.price)||0) * (Number(it.quantity)||1), 0)
            : 0
        );

    // Tambahkan item "Ongkir" agar item_details selaras dengan gross_amount
    const items = Array.isArray(order?.items) ? [...order.items] : [];
    if (ongkir > 0) {
      items.push({ id: 'shipping', name: 'Ongkir', price: Number(ongkir || 0), quantity: 1 });
    }

    try {
      const res = await fetch(`${(process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}/api/payments/midtrans/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          gross_amount: baseAmount,
          // Gunakan order_id unik agar tidak bentrok pada percobaan berulang
          order_id: `ORDER-${order?.id || 'NOID'}-${Date.now()}`,
          // Jangan batasi channel di sini; biarkan Snap menampilkan yang tersedia
          order: {
            id: order?.id,
            buyer_name: order?.buyer_name || 'Guest',
            buyer_email: order?.buyer_email || 'customer@example.com',
            buyer_phone: order?.buyer_phone || '',
            buyer_address: order?.buyer_address || '',
            items,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.token) {
        setPaymentStatus('error');
        const msg = (data && (data.body?.status_message || (Array.isArray(data.body?.error_messages) ? data.body.error_messages.join(', ') : '') || data.message)) || 'Gagal membuat transaksi';
        setErrorInfo(msg || '');
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: async (result) => {
          console.log('Success', result);
          setPaymentStatus('success');
          // Tandai pesanan sebagai dibayar => status Processing
          try {
            const token = localStorage.getItem('userToken');
            const API_BASE = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
            if (token && order?.id) {
              await fetch(`${API_BASE}/api/user/orders/${order.id}/paid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
              });
            }
          } catch (e) { console.warn('Gagal mengubah status pesanan ke diproses', e); }
          setShowSuccess(true);
        },
        onPending: (result) => { console.log('Pending', result); setPaymentStatus('pending'); setErrorInfo(result?.status_message || 'Transaksi pending, lanjutkan di Snap.'); },
        onError: (result) => { console.log('Error', result); setPaymentStatus('error'); setErrorInfo(result?.status_message || result?.message || 'Pembayaran gagal'); },
        onClose: () => { console.log('Closed'); setPaymentStatus('closed'); setErrorInfo('Jendela Snap ditutup. Anda bisa mencoba lagi.'); },
      });
    } catch (e) {
      console.error('Payment error', e);
      setPaymentStatus('error');
      setErrorInfo(e?.message || 'Kesalahan jaringan');
    }
  };

  const statusStyle = (s) => ({
    textAlign: 'center',
    fontSize: 18,
    marginTop: 12,
    color: s === 'pending' ? '#ffa500' : s === 'success' ? '#008000' : '#ff0000',
    fontWeight: 600,
  });

  return (
    <div className="page-root">
      <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#fff', borderBottom: '1px solid #eee' }}>
        <img src="/kurin.png" alt="Kurin" style={{ height: 54 }} />
        <div className="nav" style={{ display: 'flex', gap: 24 }}>
          <a href="/home" style={{ color: '#c33', textDecoration: 'none', fontWeight: 600 }}>Home</a>
          <a href="/company-profile" style={{ color: '#c33', textDecoration: 'none', fontWeight: 600 }}>About Us</a>
          <a href="/terms" style={{ color: '#c33', textDecoration: 'none', fontWeight: 600 }}>Syarat & Ketentuan</a>
          <a href="/contact" style={{ color: '#c33', textDecoration: 'none', fontWeight: 600 }}>Contact</a>
          <a href="/profile" style={{ color: '#c33', textDecoration: 'none', fontWeight: 600 }}>Profile</a>
        </div>
      </div>

      {/* Jadikan konten fleksibel agar footer selalu terdorong ke bawah tanpa mengubah tampilan */}
      <div style={{ padding: 20, backgroundColor: '#f9f9f9', flex: 1 }}>
        <h1 style={{ color: '#333', textAlign: 'center' }}>Pilih Metode Pembayaran</h1>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: 24 }}>Silakan pilih metode pembayaran yang diinginkan:</p>

        {paymentStatus && (
          <div style={statusStyle(paymentStatus)}>
            Status Pembayaran: {paymentStatus === 'pending' ? 'Pending — selesaikan pembayaran' : paymentStatus === 'success' ? 'Success — pembayaran berhasil' : 'Error — gagal/tutup tanpa bayar'}
            {errorInfo && (
              <div style={{ marginTop: 8, fontSize: 14, color: '#c33' }}>Detail: {errorInfo}</div>
            )}
            <div style={{ marginTop: 10 }}>
              <button onClick={() => { setPaymentStatus(null); setErrorInfo(''); }} style={{ border:'1px solid #c33', background:'#fff', color:'#c33', borderRadius:6, padding:'8px 12px', fontWeight:700 }}>Coba Lagi</button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)} style={{ padding: 10, width: 260, borderRadius: 6, border: '1px solid #ccc' }}>
            <option value="">Pilih Metode</option>
            {paymentMethods.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
          </select>
          <button onClick={handlePayment} disabled={!snapReady} style={{ backgroundColor: '#e52b2b', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 6, fontSize: 16, cursor: !snapReady ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: !snapReady ? 0.6 : 1 }}>
            Bayar dengan Midtrans Snap
          </button>
          {!snapReady && <div style={{ color: '#999', fontSize: 14 }}>Memuat Snap... (Client key dari backend)</div>}
        </div>
      </div>
      {/* Modal sukses pembayaran */}
      {showSuccess && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'#fff', borderRadius:10, padding:16, maxWidth:420, width:'90%', boxShadow:'0 8px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize:22, color:'#c33', fontWeight:700, marginBottom:8, textAlign:'center' }}>Pembayaran Berhasil</div>
            <div style={{ color:'#555', textAlign:'center', marginBottom:12 }}>Terima kasih. Pesanan Anda akan segera diproses.</div>
            <div style={{ display:'flex', justifyContent:'center', gap:10 }}>
              <button onClick={() => setShowSuccess(false)} style={{ border:'1px solid #c33', background:'#fff', color:'#c33', borderRadius:6, padding:'10px 14px', fontWeight:700 }}>Tutup</button>
              <button onClick={() => navigate('/pesanan')} style={{ background:'#c33', color:'#fff', border:'none', borderRadius:6, padding:'10px 14px', fontWeight:700 }}>Ke Halaman Pesanan</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default PaymentSelectionPage;