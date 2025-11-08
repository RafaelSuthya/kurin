import React, { useEffect, useMemo, useState } from 'react';
import Footer from '../components/Footer';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../api/admin';

const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(n || 0));

// Samakan logic gambar pertama dengan UserHome
const getFirstImage = (p) => {
  if (Array.isArray(p?.images) && p.images.length > 0) return p.images[0];
  if (Array.isArray(p?.variants) && p.variants[0]?.image) return p.variants[0].image;
  return '';
};

export default function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState(''); // '' | 'asc' | 'desc'
  const [sortBy, setSortBy] = useState(''); // '' | 'name' | 'price'

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/products`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('Gagal memuat produk');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
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
      const matchCategory = category ? (p?.category || '') === category : true;
      const matchSearch = search ? (p?.name || '').toLowerCase().includes(search.toLowerCase()) : true;
      return matchCategory && matchSearch;
    });
  }, [products, category, search]);

  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];

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

    if (sortBy === 'name' && (sortOrder === 'asc' || sortOrder === 'desc')) {
      arr.sort((a, b) => String(a?.name || '').toLowerCase().localeCompare(String(b?.name || '').toLowerCase()));
      return sortOrder === 'asc' ? arr : arr.reverse();
    }

    if (sortBy === 'price' && (sortOrder === 'asc' || sortOrder === 'desc')) {
      arr.sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));
      return sortOrder === 'asc' ? arr : arr.reverse();
    }

    return arr;
  }, [filteredProducts, sortBy, sortOrder]);

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
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
        .product-card { border-radius: 8px; overflow: hidden; border: 1px solid #eee; background: #fff; }
        .product-card img { width: 100%; height: 140px; object-fit: contain; display: block; background:#fff; }
        .product-info { padding: 8px 10px; }
        .product-name { font-size: 14px; font-weight: 600; }
        .price-band { background: #c33; color: #fff; padding: 8px 10px; font-weight: bold; }
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
          <input placeholder="Cari produk..." value={query} onChange={e=>setQuery(e.target.value)} />
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
              <li key={c} className={c === category ? 'active' : ''} onClick={() => navigate(`/kategori/${encodeURIComponent(c)}`)}>{c}</li>
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
          <div className="section-title">Kategori {category}</div>
          {loading && <div>Memuat produk...</div>}
          {error && <div style={{ color: '#c33' }}>{error}</div>}
          {!loading && !error && (
            <div className="grid">
              {sortedProducts.map(p => (
                <div
                  key={p.id}
                  className="product-card"
                  onClick={() => navigate(`/produk/${p.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {getFirstImage(p) ? (
                    <img src={getFirstImage(p)} alt={p.name} />
                  ) : (
                    <div style={{height:140, display:'flex', alignItems:'center', justifyContent:'center', color:'#888'}}>No Image</div>
                  )}
                  <div className="product-info">
                    <div className="product-name">{p.name}</div>
                  </div>
                  <div className="price-band">
                    {(() => {
                      const base = Number(p.price || 0);
                      const dp = p?.discount_price != null ? Number(p.discount_price) : NaN;
                      const pct = p?.discount_percent != null ? Number(p.discount_percent) : NaN;
                      let discounted = base;
                      if (p?.discount_active) {
                        if (!isNaN(dp) && dp > 0) discounted = Math.min(discounted, dp);
                        if (!isNaN(pct) && pct > 0) discounted = Math.min(discounted, Math.max(0, base - (pct / 100) * base));
                      }
                      const isDisc = p?.discount_active && discounted < base;
                      return isDisc ? (
                        <div>
                          <div style={{ textDecoration: 'line-through', color: '#ffd' }}>{formatRupiah(base)}</div>
                          <div style={{ fontWeight: 700 }}>{formatRupiah(discounted)}</div>
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