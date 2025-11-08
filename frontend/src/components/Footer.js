import React from 'react';

const Footer = () => {
  return (
    <footer className="global-footer" style={{ background: '#c33', color: '#fff', marginTop: 'auto', width: '100%' }}>
      <style>{`
        .global-footer .container {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 16px 24px; /* beri ruang kanan */
          display: grid;
          grid-template-columns: auto 1fr auto; /* kiri fix, tengah fleksibel, kanan fix */
          align-items: center;
          gap: 12px;
          box-sizing: border-box;
        }
        /* Pastikan halaman cukup tinggi agar footer terdorong ke bawah saat konten sedikit */
        :root, body, #root { min-height: 100vh; }
        .page-root { display: flex; flex-direction: column; min-height: 100vh; }
        .global-footer .left { font-weight: 700; justify-self: start; }
        .global-footer .center {
          display: inline-flex;
          gap: 10px;
          align-items: center;
          justify-self: center;
          justify-content: center;
          flex-wrap: wrap;
          font-weight: 600;
        }
        .global-footer .center .icon { display:inline-block; width: 20px; height: 20px; line-height: 20px; font-size: 20px; }
        .global-footer .right { text-align: right; justify-self: end; }
        @media (max-width: 768px) {
          .global-footer .container { grid-template-columns: 1fr; row-gap: 12px; padding: 16px; }
          .global-footer .left, .global-footer .right { text-align: center; justify-self: center; }
          .global-footer .right { text-align: center; }
        }
      `}</style>
      <div className="container">
        <div className="left">Social Media</div>
        <div className="center">
          <a href="https://instagram.com/kurinhousehold" target="_blank" rel="noopener noreferrer" style={{ color:'#fff', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}>
            <span className="icon">📷</span>
            <span>Instagram</span>
          </a>
          <a href="https://www.tiktok.com/@kurinhousehold" target="_blank" rel="noopener noreferrer" style={{ color:'#fff', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}>
            <span className="icon">🎵</span>
            <span>TikTok</span>
          </a>
        </div>
        <div className="right">
          Jl. Raya Kedoya No. 10-16<br/>
          (Komplek Ruko Kedoya Indah), Kedoya Utara, Kebon Jeruk, Jakarta Barat. 11520
        </div>
      </div>
    </footer>
  );
};

export default Footer;