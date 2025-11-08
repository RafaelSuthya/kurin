import React from "react";
import "../admin.css";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const handleAddProduct = () => {
    navigate("/addkatalogproduk");
  };
  
  return (
    <div className="admin-dashboard-wrapper" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="sidebar" style={{ width: '200px', backgroundColor: 'white', borderRight: '1px solid #eee', padding: '20px 0' }}>
        <div className="logo" style={{ padding: '0 20px', marginBottom: '30px' }}>
          {/* Gunakan asset dari public folder */}
          <img src="/kurin.png" alt="Kurin" style={{ width: '100px' }} />
        </div>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ padding: '10px 20px', backgroundColor: '#f8f8f8', marginBottom: '5px', color: '#e52b2b', fontWeight: 'bold' }}>
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
          {/* Hapus menu Refund karena sama dengan Pengembalian */}
          
        </ul>
        
        <div style={{ position: 'absolute', bottom: '20px', width: '180px', padding: '0 20px' }}>
          <div style={{ padding: '10px 0', borderTop: '1px solid #eee', marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }} onClick={() => navigate('/admin/profile')}>
              <span style={{ marginRight: '10px' }}>👤</span> My Profile
            </div>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => { try { localStorage.removeItem('adminToken'); } catch (e) {} navigate('/admin/login'); }}>
              <span style={{ marginRight: '10px' }}>🚪</span> Sign Out
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content" style={{ flex: 1, backgroundColor: 'white' }}>
        {/* Header */}
        <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <h1 style={{ fontSize: '28px', margin: 0, fontWeight: 'normal' }}>Dashboard</h1>
            <p style={{ margin: '5px 0 0', color: '#666' }}>Welcome, Admin!</p>
          </div>
          <button
            className="website-btn"
            onClick={() => navigate('/home')}
            style={{ 
              backgroundColor: '#e52b2b', 
              color: 'white', 
              padding: '10px 25px', 
              borderRadius: '5px', 
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Website
          </button>
        </div>
        
        {/* Dashboard Cards */}
        <div className="dashboard-cards" style={{ padding: '30px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          {/* Syarat & Ketentuan Card */}
          <div className="dashboard-card" style={{ 
            backgroundColor: '#e52b2b', 
            borderRadius: '10px', 
            padding: '30px', 
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 style={{ fontSize: '24px', margin: '0 0 15px', fontWeight: 'normal' }}>Syarat & Ketentuan</h2>
              <button style={{ 
                backgroundColor: 'white', 
                color: '#e52b2b', 
                border: 'none', 
                borderRadius: '50px', 
                padding: '10px 30px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '20px'
              }} onClick={() => navigate('/admin/terms/edit')}>
                Edit
              </button>
            </div>
            <div style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              backgroundColor: 'white', 
              borderRadius: '10px',
              padding: '15px',
              width: '70px',
              height: '70px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '40px' }}>📄</span>
            </div>
          </div>
          
          {/* Kategori Produk Card */}
          <div className="dashboard-card" style={{ 
            backgroundColor: '#e52b2b', 
            borderRadius: '10px', 
            padding: '30px', 
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 style={{ fontSize: '24px', margin: '0 0 15px', fontWeight: 'normal' }}>Katalog Produk</h2>
              <button 
                onClick={handleAddProduct}
                style={{ 
                backgroundColor: 'white', 
                color: '#e52b2b', 
                border: 'none', 
                borderRadius: '50px', 
                padding: '10px 30px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '20px'
              }}>
                Add
              </button>
            </div>
            <div style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              backgroundColor: 'white', 
              borderRadius: '10px',
              padding: '15px',
              width: '70px',
              height: '70px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '40px' }}>🏷️</span>
            </div>
          </div>
          
          {/* Kontak Bantuan Card */}
          <div className="dashboard-card" style={{ 
            backgroundColor: '#e52b2b', 
            borderRadius: '10px', 
            padding: '30px', 
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 style={{ fontSize: '24px', margin: '0 0 15px', fontWeight: 'normal' }}>Kontak Bantuan</h2>
              <button style={{ 
                backgroundColor: 'white', 
                color: '#e52b2b', 
                border: 'none', 
                borderRadius: '50px', 
                padding: '10px 30px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '20px'
              }} onClick={() => navigate('/admin/contact/edit')}>
                Edit
              </button>
            </div>
            <div style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              backgroundColor: 'white', 
              borderRadius: '10px',
              padding: '15px',
              width: '70px',
              height: '70px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '40px' }}>🎧</span>
            </div>
          </div>
          
          {/* Profil Perusahaan Card */}
          <div className="dashboard-card" style={{ 
            backgroundColor: '#e52b2b', 
            borderRadius: '10px', 
            padding: '30px', 
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 style={{ fontSize: '24px', margin: '0 0 15px', fontWeight: 'normal' }}>Profil Perusahaan</h2>
              <button style={{ 
                backgroundColor: 'white', 
                color: '#e52b2b', 
                border: 'none', 
                borderRadius: '50px', 
                padding: '10px 30px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '20px'
              }} onClick={() => navigate('/admin/company-profile/edit')}>
                Edit
              </button>
            </div>
            <div style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              backgroundColor: 'white', 
              borderRadius: '10px',
              padding: '15px',
              width: '70px',
              height: '70px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '40px' }}>🔍</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;