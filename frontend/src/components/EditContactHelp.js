import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, updateContact, uploadContactImage, API_URL } from '../api/admin';

const defaults = {
  image: '/kurin.png',
  hero_title: 'KONTAK KURIN',
  hero_subtitle: '',
  phone: '+62 858-8886-2104',
  email: 'kurinhousehold@gmail.com',
  address: 'Jalan Kedoya Raya (Kedoya Pesing No.12-16 2, RT.2/RW.7, Kedoya Utara, Kec. Kb. Jeruk, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11520)',
  social: 'Instagram / Facebook',
  map_query: 'Jalan Kedoya Raya (Kedoya Pesing No.12-16 2, RT.2/RW.7, Kedoya Utara, Kec. Kb. Jeruk, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11520)',
  map_zoom: 16,
};

const API_BASE = API_URL.replace(/\/api$/, '');
const toAbsolute = (url) => (url && url.startsWith('/')) ? `${API_BASE}${url}` : url;

export default function EditContactHelp() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getSettings();
        const contactRaw = res?.settings?.contact || '';
        let contact = {};
        try { contact = JSON.parse(contactRaw || '{}'); } catch (_) { contact = {}; }
        setForm(prev => ({ ...prev, ...contact }));
      } catch (e) {
        // gunakan defaults
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleChange = (key) => (e) => {
    const value = key === 'map_zoom' ? Number(e.target.value) : e.target.value;
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    setMessage('');
    const res = await uploadContactImage(file);
    setUploading(false);
    if (res && !res.error) {
      const path = res.path || res.url;
      setForm(prev => ({ ...prev, image: path || prev.image }));
      setMessage('Gambar berhasil diupload.');
    } else {
      setMessage(res?.error || 'Gagal upload gambar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    // kirim sebagai JSON yang diserialisasi
    const res = await updateContact(form);
    setSaving(false);
    if (res && !res.error) {
      setMessage('Kontak bantuan berhasil disimpan.');
    } else {
      setMessage(res?.error || 'Gagal menyimpan kontak bantuan');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        .topbar { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; border-bottom:1px solid #eee; }
        .nav a { color:#c33; text-decoration:none; font-weight:600; margin-right:16px; }
        .container { max-width: 1000px; margin: 0 auto; padding: 24px; }
        .card { background:#fff; border:1px solid #eee; border-radius:12px; padding:24px; }
        label { display:block; font-weight:600; color:#c33; margin-top:12px; }
        input, textarea { width:100%; padding:12px; border-radius:8px; border:1px solid #ddd; margin-top:6px; }
        textarea { min-height: 100px; }
        .actions { display:flex; gap:12px; margin-top:16px; }
        .btn { border:none; border-radius:8px; padding:12px 16px; cursor:pointer; }
        .btn.primary { background:#c33; color:#fff; }
        .btn.secondary { background:#eee; color:#333; }
        .msg { margin-top:12px; color:#0a7; font-weight:600; }
        .hint { font-size: 12px; color: #666; margin-top: 6px; }
        .preview { margin-top: 12px; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
      `}</style>

      <div className="topbar">
        <img src="/kurin.png" alt="Kurin" style={{ height: 54 }} />
        <div className="nav">
          <a href="/admin/dashboard">Dashboard</a>
          <a href="/contact">Lihat Halaman Publik</a>
        </div>
      </div>

      <div className="container">
        <h2 style={{ color:'#c33' }}>Edit Kontak Bantuan</h2>
        {loading ? (
          <div>Memuat data...</div>
        ) : (
          <form className="card" onSubmit={handleSubmit}>
            <label>Upload Hero Image</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {form.image && (
              <div className="hint">Path: {form.image}</div>
            )}
            {form.image && (
              <div className="preview">
                <div style={{ height: 180, backgroundSize:'cover', backgroundPosition:'center', backgroundImage: `url(${toAbsolute(form.image)})` }} />
              </div>
            )}

            <label>Hero Title</label>
            <input value={form.hero_title} onChange={handleChange('hero_title')} />

            <label>Hero Subtitle</label>
            <input value={form.hero_subtitle} onChange={handleChange('hero_subtitle')} />

            <label>Nomor Telepon</label>
            <input value={form.phone} onChange={handleChange('phone')} />

            <label>Email</label>
            <input value={form.email} onChange={handleChange('email')} />

            <label>Alamat</label>
            <textarea value={form.address} onChange={handleChange('address')} />

            <label>Sosial Media</label>
            <input value={form.social} onChange={handleChange('social')} placeholder="Instagram / Facebook" />

            <label>Map Query (alamat untuk Google Maps)</label>
            <input value={form.map_query} onChange={handleChange('map_query')} />

            <label>Map Zoom</label>
            <input type="number" value={form.map_zoom} onChange={handleChange('map_zoom')} />

            <div className="actions">
              <button className="btn secondary" type="button" onClick={() => navigate('/admin/dashboard')}>Kembali</button>
              <button className="btn primary" type="submit" disabled={saving || uploading}>{(saving || uploading) ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
            {message && <div className="msg">{message}</div>}
          </form>
        )}
      </div>
    </div>
  );
}