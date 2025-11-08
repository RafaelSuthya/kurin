import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../admin.css';

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <div className="sidebar" style={{ position: 'relative', width: '200px', backgroundColor: 'white', borderRight: '1px solid #eee', padding: '20px 0' }}>
      <div className="logo" style={{ padding: '0 20px', marginBottom: '30px' }}>
        <img src="/kurin.png" alt="Kurin" style={{ width: '100px' }} />
      </div>
      
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        <li 
          style={{ padding: '10px 20px', marginBottom: '5px', cursor: 'pointer' }}
          onClick={() => navigate('/admin/dashboard')}
        >
          <span style={{ marginRight: '10px' }}>📊</span> Dashboard
        </li>
        <li 
          style={{ padding: '10px 20px', marginBottom: '5px', cursor: 'pointer' }}
          onClick={() => navigate('/admin/pesanan')}
        >
          <span style={{ marginRight: '10px' }}>🛒</span> Pesanan
        </li>
        <li 
          style={{ padding: '10px 20px', marginBottom: '5px', cursor: 'pointer' }}
          onClick={() => navigate('/admin/refund')}
        >
          <span style={{ marginRight: '10px' }}>↩️</span> Pengembalian
        </li>
        <li 
          style={{ padding: '10px 20px', marginBottom: '5px', cursor: 'pointer' }}
          onClick={() => navigate('/admin/pembatalan')}
        >
          <span style={{ marginRight: '10px' }}>❌</span> Pembatalan
        </li>
        <li 
          style={{ padding: '10px 20px', marginBottom: '5px', cursor: 'pointer' }}
          onClick={() => navigate('/katalogproduk')}
        >
          <span style={{ marginRight: '10px' }}>📦</span> Katalog Produk
        </li>
        <li 
          style={{ padding: '10px 20px', marginBottom: '5px', cursor: 'pointer' }}
          onClick={() => navigate('/admin/stock')}
        >
          <span style={{ marginRight: '10px' }}>🧮</span> Kelola Stok
        </li>
        <li 
          style={{ padding: '10px 20px', marginBottom: '5px', cursor: 'pointer' }}
          onClick={() => navigate('/admin/kategori')}
        >
          <span style={{ marginRight: '10px' }}>🏷️</span> Kategori
        </li>
        <li 
          style={{ padding: '10px 20px', marginBottom: '5px', cursor: 'pointer' }}
          onClick={() => navigate('/admin/diskon')}
        >
          <span style={{ marginRight: '10px' }}>💰</span> Diskon
        </li>
      </ul>
      
      <div style={{ position: 'absolute', bottom: '20px', width: '180px', padding: '0 20px' }}>
        <div style={{ padding: '10px 0', borderTop: '1px solid #eee', marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
            <span style={{ marginRight: '10px' }}>👤</span> My Profile
          </div>
          <div 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => {
              localStorage.removeItem('adminToken');
              navigate('/admin/login');
            }}
          >
            <span style={{ marginRight: '10px' }}>🚪</span> Sign Out
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;