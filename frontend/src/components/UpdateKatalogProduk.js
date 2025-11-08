import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { API_URL, getCategories } from '../api/admin';
import '../admin.css';
import './katalog.css';

const UpdateKatalogProduk = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State untuk data produk
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productImages, setProductImages] = useState([]);
  const [productVideo, setProductVideo] = useState(null); // Data URL video
  const [videoPreview, setVideoPreview] = useState(null); // Object URL untuk pratinjau
  const [hasVariants, setHasVariants] = useState(false);
  // tipe varian: 'size' | 'color' | 'type' (Jenis)
  const [variantType, setVariantType] = useState('size');
  const [variants, setVariants] = useState([{ size: '', color: '', type: '', stock: 0, price: 0 }]);
  const [singleStock, setSingleStock] = useState(0);
  const [singlePrice, setSinglePrice] = useState(0);
  const [shipping, setShipping] = useState({ weight: '', height: '', length: '', width: '' });
  
  // Data kategori
  const DEFAULT_CATEGORIES = useMemo(() => ["Pel", "Sapu", "Pengki", "Sikat", "Platinum Series"], []);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  
  // Ambil data produk dari API
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/products/${id}`);
        const data = await res.json();
        if (res.ok) {
          setProductName(data.name || '');
          setProductDescription(data.description || '');
          setProductCategory(data.category || '');
          // Normalisasi images: dukung array langsung atau string JSON
          let imgs = [];
          if (Array.isArray(data.images)) {
            imgs = data.images;
          } else if (typeof data.images === 'string' && data.images) {
            const trimmed = data.images.trim();
            if (trimmed.startsWith('[')) {
              try {
                const parsed = JSON.parse(trimmed);
                imgs = Array.isArray(parsed) ? parsed : [];
              } catch (_) {
                imgs = [];
              }
            } else {
              imgs = [data.images];
            }
          }
          // Deteksi jika ada video di dalam daftar images
          const isVideoSrc = (s) => typeof s === 'string' && (/^data:video\//.test(s) || /\.(mp4|webm|mov|avi)(\?.*)?$/i.test(s));
          let vid = null;
          const vIndex = imgs.findIndex(isVideoSrc);
          if (vIndex > -1) {
            vid = imgs[vIndex];
            imgs.splice(vIndex, 1);
          }
          setProductVideo(vid || null);
          setProductImages(imgs);
          const hasVar = Array.isArray(data.variants) && data.variants.length > 0;
          setHasVariants(hasVar);
          if (hasVar) {
            // Normalisasi struktur varian agar memiliki properti 'type' (jenis)
            const normalized = data.variants.map((v) => ({
              size: v.size || '',
              color: v.color || '',
              type: v.type || v.jenis || '',
              stock: parseInt(v.stock || 0),
              price: parseFloat(v.price || 0),
            }));
            setVariants(normalized);
            // Tentukan default variantType berdasarkan data yang paling banyak terisi
            const counts = {
              size: normalized.filter((v) => (v.size || '').trim() !== '').length,
              color: normalized.filter((v) => (v.color || '').trim() !== '').length,
              type: normalized.filter((v) => (v.type || '').trim() !== '').length,
            };
            const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'size';
            setVariantType(best);
          } else {
            setVariants([]);
            setSingleStock(parseInt(data.stock || 0));
            setSinglePrice(parseFloat(data.price || 0));
          }
          setShipping({
            weight: data.weight || '',
            height: data.height || '',
            length: data.length || '',
            width: data.width || ''
          });
        }
      } catch (err) {
        console.error('Gagal mengambil produk:', err);
      }
    };
    fetchProduct();
  }, [id]);
  
  // Ambil kategori dari API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        let items = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (data?.data && Array.isArray(data.data)) {
          items = data.data;
        } else if (data?.categories && Array.isArray(data.categories)) {
          items = data.categories;
        }
        const names = items
          .map((c) => typeof c === 'string' ? c : (c.name || c.nama || c.category || c.title || c.label || ''))
          .filter(Boolean);
        const unique = Array.from(new Set([...names, ...DEFAULT_CATEGORIES]));
        setCategories(unique);
      } catch (err) {
        console.warn('Gagal memuat kategori, gunakan default:', err);
        setCategories((prev) => Array.from(new Set([...prev, ...DEFAULT_CATEGORIES])));
      }
    };
    loadCategories();
  }, [DEFAULT_CATEGORIES]);
  
  // Fungsi untuk menambah varian
  const addVariant = () => {
    setVariants([...variants, { size: '', color: '', type: '', stock: 0, price: 0 }]);
  };
  
  // Fungsi untuk menghapus varian
  const removeVariant = (index) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };
  
  // Fungsi untuk mengubah nilai varian
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };
  
  // Fungsi untuk mengubah nilai shipping
  const handleShippingChange = (field, value) => {
    setShipping({ ...shipping, [field]: value });
  };
  
  // Fungsi untuk menambah gambar (mendukung multi-select)
  const addImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remainingSlots = Math.max(0, 10 - productImages.length);
    const take = files.slice(0, remainingSlots);
    Promise.all(
      take.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    ).then((newImages) => {
      setProductImages([...productImages, ...newImages]);
    });
  };
  
  // Fungsi untuk menghapus gambar
  const removeImage = (index) => {
    const newImages = [...productImages];
    newImages.splice(index, 1);
    setProductImages(newImages);
  };

  // Drag & Drop reorder gambar
  const reorderImages = (from, to) => {
    if (from === to || from < 0 || to < 0) return;
    setProductImages((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  };

  const onImageDragStart = (index) => (e) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onImageDragOver = () => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onImageDrop = (index) => (e) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!Number.isNaN(fromIndex)) reorderImages(fromIndex, index);
  };

  // Upload Video: satu file (maksimal 50MB)
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_BYTES = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_BYTES) {
      alert('Ukuran video maksimal 50MB');
      e.target.value = '';
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      setProductVideo(reader.result);
      setVideoPreview(previewUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeVideo = () => {
    if (videoPreview) {
      try { URL.revokeObjectURL(videoPreview); } catch (_) {}
    }
    setProductVideo(null);
    setVideoPreview(null);
  };
  
  // Fungsi untuk menyimpan perubahan
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sisipkan video ke slide kedua
    let images = [...productImages];
    if (productVideo) {
      images = images.length > 0 ? [images[0], productVideo, ...images.slice(1)] : [productVideo, ...images];
    }

    const productData = {
      name: productName,
      description: productDescription || '',
      category: productCategory || '',
      images,
      variants: hasVariants
        ? variants.map(v => ({
            size: v.size || '',
            color: v.color || '',
            type: v.type || '',
            stock: parseInt(v.stock || 0),
            price: parseFloat(v.price || 0)
          }))
        : [],
      stock: hasVariants
        ? variants.reduce((total, v) => total + parseInt(v.stock || 0), 0)
        : parseInt(singleStock || 0),
      price: hasVariants
        ? parseFloat(variants[0]?.price || 0)
        : parseFloat(singlePrice || 0),
      weight: parseFloat(shipping.weight || 0),
      height: parseFloat(shipping.height || 0),
      length: parseFloat(shipping.length || 0),
      width: parseFloat(shipping.width || 0)
    };

    try {
      const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Gagal menyimpan perubahan: ${err.message || res.status}`);
        return;
      }
      navigate('/katalogproduk');
    } catch (err) {
      console.error('Error update:', err);
      alert('Terjadi kesalahan saat menyimpan perubahan');
    }
  };
  
  // Fungsi untuk kembali ke halaman katalog
  const handleCancel = () => {
    navigate('/katalogproduk');
  };
  
  return (
    <div className="admin-dashboard" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div className="main-content page-main" style={{ flex: 1 }}>
        {/* Header halaman: samakan dengan AddKatalogProduk */}
        <div className="page-header">
          <div>
            <h1>Update Katalog Produk</h1>
            <p>Ubah detail produk yang sudah ada</p>
          </div>
          <button className="website-btn" onClick={() => navigate('/home')}>Website</button>
        </div>
        
        <div className="dashboard-content">
          <form onSubmit={handleSubmit} className="product-form">
            {/* Bagian Foto Produk */}
            <div className="form-section">
              <h3>Foto</h3>
              <div className="product-images">
                {productImages.map((image, index) => (
                  <div
                    key={index}
                    className="image-container"
                    draggable
                    onDragStart={onImageDragStart(index)}
                    onDragOver={onImageDragOver(index)}
                    onDrop={onImageDrop(index)}
                  >
                    <img src={image} alt={`Product ${index + 1}`} />
                    <button 
                      type="button" 
                      className="remove-image" 
                      onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {productImages.length < 10 && (
                  <div className="add-image">
                    <input 
                      type="file" 
                      id="add-image" 
                      accept="image/*" 
                      multiple
                      onChange={addImages} 
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="add-image">+</label>
                  </div>
                )}
            </div>
              <p className="image-hint">Tambahkan 5-10 foto produk</p>
            </div>

            {/* Bagian Video Produk */}
            <div className="form-section">
              <h3>Video (Opsional)</h3>
              <div className="product-images">
                {productVideo ? (
                  <div className="image-container">
                    <video src={videoPreview || productVideo} controls muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" className="remove-image" onClick={removeVideo}>&times;</button>
                  </div>
                ) : (
                  <div className="add-image">
                    <input
                      type="file"
                      id="add-video"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="add-video">+</label>
                  </div>
                )}
              </div>
              <p className="image-hint">Video akan ditampilkan sebagai slide kedua di detail produk (maks 50MB).</p>
            </div>
            
            {/* Bagian Nama Produk */}
            <div className="form-section">
              <h3>Nama</h3>
              <input 
                type="text" 
                value={productName} 
                onChange={(e) => setProductName(e.target.value)} 
                required 
                className="form-input"
              />
            </div>
            
            {/* Bagian Kategori */}
            <div className="form-section">
              <h3>Kategori</h3>
              <div className="select-container">
                <select 
                  value={productCategory} 
                  onChange={(e) => setProductCategory(e.target.value)} 
                  required
                  className="form-select"
                >
                  <option value="">Pilih</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
                <div className="select-arrow">▼</div>
              </div>
            </div>
            
            {/* Bagian Deskripsi */}
            <div className="form-section">
              <h3>Deskripsi</h3>
              <textarea 
                value={productDescription} 
                onChange={(e) => setProductDescription(e.target.value)} 
                required 
                className="form-textarea"
              />
            </div>
            
            {/* Bagian Harga & Stok / Varian */}
            <div className="form-section">
              <h3>Harga & Stok</h3>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={hasVariants} 
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasVariants(checked);
                      if (!checked) {
                        // pindah ke mode single
                        setVariants([]);
                      } else if (variants.length === 0) {
                        setVariants([{ size: '', color: '', type: '', stock: 0, price: 0 }]);
                        setVariantType('size');
                      }
                    }}
                  />
                  Memiliki varian
                </label>
              </div>
              {hasVariants && (
                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ minWidth: '100px' }}>Tipe Varian</label>
                  <div className="select-container" style={{ flex: 1 }}>
                    <select
                      value={variantType}
                      onChange={(e) => setVariantType(e.target.value)}
                      className="form-select"
                    >
                      <option value="size">Ukuran</option>
                      <option value="color">Warna</option>
                      <option value="type">Jenis</option>
                    </select>
                    <div className="select-arrow">▼</div>
                  </div>
                </div>
              )}

              {hasVariants ? (
                <>
                  {/* Header kolom untuk penyelarasan */}
                  <div className="variant-headers">
                    <div>{variantType === 'size' ? 'Ukuran' : variantType === 'color' ? 'Warna' : 'Jenis'}</div>
                    <div>Stok</div>
                    <div>Harga (Rp)</div>
                  </div>
                  {variants.map((variant, index) => (
                    <div key={index} className="variant-row">
                      <div className="variant-inputs">
                        {variantType === 'size' && (
                          <div>
                            <input
                              type="text"
                              placeholder="Contoh: S, M, L"
                              value={variant.size}
                              onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                              className="form-input"
                            />
                          </div>
                        )}
                        {variantType === 'color' && (
                          <div>
                            <input
                              type="text"
                              placeholder="Contoh: Merah, Biru"
                              value={variant.color}
                              onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                              className="form-input"
                            />
                          </div>
                        )}
                        {variantType === 'type' && (
                          <div>
                            <input
                              type="text"
                              placeholder="Contoh: Model A, Paket 2pcs"
                              value={variant.type}
                              onChange={(e) => handleVariantChange(index, 'type', e.target.value)}
                              className="form-input"
                            />
                          </div>
                        )}
                        <div>
                          <input
                            type="number"
                            placeholder="0"
                            value={variant.stock}
                            onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="0"
                            value={variant.price}
                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                            className="form-input"
                          />
                        </div>
                      </div>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          className="remove-variant"
                          onClick={() => removeVariant(index)}
                          >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-variant"
                    onClick={addVariant}
                  >
                    + Tambah Varian
                  </button>
                </>
              ) : (
                <div className="variant-inputs two-cols">
                  <div>
                    <label>Stok</label>
                    <input
                      type="number"
                      value={singleStock}
                      onChange={(e) => setSingleStock(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label>Harga (Rp)</label>
                    <input
                      type="number"
                      value={singlePrice}
                      onChange={(e) => setSinglePrice(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Bagian Informasi Pengiriman */}
            <div className="form-section">
              <h3>Informasi Pengiriman</h3>
              <div className="shipping-inputs">
                <div className="shipping-input">
                  <label>Berat (gram)</label>
                  <input 
                    type="number" 
                    value={shipping.weight} 
                    onChange={(e) => handleShippingChange('weight', e.target.value)} 
                    required 
                    className="form-input"
                  />
                </div>
                <div className="shipping-input">
                  <label>Tinggi (cm)</label>
                  <input 
                    type="number" 
                    value={shipping.height} 
                    onChange={(e) => handleShippingChange('height', e.target.value)} 
                    required 
                    className="form-input"
                  />
                </div>
                <div className="shipping-input">
                  <label>Panjang (cm)</label>
                  <input 
                    type="number" 
                    value={shipping.length} 
                    onChange={(e) => handleShippingChange('length', e.target.value)} 
                    required 
                    className="form-input"
                  />
                </div>
                <div className="shipping-input">
                  <label>Lebar (cm)</label>
                  <input 
                    type="number" 
                    value={shipping.width} 
                    onChange={(e) => handleShippingChange('width', e.target.value)} 
                    required 
                    className="form-input"
                  />
                </div>
              </div>
            </div>
            
            {/* Tombol Submit dan Cancel */}
            <div className="form-buttons">
              <button type="button" className="cancel-button" onClick={handleCancel}>Batal</button>
              <button type="submit" className="submit-button">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateKatalogProduk;