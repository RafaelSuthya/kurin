import React, { useState } from 'react';
import { loginUser } from '../api/user';
import { useNavigate } from 'react-router-dom';

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Removed auto-redirect to allow switching accounts
  // useEffect(() => {}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      try {
        // clear previous identity to avoid mixing accounts
        localStorage.removeItem('userToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        // store new identity
        localStorage.setItem('userToken', data.token);
        if (data?.user?.name) localStorage.setItem('userName', data.user.name);
        if (data?.user?.email) localStorage.setItem('userEmail', data.user.email);
        if (data?.user?.id) localStorage.setItem('userId', String(data.user.id));
      } catch (e) {}
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Login gagal';
      setError(msg);
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
        input[type="text"], input[type="email"], input[type="password"] { width: 100%; padding: 15px; margin: 10px 0 20px 0; border-radius: 15px; border: none; background: #fff7f7; font-size: 16px; box-sizing: border-box; }
        .btn { background: #c33; color: #fff; border: none; border-radius: 20px; padding: 12px 40px; font-size: 20px; margin-top: 20px; cursor: pointer; width: 100%; }
        .register-link { margin-top: 20px; display: flex; justify-content: space-between; }
        .register-link .left { color: #222; }
        .register-link .right a { color: #c33; text-decoration: none; }
        .error { color: #c33; margin-top: 10px; text-align: center; }
      `}</style>

      <div className="header">
        <div className="logo">Kūrin</div>
        <div className="nav-menu">
          <a href="/home">Home</a>
          <a href="/company-profile">About Us</a>
          <a href="/terms">Syarat & Ketentuan</a>
          <a href="/contact">Contact</a>
          <a href="/profile">Profile</a>
        </div>
      </div>

      <div className="main-content">
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
            <button type="submit" disabled={loading} className="btn">{loading ? 'LOADING...' : 'LOGIN'}</button>
          </form>

          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <a href="/forgot-password" style={{ color: '#c33', textDecoration: 'none' }}>Forgot Password?</a>
          </div>

          <div className="register-link">
            <span className="left">Don't have an account?</span>
            <span className="right"><a href="/register">Register now</a></span>
          </div>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </>
  );
}