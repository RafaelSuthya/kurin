import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import '../admin.css';
import './katalog.css';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../api/admin';

// Normalisasi berbagai bentuk data kategori dari API
const normalizeCategories = (raw) => {
  const src = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.categories) ? raw.categories : []));
  return src.map((item, idx) => {
    if (typeof item === 'string') return { id: idx + 1, name: item };
    return {
      id: item?.id ?? item?.category_id ?? idx + 1,
      name: item?.name ?? item?.category ?? item?.title ?? ''
    };
  }).filter(c => (c.name || '').trim() !== '');
};

const DEFAULT_CATEGORIES = ['Sapu', 'Pel', 'Pengki', 'Sikat', 'Platinum Series'];
const AdminCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCategories();
        let list = normalizeCategories(data);

        // Seed kategori default jika sebagian belum ada
        const existing = new Set(list.map(c => (c.name || '').trim().toLowerCase()));
        const toCreate = DEFAULT_CATEGORIES.filter(n => !existing.has(n.toLowerCase()));
        if (toCreate.length) {
          for (const name of toCreate) {
            try { await addCategory({ name }); } catch (_) {}
          }
          const reData = await getCategories();
          list = normalizeCategories(reData);
        }

        setCategories(list);
      } catch (e) {
        setError('Gagal memuat kategori');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const openAdd = () => {
    setCategoryName('');
    setShowAddModal(true);
  };

  const openEdit = (cat) => {
    setSelectedCategory(cat);
    setCategoryName(cat?.name || '');
    setShowEditModal(true);
  };

  const openDelete = (cat) => {
    setSelectedCategory(cat);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedCategory(null);
    setCategoryName('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: categoryName };
      const res = await addCategory(payload);
      if (res?.error) throw new Error(res.error);
      // Jika API tidak mengembalikan objek baru, sisipkan manual
      const newCat = { id: res?.id ?? (categories.length ? Math.max(...categories.map(c => Number(c.id) || 0)) + 1 : 1), name: categoryName };
      setCategories(prev => [...prev, newCat]);
      closeModals();
    } catch (err) {
      alert('Gagal menambah kategori: ' + (err.message || 'Coba lagi'));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const id = selectedCategory?.id;
      const payload = { name: categoryName };
      const res = await updateCategory(id, payload);
      if (res?.error) throw new Error(res.error);
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: categoryName } : c));
      closeModals();
    } catch (err) {
      alert('Gagal mengubah kategori: ' + (err.message || 'Coba lagi'));
    }
  };

  const handleDelete = async () => {
    try {
      const id = selectedCategory?.id;
      const res = await deleteCategory(id);
      if (res?.error) throw new Error(res.error);
      setCategories(prev => prev.filter(c => c.id !== id));
      closeModals();
    } catch (err) {
      alert('Gagal menghapus kategori: ' + (err.message || 'Coba lagi'));
    }
  };

  return (
    <div className="admin-dashboard" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1, backgroundColor: 'white' }}>
        <Header />
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h2>Kategori Produk</h2>
            <button className="add-button" onClick={openAdd}>+ Tambah</button>
          </div>

          {error && (
            <div style={{ background: '#ffe7e7', color: '#a10000', padding: '10px 12px', borderRadius: 6, marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div className="product-table">
            <table>
              <colgroup>
                <col style={{ width: '70%' }} />
                <col style={{ width: '30%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Kategori Produk</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', color: '#888' }}>Memuat kategori...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', color: '#888' }}>Belum ada kategori</td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id}>
                      <td>
                        <span style={{ fontWeight: 600, color: '#222' }}>{cat.name}</span>
                      </td>
                      <td className="action-cell">
                        <button className="edit-button" onClick={() => openEdit(cat)}>Ubah</button>
                        <button className="delete-button" onClick={() => openDelete(cat)}>hapus</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tambah */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Tambah Kategori</h3>
            <form onSubmit={handleAddSubmit}>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Nama kategori"
                className="form-input"
                required
              />
              <div className="modal-buttons">
                <button type="button" className="cancel-button" onClick={closeModals}>Batal</button>
                <button type="submit" className="confirm-button">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Ubah Kategori</h3>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Nama kategori"
                className="form-input"
                required
              />
              <div className="modal-buttons">
                <button type="button" className="cancel-button" onClick={closeModals}>Batal</button>
                <button type="submit" className="confirm-button">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Konfirmasi Hapus</h3>
            <p>Apakah Anda yakin ingin menghapus kategori "{selectedCategory?.name}"?</p>
            <div className="modal-buttons">
              <button className="cancel-button" onClick={closeModals}>Batal</button>
              <button className="confirm-button" onClick={handleDelete}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoryList;