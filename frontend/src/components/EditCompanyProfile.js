import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, updateProfile, uploadProfileImage, API_URL } from '../api/admin';

const defaultProfile = {
  heroTitle: 'Tentang Kami',
  heroSubtitle: 'Mewujudkan kebersihan dan kenyamanan di setiap rumah',
  heroImageUrl: '/banners.png',
  aboutHtml: '<p>Kurin adalah brand kebersihan rumah tangga.</p>',
  vision: 'Menjadi brand pilihan utama untuk solusi kebersihan rumah.',
  mission: 'Memberikan produk inovatif, aman, dan efektif.',
  address: 'Jl. Raya Kedoya No. 10-16(Komplek Ruko Kedoya Indah), Kedoya Utara, Kebon Jeruk, Jakarta Barat. 11520',
  phone: '+62 812-0000-0000',
  email: 'halo@kurin.co.id',
  values: ['Kualitas', 'Inovasi', 'Kepercayaan', 'Keberlanjutan']
};

export default function EditCompanyProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(defaultProfile);
  const [valuesInput, setValuesInput] = useState(profile.values.join(', '));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSettings();
        const cp = res?.settings?.company_profile;
        if (cp) {
          const parsed = typeof cp === 'string' ? safeParse(cp) : cp;
          const final = { ...defaultProfile, ...parsed };
          setProfile(final);
          setValuesInput(Array.isArray(final.values) ? final.values.join(', ') : '');
        }
      } catch (e) {
        // gunakan default
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const safeParse = (str) => {
    try { return JSON.parse(str); } catch { return {}; }
  };

  const handleChange = (field) => (e) => {
    setProfile(p => ({ ...p, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const values = valuesInput.split(',').map(v => v.trim()).filter(Boolean);
    const payload = { ...profile, values };
    const res = await updateProfile(payload);
    setSaving(false);
    if (res && !res.error) {
      setMessage('Profil perusahaan berhasil disimpan.');
    } else {
      setMessage(res?.error || 'Gagal menyimpan profil perusahaan');
    }
  };

  const API_BASE = (API_URL || '').replace(/\/api$/, '');
  const toAbsolute = (url) => (url && url.startsWith('/')) ? `${API_BASE}${url}` : url;

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    setMessage('');
    const res = await uploadProfileImage(file);
    setUploading(false);
    if (res && !res.error) {
      const path = res.path || res.url;
      setProfile(prev => ({ ...prev, heroImageUrl: path || prev.heroImageUrl }));
      setMessage('Gambar banner berhasil diupload.');
    } else {
      setMessage(res?.error || 'Gagal upload gambar banner');
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
        textarea { min-height: 120px; }
        .actions { display:flex; gap:12px; margin-top:16px; }
        .btn { border:none; border-radius:8px; padding:12px 16px; cursor:pointer; }
        .btn.primary { background:#c33; color:#fff; }
        .btn.secondary { background:#eee; color:#333; }
        .msg { margin-top:12px; color:#0a7; font-weight:600; }
      `}</style>

      <div className="topbar">
        <img src="/kurin.png" alt="Kurin" style={{ height: 54 }} />
        <div className="nav">
          <a href="/admin/dashboard">Dashboard</a>
          <a href="/company-profile">Lihat Halaman Publik</a>
        </div>
      </div>

      <div className="container">
        <h2 style={{ color:'#c33' }}>Edit Profil Perusahaan</h2>
        {loading ? (
          <div>Memuat data...</div>
        ) : (
          <form className="card" onSubmit={handleSubmit}>
            <label>Upload Hero Image</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {profile.heroImageUrl && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>Path: {profile.heroImageUrl}</div>
            )}
            {profile.heroImageUrl && (
              <div style={{ marginTop: 8, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ height: 180, backgroundSize:'cover', backgroundPosition:'center', backgroundImage: `url(${toAbsolute(profile.heroImageUrl)})` }} />
              </div>
            )}

            <label>Hero Image URL (opsional)</label>
            <input value={profile.heroImageUrl} onChange={handleChange('heroImageUrl')} />

            <label>Tentang Kami (HTML)</label>
            <textarea value={profile.aboutHtml} onChange={handleChange('aboutHtml')} />

            <label>Visi</label>
            <input value={profile.vision} onChange={handleChange('vision')} />

            <label>Misi</label>
            <input value={profile.mission} onChange={handleChange('mission')} />

            <label>Alamat</label>
            <input value={profile.address} onChange={handleChange('address')} />

            <label>Telepon</label>
            <input value={profile.phone} onChange={handleChange('phone')} />

            <label>Email</label>
            <input value={profile.email} onChange={handleChange('email')} />

            <label>Nilai-nilai (pisahkan dengan koma)</label>
            <input value={valuesInput} onChange={(e) => setValuesInput(e.target.value)} />

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