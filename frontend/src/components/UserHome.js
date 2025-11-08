import React, { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../api/admin';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';

const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(n || 0));

export default function UserHome() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState(''); // '' | 'asc' | 'desc'
  const [sortBy, setSortBy] = useState(''); // '' | 'name' | 'price'

  useEffect(() => {
    const controller = new AbortController();
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/products`, { signal: controller.signal });
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e?.name !== 'AbortError') {
          setError('Gagal memuat produk');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    return () => controller.abort();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      const c = (p?.category || '').trim();
      if (c) set.add(c);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategory ? (p?.category || '') === selectedCategory : true;
      const matchSearch = search ? (p?.name || '').toLowerCase().includes(search.toLowerCase()) : true;
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, search]);

  // Hitung total stok untuk sebuah produk (gabungkan stok varian bila ada)
  const getTotalStock = (p) => {
    const sNum = parseInt(p?.stock ?? '');
    if (!isNaN(sNum)) return Math.max(0, sNum);
    if (Array.isArray(p?.variants)) {
      return p.variants.reduce((t, v) => t + (parseInt(v?.stock ?? '') || 0), 0);
    }
    return 0;
  };

  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];

    // fungsi harga tampil (memperhitungkan diskon aktif)
    const getDisplayPrice = (p) => {
      const base = Number(p?.price || 0);
      const dp = p?.discount_price != null ? Number(p.discount_price) : NaN;
      const pct = p?.discount_percent != null ? Number(p.discount_percent) : NaN;
      let discounted = base;
      if (p?.discount_active) {
        if (!isNaN(dp) && dp > 0) discounted = Math.min(discounted, dp);
        if (!isNaN(pct) && pct > 0) discounted = Math.min(discounted, Math.max(0, base - (pct / 100) * base));
      }
      return discounted;
    };

    // Pisahkan in-stock dan out-of-stock agar OOS selalu di akhir
    const inStock = arr.filter(p => getTotalStock(p) > 0);
    const outStock = arr.filter(p => getTotalStock(p) <= 0);

    // Komparator nama dan harga
    const byName = (a, b) => String(a?.name || '').toLowerCase().localeCompare(String(b?.name || '').toLowerCase());
    const byPrice = (a, b) => getDisplayPrice(a) - getDisplayPrice(b);

    if (sortBy === 'name' && (sortOrder === 'asc' || sortOrder === 'desc')) {
      inStock.sort(byName);
      outStock.sort(byName);
      const res = sortOrder === 'asc' ? [...inStock, ...outStock] : [...inStock.reverse(), ...outStock.reverse()];
      return res;
    }

    if (sortBy === 'price' && (sortOrder === 'asc' || sortOrder === 'desc')) {
      inStock.sort(byPrice);
      outStock.sort(byPrice);
      const res = sortOrder === 'asc' ? [...inStock, ...outStock] : [...inStock.reverse(), ...outStock.reverse()];
      return res;
    }

    // Default tanpa sort: tetap dorong OOS ke akhir, pertahankan urutan semula
    return [...inStock, ...outStock];
  }, [filteredProducts, sortBy, sortOrder]);

  const getFirstImage = (p) => {
    if (Array.isArray(p?.images) && p.images.length > 0) return p.images[0];
    if (Array.isArray(p?.variants) && p.variants[0]?.image) return p.variants[0].image;
    return '';
  };

  return (
    <div className="page-root user-home" style={{ fontFamily: 'Arial, sans-serif', background: '#fff' }}>
      <style>{`
        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: #fff; border-bottom: 1px solid #eee; }
        .logo { font-size: 28px; font-weight: bold; color: #b71c1c; }
        .nav { display: flex; gap: 24px; }
        .nav a { color: #c33; text-decoration: none; font-weight: 600; }
        .searchbar { display: flex; align-items: center; gap: 8px; padding: 16px 24px; }
        .searchbar input { flex: 1; height: 40px; border-radius: 8px; border: 1px solid #ccc; padding: 0 12px; }
        .searchbar button { background: #c33; color: #fff; border: none; border-radius: 8px; padding: 10px 16px; cursor: pointer; }
        .icons { display: flex; gap: 16px; align-items: center; color: #c33; }
        .layout { display: grid; grid-template-columns: 240px 1fr; gap: 16px; }
        .sidebar { background: #c33; color: #fff; padding: 20px; min-height: calc(100vh - 140px); }
        .sidebar h3 { margin: 0 0 12px 0; }
        .cat-list { list-style: none; padding: 0; margin: 0; }
        .cat-list li { padding: 8px 4px; cursor: pointer; }
        .cat-list li.active { font-weight: bold; text-decoration: underline; }
        .content { padding: 0 24px 24px; }
        .section-title { color: #c33; font-weight: bold; margin: 12px 0; }
        .cat-row { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; }
        .cat-card { min-width: 120px; text-align: center; border: 1px solid #eee; border-radius: 8px; padding: 8px; background: #fff; cursor: pointer; }
        .cat-card img { width: 100%; height: 70px; object-fit: contain; border-radius: 6px; background:#fff; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
        .product-card { border-radius: 8px; overflow: hidden; border: 1px solid #eee; background: #fff; position: relative; }
        .product-card img { width: 100%; height: 140px; object-fit: contain; display: block; background:#fff; }
        .product-info { padding: 8px 10px; }
        .product-name { font-size: 14px; font-weight: 600; }
        .price-band { background: #c33; color: #fff; padding: 8px 10px; font-weight: bold; }
        .disc-badge { background: #ff5722; color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; min-width: 54px; text-align: center; }
        .oos-badge { position: absolute; top: 8px; left: 8px; background: #a10000; color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; }
        .footer { background: #c33; color: #fff; padding: 20px 24px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
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

      <div className="searchbar">
        <form onSubmit={(e)=>{ e.preventDefault(); setSearch(query); }} style={{ display:'contents' }}>
          <input
            placeholder="Cari produk..."
            value={query}
            onChange={e=>setQuery(e.target.value)}
          />
          <button type="submit">Cari</button>
        </form>
        <div className="icons">
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/keranjang')}>🛒 Keranjang</span>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/wishlist')}>❤️ Wishlist</span>
        </div>
      </div>

      <div className="layout">
        <aside className="sidebar">
          <h3>List Kategori</h3>
          <ul className="cat-list">
            {categories.map(c => (
              <li key={c} className={selectedCategory === c ? 'active' : ''} onClick={()=>{ setSelectedCategory(c); navigate(`/kategori/${encodeURIComponent(c)}`); }}>{c}</li>
            ))}
            {categories.length === 0 && <li>Tidak ada kategori</li>}
          </ul>

          {/* Kontrol Sortir Nama Produk */}
          <div style={{ marginTop: '24px' }}>
            <h3>Urut Nama</h3>
            <ul className="cat-list">
              <li className={sortBy === 'name' && sortOrder === 'asc' ? 'active' : ''} onClick={()=> { setSortBy('name'); setSortOrder('asc'); }}>A - Z</li>
              <li className={sortBy === 'name' && sortOrder === 'desc' ? 'active' : ''} onClick={()=> { setSortBy('name'); setSortOrder('desc'); }}>Z - A</li>
            </ul>
          </div>
          {/* Kontrol Sortir Harga Produk */}
          <div style={{ marginTop: '12px' }}>
            <h3>Urut Harga</h3>
            <ul className="cat-list">
              <li className={sortBy === 'price' && sortOrder === 'asc' ? 'active' : ''} onClick={()=> { setSortBy('price'); setSortOrder('asc'); }}>Harga Termurah</li>
              <li className={sortBy === 'price' && sortOrder === 'desc' ? 'active' : ''} onClick={()=> { setSortBy('price'); setSortOrder('desc'); }}>Harga Tertinggi</li>
            </ul>
          </div>
          {/* Menu Pesanan baru */}
          <div style={{ marginTop: '24px' }}>
            <h3>Pesanan</h3>
            <div style={{ cursor: 'pointer' }} onClick={() => navigate('/pesanan')}>🧾 Pesanan</div>
          </div>
          <div style={{ marginTop: '24px' }}>
            <h3>Social Media</h3>
            <div>
              <a href="https://instagram.com/kurinhousehold" target="_blank" rel="noopener noreferrer" style={{ color:'#fff', textDecoration:'none' }}>📷 Instagram</a>
            </div>
            <div>
              <a href="https://www.tiktok.com/@kurinhousehold" target="_blank" rel="noopener noreferrer" style={{ color:'#fff', textDecoration:'none' }}>🎵 TikTok</a>
            </div>
          </div>
        </aside>

        <main className="content">
          <div className="section-title">Kategori</div>
          <div className="cat-row">
            {categories.map(c => {
              const sample = products.find(p => (p?.category || '') === c);
              const img = sample ? getFirstImage(sample) : '';
              return (
                <div key={c} className="cat-card" onClick={()=>{ setSelectedCategory(c); navigate(`/kategori/${encodeURIComponent(c)}`); }}>
                  {img ? <img src={img} alt={c} /> : <div style={{height:70, display:'flex', alignItems:'center', justifyContent:'center', color:'#888'}}>No Image</div>}
                  <div style={{ marginTop: 6 }}>{c}</div>
                </div>
              );
            })}
            {categories.length === 0 && <div>Tidak ada kategori</div>}
          </div>

          <div className="section-title">Katalog Produk</div>
          {loading && <div>Memuat produk...</div>}
          {error && <div style={{ color: '#c33' }}>{error}</div>}
          {!loading && !error && (
            <div className="grid">
              {sortedProducts.map(p => (
                <div
                  key={p.id}
                  className="product-card"
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/produk/${p.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/produk/${p.id}`); }}
                  style={{ cursor: 'pointer' }}
                >
                  {getTotalStock(p) <= 0 && (
                    <div className="oos-badge">Stok habis</div>
                  )}
                  {getFirstImage(p) ? (
                    <img
                      src={getFirstImage(p)}
                      alt={p.name}
                      style={{ display: 'block' }}
                      onClick={() => navigate(`/produk/${p.id}`)}
                    />
                  ) : (
                    <div
                      style={{height:140, display:'flex', alignItems:'center', justifyContent:'center', color:'#888'}}
                      onClick={() => navigate(`/produk/${p.id}`)}
                    >
                      No Image
                    </div>
                  )}
                  <div className="product-info" onClick={() => navigate(`/produk/${p.id}`)}>
                    <div className="product-name">{p.name}</div>
                  </div>
                  <div className="price-band" onClick={() => navigate(`/produk/${p.id}`)}>
                    {(() => {
                      const base = Number(p.price || 0);
                      const dp = p?.discount_price != null ? Number(p.discount_price) : NaN;
                      const pctField = p?.discount_percent != null ? Number(p.discount_percent) : NaN;
                      let discounted = base;
                      if (p?.discount_active) {
                        if (!isNaN(dp) && dp > 0) discounted = Math.min(discounted, dp);
                        if (!isNaN(pctField) && pctField > 0) discounted = Math.min(discounted, Math.max(0, base - (pctField / 100) * base));
                      }
                      const isDisc = p?.discount_active && discounted < base;
                      const pctDisplay = isDisc ? (
                        !isNaN(pctField) && pctField > 0
                          ? Math.round(pctField)
                          : Math.max(0, Math.round(((base - discounted) / base) * 100))
                      ) : null;
                      return isDisc ? (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div>
                            <div style={{ textDecoration: 'line-through', color: '#ffd' }}>{formatRupiah(base)}</div>
                            <div style={{ fontWeight: 700 }}>{formatRupiah(discounted)}</div>
                          </div>
                          {pctDisplay ? <div className="disc-badge">-{pctDisplay}%</div> : null}
                        </div>
                      ) : (
                        formatRupiah(base)
                      );
                    })()}
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div>Tidak ada produk pada kategori ini.</div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}