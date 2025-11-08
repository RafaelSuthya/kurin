import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const fmt = (n) => 'Rp.' + Number(n || 0).toLocaleString('id-ID');

export default function AdminOrderCancel() {
  const location = useLocation();
  const navigate = useNavigate();
  const grp = location.state?.group || null;
  const item = location.state?.item || null;

  const [alasan, setAlasan] = React.useState('');

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 30px', borderBottom:'1px solid #f0f0f0' }}>
          <div>
            <h1 style={{ fontSize:'28px', margin:0, fontWeight:'normal' }}>Pembatalan Pesanan</h1>
            <p style={{ margin:'5px 0 0', color:'#666' }}>Isi alasan pembatalan dan konfirmasi</p>
          </div>
          <div>
            <button onClick={() => navigate(-1)} style={{ background:'#e52b2b', color:'#fff', padding:'10px 16px', border:'none', borderRadius:6, cursor:'pointer' }}>Kembali</button>
          </div>
        </div>

        <div style={{ padding:'24px 30px' }}>
          {!grp && (
            <div style={{ border:'1px dashed #ddd', padding:16, borderRadius:8 }}>
              Data tidak ditemukan. Silakan kembali ke halaman sebelumnya.
            </div>
          )}

          {grp && (
            <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:10, padding:16 }}>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontWeight:700, color:'#c33', marginBottom:6 }}>{grp.buyer_name} • {grp.buyer_phone}</div>
                <div style={{ color:'#555' }}>{grp.buyer_address}</div>
              </div>

              {item && (
                <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:12, alignItems:'center', marginBottom:16 }}>
                  <img src={(item.product_image || '/kurin.png')} alt={item.product_name} style={{ width:100, height:100, objectFit:'cover', borderRadius:8 }} />
                  <div>
                    <div style={{ fontWeight:700, marginBottom:4 }}>{item.product_name}</div>
                    <div style={{ color:'#555' }}>Harga: {fmt(item.price)} • Jumlah: {item.quantity}</div>
                  </div>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:10, alignItems:'start', marginBottom:16 }}>
                <label style={{ color:'#555', paddingTop:6 }}>Alasan pembatalan</label>
                <textarea
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder="Contoh: pelanggan meminta cancel / stok habis"
                  rows={4}
                  style={{ padding:'10px 12px', border:'1px solid #ddd', borderRadius:6 }}
                />
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button
                  style={{ background:'#999', color:'#fff', border:'none', borderRadius:6, padding:'10px 18px', cursor:'pointer' }}
                  onClick={() => navigate(-1)}
                >Tidak</button>
                <button
                  style={{ background:'#e52b2b', color:'#fff', border:'none', borderRadius:6, padding:'10px 18px', cursor:'pointer' }}
                  onClick={() => {
                    if (!alasan.trim()) {
                      alert('Mohon isi alasan pembatalan.');
                      return;
                    }
                    const yakin = window.confirm('Apakah yakin batal?');
                    if (!yakin) return;
                    // TODO: Integrasikan ke API pembatalan (POST) bila tersedia.
                    console.log('Pengajuan pembatalan:', { alasan, buyer: grp?.buyer_name, item: item?.product_name });
                    alert('Pengajuan pembatalan dikirim. Menunggu keputusan admin.');
                    navigate('/admin/pesanan');
                  }}
                >Batal</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}