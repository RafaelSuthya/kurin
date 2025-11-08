import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { API_URL } from '../api/admin';

export default function UserOrderRefund() {
  const { state } = useLocation();
  const navigate = useNavigate();
  // Ambil order dari state; fallback ke localStorage bila state hilang
  const order = React.useMemo(() => {
    if (state?.order) return state.order;
    try {
      const raw = localStorage.getItem('lastOrderForRefund');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, [state?.order]);
  const [reason, setReason] = React.useState('');
  const [photo, setPhoto] = React.useState(null);
  const [photoURL, setPhotoURL] = React.useState(null);
  const [video, setVideo] = React.useState(null);
  const [videoURL, setVideoURL] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showConfirm, setShowConfirm] = React.useState(false);
  // Viewer untuk memperbesar foto/video
  const [viewer, setViewer] = React.useState(null); // { type: 'image' | 'video', url: string, rotate?: number, portrait?: boolean }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    try { if (photoURL) URL.revokeObjectURL(photoURL); } catch (err) {}
    setPhoto(file);
    setPhotoURL(file ? URL.createObjectURL(file) : null);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0] || null;
    try { if (videoURL) URL.revokeObjectURL(videoURL); } catch (err) {}
    setVideo(file);
    setVideoURL(file ? URL.createObjectURL(file) : null);
  };

  React.useEffect(() => {
    return () => {
      try { if (photoURL) URL.revokeObjectURL(photoURL); } catch (err) {}
      try { if (videoURL) URL.revokeObjectURL(videoURL); } catch (err) {}
    };
  }, [photoURL, videoURL]);

  const openConfirm = () => {
    setError('');
    if (!order?.id) { setError('Data pesanan tidak lengkap.'); return; }
    if (!reason.trim()) { setError('Isi alasan refund terlebih dahulu.'); return; }
    if (!photo) { setError('Foto bukti wajib diunggah.'); return; }
    setShowConfirm(true);
  };

  const doSubmitRefund = async () => {
    setError('');
    setShowConfirm(false);
    setBusy(true);
    try {
      const token = localStorage.getItem('userToken');
      const fd = new FormData();
      fd.append('reason', reason);
      if (photo) fd.append('photo', photo);
      if (video) fd.append('video', video);
      const res = await fetch(`${API_URL}/user/orders/${order.id}/refund`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j.message || 'Gagal mengajukan refund');
      }
      alert('Pengajuan refund dikirim ke admin. Pantau status pada daftar pesanan.');
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
        /* Hindari textarea melebar keluar card: gunakan border-box dan batasi resize horizontal */
        .card textarea { width: 100%; box-sizing: border-box; resize: vertical; }
        .actions { display: flex; gap: 12px; justify-content: flex-end; }
        .btn { border: none; padding: 10px 14px; border-radius: 6px; cursor: pointer; }
        .btn.primary { background:#c33; color:#fff; }
        .btn.secondary { background:#eee; color:#333; }
        .preview { display:block; margin-top:8px; }
        .preview img { max-width: 220px; max-height: 160px; border-radius:6px; border:1px solid #eee; object-fit: contain; cursor: zoom-in; }
        .preview video { max-width: 260px; max-height: 200px; border-radius:6px; border:1px solid #eee; cursor: zoom-in; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index: 1000; }
        .modal { background: #fff; width: 92%; max-width: 420px; border-radius: 10px; padding: 16px; box-shadow: 0 12px 30px rgba(0,0,0,.25); }
        .modal-title { font-size: 18px; font-weight: 700; color: #c33; margin-bottom: 8px; }
        .modal-sub { color: #555; margin-bottom: 12px; }
        .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top: 12px; }
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
        <div className='title'>Pengajuan Refund</div>
        <div className='note'>Unggah bukti dan alasan refund untuk diproses admin.</div>

        {!order && (
          <div className='card'>Data pesanan tidak ditemukan.</div>
        )}

        {order && (
          <div className='card'>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight:700, color:'#c33' }}>{order.buyer_name} • {order.buyer_phone}</div>
              <div style={{ color:'#555' }}>{order.buyer_address}</div>
            </div>

            <label style={{ display:'block', marginBottom: 6 }}>Foto Bukti (wajib)</label>
            <input type='file' accept='image/*' onChange={handlePhotoChange} />
            {photoURL && (
              <div className='preview'>
                <img src={photoURL} alt='Foto bukti' onClick={() => setViewer({ type: 'image', url: photoURL })} />
              </div>
            )}

            <label style={{ display:'block', margin:'12px 0 6px' }}>Video Tambahan (opsional)</label>
            <input type='file' accept='video/*' onChange={handleVideoChange} />
            {videoURL && (
              <div className='preview'>
                <video controls src={videoURL} onClick={() => setViewer({ type: 'video', url: videoURL, rotate: 0 })} />
              </div>
            )}

            <label style={{ display:'block', margin:'12px 0 6px' }}>Alasan Refund (wajib)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Tuliskan alasan refund Anda...'
              rows={4}
              style={{ width:'100%', maxWidth:'100%', boxSizing:'border-box', padding:'10px 12px', border:'1px solid #ddd', borderRadius:6, resize:'vertical' }}
            />
            {error && <div style={{ color:'#c33', marginTop:8 }}>{error}</div>}

            <div className='actions' style={{ marginTop: 12 }}>
              <button className='btn secondary' disabled={busy} onClick={() => navigate(-1)}>Batal</button>
              <button className='btn primary' disabled={busy} onClick={openConfirm}>{busy ? 'Mengirim...' : 'Kirim Refund'}</button>
            </div>
          </div>
        )}

        {showConfirm && (
          <div className='modal-overlay' onClick={() => setShowConfirm(false)}>
            <div className='modal' onClick={(e) => e.stopPropagation()}>
              <div className='modal-title'>Kirim pengajuan refund?</div>
              <div className='modal-sub'>Pastikan data sudah benar sebelum mengirim.</div>
              <ul style={{ margin:'0 0 8px 18px', color:'#333' }}>
                <li>Pesanan: #{order?.id}</li>
                {photo && <li>Foto: {photo.name}</li>}
                {video && <li>Video: {video.name}</li>}
                <li>Alasan: {reason.trim().slice(0,80) || '-'}</li>
              </ul>
              <div className='modal-actions'>
                <button className='btn secondary' onClick={() => setShowConfirm(false)}>Batal</button>
                <button className='btn primary' onClick={doSubmitRefund} disabled={busy}>Kirim</button>
              </div>
            </div>
          </div>
        )}
        {/* Viewer Overlay untuk foto/video */}
        {viewer && (
          <div className='modal-overlay' style={{ background:'rgba(0,0,0,0.65)' }} onClick={() => setViewer(null)}>
            {/* Controls: Close + Rotate */}
            <div style={{ position:'absolute', top:16, right:20, display:'flex', gap:8 }}>
              <button onClick={(e) => { e.stopPropagation(); setViewer(null); }} style={{ background:'#222', color:'#fff', border:'none', borderRadius:999, width:30, height:30, cursor:'pointer' }}>×</button>
              {viewer.type === 'video' && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); setViewer(v => v ? { ...v, rotate: ((v.rotate || 0) - 90 + 360) % 360 } : v); }} style={{ background:'#444', color:'#fff', border:'none', borderRadius:6, padding:'6px 10px', cursor:'pointer' }}>Putar ⟲</button>
                  <button onClick={(e) => { e.stopPropagation(); setViewer(v => v ? { ...v, rotate: ((v.rotate || 0) + 90) % 360 } : v); }} style={{ background:'#444', color:'#fff', border:'none', borderRadius:6, padding:'6px 10px', cursor:'pointer' }}>Putar ⟳</button>
                </>
              )}
              {/* Open raw file in new tab for quick check */}
              <a href={viewer.url} target="_blank" rel="noopener noreferrer" onClick={(e)=>e.stopPropagation()} style={{ background:'#555', color:'#fff', textDecoration:'none', borderRadius:6, padding:'6px 10px' }}>Buka File</a>
            </div>
          
            {/* Content */}
            {viewer.type === 'image' ? (
              <img src={viewer.url} alt='Preview Foto' style={{ maxWidth:'90vw', maxHeight:'90vh', width:'auto', height:'auto', objectFit:'contain', borderRadius:6 }} onClick={(e)=>e.stopPropagation()} />
            ) : (
              <video
                src={viewer.url}
                controls
                onClick={(e)=>e.stopPropagation()}
                onLoadedMetadata={(e) => {
                  const vw = e.target.videoWidth || 0;
                  const vh = e.target.videoHeight || 0;
                  const portrait = vh > vw;
                  setViewer(v => v ? { ...v, portrait } : v);
                }}
                style={{
                  maxWidth:'90vw',
                  maxHeight:'90vh',
                  width: (() => {
                    const r = ((viewer?.rotate || 0) % 180) !== 0;
                    const effectivePortrait = viewer?.portrait ? !r : r;
                    return effectivePortrait ? 'auto' : '90vw';
                  })(),
                  height: (() => {
                    const r = ((viewer?.rotate || 0) % 180) !== 0;
                    const effectivePortrait = viewer?.portrait ? !r : r;
                    return effectivePortrait ? '90vh' : 'auto';
                  })(),
                  objectFit:'contain',
                  borderRadius:6,
                  transform: `rotate(${viewer?.rotate || 0}deg)`,
                  transformOrigin: 'center center',
                  aspectRatio: (() => {
                    const r = ((viewer?.rotate || 0) % 180) !== 0;
                    const effectivePortrait = viewer?.portrait ? !r : r;
                    return effectivePortrait ? '9 / 16' : '16 / 9';
                  })(),
                  background: '#000'
                }}
              />
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}