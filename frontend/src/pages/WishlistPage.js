import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const WISHLIST_KEY = 'wishlist_items';

function formatRupiah(value) {
  const num = Number(value || 0);
  return 'Rp.' + num.toLocaleString('id-ID');
}

const WishlistPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [confirmUid, setConfirmUid] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setItems(parsed);
    } catch (e) {
      setItems([]);
    }
  }, []);

  const removeItem = (uid) => {
    const next = items.filter((it) => it.uid !== uid);
    setItems(next);
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(next)); } catch (e) {}
  };

  return (
    <div className="page-root" style={{ background: '#fafafa', minHeight: '100vh' }}>
      <style>{`
        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: #fff; border-bottom: 1px solid #eee; }
        .logo { font-size: 28px; font-weight: bold; color: #b71c1c; }
        .nav { display: flex; gap: 24px; }
        .nav a { color: #c33; text-decoration: none; font-weight: 600; }
        .content { padding: 16px 24px 24px; }
        .title { color: #c33; font-size: 28px; font-weight: 700; margin: 16px 0; }
        .row { display: grid; grid-template-columns: 72px 1fr 140px 120px 60px 100px; align-items: center; gap: 16px; background: #c33; color: #fff; border-radius: 16px; padding: 12px 16px; margin-bottom: 12px; }
        .thumb { width: 72px; height: 72px; object-fit: cover; border-radius: 10px; background: #fff; }
        .name { font-weight: 700; }
        .variant { font-weight: 600; }
        .price { font-weight: 700; }
        .qty { font-weight: 700; text-align: center; }
        .delete { text-align: right; cursor: pointer; font-weight: 700; }
        .empty { background: #fff; border: 1px dashed #ddd; color: #666; padding: 24px; border-radius: 12px; }
        .footer { background: #c33; color: #fff; padding: 20px 24px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center; }
        .btn { border:none; border-radius:8px; padding:12px 16px; cursor:pointer; }
        .btn.primary { background:#c33; color:#fff; }
        .btn.secondary { background:#eee; color:#333; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: #fff; border-radius: 12px; padding: 16px; max-width: 380px; width: calc(100% - 48px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); text-align: center; }
        .modal-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .modal-desc { color: #555; margin-bottom: 14px; }
        .modal-actions { display: flex; gap: 12px; justify-content: center; }
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

      <div className="content">
        <div className="title">Wishlist</div>

        {items.length === 0 ? (
          <div className="empty">Belum ada produk di wishlist.</div>
        ) : (
          items.map((item) => (
            <div className="row" key={item.uid}>
              <img
                className="thumb"
                src={item.image || '/kurin.png'}
                alt={item.name}
                style={{ cursor: 'pointer' }}
                onClick={() => item.id && navigate(`/produk/${item.id}`)}
              />
              <div
                className="name"
                style={{ cursor: 'pointer' }}
                onClick={() => item.id && navigate(`/produk/${item.id}`)}
              >
                {item.name}
              </div>
              <div className="variant">{item.variant || '-'}</div>
              <div className="price">{formatRupiah(Number(item.price) * Number(item.qty || 1))}</div>
              <div className="qty">{item.qty || 1}</div>
              <div className="delete" onClick={() => setConfirmUid(item.uid)}>Hapus</div>
            </div>
          ))
        )}

        {confirmUid && (
          <div className="modal-overlay" onClick={() => setConfirmUid(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">Hapus produk?</div>
              <div className="modal-desc">Apakah Anda yakin ingin menghapus item ini dari wishlist?</div>
              <div className="modal-actions">
                <button className="btn secondary" onClick={() => setConfirmUid(null)}>Tidak</button>
                <button className="btn primary" onClick={() => { removeItem(confirmUid); setConfirmUid(null); }}>Iya</button>
              </div>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
};

export default WishlistPage;