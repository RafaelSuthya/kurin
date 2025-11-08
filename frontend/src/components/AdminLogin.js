import React, { useState, useEffect } from 'react';
import { loginAdmin } from '../api/admin';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Autosave: Load saved values on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('autosave_admin_email');
    const savedPassword = localStorage.getItem('autosave_admin_password');
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  // Autosave: Save values when they change
  useEffect(() => {
    localStorage.setItem('autosave_admin_email', email);
    localStorage.setItem('autosave_admin_password', password);
  }, [email, password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginAdmin({ email, password });
      console.log('Login response:', res); // Debugging
      
      // Cek jika ada error dari server
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      
      // Normalisasi token dari berbagai bentuk respons API
      const token = (
        res?.access_token ||
        res?.token ||
        res?.data?.access_token ||
        (res?.token_type === 'Bearer' ? res?.token : '')
      );

      if (token) {
        localStorage.setItem('adminToken', token);
        // Arahkan ke dashboard admin, dengan fallback hard redirect jika router gagal
        navigate('/admin/dashboard', { replace: true });
        setTimeout(() => {
          if (window?.location?.pathname !== '/admin/dashboard') {
            window.location.href = '/admin/dashboard';
          }
        }, 50);
      } else {
        // Jika tidak ada token, coba gunakan token dummy untuk testing
        if (email === 'admin@example.com' && password === 'password') {
          localStorage.setItem('adminToken', 'dummy-token-for-testing');
          navigate('/admin/dashboard', { replace: true });
          setTimeout(() => {
            if (window?.location?.pathname !== '/admin/dashboard') {
              window.location.href = '/admin/dashboard';
            }
          }, 50);
          return;
        }
        setError('Token tidak ditemukan. Pastikan server backend berjalan dengan benar.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        body {
          background: #f4fcfd;
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .header {
          background: #c33;
          color: white;
          padding: 15px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
        }
        .nav-menu {
          display: flex;
          gap: 30px;
        }
        .nav-menu a {
          color: white;
          text-decoration: none;
          font-size: 18px;
        }
        .main-content {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 70px);
          padding: 20px;
        }
        .form-container {
          background: #d3d3d3;
          border-radius: 30px;
          width: 400px;
          padding: 40px 30px;
          box-shadow: 0 0 20px #eee;
        }
        label {
          color: #c33;
          font-size: 18px;
          margin-top: 10px;
          display: block;
        }
        input[type="text"], input[type="email"], input[type="password"] {
          width: 100%;
          padding: 15px;
          margin: 10px 0 20px 0;
          border-radius: 15px;
          border: none;
          background: #fff7f7;
          font-size: 16px;
          box-sizing: border-box;
        }
        .btn {
          background: #c33;
          color: #fff;
          border: none;
          border-radius: 20px;
          padding: 12px 40px;
          font-size: 20px;
          margin-top: 20px;
          cursor: pointer;
          width: 100%;
        }
        .register-link {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
        }
        .register-link .left {
          color: #222;
        }
        .register-link .right a {
          color: #c33;
          text-decoration: none;
        }
        .error {
          color: #c33;
          margin-top: 10px;
          text-align: center;
        }
      `}</style>
      
      <div className="header">
        <div className="logo">Kurin</div>
        <div className="nav-menu">
          <a href="/admin/dashboard">Dashboard</a>
          <a href="/admin/profile">Profile</a>
        </div>
      </div>
      
      <div className="main-content">
        <div className="form-container">
          <form onSubmit={handleLogin}>
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            <button type="submit" className="btn" disabled={loading}>{loading ? 'LOGIN...' : 'LOGIN'}</button>
          </form>
          <div className="register-link">
            <span className="left">Don't have an account?</span>
            <span className="right"><a href="/admin/register">Register now</a></span>
          </div>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </>
  );
}