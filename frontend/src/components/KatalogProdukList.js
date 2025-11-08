import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { API_URL } from '../api/admin';
import '../admin.css';
import './katalog.css';

const KatalogProdukList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  // Ambil data dari API backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/admin/products`, {
          headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || `HTTP ${res.status}`);
        }

        // Dukung berbagai bentuk respons: array langsung, data.data, atau data.products
        const list = Array.isArray(data)
          ? data
          : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.products) ? data.products : []));

        const normalized = list.map(p => {
          let images = [];
          if (Array.isArray(p.images)) {
            images = p.images;
          } else if (typeof p.images === 'string' && p.images) {
            const trimmed = p.images.trim();
            if (trimmed.startsWith('[')) {
              try {
                const parsed = JSON.parse(trimmed);
                images = Array.isArray(parsed) ? parsed : [];
              } catch (_) {
                images = [p.images];
              }
            } else {
              images = [p.images];
            }
          }

          const stock = typeof p.stock === 'number'
            ? p.stock
            : (Array.isArray(p.variants) ? p.variants.reduce((t, v) => t + parseInt(v.stock || 0), 0) : 0);

          // Kumpulkan semua harga dari price utama dan varian
          const basePrice = (() => {
            if (typeof p.price === 'number') return p.price;
            if (typeof p.price === 'string' && p.price.trim() !== '') {
              const parsed = parseFloat(p.price);
              return isNaN(parsed) ? undefined : parsed;
            }
            return undefined;
          })();
          const variantPrices = Array.isArray(p.variants)
            ? p.variants
                .map(v => {
                  const num = parseFloat(v?.price ?? '');
                  return isNaN(num) ? undefined : num;
                })
                .filter(v => typeof v === 'number')
            : [];
          const allPrices = [basePrice, ...variantPrices].filter(pv => typeof pv === 'number');
          const minPrice = allPrices.length ? Math.min(...allPrices) : 0;
          const maxPrice = allPrices.length ? Math.max(...allPrices) : 0;

          return {
            id: p.id,
            name: p.name,
            stock,
            price: minPrice, // tetap gunakan harga minimum sebagai nilai default
            minPrice,
            maxPrice,
            image: images.length > 0 ? images[0] : null
          };
        });
        setProducts(normalized);
        setLoading(false);
      } catch (err) {
        console.error('Gagal mengambil produk:', err);
        setError(err?.message || 'Gagal mengambil produk');
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const handleAddProduct = () => {
    navigate('/addkatalogproduk');
  };

  const handleEditProduct = (productId) => {
    navigate(`/updatekatalogproduk/${productId}`);
  };

  const confirmDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const handleDeleteProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Gagal menghapus produk: ${err.message || res.status}`);
        return;
      }
      setProducts(products.filter(product => product.id !== productToDelete.id));
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error delete:', err);
      alert('Terjadi kesalahan saat menghapus produk');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  return (
    <div className="admin-dashboard" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1, backgroundColor: 'white' }}>
        <Header />
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h2>Katalog Produk</h2>
            <button className="add-button" onClick={handleAddProduct}>+ Tambah</button>
          </div>
          {error && (
            <div style={{ background: '#ffe7e7', color: '#a10000', padding: '10px 12px', borderRadius: 6, marginBottom: 12 }}>
              Gagal memuat data: {error}
              <button onClick={() => window.location.reload()} style={{ marginLeft: 12, background: '#e52b2b', color: '#fff', border: 0, borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}>
                Muat Ulang
              </button>
            </div>
          )}
          
          <div className="product-table">
            <table>
              <colgroup>
                <col style={{ width: '6%' }} />
                <col style={{ width: '49%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="number-cell">No</th>
                  <th>Produk</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>Memuat data...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>Belum ada produk</td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr key={product.id}>
                      <td className="number-cell">{index + 1}</td>
                      <td className="product-cell">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="product-image" />
                        ) : (
                          <div className="product-image placeholder" aria-label="No image" />
                        )}
                        <span>{product.name}</span>
                      </td>
                      <td>
                        {product.maxPrice > product.minPrice
                          ? `${formatRupiah(product.minPrice)} - ${formatRupiah(product.maxPrice)}`
                          : formatRupiah(product.minPrice)}
                      </td>
                      <td>{product.stock}</td>
                      <td className="action-cell">
                        <button 
                          className="edit-button"
                          onClick={() => handleEditProduct(product.id)}
                        >
                          Ubah
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => confirmDelete(product)}
                        >
                          hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Konfirmasi Hapus</h3>
            <p>Apakah Anda yakin ingin menghapus produk "{productToDelete?.name}"?</p>
            <div className="modal-buttons">
              <button className="cancel-button" onClick={cancelDelete}>Batal</button>
              <button className="confirm-button" onClick={handleDeleteProduct}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KatalogProdukList;