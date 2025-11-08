import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { API_URL } from '../api/admin';
import Footer from '../components/Footer';

const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(n || 0));

const normalizeImages = (images) => {
  if (Array.isArray(images)) return images.filter(Boolean);
  if (typeof images === 'string' && images.trim()) {
    const t = images.trim();
    if (t.startsWith('[')) {
      try { const arr = JSON.parse(t); return Array.isArray(arr) ? arr.filter(Boolean) : []; }
      catch { return []; }
    }
    return [t];
  }
  return [];
};

// Deteksi apakah sumber adalah video (data URL atau ekstensi umum)
const isVideoSrc = (src) => {
  if (typeof src !== 'string') return false;
  const s = src.trim();
  return /^data:video\//.test(s) || /\.(mp4|webm|mov|avi)(\?.*)?$/i.test(s);
};

const getCartKey = () => {
  try {
    const email = localStorage.getItem('userEmail');
    return email ? `cart_items__${email}` : 'cart_items__guest';
  } catch (e) {
    return 'cart_items__guest';
  }
};

export default function ProductDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const qs = new URLSearchParams(location.search || '');
  const readonly = Boolean(location.state && location.state.readonly) || qs.get('readonly') === '1';
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);
  const pageSize = 4; // tampilkan 4 thumbnail per halaman
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  // Opsi pengiriman mengikuti pilihan di checkout static
  const [shippingOption, setShippingOption] = useState('jne_reguler');
  const shippingLabel = useMemo(() => {
    if (shippingOption === 'jne_reguler') return 'JNE Reguler';
    if (shippingOption === 'jne_next_day') return 'JNE Next Day';
    if (shippingOption === 'jne_cargo') return 'JNE Cargo';
    return '-';
  }, [shippingOption]);
  const [wishlistAdded, setWishlistAdded] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [reviews, setReviews] = useState([]);
  // Muat ulasan publik dari API; fallback ke localStorage jika API gagal
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/products/${id}/reviews`);
        if (res.ok) {
          const data = await res.json();
          if (mounted && Array.isArray(data)) setReviews(data);
          return;
        }
      } catch (e) {}
      // Fallback localStorage jika API tidak tersedia
      try {
        const raw = localStorage.getItem('productReviews:' + id);
        const arr = raw ? JSON.parse(raw) : [];
        if (mounted) setReviews(Array.isArray(arr) ? arr : []);
      } catch {
        if (mounted) setReviews([]);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);
  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((t, r) => t + (Number(r.rating) || 0), 0) / reviews.length;
  }, [reviews]);

  // Kembalikan efek untuk memuat produk dari API
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/admin/products/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        setProduct(data);
      } catch (e) {
        setError(e?.message || 'Gagal memuat produk');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);
  // Susun media (gambar+video). Jika ada video, pastikan berada di indeks 1 (slide kedua)
  const media = useMemo(() => {
    const arr = normalizeImages(product?.images);
    const idx = arr.findIndex(isVideoSrc);
    if (idx > -1 && idx !== 1) {
      const [v] = arr.splice(idx, 1);
      arr.splice(Math.min(1, arr.length), 0, v);
    }
    return arr;
  }, [product]);
  // Temukan varian yang sedang dipilih berdasarkan warna
  const selectedVariant = useMemo(() => {
    if (!product || !Array.isArray(product.variants)) return null;
    if (!selectedColor) return null;
    const target = (selectedColor || '').trim().toLowerCase();
    return product.variants.find(v => ((v.color || '').trim().toLowerCase()) === target) || null;
  }, [product, selectedColor]);

  // Harga yang ditampilkan mengikuti varian terpilih jika ada
  const displayPrice = useMemo(() => {
    if (!product) return 0;
    // Jika varian terpilih memiliki harga, gunakan itu
    const variantPrice = parseFloat(selectedVariant?.price ?? '');
    if (!isNaN(variantPrice) && selectedVariant) return variantPrice;

    // Fallback ke harga produk utama
    if (typeof product.price === 'number') return product.price;
    if (typeof product.price === 'string' && product.price.trim()) {
      const parsed = parseFloat(product.price);
      if (!isNaN(parsed)) return parsed;
    }

    // Jika tidak ada, gunakan harga varian pertama bila tersedia
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      const vPrice = parseFloat(product.variants[0]?.price || 0);
      return isNaN(vPrice) ? 0 : vPrice;
    }
    return 0;
  }, [product, selectedVariant]);

  // Stok yang ditampilkan mengikuti varian terpilih jika ada
  const displayStock = useMemo(() => {
    const selectedStockNum = parseInt(selectedVariant?.stock ?? '');
    if (selectedVariant && !isNaN(selectedStockNum)) return selectedStockNum;
    if (!product) return 0;
    if (typeof product.stock === 'number') return product.stock;
    if (Array.isArray(product.variants)) return product.variants.reduce((t, v) => t + parseInt(v.stock || 0), 0);
    return 0;
  }, [product, selectedVariant]);

  // Sesuaikan qty jika stok varian berubah (misal pindah warna)
  useEffect(() => {
    const maxQty = displayStock > 0 ? displayStock : 1;
    setQty(q => Math.min(q, maxQty));
  }, [displayStock]);

  const colors = useMemo(() => {
    if (!Array.isArray(product?.variants)) return [];
    const set = new Set();
    product.variants.forEach(v => { const c = (v.color || '').trim(); if (c) set.add(c); });
    return Array.from(set);
  }, [product]);

  useEffect(() => {
    if (colors.length > 0 && !selectedColor) setSelectedColor(colors[0]);
  }, [colors, selectedColor]);

  const inc = () => setQty(q => Math.min(q + 1, displayStock > 0 ? displayStock : 1));
  const dec = () => setQty(q => Math.max(q - 1, 1));

  // Pastikan thumbnail menampilkan "antrian" 4-pertama, lalu maju per halaman
  useEffect(() => {
    const maxStart = Math.max(0, media.length - pageSize);
    const targetStart = Math.min(Math.floor(selectedImage / pageSize) * pageSize, maxStart);
    if (selectedImage < thumbStart || selectedImage >= thumbStart + pageSize) {
      setThumbStart(targetStart);
    }
  }, [selectedImage, media.length, thumbStart, pageSize]);

  const addToWishlist = () => {
    if (!product) return;
    const WISHLIST_KEY = 'wishlist_items';
    const firstImage = (media.find((m) => !isVideoSrc(m))) || '/kurin.png';
    const item = {
      uid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      id: product.id,
      name: product.name,
      image: firstImage,
      price: (() => { const base = Number(displayPrice || 0); const dp = product?.discount_price != null ? Number(product.discount_price) : NaN; const pct = product?.discount_percent != null ? Number(product.discount_percent) : NaN; let discounted = base; if (product?.discount_active) { if (!isNaN(dp) && dp > 0) discounted = Math.min(discounted, dp); if (!isNaN(pct) && pct > 0) discounted = Math.min(discounted, Math.max(0, base - (pct / 100) * base)); } return discounted; })(),
      qty: qty,
      variant: selectedColor || '-',
      ts: Date.now(),
    };
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(item);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(arr));
    } catch (e) {}
    setWishlistAdded(true);
  };

  const addToCart = () => {
    if (!product) return;
    // Cegah masukkan ke keranjang jika stok 0
    if (displayStock <= 0) {
      return;
    }
    const firstImage2 = (media.find((m) => !isVideoSrc(m))) || '/kurin.png';
    const item = {
      uid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      id: product.id,
      name: product.name,
      image: firstImage2,
      price: (() => { const base = Number(displayPrice || 0); const dp = product?.discount_price != null ? Number(product.discount_price) : NaN; const pct = product?.discount_percent != null ? Number(product.discount_percent) : NaN; let discounted = base; if (product?.discount_active) { if (!isNaN(dp) && dp > 0) discounted = Math.min(discounted, dp); if (!isNaN(pct) && pct > 0) discounted = Math.min(discounted, Math.max(0, base - (pct / 100) * base)); } return discounted; })(),
      qty: qty,
      variant: selectedColor || '-',
      ts: Date.now(),
    };
    try {
      const raw = localStorage.getItem(getCartKey());
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(item);
      localStorage.setItem(getCartKey(), JSON.stringify(arr));
    } catch (e) {}
    setCartAdded(true);
  };

  return (
    <div className="page-root" style={{ fontFamily: 'Arial, sans-serif', background: '#fff', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <style>{`
        .topbar { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; border-bottom:1px solid #eee; }
        .nav { display:flex; gap:24px; color:#c33; }
        .nav a { color:#c33; text-decoration:none; font-weight:600; }
        .container { max-width: 1100px; margin: 0 auto; padding: 24px; flex: 1; width: 100%; }
        .detail { display:grid; grid-template-columns: 1fr 1fr; gap: 24px; background:#eee; padding: 16px; }
        .image-main { position:relative; background:#fff; display:flex; align-items:center; justify-content:center; min-height:420px; }
        .image-main img { max-width:100%; max-height:420px; object-fit:contain; }
        .thumbs-bar { margin-top:12px; }
        .thumbs-controls { display:flex; align-items:center; gap:12px; }
        .thumbs-viewport { display:flex; gap:12px; overflow:hidden; max-width:516px; }
        .thumbs { display:flex; gap:12px; }
        .thumb-nav { width:28px; height:28px; border:none; border-radius:50%; background:#eee; color:#333; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .thumb-nav:disabled { opacity:0.4; cursor:default; }
        .thumb { flex:0 0 auto; width:120px; height:80px; border:1px solid #ddd; border-radius:6px; overflow:hidden; cursor:pointer; background:#fff; display:flex; align-items:center; justify-content:center; scroll-snap-align:start; }
        .thumb img { width:100%; height:100%; object-fit:contain; background:#fff; }
        .nav-arrow { position:absolute; top:50%; transform:translateY(-50%); width:36px; height:36px; border:none; border-radius:50%; background:rgba(0,0,0,0.4); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .nav-arrow.left { left:12px; }
        .nav-arrow.right { right:12px; }
        .title { font-size:28px; font-weight:600; margin-bottom:16px; }
        .row { display:grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 12px 0; }
        .label { color:#333; }
        .value { font-weight:600; }
        .badge { display:inline-block; padding:6px 10px; border-radius:6px; background:#fff; border:1px solid #ddd; margin-right:8px; cursor:pointer; }
        .badge.active { background:#c33; color:#fff; border-color:#c33; }
        .qty { display:flex; align-items:center; gap:8px; }
        /* sejajarin: samakan ukuran tombol +/- dengan input */
        .qty .btn { width:36px; height:36px; padding:0; background:#c33; color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; }
        .btn { border:none; border-radius:8px; padding:12px 16px; cursor:pointer; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn.primary { background:#c33; color:#fff; }
        .btn.heart { background:#c33; color:#fff; }
        .btn.secondary { background:#eee; color:#333; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: #fff; border-radius: 12px; padding: 16px; max-width: 380px; width: calc(100% - 48px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); text-align: center; }
        .modal-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .modal-desc { color: #555; margin-bottom: 14px; }
        .modal-actions { display: flex; gap: 12px; justify-content: center; }
        .footer { background:#c33; color:#fff; padding: 20px 24px; margin-top: 24px; display:flex; justify-content:space-between; align-items:center; }
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
        {loading && <div>Memuat produk...</div>}
        {error && <div style={{ color: '#c33' }}>{error}</div>}
        {!loading && !error && product && (
          <div>
            <div className="detail">
              <div>
                <div className="image-main">
                  {media.length > 0 ? (
                    isVideoSrc(media[selectedImage] || media[0]) ? (
                      <video src={media[selectedImage] || media[0]} controls style={{ maxWidth:'100%', maxHeight:420 }} />
                    ) : (
                      <img src={media[selectedImage] || media[0]} alt={product.name} />
                    )
                  ) : (
                    <div style={{ color:'#888' }}>Tidak ada gambar</div>
                  )}
                  {media.length > 1 && (
                    <>
                      <button className="nav-arrow left" onClick={() => setSelectedImage(i => (i <= 0 ? media.length - 1 : i - 1))}>‹</button>
                      <button className="nav-arrow right" onClick={() => setSelectedImage(i => (i >= media.length - 1 ? 0 : i + 1))}>›</button>
                    </>
                  )}
                </div>
                {media.length > 1 && (
                  <div className="thumbs-bar">
                    <div className="thumbs-controls">
                      <button
                        className="thumb-nav"
                        disabled={thumbStart === 0}
                        onClick={() => setThumbStart(s => Math.max(0, s - pageSize))}
                      >
                        ‹
                      </button>
                      <div className="thumbs-viewport">
                        <div className="thumbs">
                          {media.slice(thumbStart, Math.min(thumbStart + pageSize, media.length)).map((src, i) => (
                            <div key={thumbStart + i} className="thumb" onClick={() => setSelectedImage(thumbStart + i)}>
                              {isVideoSrc(src) ? (
                                <video src={src} muted style={{ width:'100%', height:'100%', objectFit:'contain', background:'#fff' }} />
                              ) : (
                                <img src={src} alt={`thumb-${thumbStart + i}`} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        className="thumb-nav"
                        disabled={thumbStart >= Math.max(0, media.length - pageSize)}
                        onClick={() => setThumbStart(s => Math.min(s + pageSize, Math.max(0, media.length - pageSize)))}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: '12px' }}>
                <div className="title">{product.name}</div>
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
                  {(() => {
                    const base = Number(displayPrice || 0);
                    const dp = product?.discount_price != null ? Number(product.discount_price) : NaN;
                    const pct = product?.discount_percent != null ? Number(product.discount_percent) : NaN;
                    let discounted = base;
                    if (product?.discount_active) {
                      if (!isNaN(dp) && dp > 0) discounted = Math.min(discounted, dp);
                      if (!isNaN(pct) && pct > 0) discounted = Math.min(discounted, Math.max(0, base - (pct / 100) * base));
                    }
                    const isDisc = product?.discount_active && discounted < base;
                    return isDisc ? (
                      <>
                        <span style={{ textDecoration: 'line-through', color: '#888', marginRight: 8 }}>{formatRupiah(base)}</span>
                        <span>{formatRupiah(discounted)}</span>
                      </>
                    ) : (
                      formatRupiah(base)
                    );
                  })()}
                </div>

                <div className="row">
                  <div>
                    <div className="label">Opsi Pengiriman</div>
                    <div>
                      <select
                        value={shippingOption}
                        onChange={(e) => setShippingOption(e.target.value)}
                        style={{ padding: 8, border: '1px solid #ddd', borderRadius: 8, minWidth: 240 }}
                      >
                        <option value="jne_reguler">JNE Reguler</option>
                        <option value="jne_next_day">JNE Next Day</option>
                        <option value="jne_cargo">JNE Cargo</option>
                      </select>
                      <div style={{ marginTop: 6, color: '#555' }}>Dipilih: {shippingLabel}</div>
                    </div>
                  </div>
                  <div>
                    <div className="label">Jaminan KURIN</div>
                    <div className="value">Refund</div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div className="label">Variant</div>
                  <div style={{ marginTop: 8 }}>
                    {colors.length > 0 ? (
                      colors.map(c => (
                        <span
                          key={c}
                          className={`badge ${selectedColor === c ? 'active' : ''}`}
                          onClick={() => setSelectedColor(c)}
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="badge">Default</span>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div className="label">Kuantitas</div>
                  <div className="qty" style={{ marginTop: 8 }}>
                    <button className="btn" onClick={dec}>-</button>
                    <input type="number" value={qty} onChange={e => {
                      const val = parseInt(e.target.value || '1');
                      const maxQty = displayStock > 0 ? displayStock : 1;
                      setQty(Math.min(Math.max(1, isNaN(val) ? 1 : val), maxQty));
                    }} style={{ width: 50, textAlign: 'center', border:'1px solid #ccc', borderRadius: 6, height: 36 }} />
                    <button className="btn" onClick={inc}>+</button>
                    <span style={{ marginLeft: 10, color:'#666' }}>Tersedia {displayStock}</span>
                  </div>
                  {displayStock <= 0 && (
                    <div style={{ marginTop: 10, background:'#ffe7e7', border:'1px solid #f3cdcd', borderRadius:8, padding:'10px', color:'#a10000' }}>
                      Stok habis. Produk tidak bisa dimasukkan ke keranjang.
                    </div>
                  )}
                </div>

                {readonly ? (
                  <div style={{ marginTop: 16, background:'#ffe7e7', border:'1px solid #f3cdcd', borderRadius:8, padding:'12px', color:'#a10000' }}>
                    Halaman ini dibuka dari tabel. Tombol keranjang dan wishlist dinonaktifkan.
                  </div>
                ) : (
                  <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                    <button className="btn primary" onClick={addToCart} disabled={displayStock <= 0}>Masukkan Keranjang</button>
                    <button className="btn heart" onClick={addToWishlist}>❤ Masukkan Wishlist</button>
                  </div>
                )}
              </div>
            </div>

            {/* Deskripsi Produk */}
            <div style={{ marginTop: 20, background:'#fff', border:'1px solid #eee', borderRadius:12, padding: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Deskripsi Produk</div>
              <div style={{ color:'#444', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                {(product?.description || '').trim() ? product.description : 'Belum ada deskripsi untuk produk ini.'}
              </div>
            </div>

            {/* Rating & Ulasan */}
            <div style={{ marginTop: 20, background:'#fff', border:'1px solid #eee', borderRadius:12, padding: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Rating & Ulasan</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} style={{ color: avgRating >= n ? '#f7b500' : '#ddd', fontSize: 20 }}>★</span>
                ))}
                <span style={{ color:'#555' }}>{reviews.length ? `${avgRating.toFixed(1)} dari 5 • ${reviews.length} ulasan` : 'Belum ada ulasan'}</span>
              </div>
              {reviews.length > 0 ? (
                <div style={{ display:'grid', gap:12 }}>
                  {reviews.map((rv, idx) => (
                    <div key={idx} style={{ border:'1px solid #eee', borderRadius:8, padding:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          {[1,2,3,4,5].map(n => (
                            <span key={n} style={{ color: rv.rating >= n ? '#f7b500' : '#ddd' }}>★</span>
                          ))}
                          <span style={{ color:'#555', marginLeft:6 }}>{rv.author || 'Anonim'}</span>
                        </div>
                        <div style={{ color:'#999', fontSize:12 }}>{new Date(rv.created_at || rv.ts || Date.now()).toLocaleDateString('id-ID')}</div>
                      </div>
                      <div style={{ marginTop:6, color:'#333' }}>{rv.text}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color:'#555' }}>Belum ada ulasan untuk produk ini.</div>
              )}
            </div>

            {wishlistAdded && (
              <div className="modal-overlay" onClick={() => setWishlistAdded(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-title">Berhasil masukan ke wishlist</div>
                  <div className="modal-desc">Produk telah ditambahkan ke wishlist Anda.</div>
                  <div className="modal-actions">
                    <button className="btn secondary" onClick={() => setWishlistAdded(false)}>Tutup</button>
                    <button className="btn primary" onClick={() => navigate('/wishlist')}>Lihat Wishlist</button>
                  </div>
                </div>
              </div>
            )}

            {cartAdded && (
              <div className="modal-overlay" onClick={() => setCartAdded(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-title">Berhasil masukan ke keranjang</div>
                  <div className="modal-desc">Produk telah ditambahkan ke keranjang Anda.</div>
                  <div className="modal-actions">
                    <button className="btn secondary" onClick={() => setCartAdded(false)}>Tutup</button>
                    <button className="btn primary" onClick={() => navigate('/keranjang')}>Lihat Keranjang</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {!loading && !error && !product && (
          <div>Produk tidak ditemukan</div>
        )}
      </div>
      {/* Footer dipindahkan menjadi child langsung dari page-root agar selalu di bawah */}
      <Footer />
    </div>
  );
}