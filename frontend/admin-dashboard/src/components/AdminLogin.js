import React, { useState } from 'react';
import { loginAdmin } from '../../src/admin';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await loginAdmin({ email, password });
    setLoading(false);
    if (res.error || !res.token) {
      setError(res.error || 'Login gagal');
    } else {
      localStorage.setItem('adminToken', res.token);
      window.location.href = '/dashboard';
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #ccc' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: 10, background: '#c33', color: '#fff', border: 'none', borderRadius: 4 }} disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;