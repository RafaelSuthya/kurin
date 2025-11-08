import React, { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import { API_URL } from '../api/admin';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/settings/terms`, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        const content = data?.terms_html || '';
        setHtml(content);
      } catch (e) {
        setHtml('');
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  return (
    <div className="page-root" style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        .topbar { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; border-bottom:1px solid #eee; }
        .nav a, .nav .link { color:#c33; text-decoration:none; font-weight:600; margin-right:16px; }
        .hero { padding: 40px 24px; background:#f7f7f7; border-bottom:1px solid #eee; }
        .hero-title { font-size: 28px; letter-spacing: 1px; color:#333; }
        .hero-subtitle { margin-top: 8px; font-size: 14px; color:#666; }
        .section { padding: 24px; }
        .card { border: 1px solid #eee; border-radius: 12px; padding: 18px; margin-bottom: 16px; background:#fff; }
      `}</style>

      {/* Header */}
      <div className="topbar">
        <img src="/kurin.png" alt="Kurin" style={{ height: 54 }} />
        <div className="nav">
          <Link to="/home" className="link">Home</Link>
          <Link to="/company-profile" className="link">About Us</Link>
          <Link to="/terms" className="link">Syarat & Ketentuan</Link>
          <Link to="/contact" className="link">Contact</Link>
          <Link to="/profile" className="link">Profile</Link>
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">Syarat & Ketentuan Kurin</h1>
        <div className="hero-subtitle">Kebijakan penggunaan layanan dan transaksi di toko online Kurin.</div>
      </section>

      {/* Content */}
      <div className="section">
        <div className="card">
          {loading ? (
            <div>Memuat konten...</div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: html || '<p><em>Konten belum tersedia.</em></p>' }} />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}