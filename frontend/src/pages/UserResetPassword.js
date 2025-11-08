import React, { useState, useMemo } from 'react';
import { resetPassword } from '../api/user';

export default function UserResetPassword() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || '';
  const hash = params.get('hash') || '';

  const [password, setPassword] = useState('');
  const [password_confirmation, setPasswordConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validLink = useMemo(() => !!id && !!hash, [id, hash]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!validLink) {
      setMessage('Invalid reset link.');
      return;
    }
    setLoading(true);
    try {
      const data = await resetPassword({ id, hash, password, password_confirmation });
      setMessage(data.message || 'Password berhasil diubah.');
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Gagal reset password';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        body { background: #f4fcfd; font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .header { background: #c33; color: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 24px; font-weight: bold; }
        .nav-menu { display: flex; gap: 30px; }
        .nav-menu a { color: white; text-decoration: none; font-size: 18px; }
        .main-content { display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 70px); padding: 20px; }
        .form-container { background: #d3d3d3; border-radius: 30px; width: 400px; padding: 40px 30px; box-shadow: 0 0 20px #eee; }
        label { color: #c33; font-size: 18px; margin-top: 10px; display: block; }
        input[type="password"] { width: 100%; padding: 15px; margin: 10px 0 20px 0; border-radius: 15px; border: none; background: #fff7f7; font-size: 16px; box-sizing: border-box; }
        .btn { background: #c33; color: #fff; border: none; border-radius: 20px; padding: 12px 40px; font-size: 20px; margin-top: 20px; cursor: pointer; width: 100%; }
        .msg { margin-top: 12px; text-align: center; font-weight: bold; color: #c33; }
        .links { margin-top: 12px; text-align: center; }
        .links a { color: #c33; }
      `}</style>

      <div className="header">
        <div className="logo">Kūrin</div>
        <div className="nav-menu">
          <a href="/home">Home</a>
          <a href="/company-profile">About Us</a>
          <a href="/terms">Syarat & Ketentuan</a>
          <a href="/contact">Contact</a>
          <a href="/login">Login</a>
        </div>
      </div>

      <div className="main-content">
        <div className="form-container">
          {!validLink && (
            <div className="msg">Link reset tidak valid. Pastikan membuka dari tautan yang diberikan.</div>
          )}
          <form onSubmit={handleSubmit}>
            <label>Password baru</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password baru" />
            <label>Konfirmasi password</label>
            <input type="password" value={password_confirmation} onChange={e=>setPasswordConfirmation(e.target.value)} placeholder="Konfirmasi password" />
            <button type="submit" disabled={loading || !validLink} className="btn">{loading ? 'LOADING...' : 'RESET PASSWORD'}</button>
          </form>
          {message && <div className="msg">{message}</div>}
          <div className="links">
            <div><a href="/login">Kembali ke Login</a></div>
          </div>
        </div>
      </div>
    </>
  );
}