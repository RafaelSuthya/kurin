import React from 'react';
import { Link } from 'react-router-dom';
import '../admin.css';

const Header = () => {
  return (
    <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', borderBottom: '1px solid #f0f0f0' }}>
      <div>
        <h1 style={{ fontSize: '28px', margin: 0, fontWeight: 'normal' }}>Dashboard</h1>
        <p style={{ margin: '5px 0 0', color: '#666' }}>Welcome, Admin!</p>
      </div>
      <Link to="/home" className="website-btn" style={{ 
        backgroundColor: '#e52b2b', 
        color: 'white', 
        padding: '10px 25px', 
        borderRadius: '5px', 
        textDecoration: 'none',
        fontWeight: 'bold'
      }}>
        Website
      </Link>
    </div>
  );
};

export default Header;