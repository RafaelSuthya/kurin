import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { API_URL } from '../api/admin';
import { getProvinces, getCities, getShippingCost, getSubdistricts } from '../api/shipping';

const getCartKey = () => {
  try {
    const email = localStorage.getItem('userEmail');
    return email ? `cart_items__${email}` : 'cart_items__guest';
  } catch (e) {
    return 'cart_items__guest';
  }
};

const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n || 0));

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedUids = useMemo(() => Array.isArray(location.state?.selectedUids) ? location.state.selectedUids : null, [location.state]);

  const [cartItems, setCartItems] = useState([]);
  const [productsMeta, setProductsMeta] = useState({}); // id -> { weight, length, width, height }

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
  const [provinces, setProvinces] = useState([]);
  const [provinceId, setProvinceId] = useState('');
  const [cities, setCities] = useState([]);
  const [cityId, setCityId] = useState('');
  const [subdistricts, setSubdistricts] = useState([]);
  const [subdistrictId, setSubdistrictId] = useState('');
  const [rates, setRates] = useState({ jne: [], jnt: [], warning: null });
  const [selectedService, setSelectedService] = useState('');
  const [loadingRates, setLoadingRates] = useState(false);

  // Load per-user cart
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getCartKey());
      let items = raw ? JSON.parse(raw) : [];
      items = Array.isArray(items) ? items : [];
      if (selectedUids && selectedUids.length > 0) {
        const setUids = new Set(selectedUids);
        items = items.filter(it => setUids.has(it.uid));
      }
      setCartItems(items);
    } catch (e) {
      setCartItems([]);
    }
  }, [selectedUids]);

  // Totals
  const subtotal = useMemo(() => cartItems.reduce((t, it) => t + (Number(it.price) || 0) * (Number(it.qty) || 1), 0), [cartItems]);

  const totalWeight = useMemo(() => cartItems.reduce((t, it) => {
    const w = Number(productsMeta[it.id]?.weight || 0);
    const q = Number(it.qty || 1);
    return t + (w * q);
  }, 0), [cartItems, productsMeta]);

  const totalVolumetric = useMemo(() => cartItems.reduce((t, it) => {
    const meta = productsMeta[it.id] || {};
    const l = Number(meta.length || 0);
    const w = Number(meta.width || 0);
    const h = Number(meta.height || 0);
    const q = Number(it.qty || 1);
    const volumetricKg = (l > 0 && w > 0 && h > 0) ? ((l * w * h) / 6000) : 0; // cm-based divisor 6000
    return t + (volumetricKg * q * 1000); // grams
  }, 0), [cartItems, productsMeta]);

  const chargeableGrams = useMemo(() => Math.max(1, Math.ceil(Math.max(totalWeight, totalVolumetric))), [totalWeight, totalVolumetric]);

  const shippingCost = useMemo(() => {
    if (!selectedService) return 0;
    const parts = selectedService.split(':');
    const cost = Number(parts[1] || 0);
    return isNaN(cost) ? 0 : cost;
  }, [selectedService]);

  const grandTotal = useMemo(() => subtotal + shippingCost, [subtotal, shippingCost]);

  // Fetch product meta (weight & dimensions)
  useEffect(() => {
    const ids = Array.from(new Set(cartItems.map(it => it.id))).filter(Boolean);
    if (ids.length === 0) { setProductsMeta({}); return; }
    const controller = new AbortController();
    Promise.all(ids.map(async (pid) => {
      try {
        const res = await fetch(`${API_URL}/admin/products/${pid}`, { signal: controller.signal });
        const data = await res.json();
        return { id: pid, weight: Number(data?.weight || 0), length: Number(data?.length || 0), width: Number(data?.width || 0), height: Number(data?.height || 0) };
      } catch (e) {
        return { id: pid, weight: 0, length: 0, width: 0, height: 0 };
      }
    })).then(list => {
      const map = {};
      list.forEach(({ id, weight, length, width, height }) => { map[id] = { weight, length, width, height }; });
      setProductsMeta(map);
    });
    return () => controller.abort();
  }, [cartItems]);

  // Shipping region selectors
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await getProvinces();
        setProvinces(res.data || []);
        const jabar = (res.data || []).find(p => (p.province || '').toLowerCase() === 'jawa barat');
        if (jabar) setProvinceId(jabar.province_id);
      } catch (e) {}
    };
    loadProvinces();
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      if (!provinceId) { setCities([]); setCityId(''); return; }
      try {
        const res = await getCities(provinceId);
        setCities(res.data || []);
        const bekasi = (res.data || []).find(c => (c.city_name || '').toLowerCase().includes('bekasi'));
        if (bekasi) setCityId(bekasi.city_id);
      } catch (e) {}
    };
    loadCities();
  }, [provinceId]);

  useEffect(() => {
    const loadSubdistricts = async () => {
      if (!cityId) { setSubdistricts([]); setSubdistrictId(''); return; }
      try {
        const res = await getSubdistricts(cityId);
        setSubdistricts(res.data || []);
        const first = (res.data || [])[0];
        if (first) setSubdistrictId(first.subdistrict_id);
      } catch (e) {}
    };
    loadSubdistricts();
  }, [cityId]);

  // Shipping rates
  useEffect(() => {
    const calcRates = async () => {
      if (!cityId || !chargeableGrams) { setRates({ jne: [], jnt: [], warning: null }); setSelectedService(''); return; }
      setLoadingRates(true);
      try {
        const res = await getShippingCost({
          destination_city_id: cityId,
          destination_subdistrict_id: subdistrictId || undefined,
          weight: Math.max(1, Math.round(chargeableGrams)),
        });
        let warn = res?.warning || null;
        const jneList = Array.isArray(res?.data?.jne) ? res.data.jne : [];
        const jntList = Array.isArray(res?.data?.jnt) ? res.data.jnt : [];
        if (!Array.isArray(res?.data?.jne) && res?.data?.jne?.error) warn = (warn ? warn + '; ' : '') + `JNE ${res.data.jne.error}`;
        if (!Array.isArray(res?.data?.jnt) && res?.data?.jnt?.error) warn = (warn ? warn + '; ' : '') + `J&T ${res.data.jnt.error}`;
        setRates({ jne: jneList, jnt: jntList, warning: warn });
        const firstJne = jneList[0];
        const firstJnt = jntList[0];
        if (firstJne) setSelectedService(firstJne.service + ':' + (firstJne.cost || 0));
        else if (firstJnt) setSelectedService(firstJnt.service + ':' + (firstJnt.cost || 0));
      } catch (e) {}
      setLoadingRates(false);
    };
    calcRates();
  }, [cityId, subdistrictId, chargeableGrams]);

  const placeOrder = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) { alert('Silakan login terlebih dahulu untuk membuat pesanan.'); navigate('/login'); return; }
    if (!recipient.name || !recipient.phone || !recipient.address) { alert('Lengkapi data penerima.'); return; }
    if (cartItems.length === 0) { alert('Tidak ada item diproses.'); return; }
    try {
      const payload = {
        buyer: { name: recipient.name, phone: recipient.phone, address: recipient.address },
        items: cartItems.map(it => ({ product_id: it.id || null, name: it.name, image: it.image || null, variant: it.variant || null, price: Number(it.price || 0), quantity: Number(it.qty || 1) })),
        total: grandTotal,
        order_date: new Date().toISOString().slice(0,10),
      };
      const res = await fetch(`${API_URL}/user/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || `Gagal membuat pesanan (HTTP ${res.status})`);
      // remove ordered items from per-user cart
      try {
        const rawAll = localStorage.getItem(getCartKey());
        const allItems = rawAll ? JSON.parse(rawAll) : [];
        const usedUids = new Set(cartItems.map(x => x.uid));
        const remaining = Array.isArray(allItems) ? allItems.filter(x => !usedUids.has(x.uid)) : [];
        localStorage.setItem(getCartKey(), JSON.stringify(remaining));
      } catch (e) {}
      alert('Pesanan berhasil dibuat.');
      navigate('/pesanan');
    } catch (err) {
      alert(err?.message || 'Terjadi kesalahan saat membuat pesanan');
    }
  };

  // Gunakan gambar per-item dengan fallback

  return (
    <div className="page-root" style={{ background:'#fff', minHeight:'100vh' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', borderBottom:'1px solid #eee' }}>
        <img src="/kurin.png" alt="Kurin" style={{ height: 54 }} />
        <div style={{ display:'flex', gap:24 }}>
          <a href="/home" style={{ color:'#c33', textDecoration:'none', fontWeight:600 }}>Home</a>
          <a href="/company-profile" style={{ color:'#c33', textDecoration:'none', fontWeight:600 }}>About Us</a>
          <a href="/profile" style={{ color:'#c33', textDecoration:'none', fontWeight:600 }}>Profile</a>
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'12px 24px' }}>
        <div style={{ fontWeight:700, marginBottom:8, color:'#c33' }}>Produk Dipesan</div>
        <div style={{ background:'#c33', color:'#fff', borderRadius:16, padding:16 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding:12, textAlign:'left' }}>Produk</th>
                <th style={{ padding:12, textAlign:'left' }}>Harga</th>
                <th style={{ padding:12, textAlign:'left' }}>Jumlah</th>
                <th style={{ padding:12, textAlign:'left' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map(it => (
                <tr key={it.uid}>
                  <td style={{ padding:12 }}>
                    <div style={{ display:'flex', alignItems:'center' }}>
                      <img src={it.image || '/kurin.png'} alt={it.name} style={{ width: 80, height: 80, objectFit:'cover', borderRadius:6, marginRight:12 }} />
                      <div style={{ fontSize:16, fontWeight:600 }}>
                        {it.name}
                        {it.variant ? ` — ${it.variant}` : ''}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:12 }}>{formatRupiah(Number(it.price || 0))}</td>
                  <td style={{ padding:12 }}>{Number(it.qty || 1)}</td>
                  <td style={{ padding:12 }}>{formatRupiah((Number(it.price || 0)) * (Number(it.qty || 1)))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize:20, fontWeight:700, textAlign:'right', margin:'16px 0' }}>Subtotal: {formatRupiah(subtotal)}</div>

        <div>
          <div style={{ fontWeight:700, marginBottom:6 }}>Wilayah Pengiriman</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <select value={provinceId} onChange={e => setProvinceId(e.target.value)} style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }}>
              <option value="">Pilih Provinsi</option>
              {provinces.map(p => (<option key={p.province_id} value={p.province_id}>{p.province}</option>))}
            </select>
            <select value={cityId} onChange={e => setCityId(e.target.value)} style={{ padding:8, border:'1px solid #ddd', borderRadius:8 }}>
              <option value="">Pilih Kota/Kabupaten</option>
              {cities.map(c => (<option key={c.city_id} value={c.city_id}>{c.type} {c.city_name}</option>))}
            </select>
            <select value={subdistrictId} onChange={e => setSubdistrictId(e.target.value)} style={{ gridColumn:'1 / span 2', padding:8, border:'1px solid #ddd', borderRadius:8 }}>
              <option value="">Pilih Kecamatan</option>
              {subdistricts.map(s => (<option key={s.subdistrict_id} value={s.subdistrict_id}>{s.subdistrict_name}</option>))}
            </select>
          </div>
        </div>

        <div style={{ marginTop:12 }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>Opsi Pengiriman</div>
          <select value={selectedService} onChange={e => setSelectedService(e.target.value)} style={{ width:'100%', padding:10, border:'1px solid #ddd', borderRadius:8 }}>
            <option value="">Pilih layanan</option>
            {rates.jne.map((r, idx) => (
              <option key={'jne-'+idx} value={r.service + ':' + (r.cost || 0)}>JNE {r.service} — {formatRupiah(r.cost || 0)}</option>
            ))}
            {rates.jnt.map((r, idx) => (
              <option key={'jnt-'+idx} value={r.service + ':' + (r.cost || 0)}>J&T {r.service} — {formatRupiah(r.cost || 0)}</option>
            ))}
          </select>
          {loadingRates && <div style={{ marginTop:6, color:'#555' }}>Menghitung ongkir...</div>}
          {rates.warning && <div style={{ marginTop:6, color:'#a00' }}>{rates.warning}</div>}
        </div>

        <div style={{ fontWeight:700, marginTop:16 }}>Data Penerima</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8 }}>
          <input value={recipient.name} onChange={e => setRecipient(prev => ({ ...prev, name: e.target.value }))} placeholder="Nama penerima" style={{ padding:10, border:'1px solid #ddd', borderRadius:8 }} />
          <input value={recipient.phone} onChange={e => setRecipient(prev => ({ ...prev, phone: e.target.value }))} placeholder="No. Telp" style={{ padding:10, border:'1px solid #ddd', borderRadius:8 }} />
          <textarea rows={3} value={recipient.address} onChange={e => setRecipient(prev => ({ ...prev, address: e.target.value }))} placeholder="Alamat lengkap" style={{ gridColumn:'1 / span 2', padding:10, border:'1px solid #ddd', borderRadius:8 }} />
          {addressSuggestions.length > 0 && (
            <div style={{ gridColumn:'1 / span 2' }}>
              <div style={{ color:'#555', marginTop:6, marginBottom:6 }}>Alamat tersimpan:</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {addressSuggestions.map((s, i) => (
                  <button type="button" key={i} onClick={() => setRecipient(prev => ({ ...prev, address: s }))} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:20, background:'#fff', cursor:'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign:'right', marginTop:16, fontWeight:700 }}>Ongkir: {formatRupiah(shippingCost)}</div>
        <div style={{ textAlign:'right', marginTop:6, fontWeight:700 }}>Total: {formatRupiah(grandTotal)}</div>

        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
          <button onClick={placeOrder} style={{ background:'#c33', color:'#fff', border:'none', borderRadius:10, padding:'12px 20px', fontSize:18, cursor:'pointer' }}>Buat Pesanan</button>
        </div>

      </div>
      <Footer />
    </div>
  );
}