import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { API_URL } from '../api/admin';

export default function UserOrderCancel() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order || null;
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const submitCancel = async () => {
    setError('');
    if (!order?.id) { alert('Data pesanan tidak lengkap.'); return; }
    if (!reason.trim()) { alert('Isi alasan pembatalan terlebih dahulu.'); return; }
    const sure = window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini?');
    if (!sure) return;
    setBusy(true);
    try {
      // Placeholder integrasi API, sesuaikan endpoint jika tersedia
      const token = localStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/user/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      // Jika endpoint belum ada, anggap sukses
      if (!res.ok) {
        try { const j = await res.json(); throw new Error(j.message || 'Gagal mengajukan pembatalan'); } catch(e) { throw new Error('Gagal mengajukan pembatalan'); }
      }
      alert('Pengajuan pembatalan dikirim ke admin. Status akan diperbarui setelah diproses.');
      navigate('/pesanan');
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-root" style={{ background: '#f8f8f8', minHeight: '100vh' }}>
      <style>{`
        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: #fff; border-bottom: 1px solid #eee; }
        .nav { display: flex; gap: 24px; }
        .nav a { color: #c33; text-decoration: none; font-weight: 600; }
        .container { max-width: 720px; margin: 20px auto; padding: 0 20px; }
        .title { font-size: 24px; color: #c33; margin: 0 0 4px; }
        .note { color: #666; margin-bottom: 12px; }
        .card { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 16px; }
        .actions { display: flex; gap: 12px; justify-content: flex-end; }
        .btn { border: none; padding: 10px 14px; border-radius: 6px; cursor: pointer; }
        .btn.primary { background:#c33; color:#fff; }
        .btn.secondary { background:#eee; color:#333; }
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
        <div className='title'>Pembatalan Pesanan</div>
        <div className='note'>Isi alasan pembatalan kemudian konfirmasi. Keputusan akhir oleh admin.</div>

        {!order && (
          <div className='card'>Data pesanan tidak ditemukan.</div>
        )}

        {order && (
          <div className='card'>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight:700, color:'#c33' }}>{order.buyer_name} • {order.buyer_phone}</div>
              <div style={{ color:'#555' }}>{order.buyer_address}</div>
            </div>

            <label style={{ display:'block', marginBottom: 6 }}>Alasan Pembatalan</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Tuliskan alasan pembatalan Anda...'
              rows={4}
              style={{ width:'100%', padding:'10px 12px', border:'1px solid #ddd', borderRadius:6 }}
            />
            {error && <div style={{ color:'#c33', marginTop:8 }}>{error}</div>}

            <div className='actions' style={{ marginTop: 12 }}>
              <button className='btn secondary' disabled={busy} onClick={() => navigate(-1)}>Tidak</button>
              <button className='btn primary' disabled={busy} onClick={submitCancel}>{busy ? 'Mengirim...' : 'Batal'}</button>
            </div>
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
}