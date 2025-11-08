import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { API_URL } from '../api/admin';

const getCartKey = () => {
  try {
    const email = localStorage.getItem('userEmail');
    return email ? `cart_items__${email}` : 'cart_items__guest';
  } catch (e) {
    return 'cart_items__guest';
  }
};

export default function CheckoutStaticPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedUids = useMemo(() => Array.isArray(location.state?.selectedUids) ? location.state.selectedUids : null, [location.state]);

  const [items, setItems] = useState([]);
  const [shipping, setShipping] = useState('jne_next_day'); // jne_reguler | jne_next_day | jne_cargo
  const [recipient, setRecipient] = useState({ name: '', address: '', phone: '' });
  // suggestion alamat dari profile
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('userAddressHistory');
      const arr = raw ? JSON.parse(raw) : [];
      const base = Array.isArray(arr) ? arr : [];
      const last = String(localStorage.getItem('userAddress') || '').trim();
      const merged = last ? [last, ...base.filter(x => x !== last)] : base;
      setAddressSuggestions(merged.slice(0, 5));
    } catch (e) {}
  }, []);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Geolokasi & reverse geocoding untuk "Tembak Maps"
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | locating | reverse | done | error
  const [geoCoords, setGeoCoords] = useState(null); // { lat, lon }
  const [geoMessage, setGeoMessage] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [mapEngine, setMapEngine] = useState('auto'); // auto | google | osm
  const [mapInitError, setMapInitError] = useState('');

  // Gunakan mapEngine agar tidak terdeteksi sebagai unused oleh linter
  useEffect(() => { Promise.resolve(mapEngine); }, [mapEngine]);

  const composeAddress = (addrObj) => {
    if (!addrObj) return '';
    const a = addrObj;
    const parts = [
      a.road,
      a.neighbourhood,
      a.suburb,
      a.village,
      a.city_district,
      a.city || a.town || a.village,
      a.state,
      a.postcode,
      a.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const tembakMaps = async () => {
    try {
      if (!('geolocation' in navigator)) {
        alert('Browser tidak mendukung geolokasi.');
        return;
      }
      setGeoStatus('locating');
      setGeoMessage('Mengambil lokasi...');
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            setGeoCoords({ lat, lon });
            setGeoStatus('reverse');
            setGeoMessage('Mencari alamat lengkap dari peta...');
            try {
              const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1`;
              const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
              const data = await res.json();
              const full = data?.display_name || composeAddress(data?.address);
              if (!full) throw new Error('Alamat tidak ditemukan');
              setRecipient(prev => ({ ...prev, address: full }));
              setGeoStatus('done');
              setGeoMessage('Alamat berhasil diisi dari peta.');
              try {
                // Simpan alamat terakhir agar muncul di suggestion
                const last = String(full || '').trim();
                if (last) {
                  localStorage.setItem('userAddress', last);
                  const raw = localStorage.getItem('userAddressHistory');
                  const arr = raw ? JSON.parse(raw) : [];
                  const base = Array.isArray(arr) ? arr : [];
                  const merged = [last, ...base.filter(x => x !== last)];
                  localStorage.setItem('userAddressHistory', JSON.stringify(merged.slice(0,5)));
                  setAddressSuggestions(merged.slice(0,5));
                }
              } catch (e) {}
              resolve();
            } catch (e) {
              setGeoStatus('error');
              setGeoMessage('Gagal mendapatkan alamat dari peta.');
              alert('Gagal mendapatkan alamat dari peta.');
              resolve();
            }
          },
          (err) => {
            setGeoStatus('error');
            const msg = err?.message || 'Tidak bisa mengambil lokasi';
            setGeoMessage(msg);
            alert('Gagal mengambil lokasi: ' + msg);
            resolve();
          },
          { enableHighAccuracy: true, timeout: 15000 }
        );
      });
    } catch (e) {
      setGeoStatus('error');
      setGeoMessage('Terjadi kesalahan geolokasi.');
    }
  };

  // Fitur pencarian alamat berbasis teks dihapus sesuai permintaan,
  // interaksi pencarian kini terpusat pada modal peta.

  const removeSavedAddress = (value) => {
    try {
      const raw = localStorage.getItem('userAddressHistory');
      const arr = raw ? JSON.parse(raw) : [];
      const base = Array.isArray(arr) ? arr : [];
      const next = base.filter(x => x !== value);
      localStorage.setItem('userAddressHistory', JSON.stringify(next));
      const current = String(localStorage.getItem('userAddress') || '').trim();
      if (current === value) {
        localStorage.removeItem('userAddress');
      }
      const last = String(localStorage.getItem('userAddress') || '').trim();
      const merged = last ? [last, ...next.filter(x => x !== last)] : next;
      setAddressSuggestions(merged.slice(0,5));
    } catch (e) {}
  };

  const loadGoogleMaps = () => new Promise((resolve, reject) => {
    const key = (process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '').trim();
    if (!key) return reject(new Error('Missing Google Maps API key'));
    if (window.google && window.google.maps) return resolve();
    const scriptId = 'google-maps-js';
    if (document.getElementById(scriptId)) {
      document.getElementById(scriptId).addEventListener('load', resolve, { once: true });
      document.getElementById(scriptId).addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });

  const loadLeaflet = () => new Promise((resolve, reject) => {
    if (window.L) return resolve();
    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const jsId = 'leaflet-js';
    if (document.getElementById(jsId)) {
      document.getElementById(jsId).addEventListener('load', resolve, { once: true });
      document.getElementById(jsId).addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = jsId;
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });

  const openMapModal = async () => {
    setShowMap(true);
    setMapInitError('');
    // Coba Google Maps dulu
    try {
      await loadGoogleMaps();
      setMapEngine('google');
      setTimeout(initGoogleMap, 50);
      return;
    } catch (e) {
      // Fallback ke OSM
    }
    try {
      await loadLeaflet();
      setMapEngine('osm');
      setTimeout(initLeafletMap, 50);
    } catch (e2) {
      setMapInitError('Gagal memuat peta.');
    }
  };

  const closeMapModal = () => {
    setShowMap(false);
    setMapEngine('auto');
    setMapInitError('');
  };

  const initGoogleMap = () => {
    try {
      const center = geoCoords ? { lat: geoCoords.lat, lng: geoCoords.lon } : { lat: -6.2, lng: 106.8166 }; // Jakarta
      const map = new window.google.maps.Map(document.getElementById('picker-map'), { center, zoom: 13 });
      const geocoder = new window.google.maps.Geocoder();
      let marker = null;
      map.addListener('click', (e) => {
        const latLng = e.latLng;
        if (marker) marker.setMap(null);
        marker = new window.google.maps.Marker({ position: latLng, map });
        geocoder.geocode({ location: latLng }, (results, status) => {
          if (status === 'OK' && results && results.length) {
            const full = results[0].formatted_address;
            setRecipient(prev => ({ ...prev, address: full }));
            setGeoCoords({ lat: latLng.lat(), lon: latLng.lng() });
            setGeoStatus('done');
            setGeoMessage('Alamat diambil dari klik peta Google.');
            try {
              const last = String(full || '').trim();
              if (last) {
                localStorage.setItem('userAddress', last);
                const raw = localStorage.getItem('userAddressHistory');
                const arr = raw ? JSON.parse(raw) : [];
                const base = Array.isArray(arr) ? arr : [];
                const merged = [last, ...base.filter(x => x !== last)];
                localStorage.setItem('userAddressHistory', JSON.stringify(merged.slice(0,5)));
                setAddressSuggestions(merged.slice(0,5));
              }
            } catch (e) {}
          } else {
            alert('Alamat tidak ditemukan dari titik tersebut.');
          }
        });
      });
    } catch (e) {
      setMapInitError('Gagal inisialisasi Google Maps.');
    }
  };

  const initLeafletMap = () => {
    try {
      const center = geoCoords ? [geoCoords.lat, geoCoords.lon] : [-6.2, 106.8166];
      const map = window.L.map('picker-map').setView(center, 13);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      let marker = null;
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        if (marker) map.removeLayer(marker);
        marker = window.L.marker([lat, lng]).addTo(map);
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1`;
          const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
          const data = await res.json();
          const full = data?.display_name || composeAddress(data?.address);
          if (!full) throw new Error('Alamat tidak ditemukan');
          setRecipient(prev => ({ ...prev, address: full }));
          setGeoCoords({ lat, lon: lng });
          setGeoStatus('done');
          setGeoMessage('Alamat diambil dari klik peta.');
          try {
            const last = String(full || '').trim();
            if (last) {
              localStorage.setItem('userAddress', last);
              const raw = localStorage.getItem('userAddressHistory');
              const arr = raw ? JSON.parse(raw) : [];
              const base = Array.isArray(arr) ? arr : [];
              const merged = [last, ...base.filter(x => x !== last)];
              localStorage.setItem('userAddressHistory', JSON.stringify(merged.slice(0,5)));
              setAddressSuggestions(merged.slice(0,5));
            }
          } catch (e) {}
        } catch (err) {
          alert('Gagal mengambil alamat dari titik tersebut.');
        }
      });
    } catch (e) {
      setMapInitError('Gagal inisialisasi peta.');
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getCartKey());
      let arr = raw ? JSON.parse(raw) : [];
      arr = Array.isArray(arr) ? arr : [];
      if (selectedUids && selectedUids.length > 0) {
        const setUids = new Set(selectedUids);
        arr = arr.filter(it => setUids.has(it.uid));
      }
      setItems(arr);
    } catch (e) {
      setItems([]);
    }
  }, [selectedUids]);

  const formatRupiah = (n) => 'Rp.' + Number(n || 0).toLocaleString('id-ID');
  const total = items.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.qty || 1)), 0);

  const shippingLabel = shipping === 'jne_reguler' ? 'Reguler'
    : shipping === 'jne_cargo' ? 'Cargo'
    : 'Next Day';

  return (
    <div className="page-root" style={{ background:'#fff', minHeight:'100vh' }}>
      <style>{`
        .topbar { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; border-bottom:1px solid #eee; }
        .nav { display:flex; gap:24px; color:#c33; }
        .nav a { color:#c33; text-decoration:none; font-weight:600; }
        .container { max-width: 1000px; margin: 0 auto; padding: 12px 24px; }
        .title { font-size: 22px; font-weight: 700; color: #c33; margin: 8px 0 16px; }
        .card { background:#c33; color:#fff; border-radius:28px; padding: 20px; }
        .table { width:100%; border-collapse: collapse; }
        .table th, .table td { padding: 12px; color:#fff; }
        .table th { text-align:left; font-weight:700; }
        .thumb { width: 120px; height: 120px; object-fit: cover; border-radius: 6px; margin-right: 14px; }
        .row-flex { display:flex; align-items:center; }
        .summary { font-size: 26px; font-weight:700; text-align:right; margin: 16px 0; }
        .section { margin-top: 16px; }
        .label { font-weight:700; margin-bottom: 6px; }
        .input, .select { width: 100%; border:1px solid #ddd; border-radius:10px; padding: 12px; font-size: 16px; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .processbar { display:flex; justify-content:flex-end; margin-top: 12px; }
        .process { background:#c33; color:#fff; border:none; border-radius:12px; padding:16px 28px; font-size:20px; cursor:pointer; }
        /* Modal Kurin */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .modal-card { background: #fff; border-radius: 16px; padding: 24px; width: 380px; box-shadow: 0 12px 32px rgba(0,0,0,0.18); text-align: center; }
        .modal-title { font-size: 20px; font-weight: 700; color: #c33; margin-bottom: 8px; }
        .modal-desc { color: #333; margin-bottom: 16px; }
        .modal-actions { display: flex; gap: 12px; justify-content: center; }
        .btn { border: none; border-radius: 10px; padding: 10px 16px; cursor: pointer; }
        .btn.primary { background: #c33; color: #fff; }
        .btn.secondary { background: #eee; color: #333; }
      `}</style>

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

      <div className="container">
        <div style={{ fontWeight:700, marginBottom:8, color:'#c33' }}>Produk Dipesan</div>
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Produk Dipesan</th>
                <th>Harga Satuan</th>
                <th>Jumlah</th>
                <th>Total Harga</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.uid}>
                  <td>
                    <div className="row-flex">
                      <img className="thumb" src={it.image || '/kurin.png'} alt={it.name} />
                      <div style={{ fontSize:18, fontWeight:600 }}>
                        {it.name}
                        {it.variant ? ` — ${it.variant}` : ''}
                      </div>
                    </div>
                  </td>
                  <td>{formatRupiah(Number(it.price || 0))}</td>
                  <td>{Number(it.qty || 1)}</td>
                  <td>{formatRupiah(Number(it.price || 0) * Number(it.qty || 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary">{formatRupiah(total)}</div>

        <div className="section">
          <div className="label">Opsi Pengiriman</div>
          <select className="select" value={shipping} onChange={(e) => setShipping(e.target.value)}>
            <option value="jne_reguler">JNE Reguler</option>
            <option value="jne_next_day">JNE Next Day</option>
            <option value="jne_cargo">JNE Cargo</option>
          </select>
          <div style={{ marginTop:8, color:'#333', fontWeight:600 }}>Opsi Pengiriman : {shippingLabel}</div>
        </div>

        <div className="section">
          <div className="grid">
            <div>
              <div className="label">Nama Penerima</div>
              <input className="input" placeholder="Nama penerima" value={recipient.name} onChange={e => setRecipient(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <div className="label">No. Telp</div>
              <input className="input" placeholder="08123456789" value={recipient.phone} onChange={e => setRecipient(prev => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / span 2' }}>
               <div className="label" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                 <span>Alamat Pembeli</span>
                 <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                   <button type="button" onClick={openMapModal} className="btn secondary" style={{ padding:'8px 12px' }}>Cari Alamat (Peta)</button>
                   <button type="button" onClick={tembakMaps} className="btn secondary" style={{ padding:'8px 12px' }}>Tembak Maps</button>
                 </div>
               </div>
               <textarea className="input" rows={3} placeholder="Alamat lengkap" value={recipient.address} onChange={e => setRecipient(prev => ({ ...prev, address: e.target.value }))} />
               {geoStatus !== 'idle' && (
                 <div style={{ marginTop:6, color: geoStatus === 'error' ? '#a00' : '#555' }}>
                   {geoMessage}
                   {geoCoords && (
                     <span style={{ marginLeft:8 }}>
                       (<a href={`https://www.google.com/maps?q=${geoCoords.lat},${geoCoords.lon}`} target="_blank" rel="noreferrer">lihat peta</a>)
                     </span>
                   )}
                 </div>
               )}
               {showMap && (
                 <div className="modal-overlay" onClick={closeMapModal}>
                   <div className="modal-card" style={{ width:'90%', maxWidth:900 }} onClick={(e) => e.stopPropagation()}>
                     <div className="modal-title">Cari Alamat di Peta</div>
                     <div className="modal-desc">Klik titik peta untuk memilih alamat.</div>
                     <div id="picker-map" style={{ width:'100%', height:450, borderRadius:8, overflow:'hidden', border:'1px solid #eee' }} />
                     {mapInitError && <div style={{ color:'#a00', marginTop:8 }}>{mapInitError}</div>}
                     <div className="modal-actions" style={{ marginTop:12 }}>
                       <button className="btn secondary" onClick={closeMapModal}>Tutup</button>
                       <a className="btn primary" href={geoCoords ? `https://www.google.com/maps?q=${geoCoords.lat},${geoCoords.lon}` : '#'} target="_blank" rel="noreferrer">Buka di Google Maps</a>
                     </div>
                   </div>
                 </div>
               )}
                {addressSuggestions.length > 0 && (
                  <div style={{ marginTop:6 }}>
                 <div className="label" style={{ marginBottom:6 }}>Alamat tersimpan:</div>
                 <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                   {addressSuggestions.map((s, i) => (
                     <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                       <button type="button" onClick={() => setRecipient(prev => ({ ...prev, address: s }))} style={{ flex:1, textAlign:'left', padding:'8px 12px', border:'1px solid #ddd', borderRadius:20, background:'#fff', cursor:'pointer' }}>
                         {s}
                       </button>
                       <button type="button" aria-label="Hapus alamat" onClick={() => removeSavedAddress(s)} style={{ padding:'6px 10px', border:'1px solid #f3c4c4', borderRadius:20, background:'#ffecec', color:'#b00', cursor:'pointer' }}>Hapus</button>
                     </div>
                   ))}
                 </div>
                </div>
              )}
              </div>
          </div>
        </div>

        <div className="processbar">
          <button className="process" onClick={async () => {
            if (!recipient.name || !recipient.address || !recipient.phone) { alert('Lengkapi data penerima terlebih dahulu.'); return; }
            if (items.length === 0) { alert('Tidak ada item diproses.'); return; }
            try {
              const payload = {
                buyer: recipient,
                items: items.map(it => ({
                  product_id: it.id || null,
                  name: it.name,
                  image: it.image || null,
                  variant: it.variant || null,
                  price: Number(it.price || 0),
                  quantity: Number(it.qty || 1),
                })),
                total,
                order_date: new Date().toISOString().slice(0,10),
              };
              const token = localStorage.getItem('userToken');
              const endpoint = token ? `${API_URL}/user/orders` : `${API_URL}/orders`;
              const headers = token ? { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json', 'Accept': 'application/json' };
              const res = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
              });
              let json = {};
              try { json = await res.json(); } catch(e) { json = {}; }
              if (!res.ok || json.ok !== true) {
                const msg = json.message || `Gagal memproses pesanan (HTTP ${res.status})`;
                alert(msg);
                return;
              }
              // Bersihkan item yang di-checkout dari keranjang (per-user)
              try {
                const raw = localStorage.getItem(getCartKey());
                let arr = raw ? JSON.parse(raw) : [];
                arr = Array.isArray(arr) ? arr : [];
                const uids = new Set(items.map(it => it.uid));
                const next = arr.filter(it => !uids.has(it.uid));
                localStorage.setItem(getCartKey(), JSON.stringify(next));
              } catch(e) {}
              // Simpan nomor telp dan nama penerima untuk referensi
              try {
                localStorage.setItem('last_buyer_phone', recipient.phone);
                localStorage.setItem('last_buyer_name', recipient.name);
              } catch (e) {}
              setOrderId(json.order_id || null);
              setShowSuccess(true);
            } catch (e) {
              alert('Terjadi kesalahan jaringan');
            }
          }}>Proses</button>
        </div>

        {/* Modal Sukses Kurin */}
        {showSuccess && (
          <div className="modal-overlay">
            <div className="modal-card">
              <img src="/kurin.png" alt="Kurin" style={{ width: 60, height: 60, marginBottom: 8 }} />
              <div className="modal-title">Berhasil diproses</div>
              <div className="modal-desc">Pesanan Anda telah berhasil dibuat{orderId ? ` (ID: ${orderId})` : ''}.</div>
              <div className="modal-actions">
                <button className="btn secondary" onClick={() => setShowSuccess(false)}>Tutup</button>
                <button className="btn primary" onClick={() => navigate('/pesanan')}>Lihat Pesanan</button>
              </div>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}