import React, { useState } from 'react';
import { requestPasswordReset } from '../api/user';

export default function UserForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [appResetUrl, setAppResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setResetUrl('');
    setAppResetUrl('');
    setLoading(true);
    try {
      const data = await requestPasswordReset({ email });
      setMessage(data.message || 'Link reset dikirim.');
      if (data.reset_url) {
        setResetUrl(data.reset_url);
        const match = data.reset_url.match(/\/reset\/(\d+)\/([a-f0-9]+)/i);
        if (match) {
          const id = match[1];
          const hash = match[2];
          setAppResetUrl(`/reset-password?id=${id}&hash=${hash}`);
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Gagal mengirim link reset.';
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
        input[type="email"] { width: 100%; padding: 15px; margin: 10px 0 20px 0; border-radius: 15px; border: none; background: #fff7f7; font-size: 16px; box-sizing: border-box; }
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
          <form onSubmit={handleSubmit}>
            <label>Masukkan email untuk reset password</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
            <button type="submit" disabled={loading} className="btn">{loading ? 'LOADING...' : 'KIRIM LINK RESET'}</button>
          </form>
          {message && <div className="msg">{message}</div>}
          <div className="links">
            {resetUrl && (
              <div>
                <div>Server reset link: <a href={resetUrl} target="_blank" rel="noreferrer">{resetUrl}</a></div>
                {appResetUrl && (
                  <div>Aplikasi reset form: <a href={appResetUrl}>{appResetUrl}</a></div>
                )}
              </div>
            )}
            <div><a href="/login">Kembali ke Login</a></div>
          </div>
        </div>
      </div>
    </>
  );
}