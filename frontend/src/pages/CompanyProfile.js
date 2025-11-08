import React, { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import ProductImageSlider from '../components/ProductImageSlider';
import { API_URL } from '../api/admin';

// helper untuk URL absolut (menghapus /api di ujung API_URL)
const API_BASE = (API_URL || '').replace(/\/api$/, '');
const toAbsolute = (url) => {
  if (!url) return '';
  if (/^(https?:|data:)/.test(url)) return url;
  // Untuk aset frontend seperti banners.png, tetap gunakan path root dev server
  if (url === '/banners.png' || url.endsWith('/banners.png')) return url;
  if (url.startsWith('/')) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
};

const defaultProfile = {
  heroTitle: 'Tentang Kami',
  heroSubtitle: 'Mewujudkan kebersihan dan kenyamanan di setiap rumah',
  heroImageUrl: '/banners.png',
  aboutHtml: 'Kurin adalah brand yang berfokus pada produk kebersihan rumah tangga dengan kualitas terbaik dan desain yang modern. Kami percaya kebersihan adalah fondasi kenyamanan.',
  vision: 'Menjadi brand pilihan utama untuk solusi kebersihan rumah.',
  mission: 'Memberikan produk inovatif, aman, dan efektif yang memudahkan aktivitas bersih-bersih.',
  address: 'Jl. Contoh Alamat No. 123, Jakarta',
  phone: '+62 812-0000-0000',
  email: 'halo@kurin.co.id',
  values: ['Kualitas', 'Inovasi', 'Kepercayaan', 'Keberlanjutan']
};

export default function CompanyProfile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/company-profile`, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        if (data && data.company_profile) {
          setProfile({ ...defaultProfile, ...data.company_profile });
        }
      } catch (e) {
        // gunakan defaultProfile jika gagal
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // resolve hero image jadi absolut agar tidak "template" dan konsisten
  const heroImage = toAbsolute(profile.heroImageUrl);

  return (
    <div className="company-profile page-root" style={{ fontFamily: 'Arial, sans-serif', background: 'linear-gradient(180deg, #ffffff 0%, #fff7f7 100%)' }}>
      <style>{`
        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: rgba(255,255,255,0.85); border-bottom: 1px solid #eee; backdrop-filter: saturate(160%) blur(6px); position: sticky; top: 0; z-index: 10; }
        .nav { display: flex; gap: 24px; }
        .nav a { color: #c33; text-decoration: none; font-weight: 600; }
        .hero { position: relative; color: #fff; overflow: hidden; }
        .hero-img { width: 100%; height: auto; display: block; }
        .btn-cta { display: inline-block; background: #fff; color: #c33; border: 1px solid #ffd1d1; border-radius: 999px; padding: 10px 20px; font-weight: 700; box-shadow: 0 6px 14px rgba(0,0,0,0.12); transition: transform .15s ease, box-shadow .2s ease; }
        .btn-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,0.16); }

        .blob { position: absolute; width: 220px; height: 220px; border-radius: 50%; z-index: 1; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(199,51,51,0.12)); animation: float 10s ease-in-out infinite; }
        .blob-1 { top: 40px; left: 12%; }
        .blob-2 { bottom: 30px; right: 15%; animation-delay: 2.5s; }

        .section { max-width: 1000px; margin: 28px auto; padding: 0 24px; }
        .card { background: rgba(255,255,255,0.9); border: 1px solid #f1e6e6; border-radius: 16px; padding: 24px; box-shadow: 0 8px 20px rgba(0,0,0,0.06); backdrop-filter: saturate(150%) blur(6px); transition: transform .18s ease, box-shadow .18s ease; animation: fadeUp 500ms ease both; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 16px 32px rgba(0,0,0,0.08); }
        .section-title { color: #c33; font-size: 22px; margin: 0 0 12px; display: flex; align-items: center; gap: 8px; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .pill { display: inline-flex; align-items: center; gap: 8px; background: #fff1f1; color: #c33; border: 1px solid #ffd1d1; padding: 10px 14px; border-radius: 999px; margin: 6px 6px 0 0; font-weight: 600; }
        .pill::before { content: '💎'; }
        .contact { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }

        @media (max-width: 768px) { 
          .two-col, .contact { grid-template-columns: 1fr; } 
          .hero { height: 300px; } 
          .hero-title { font-size: 34px; }
        }
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

      {/* Hero: hanya gambar banner tanpa crop */}
      <section className="hero" aria-label="Company banner">
        <img className="hero-img" src={heroImage} alt="Company banner" />
      </section>

      {/* Tentang Kami */}
      <section className="section">
        <div className="card">
          <div className="section-title">🏢 Tentang Kami</div>
          <div dangerouslySetInnerHTML={{ __html: profile.aboutHtml }} />
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="section two-col">
        <div className="card">
          <div className="section-title">🌟 Visi</div>
          <div>{profile.vision}</div>
        </div>
        <div className="card">
          <div className="section-title">🎯 Misi</div>
          <div>{profile.mission}</div>
        </div>
      </section>

      {/* Nilai-nilai */}
      {Array.isArray(profile.values) && profile.values.length > 0 && (
        <section className="section">
          <div className="card">
            <div className="section-title">💠 Nilai-nilai</div>
            <div>
              {profile.values.map((v, i) => (
                <span key={i} className="pill">{v}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Katalog Produk */}
      <section className="section">
        <div className="card">
          <div className="section-title">🧺 Katalog Produk</div>
          <ProductImageSlider />
        </div>
      </section>

      {/* Kontak */}
      <section className="section">
        <div className="card contact">
          <div>
            <div className="section-title">📍 Alamat</div>
            <div>{profile.address}</div>
          </div>
          <div>
            <div className="section-title">✉️ Kontak</div>
            <div>Telp: {profile.phone}</div>
            <div>Email: {profile.email}</div>
          </div>
        </div>
      </section>

      <Footer />

      {loading && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, background: '#c33', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>Memuat profil perusahaan...</div>
      )}
    </div>
  );
}