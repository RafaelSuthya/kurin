import React, { useState } from 'react'; 
import { registerAdmin, resendAdminVerification } from '../api/admin'; 

export default function AdminRegister() { 
  const [username, setUsername] = useState(''); 
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [password_confirmation, setPasswordConfirmation] = useState(''); 
  const [unique_code, setUniqueCode] = useState('');
  const [message, setMessage] = useState(''); 
  const [msgType, setMsgType] = useState(''); // 'success' | 'error'
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [loading, setLoading] = useState(false); 

  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    setMessage(''); 
    setMsgType('');
    
    // Validasi password 
    if (password !== password_confirmation) { 
      setMsgType('error');
      setMessage('Password dan konfirmasi password tidak cocok'); 
      setLoading(false); 
      return; 
    } 

    if (password.length < 6) { 
      setMsgType('error');
      setMessage('Password harus minimal 6 karakter'); 
      setLoading(false); 
      return; 
    } 

    // Validasi kode unik admin (jangan bocorkan nilai kode)
    if (!unique_code || !unique_code.trim()) {
      setMsgType('error');
      setMessage('Kode unik wajib diisi.');
      setLoading(false);
      return;
    }

    const res = await registerAdmin({ 
      username, 
      email, 
      password, 
      password_confirmation,
      unique_code
    }); 
    
    if (res.error) { 
      setMsgType('error');
      setMessage(res.error); 
      // Jika email sudah dipakai, munculkan tombol kirim ulang verifikasi
      if (typeof res.error === 'string' && res.error.toLowerCase().includes('already been taken')) {
        setRegisteredEmail(email);
      }
    } else { 
      setMsgType('success');
      setMessage('Registrasi berhasil! Silakan cek email Anda untuk verifikasi.'); 
      setRegisteredEmail(email);
      // Jangan redirect; tunggu verifikasi via email
      setUsername(''); 
      setPassword(''); 
      setPasswordConfirmation(''); 
      setUniqueCode('');
    } 
    
    setLoading(false); 
  }; 

  const handleResend = async () => {
    const targetEmail = registeredEmail || email;
    if (!targetEmail) {
      setMsgType('error');
      setMessage('Masukkan email terlebih dahulu untuk kirim ulang.');
      return;
    }
    setLoading(true);
    const r = await resendAdminVerification(targetEmail);
    if (r.error) {
      setMsgType('error');
      setMessage(r.error);
    } else {
      setMsgType('success');
      setMessage('Email verifikasi telah dikirim ulang. Periksa inbox/spam Gmail Anda.');
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
         .btn:disabled { 
           background: #ccc; 
           cursor: not-allowed; 
         } 
         .login-link { 
           margin-top: 20px; 
           text-align: right; 
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
         .loading { 
           text-align: center; 
           color: #c33; 
         } 
       `}</style> 
       
       <div className="header"> 
         <div className="logo">Karin</div> 
         <div className="nav-menu">
          <a href="/admin/dashboard">Dashboard</a>
          <a href="/admin/profile">Profile</a>
        </div>
      </div>
       
      <div className="main-content">
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength="6"
            />
            
            <label>Konfirmasi Password</label>
            <input
              type="password"
              value={password_confirmation}
              onChange={e => setPasswordConfirmation(e.target.value)}
              required
              minLength="6"
            />

            <label>Kode Unik Admin</label>
            <input
              type="text"
              value={unique_code}
              onChange={e => setUniqueCode(e.target.value)}
              required
              placeholder="Masukkan kode unik"
            />
            
            <button
              type="submit"
              className="btn"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'REGISTER'}
            </button>
          </form>
          
          <div className="login-link">
            Already have an account? <a href="/admin/login">Login here</a>
          </div>
          
          {message && (
            <div className={`message ${msgType === 'success' ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {(registeredEmail || (msgType === 'error' && email)) && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <button className="btn" onClick={handleResend} disabled={loading}>
                {loading ? 'Loading...' : 'Kirim ulang verifikasi'}
              </button>
              <div style={{ marginTop: '10px' }}>
                <a href="https://mail.google.com" target="_blank" rel="noreferrer">Buka Gmail</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}