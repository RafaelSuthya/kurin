import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL, getCategories } from "../api/admin";
import "../admin.css";
import "./katalog.css";

const AddKatalogProduk = () => {
  const navigate = useNavigate();
  
  // State untuk menyimpan data produk
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState("");

  const [categories, setCategories] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [productVideo, setProductVideo] = useState(null); // Data URL video
  const [videoPreview, setVideoPreview] = useState(null); // Object URL untuk pratinjau
  const [hasVariants, setHasVariants] = useState(false);
  // tipe varian: 'size' | 'color' | 'type'
  const [variantType, setVariantType] = useState('size');
  const [variants, setVariants] = useState([]);
  const [singleStock, setSingleStock] = useState(0);
  const [singlePrice, setSinglePrice] = useState(0);
  const [weight, setWeight] = useState(0);
  const [height, setHeight] = useState(0);
  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);
  
  // Fungsi untuk menyimpan produk dan redirect ke halaman katalog produk
  const saveProduct = async () => {
    try {
      // Validasi data dasar
      if (!productName) {
        alert("Nama produk harus diisi");
        return;
      }

      // Susun daftar gambar, sisipkan video di posisi slide kedua jika ada
      const baseImages = productImages.map(img => img.dataUrl || img.preview);
      let images = [...baseImages];
      if (productVideo) {
        images = images.length > 0
          ? [images[0], productVideo, ...images.slice(1)]
          : [productVideo, ...images];
      }

      // Menyiapkan data produk sebagai objek biasa
      const productData = {
        name: productName,
        description: productDescription || "",
        category: productCategory || "",
        stock: hasVariants ? variants.reduce((total, v) => total + parseInt(v.stock || 0), 0) : parseInt(singleStock || 0),
        price: hasVariants ? parseFloat(variants[0]?.price || 0) : parseFloat(singlePrice || 0),
        // Simpan sebagai Data URL (base64); video disisipkan di indeks 1 (slide kedua)
        images,
        // Jika hasVariants aktif, kirim varian; jika tidak kosongkan
        variants: hasVariants ? variants.map(v => ({
          size: v.size || "",
          color: v.color || "",
          type: v.type || "",
          stock: parseInt(v.stock || 0),
          price: parseFloat(v.price || 0)
        })) : [],
        weight: parseFloat(weight || 0),
        length: parseFloat(length || 0),
        width: parseFloat(width || 0),
        height: parseFloat(height || 0)
      };

      // Tambahkan token CSRF
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      console.log("Data yang dikirim:", productData);

      // Mengirim data ke API menggunakan API_URL agar tidak tergantung proxy dev server
      const response = await axios.post(`${API_URL}/admin/products`, productData, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json'
        }
      });
      
      console.log("Response dari server:", response.data);
      
      alert("Produk berhasil disimpan");
      // Redirect ke halaman KatalogProdukList
      navigate('/katalogproduk');
    } catch (error) {
      console.error("Error menyimpan produk:", error);
      console.error("Response data:", error.response?.data);
      console.error("Status code:", error.response?.status);
      alert("Gagal menyimpan produk: " + (error.response?.data?.message || "Silakan coba lagi."));
    }
  };

  // Kategori produk (contoh)

  // Ambil kategori dari API agar sinkron dengan admin kategori
  useEffect(() => {
    const normalizeCategories = (raw) => {
      const src = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.categories)
        ? raw.categories
        : [];
      return src
        .map((item, idx) => {
          if (typeof item === "string") return { id: idx + 1, name: item };
          return {
            id: item?.id ?? item?.category_id ?? idx + 1,
            name: item?.name ?? item?.category ?? item?.title ?? "",
          };
        })
        .filter((c) => (c.name || "").trim() !== "");
    };
    const DEFAULT = ["Sapu", "Pel", "Pengki", "Sikat", "Platinum Series"];
    (async () => {
      try {
        const data = await getCategories();
        let list = normalizeCategories(data);
        if (list.length === 0) {
          list = DEFAULT.map((n, i) => ({ id: i + 1, name: n }));
        }
        setCategories(list);
      } catch (_) {
        setCategories(DEFAULT.map((n, i) => ({ id: i + 1, name: n })));
      }
    })();
  }, []);

  // Fungsi untuk menambahkan varian
  const addVariant = () => {
    setVariants([...variants, { size: "", color: "", stock: 0, price: 0 }]);
  };

  // Fungsi untuk mengubah data varian
  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  // Fungsi untuk menghapus varian
  const removeVariant = (index) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };

  // Fungsi untuk menangani upload gambar
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + productImages.length > 10) {
      alert("Maksimal 10 gambar");
      return;
    }

    // Baca file sebagai Data URL (base64) agar bisa disimpan dan ditampilkan kembali di halaman update
    const toImageObj = (file) => new Promise((resolve) => {
      const preview = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = () => resolve({ file, preview, dataUrl: reader.result });
      reader.readAsDataURL(file);
    });

    const newImages = await Promise.all(files.map(toImageObj));
    setProductImages([...productImages, ...newImages]);
  };

  // Fungsi untuk menghapus gambar
  const removeImage = (index) => {
    const newImages = [...productImages];
    // Hapus URL objek untuk mencegah memory leak
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setProductImages(newImages);
  };

  // Upload Video: satu file, data URL (maksimal 50MB)
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_BYTES = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_BYTES) {
      alert("Ukuran video maksimal 50MB");
      e.target.value = '';
      return;
    }
    // Baca sebagai Data URL untuk disimpan, dan buat object URL untuk pratinjau
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

  // Fungsi sudah didefinisikan di atas

  return (
    <div className="admin-dashboard-wrapper" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="sidebar" style={{ width: '200px', backgroundColor: 'white', borderRight: '1px solid #eee', padding: '20px 0' }}>
        <div className="logo" style={{ padding: '0 20px', marginBottom: '30px' }}>
          <img src="/kurin.png" alt="Kurin" style={{ width: '100px' }} />
        </div>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li 
            style={{ padding: '10px 20px', marginBottom: '5px', cursor: 'pointer' }}
            onClick={() => navigate('/admin/dashboard')}
          >
            <span style={{ marginRight: '10px' }}>📊</span> Dashboard
          </li>
          <li style={{ padding: '10px 20px', marginBottom: '5px' }}>
            <span style={{ marginRight: '10px' }}>🛒</span> Pesanan
          </li>
          <li style={{ padding: '10px 20px', marginBottom: '5px' }}>
            <span style={{ marginRight: '10px' }}>↩️</span> Pengembalian
          </li>
          <li style={{ padding: '10px 20px', marginBottom: '5px' }}>
            <span style={{ marginRight: '10px' }}>❌</span> Pembatalan
          </li>
          <li 
            style={{ padding: '10px 20px', backgroundColor: '#f8f8f8', marginBottom: '5px', color: '#e52b2b', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => navigate('/katalogproduk')}
          >
            <span style={{ marginRight: '10px' }}>📦</span> Katalog Produk
          </li>
          <li 
            style={{ padding: '10px 20px', marginBottom: '5px', cursor: 'pointer' }}
            onClick={() => navigate('/admin/kategori')}
          >
            <span style={{ marginRight: '10px' }}>🏷️</span> Kategori
          </li>
          <li style={{ padding: '10px 20px', marginBottom: '5px' }}>
            <span style={{ marginRight: '10px' }}>💰</span> Diskon
          </li>
          <li style={{ padding: '10px 20px', marginBottom: '5px' }}>
            <span style={{ marginRight: '10px' }}>📋</span> Status Pesanan
          </li>
        </ul>
        
        <div style={{ position: 'absolute', bottom: '20px', width: '180px', padding: '0 20px' }}>
          <div style={{ padding: '10px 0', borderTop: '1px solid #eee', marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ marginRight: '10px' }}>👤</span> My Profile
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>🚪</span> Sign Out
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content" style={{ flex: 1, backgroundColor: '#f8f8f8', padding: '20px' }}>
        {/* Header */}
        <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', backgroundColor: 'white', borderRadius: '10px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '28px', margin: 0, fontWeight: 'normal' }}>Tambah Katalog Produk</h1>
            <p style={{ margin: '5px 0 0', color: '#666' }}>Tambahkan produk baru ke katalog</p>
          </div>
          <div>
            <button style={{ 
              backgroundColor: '#e52b2b', 
              color: 'white', 
              border: 'none', 
              borderRadius: '50px', 
              padding: '10px 30px', 
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              Website
            </button>
          </div>
        </div>
        
        {/* Form Tambah Produk */}
        <div className="product-form">
          {/* Upload Foto */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Foto</h2>
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
                  <img src={image.preview} alt={`Product ${index + 1}`} />
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
                    onChange={handleImageUpload} 
                    style={{ display: 'none' }} 
                  />
                  <label htmlFor="add-image">+</label>
                  <p className="image-hint">Upload Foto (max 10)</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Video */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Video</h2>
            <div className="product-images">
              {productVideo ? (
                <div className="image-container">
                  {/* Pratinjau video dengan ukuran sama */}
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
                  <p className="image-hint">Upload Video (opsional, maks 50MB)</p>
                </div>
              )}
            </div>
            <p className="image-hint">Video akan ditampilkan di slide kedua pada detail produk.</p>
          </div>
          
          {/* Nama Produk */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Nama</h2>
            <input 
              type="text" 
              value={productName} 
              onChange={(e) => setProductName(e.target.value)} 
              placeholder="Masukkan nama produk" 
              style={{ 
                width: '100%', 
                padding: '12px 15px', 
                border: '1px solid #ddd', 
                borderRadius: '5px', 
                fontSize: '16px' 
              }} 
            />
          </div>
          
          {/* Kategori Produk */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Kategori</h2>
            <div style={{ position: 'relative' }}>
              <select 
                value={productCategory} 
                onChange={(e) => setProductCategory(e.target.value)} 
                style={{ 
                  width: '100%', 
                  padding: '12px 15px', 
                  border: '1px solid #ddd', 
                  borderRadius: '5px', 
                  fontSize: '16px',
                  appearance: 'none',
                  backgroundColor: 'white'
                }} 
              >
                <option value="">Pilih Kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }}>▼</div>
            </div>
          </div>
          
          {/* Deskripsi Produk */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Deskripsi</h2>
            <textarea 
              value={productDescription} 
              onChange={(e) => setProductDescription(e.target.value)} 
              placeholder="Masukkan deskripsi produk" 
              style={{ 
                width: '100%', 
                padding: '12px 15px', 
                border: '1px solid #ddd', 
                borderRadius: '5px', 
                fontSize: '16px',
                minHeight: '150px',
                resize: 'vertical'
              }} 
            />
          </div>
          
          {/* Harga & Stok / Varian - disamakan persis dengan UpdateKatalogProduk */}
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
                            onChange={(e) => updateVariant(index, 'size', e.target.value)}
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
                            onChange={(e) => updateVariant(index, 'color', e.target.value)}
                            className="form-input"
                          />
                        </div>
                      )}
                      {variantType === 'type' && (
                        <div>
                          <input
                            type="text"
                            placeholder="Contoh: Model A, Paket 2pcs"
                            value={variant.type || ''}
                            onChange={(e) => updateVariant(index, 'type', e.target.value)}
                            className="form-input"
                          />
                        </div>
                      )}
                      <div>
                        <input
                          type="number"
                          placeholder="0"
                          value={variant.stock}
                          onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value))}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="0"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', parseInt(e.target.value))}
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
                    onChange={(e) => setSingleStock(parseInt(e.target.value))}
                    className="form-input"
                  />
                </div>
                <div>
                  <label>Harga (Rp)</label>
                  <input
                    type="number"
                    value={singlePrice}
                    onChange={(e) => setSinglePrice(parseInt(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Informasi Pengiriman */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Informasi Pengiriman</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Berat (gram)</label>
                <input 
                  type="number" 
                  value={weight} 
                  onChange={(e) => setWeight(parseInt(e.target.value))} 
                  min="0" 
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '5px' 
                  }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Tinggi (cm)</label>
                <input 
                  type="number" 
                  value={height} 
                  onChange={(e) => setHeight(parseInt(e.target.value))} 
                  min="0" 
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '5px' 
                  }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Panjang (cm)</label>
                <input 
                  type="number" 
                  value={length} 
                  onChange={(e) => setLength(parseInt(e.target.value))} 
                  min="0" 
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '5px' 
                  }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Lebar (cm)</label>
                <input 
                  type="number" 
                  value={width} 
                  onChange={(e) => setWidth(parseInt(e.target.value))} 
                  min="0" 
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '5px' 
                  }} 
                />
              </div>
            </div>
          </div>
          
          {/* Tombol Simpan */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={saveProduct}
              style={{ 
                backgroundColor: '#e52b2b', 
                color: 'white', 
                border: 'none', 
                borderRadius: '50px', 
                padding: '12px 40px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              + Tambah
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddKatalogProduk;