import React, { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import { API_URL } from '../api/admin';

const defaults = {
  image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop',
  hero_title: 'KONTAK KURIN',
  hero_subtitle: '',
  phone: '+62 858-8886-2104',
  email: 'kurinhousehold@gmail.com',
  address: 'Jalan Kedoya Raya (Kedoya Pesing No.12-16 2, RT.2/RW.7, Kedoya Utara, Kec. Kb. Jeruk, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11520)',
  social: 'Instagram / Facebook',
  map_query: 'Jalan Kedoya Raya (Kedoya Pesing No.12-16 2, RT.2/RW.7, Kedoya Utara, Kec. Kb. Jeruk, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11520)',
  map_zoom: 16,
};

const API_BASE = API_URL.replace(/\/api$/, '');
const toAbsolute = (url) => {
  if (!url) return url;
  return url.startsWith('/') ? `${API_BASE}${url}` : url;
};

export default function ContactPage() {
  const [contact, setContact] = useState(defaults);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/settings/contact`);
        const json = await res.json();
        if (json?.contact) {
          const data = { ...json.contact };
          data.image = toAbsolute(data.image || defaults.image);
          setContact(prev => ({ ...prev, ...data }));
        }
      } catch (e) {
        // gunakan defaults
      }
    };
    load();
  }, []);

  return (
    <div className="page-root" style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        .topbar { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; border-bottom:1px solid #eee; }
        .nav a { color:#c33; text-decoration:none; font-weight:600; margin-right:16px; }
        .hero { height: 340px; display:flex; align-items:center; justify-content:center; color:#fff; background-size:cover; background-position:center; position: relative; }
        .hero-title { font-size: 32px; letter-spacing: 2px; }
        .hero-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.35); }
        .hero-content { position: relative; text-align: center; }
        .hero-subtitle { margin-top: 8px; font-size: 14px; opacity: 0.95; }
        .section { padding: 30px 24px; }
        .grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; }
        .card { border:1px solid #eee; border-radius:12px; padding:18px; text-align:center; }
        .icon { font-size:36px; margin-bottom:12px; }
        .label { color:#999; font-weight:700; font-size:12px; }
        .value { color:#333; font-weight:600; margin-top:6px; }
        .map { overflow: hidden; border: 1px solid #eee; border-radius: 12px; }
        @media (max-width: 900px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } .hero { height: 240px; } .hero-title { font-size: 24px; } }
      `}</style>

      {/* Header */}
      <div className="topbar">
        <img src="/kurin.png" alt="Kurin" style={{ height: 54 }} />
        <div className="nav">
          <a href="/home">Home</a>
          <a href="/company-profile">About Us</a>
          <a href="/terms">Syarat & Ketentuan</a>
          <a href="/contact">Contact</a>
          <a href="/profile">Profile</a>
        </div>
      </div>

      {/* Hero */}
      <section className="hero" style={{ backgroundImage: `url(${contact.image})` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">{contact.hero_title}</h1>
          {contact.hero_subtitle && (
            <p className="hero-subtitle">{contact.hero_subtitle}</p>
          )}
        </div>
      </section>

      {/* Info icons */}
      <section className="section">
        <div className="grid">
          <div className="card">
            <div className="icon">📞</div>
            <div className="label">NOMOR TELEPON</div>
            <div className="value">{contact.phone}</div>
          </div>
          <div className="card">
            <div className="icon">✉️</div>
            <div className="label">EMAIL</div>
            <div className="value">{contact.email}</div>
          </div>
          <div className="card">
            <div className="icon">📍</div>
            <div className="label">ALAMAT</div>
            <div className="value" style={{ lineHeight: 1.4 }}>{contact.address}</div>
          </div>
          <div className="card">
            <div className="icon">🔗</div>
            <div className="label">SOSIAL MEDIA</div>
            <div className="value">{contact.social}</div>
          </div>
        </div>
      </section>

      {/* Google Map */}
      <section className="section">
        <div className="map">
          <div style={{ height: 380, width: '100%' }}>
            <iframe
              title="Lokasi Kurin"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(contact.map_query)}&t=&z=${contact.map_zoom}&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}