import React, { useState } from 'react';
import { registerUser, resendVerification } from '../api/user';

export default function UserRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password_confirmation, setPasswordConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  // removed unused navigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const data = await registerUser({ name, email, password, password_confirmation });
      setMessage(data.message);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Register gagal';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const data = await resendVerification({ email });
      setMessage(data.message);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Gagal kirim ulang verifikasi';
      setMessage(msg);
    }
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
           width: 500px;
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
         .btn:disabled {
           background: #ccc;
           cursor: not-allowed;
         }
         .login-link {
           margin-top: 20px;
           display: flex;
           justify-content: space-between;
           align-items: center;
         }
         .login-link a {
           color: #c33;
           text-decoration: none;
         }
         .message {
           margin-top: 15px;
           padding: 10px;
           border-radius: 5px;
           text-align: center;
           font-weight: bold;
         }
         .error {
           background: #f8d7da;
           color: #721c24;
           border: 1px solid #f5c6cb;
         }
         .success {
           background: #d4edda;
           color: #155724;
           border: 1px solid #c3e6cb;
         }
         .resend {
           margin-top: 10px;
           text-align: left;
         }
         .resend button {
           background: transparent;
           border: none;
           color: #c33;
           cursor: pointer;
         }
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
            <label>Username</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Username" />
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
            <label>Confirm Password</label>
            <input type="password" value={password_confirmation} onChange={e=>setPasswordConfirmation(e.target.value)} placeholder="Confirm Password" />
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'LOADING...' : 'REGISTER'}
            </button>
          </form>

          <div className="login-link">
            <span>Already have an account?</span>
            <a href="/login">Login here</a>
          </div>
          <div className="resend">
            <button onClick={handleResend}>Kirim ulang verifikasi</button>
          </div>
          {message && (
            <div className={`message ${/success|berhasil/i.test(message) ? 'success' : 'error'}`}>{message}</div>
          )}
        </div>
      </div>
    </>
  );
}