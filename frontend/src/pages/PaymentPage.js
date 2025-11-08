import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const fmt = (n) => 'Rp.' + Number(n || 0).toLocaleString('id-ID');

export default function PaymentPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order || null;
  const totalProduk = Number(state?.totalProduk || 0);
  const ongkir = Number(state?.ongkir || 0);
  const totalBayar = Number(state?.totalBayar || (totalProduk + ongkir));
  // Disable payment when shipping cost not provided by admin
  const payDisabled = Number(ongkir || 0) <= 0;

  // Load Midtrans Snap script dynamically via backend config
  
  



  

  return (
    <div className="page-root" style={{ background:'#f8f8f8', minHeight:'100vh' }}>
      <style>{`
        .topbar { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; background:#fff; border-bottom:1px solid #eee; }
        .nav { display:flex; gap:24px; }
        .nav a { color:#c33; text-decoration:none; font-weight:600; }
        .container { max-width:1000px; margin:20px auto; padding:0 20px; }
        .title { font-size:24px; color:#c33; margin:0 0 4px; }
        .note { color:#666; margin-bottom:12px; }
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; z-index:9999; }
        .modal { background:#fff; border-radius:10px; padding:16px; max-width:420px; width:90%; box-shadow:0 8px 24px rgba(0,0,0,0.15); }
        .modal-title { font-size:22px; color:#c33; font-weight:700; margin-bottom:8px; text-align:center; }
        .modal-body { color:#555; text-align:center; margin-bottom:12px; }
        .modal-actions { display:flex; justify-content:center; gap:10px; }
        .btn { border:none; border-radius:6px; padding:10px 14px; font-weight:700; cursor:pointer; }
        .btn.primary { background:#c33; color:#fff; }
        .btn.secondary { background:#fff; color:#c33; border:1px solid #c33; }
      `}</style>

      <div className="topbar">
        <img src="/kurin.png" alt="Kurin" style={{ height: 54 }} />
        <div className="nav">
          <a href="/home">Home</a>
          <a href="/company-profile">About Us</a>
          <a href="/terms">Syarat & Ketentuan</a>
          <a href="/contact">Contact</a>
          <a href="/profile">Profile</a>
        </div>
      </div>

      <div className="container">
        <div className="title">Pembayaran</div>
        <div className="note">Ringkasan pembayaran pesanan Anda.</div>

        {order && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontWeight:700, color:'#c33' }}>{order.buyer_name} • {order.buyer_phone}</div>
            <div style={{ color:'#555' }}>{order.buyer_address}</div>
          </div>
        )}

        <div style={{ background:'#fff', borderRadius:10, overflow:'hidden', border:'1px solid #eee', marginBottom:12 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding:12 }}>Total Produk</td>
                <td style={{ padding:12, textAlign:'right' }}>{fmt(totalProduk)}</td>
              </tr>
              <tr>
                <td style={{ padding:12 }}>Ongkir</td>
                <td style={{ padding:12, textAlign:'right' }}>{fmt(ongkir)}</td>
              </tr>
              <tr>
                <td style={{ padding:12, fontWeight:700, color:'#c33' }}>Total Bayar</td>
                <td style={{ padding:12, textAlign:'right', fontWeight:700, color:'#c33' }}>{fmt(totalBayar)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={() => navigate(-1)} className="btn secondary">Kembali</button>
          <button onClick={() => navigate('/select-payment', { state: { order, totalProduk, ongkir, totalBayar } })} className="btn primary" disabled={payDisabled} style={{ opacity: payDisabled ? 0.6 : 1, cursor: payDisabled ? 'not-allowed' : 'pointer' }}>Bayar Sekarang</button>
        </div>

        
      </div>
      <Footer />
    </div>
  );
}