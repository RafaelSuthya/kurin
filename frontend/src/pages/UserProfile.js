import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

export default function UserProfile() {
  const navigate = useNavigate();
  const [name, setName] = useState('User');
  const [address, setAddress] = useState('');
  const [saved, setSaved] = useState('');

  // helper: baca & simpan riwayat alamat (localStorage)
  const getAddressHistory = () => {
    try {
      const raw = localStorage.getItem('userAddressHistory');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  };
  const saveAddressHistory = (addr) => {
    const val = String(addr || '').trim();
    if (!val) return;
    const current = getAddressHistory();
    const merged = [val, ...current.filter(x => String(x || '').trim() && String(x).trim() !== val)];
    const limited = merged.slice(0, 5);
    try { localStorage.setItem('userAddressHistory', JSON.stringify(limited)); } catch (e) {}
  };

  useEffect(() => {
    try {
      const storedName = localStorage.getItem('userName');
      const storedAddress = localStorage.getItem('userAddress');
      if (storedName) setName(storedName);
      if (storedAddress) setAddress(storedAddress);
    } catch (e) {}
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('userAddress', address);
      // simpan juga ke riwayat alamat untuk suggestion di checkout
      saveAddressHistory(address);
      setSaved('Alamat berhasil disimpan');
      setTimeout(() => setSaved(''), 1500);
    } catch (e) {
      setSaved('Gagal menyimpan alamat');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
    } catch (e) {}
    navigate('/login');
  };

  return (
    <div className="page-root">
      <style>{`
        body { background: #f4fcfd; font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: #fff; border-bottom: 1px solid #eee; }
        .logo { font-size: 28px; font-weight: bold; color: #b71c1c; }
        .nav { display: flex; gap: 24px; }
        .nav a { color: #c33; text-decoration: none; font-weight: 600; }
        .main-content { display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 160px); padding: 20px; }
        .profile-card { background: #d3d3d3; border-radius: 30px; width: 500px; padding: 40px 30px; box-shadow: 0 0 20px #eee; text-align: center; }
        .avatar { width: 120px; height: 120px; border-radius: 60px; background: #000; margin: 0 auto 12px; }
        .name { font-size: 24px; font-weight: 600; margin-bottom: 12px; }
        .section-title { font-size: 22px; font-weight: 600; margin-top: 8px; }
        label { color: #c33; font-size: 18px; margin-top: 10px; display: block; text-align: left; }
        input[type="text"] { width: 100%; padding: 15px; margin: 10px 0 20px 0; border-radius: 15px; border: none; background: #fff7f7; font-size: 16px; box-sizing: border-box; }
        .btn { background: #c33; color: #fff; border: none; border-radius: 20px; padding: 12px 40px; font-size: 20px; margin-top: 8px; cursor: pointer; width: 100%; }
        .msg { color: #333; margin-top: 8px; }
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

      <div className="main-content">
        <div className="profile-card">
          <div className="avatar" />
          <div className="name">{name || 'User'}</div>
          <div className="section-title">Alamat</div>

          <form onSubmit={(e)=>{ e.preventDefault(); handleSave(); }} style={{ textAlign:'left' }}>
            <label>Masukkan alamat</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Contoh: Jln. Kreo 1243" />
            <button type="submit" className="btn">Simpan Alamat</button>
          </form>
          {saved && <div className="msg">{saved}</div>}

          <button onClick={handleLogout} className="btn" style={{ marginTop: 20 }}>Logout</button>
        </div>
      </div>

      <Footer />
    </div>
  );
}