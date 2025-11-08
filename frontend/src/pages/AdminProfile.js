import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../admin.css';
import { getSettings } from '../api/admin';

export default function AdminProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('Admin');
  const [email, setEmail] = useState('admin@example.com');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getSettings();
        const profile = data?.settings?.profile || {};
        if (mounted) {
          setName(profile?.name || 'Admin');
          setEmail(profile?.email || 'admin@example.com');
        }
      } catch (e) {
        if (mounted) setError('Gagal memuat profil admin');
      }
      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleLogout = () => {
    try { localStorage.removeItem('adminToken'); } catch (e) {}
    navigate('/admin/login');
  };

  return (
    <div className="admin-profile-page" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <div className="main-content" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: 30 }}>
          {loading ? (
            <div style={{ color:'#333' }}>Memuat profil...</div>
          ) : error ? (
            <div style={{ color:'#c33' }}>{error}</div>
          ) : (
            <div style={{ width: 720, maxWidth: '90vw', background:'#fff', borderRadius: 16, padding: 30, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', border:'1px solid #eee' }}>
              <div style={{ width: 140, height: 140, borderRadius: 70, background: '#000', margin: '0 auto 16px' }} />
              <div style={{ textAlign: 'center', fontSize: 24, fontWeight: 700 }}>{name || 'Admin'}</div>
              <div style={{ textAlign: 'center', color: '#666', fontSize: 16 }}>{email || 'admin@example.com'}</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                <button onClick={handleLogout} style={{ background:'#e52b2b', color:'#fff', border:'none', borderRadius: 10, padding: '12px 24px', cursor:'pointer', fontWeight:700, fontSize:16 }}>Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}