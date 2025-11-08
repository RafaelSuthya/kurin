import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000/api';
const STORAGE_BASE = 'http://127.0.0.1:8000/storage';

const fmt = (n) => 'Rp.' + Number(n || 0).toLocaleString('id-ID');

export default function AdminRefunds() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [approveId, setApproveId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [modalError, setModalError] = useState('');
  // Viewer untuk memperbesar foto/video
  const [viewer, setViewer] = useState(null); // { type: 'image' | 'video', url: string, rotate?: number, portrait?: boolean }

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_URL}/admin/refunds`, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } });
        const json = await res.json();
        if (!cancelled) setList(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        if (!cancelled) setError('Gagal memuat daftar refund');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  // Buka modal approve
  const approveRefund = (id) => {
    setModalError('');
    setApproveId(id);
  };

  // Konfirmasi approve (API call)
  const confirmApproveRefund = async () => {
    if (!approveId) return;
    setBusyId(approveId);
    setModalError('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/refunds/${approveId}/approve`, { method: 'POST', headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || 'Gagal approve refund');
      // refresh list
      const res2 = await fetch(`${API_URL}/admin/refunds`, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } });
      const j2 = await res2.json();
      setList(Array.isArray(j2?.data) ? j2.data : []);
      setApproveId(null);
    } catch (e) {
      setModalError(e.message || 'Terjadi kesalahan');
    } finally {
      setBusyId(null);
    }
  };

  const closeApproveModal = () => {
    if (busyId) return;
    setApproveId(null);
    setModalError('');
  };

  // Buka modal tolak
  const rejectRefund = (id) => {
    setModalError('');
    setRejectId(id);
  };

  // Konfirmasi tolak (API call)
  const confirmRejectRefund = async () => {
    if (!rejectId) return;
    setBusyId(rejectId);
    setModalError('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/refunds/${rejectId}/reject`, { method: 'POST', headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || 'Gagal menolak refund');
      // refresh list
      const res2 = await fetch(`${API_URL}/admin/refunds`, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } });
      const j2 = await res2.json();
      setList(Array.isArray(j2?.data) ? j2.data : []);
      setRejectId(null);
    } catch (e) {
      setModalError(e.message || 'Terjadi kesalahan');
    } finally {
      setBusyId(null);
    }
  };

  const closeRejectModal = () => {
    if (busyId) return;
    setRejectId(null);
    setModalError('');
  };

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

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 30px', borderBottom:'1px solid #f0f0f0' }}>
          <div>
            <h1 style={{ fontSize:'28px', margin:0, fontWeight:'normal' }}>Refund</h1>
            <p style={{ margin:'5px 0 0', color:'#666' }}>Lihat pengajuan refund, bukti, dan approve bila valid</p>
          </div>
          <div>
            <button onClick={() => navigate('/admin/pesanan')} style={{ background:'#e52b2b', color:'#fff', padding:'10px 16px', border:'none', borderRadius:6, cursor:'pointer' }}>Ke Pesanan</button>
          </div>
        </div>

        <div style={{ padding:'24px 30px' }}>
          {loading && (<div>Memuat data...</div>)}
          {error && (<div style={{ color:'#c33' }}>{error}</div>)}

          {!loading && list.length === 0 && (
            <div style={{ border:'1px dashed #ddd', padding:16, borderRadius:8 }}>Belum ada pengajuan refund.</div>
          )}

          {list.map((r) => {
            const o = r.order || {};
            const items = Array.isArray(o.items) ? o.items : [];
            const photoUrl = r.photo_path ? `${STORAGE_BASE}/${r.photo_path}` : null;
            const videoUrl = r.video_path ? `${STORAGE_BASE}/${r.video_path}` : null;
            const sLabel = statusLabel(o.status?.name || o.status);
            const total = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0), 0);
            // Tambahkan label status refund
            const refundLabel = r.decision === 'approved' ? 'refund disetujui' : (r.decision === 'rejected' ? 'refund ditolak' : 'mengajukan refund');
            return (
              <div key={r.id} style={{ background:'#fff', border:'1px solid #eee', borderRadius:10, padding:16, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, color:'#c33' }}>{o.buyer_name} • {o.buyer_phone}</div>
                    <div style={{ color:'#555', marginBottom:6 }}>{o.buyer_address}</div>
                    <div style={{ display:'flex', gap:8, margin:'8px 0' }}>
                      <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'6px 10px', fontWeight:700 }}>Status: {sLabel}</div>
                      <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'6px 10px', fontWeight:700 }}>Total: {fmt(total)}</div>
                      <div style={{ background:'#fff', color:'#c33', borderRadius:6, padding:'6px 10px', fontWeight:700 }}>Tanggal: {r.return_date}</div>
                    </div>
                    {/* Status refund */}
                    <div style={{ display:'flex', gap:8, margin:'0 0 8px' }}>
                      <div style={{ background:'#f7f7f7', color:'#333', borderRadius:6, padding:'6px 10px', fontWeight:600 }}>Status Refund: {refundLabel}</div>
                    </div>
                    <div style={{ marginTop:8 }}>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Alasan Refund</div>
                      <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:6, padding:10 }}>{r.reason}</div>
                    </div>
                  </div>
                  <div style={{ flexBasis: 420 }}>
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                      {photoUrl && (
                        <div>
                          <div style={{ fontSize:12, color:'#666' }}>Foto</div>
                          <img src={photoUrl} alt="Bukti" style={{ maxWidth:200, borderRadius:6, border:'1px solid #eee', cursor:'zoom-in' }} onClick={() => setViewer({ type: 'image', url: photoUrl })} />
                        </div>
                      )}
                      {videoUrl && (
                        <div>
                          <div style={{ fontSize:12, color:'#666' }}>Video</div>
                          <video src={videoUrl} controls style={{ maxWidth:200, borderRadius:6, border:'1px solid #eee', cursor:'zoom-in' }} onClick={() => setViewer({ type: 'video', url: videoUrl, rotate: 0 })} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12, gap:10 }}>
                  {/* Tombol approve hanya tampil saat belum ada keputusan */}
                  {r.decision == null && (
                    <>
                      <button
                        onClick={() => approveRefund(r.id)}
                        disabled={busyId === r.id}
                        style={{ background:'#e52b2b', color:'#fff', padding:'10px 14px', border:'none', borderRadius:6, cursor:'pointer' }}
                      >{busyId === r.id ? 'Memproses...' : 'Approve Refund'}</button>
                      <button
                        onClick={() => rejectRefund(r.id)}
                        disabled={busyId === r.id}
                        style={{ background:'#777', color:'#fff', padding:'10px 14px', border:'none', borderRadius:6, cursor:'pointer' }}
                      >{busyId === r.id ? 'Memproses...' : 'Tolak Refund'}</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Modal Konfirmasi Approve */}
        {approveId && (
          <div className="modal-overlay" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={closeApproveModal}>
            <div className="modal-content" style={{ background:'#fff', width:'92%', maxWidth:420, borderRadius:10, padding:16, boxShadow:'0 12px 30px rgba(0,0,0,.25)' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color:'#c33', marginTop:0 }}>Approve Refund?</h3>
              <div style={{ color:'#555' }}>Setujui refund untuk pesanan ini? Status pesanan akan diubah ke Dalam proses refund.</div>
              {modalError && (<div style={{ color:'#c33', background:'#fff', padding:8, borderRadius:6, marginTop:8 }}>{modalError}</div>)}
              <div className="modal-buttons" style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:12 }}>
                <button className="cancel-button" onClick={closeApproveModal} disabled={!!busyId}>Batal</button>
                <button className="confirm-button" onClick={confirmApproveRefund} disabled={!!busyId} style={{ background:'#e52b2b', color:'#fff', border:'none', borderRadius:6, padding:'8px 12px' }}>{busyId ? 'Memproses...' : 'Ya, Approve'}</button>
              </div>
            </div>
          </div>
        )}
        {/* Modal Konfirmasi Tolak */}
        {rejectId && (
          <div className="modal-overlay" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={closeRejectModal}>
            <div className="modal-content" style={{ background:'#fff', width:'92%', maxWidth:420, borderRadius:10, padding:16, boxShadow:'0 12px 30px rgba(0,0,0,.25)' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color:'#c33', marginTop:0 }}>Tolak Refund?</h3>
              <div style={{ color:'#555' }}>Yakin menolak refund untuk pesanan ini?</div>
              {modalError && (<div style={{ color:'#c33', background:'#fff', padding:8, borderRadius:6, marginTop:8 }}>{modalError}</div>)}
              <div className="modal-buttons" style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:12 }}>
                <button className="cancel-button" onClick={closeRejectModal} disabled={!!busyId}>Batal</button>
                <button className="confirm-button" onClick={confirmRejectRefund} disabled={!!busyId} style={{ background:'#777', color:'#fff', border:'none', borderRadius:6, padding:'8px 12px' }}>{busyId ? 'Memproses...' : 'Ya, Tolak'}</button>
              </div>
            </div>
          </div>
        )}
        {/* Viewer Overlay untuk foto/video */}
        {viewer && (
          <div className="modal-overlay" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100 }} onClick={() => setViewer(null)}>
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
              <img src={viewer.url} alt="Foto" style={{ maxWidth:'90vw', maxHeight:'90vh', width:'auto', height:'auto', objectFit:'contain', borderRadius:6 }} onClick={(e)=>e.stopPropagation()} />
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
    </div>
  );
}