import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { API_URL } from '../api/admin';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const getCartKey = () => {
  try {
    const email = localStorage.getItem('userEmail');
    return email ? `cart_items__${email}` : 'cart_items__guest';
  } catch (e) {
    return 'cart_items__guest';
  }
};

export default function CartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState({}); // uid -> true/false
  const [productMap, setProductMap] = useState({});

  useEffect(() => {
    const raw = localStorage.getItem(getCartKey());
    try { setItems(raw ? JSON.parse(raw) : []); } catch { setItems([]); }
  }, []);

  useEffect(() => {
    const ids = Array.from(new Set(items.map(it => it.id).filter(Boolean)));
    if (ids.length === 0) { setProductMap({}); return; }
    let cancelled = false;
    Promise.all(ids.map(id =>
      fetch(`${API_URL}/admin/products/${id}`).then(r => r.json()).catch(() => null)
    ))
    .then(results => {
      if (cancelled) return;
      const map = {};
      results.forEach(p => { if (p && p.id) map[p.id] = p; });
      setProductMap(map);
    });
    return () => { cancelled = true; };
  }, [items]);

  const formatIDR = (n) => 'Rp. ' + Number(n || 0).toLocaleString('id-ID');
  const getPricing = useCallback((it) => {
    const p = productMap[it.id];
    const baseUnitRaw = p?.price ?? it.price;
    const baseUnit = Number(baseUnitRaw || 0);
    const dp = p?.discount_price != null ? Number(p.discount_price) : NaN;
    const pct = p?.discount_percent != null ? Number(p.discount_percent) : NaN;
    let discountedUnit = Number(it.price || baseUnit || 0);
    if (p?.discount_active) {
      discountedUnit = baseUnit;
      if (!isNaN(dp) && dp > 0) discountedUnit = Math.min(discountedUnit, dp);
      if (!isNaN(pct) && pct > 0) discountedUnit = Math.min(discountedUnit, Math.max(0, baseUnit - (pct / 100) * baseUnit));
    }
    const qty = Math.max(1, parseInt(it.qty || 1));
    return {
      baseUnit, discountedUnit,
      baseTotal: baseUnit * qty,
      discTotal: discountedUnit * qty,
      isDisc: discountedUnit < baseUnit
    };
  }, [productMap]);


  // Total berdasarkan checklist
  const totalSelected = useMemo(() => items.reduce((t, it) => {
    const checked = !!selected[it.uid];
    return checked ? t + getPricing(it).discTotal : t;
  }, 0), [items, selected, getPricing]);
  const selectedCount = useMemo(() => items.filter(it => !!selected[it.uid]).length, [items, selected]);

  const toggleSelect = (uid) => {
    setSelected(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const removeItem = (uid) => {
    setItems(prev => {
      const nextItems = prev.filter(x => x.uid !== uid);
      try { localStorage.setItem(getCartKey(), JSON.stringify(nextItems)); } catch (e) {}
      // Pastikan seleksi ikut dihapus
      setSelected(prevSel => {
        const nextSel = { ...prevSel }; delete nextSel[uid]; return nextSel;
      });
      return nextItems;
    });
  };



  const updateQty = (uid, delta) => {
    setItems(prev => {
      const nextItems = prev.map(x => x.uid === uid ? { ...x, qty: Math.max(1, parseInt(x.qty || 1) + delta) } : x);
      try { localStorage.setItem(getCartKey(), JSON.stringify(nextItems)); } catch (e) {}
      return nextItems;
    });
  };

  const handleCheckout = () => {
    const selectedUids = items.filter(it => !!selected[it.uid]).map(it => it.uid);
    if (selectedUids.length === 0) { alert('Pilih minimal satu produk terlebih dahulu.'); return; }
    navigate('/checkout-static', { state: { selectedUids } });
  };

  return (
    <div className="page-root" style={{ fontFamily: 'Arial, sans-serif', background: '#fff' }}>
      <style>{`
        .topbar { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; border-bottom:1px solid #eee; }
        .nav { display:flex; gap:24px; color:#c33; }
        .nav a { color:#c33; text-decoration:none; font-weight:600; }
        .container { max-width: 1100px; margin: 0 auto; padding: 24px; }
        .list { display:flex; flex-direction:column; gap: 26px; }
        .item { background:#c33; color:#fff; border-radius:28px; padding: 20px 24px; display:grid; grid-template-columns: 100px 1fr 140px 140px 140px 110px 40px; align-items:center; gap: 16px; }
        .thumb { width:100px; height:100px; object-fit:cover; border-radius:8px; }
        .qty { display:flex; align-items:center; gap:12px; }
        .btn.small { width:32px; height:32px; padding:0; background:#fff; color:#c33; display:flex; align-items:center; justify-content:center; }
        .btn { border:none; border-radius:12px; padding:10px 16px; cursor:pointer; }
        .btn.small { width:32px; height:32px; padding:0; background:#fff; color:#c33; display:flex; align-items:center; justify-content:center; }
        .btn.danger { background:#fff; color:#c33; }
        .summary { margin-top:24px; display:flex; justify-content:space-between; align-items:center; }
        .total { font-size:24px; font-weight:700; color:#333; }
        .checkout { background:#c33; color:#fff; font-size:20px; font-weight:700; padding:16px 24px; border-radius:12px; border:none; cursor:pointer; }
        .checkout:disabled { background:#ccc; cursor:not-allowed; }
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
        <h2 style={{ color:'#c33' }}>Keranjang</h2>
        {items.length === 0 ? (
          <div className="card">Keranjang kosong. Silakan tambah produk dari halaman detail.</div>
        ) : (
          <>
            <div className="list">
              {items.map(it => (
                <div className="item" key={it.uid}>
                  <img className="thumb" src={it.image || '/kurin.png'} alt={it.name} />
                  <div className="name">{it.name}</div>
                  <div className="variant">{it.variant || '-'}</div>
<div className="price">
  {(() => {
    const { baseTotal, discTotal, isDisc } = getPricing(it);
    return isDisc ? (
      <div>
        <div style={{ textDecoration: 'line-through', color: '#ffd' }}>{formatIDR(baseTotal)}</div>
        <div style={{ fontWeight: 700 }}>{formatIDR(discTotal)}</div>
      </div>
    ) : (
      formatIDR(baseTotal)
    );
  })()}
</div>
                  <div className="qty">
                    <button className="btn small" onClick={() => updateQty(it.uid, -1)}>-</button>
                    <input value={it.qty} readOnly style={{ width: 48, textAlign: 'center', borderRadius:8, border:'none' }} />
                    <button className="btn small" onClick={() => updateQty(it.uid, 1)}>+</button>
                  </div>
                  <button className="btn danger" onClick={() => removeItem(it.uid)}>Hapus</button>
                  <input type="checkbox" checked={!!selected[it.uid]} onChange={() => toggleSelect(it.uid)} style={{ width:20, height:20 }} />
                </div>
              ))}
            </div>

            <div className="summary">
              <div className="total">Total {selectedCount > 0 ? 'Rp. ' + totalSelected.toLocaleString('id-ID') : 'Rp. 0'}</div>
              <button className="checkout" disabled={selectedCount === 0} onClick={handleCheckout}>Checkout</button>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}