import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, updateTerms } from '../api/admin';

export default function EditTerms() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const defaultSections = useMemo(() => ([
    { key: 'cancellation', title: 'Pembatalan Pesanan', items: '' },
    { key: 'refund', title: 'Pengembalian Dana (Refund)', items: '' },
    { key: 'payment', title: 'Pembayaran', items: '' },
    { key: 'shipping', title: 'Pengiriman', items: '' },
    { key: 'privacy', title: 'Privasi Data', items: '' },
    { key: 'changes', title: 'Perubahan Syarat & Ketentuan', items: '' },
  ]), []);
  const [sections, setSections] = useState(defaultSections);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const res = await getSettings();
        const current = (res && res.settings && res.settings.terms) ? res.settings.terms : '';
        if (current && typeof window !== 'undefined') {
          const container = document.createElement('div');
          container.innerHTML = current;
          const foundHeaders = Array.from(container.querySelectorAll('h1, h2, h3'));
          if (foundHeaders.length > 0) {
            const parsed = [];
            foundHeaders.forEach((h) => {
              const title = (h.textContent || '').trim();
              let itemsText = '';
              let next = h.nextElementSibling;
              if (next && next.tagName && next.tagName.toLowerCase() === 'ul') {
                const lis = Array.from(next.querySelectorAll('li')).map(li => (li.textContent || '').trim()).filter(Boolean);
                itemsText = lis.join('\n');
              } else if (next && next.tagName && next.tagName.toLowerCase() === 'p') {
                itemsText = (next.textContent || '').trim();
              }
              parsed.push({ key: `parsed-${parsed.length}`, title, items: itemsText });
            });
            setSections(parsed.length > 0 ? parsed : defaultSections);
          } else {
            setSections(defaultSections);
          }
        } else {
          setSections(defaultSections);
        }
      } catch (e) {
        setSections(defaultSections);
      }
      setLoading(false);
    };
    load();
  }, [defaultSections]);

  const buildHtml = (secs) => {
    const parts = [];
    secs.forEach((s) => {
      const title = (s.title || '').trim();
      const lines = String(s.items || '')
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);
      parts.push(`<h2>${title}</h2>`);
      if (lines.length > 0) {
        parts.push('<ul>');
        lines.forEach(li => parts.push(`<li>${li}</li>`));
        parts.push('</ul>');
      } else {
        parts.push('<p></p>');
      }
    });
    return parts.join('\n');
  };

  const [localPreview, setLocalPreview] = useState('');

  useEffect(() => {
    setLocalPreview(buildHtml(sections));
  }, [sections]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const html = buildHtml(sections);
      const res = await updateTerms(html);
      setSaving(false);
      if (res && !res.error) {
        setMessage('Syarat & Ketentuan berhasil disimpan.');
      } else {
        setMessage(res?.error || 'Gagal menyimpan Syarat & Ketentuan');
      }
    } catch (err) {
      setSaving(false);
      setMessage('Gagal menyimpan Syarat & Ketentuan');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        .topbar { display:flex; align-items:center; justify-content:space-between; padding:12px 24px; border-bottom:1px solid #eee; }
        .nav a { color:#c33; text-decoration:none; font-weight:600; margin-right:16px; }
        .container { max-width: 1000px; margin: 0 auto; padding: 24px; }
        .card { background:#fff; border:1px solid #eee; border-radius:12px; padding:24px; }
        label { display:block; font-weight:600; color:#c33; margin-top:12px; }
        input[type="text"] { width:100%; padding:12px; border:1px solid #ddd; border-radius:8px; margin-top:6px; }
        textarea { width:100%; min-height: 120px; padding:12px; border:1px solid #ddd; border-radius:8px; margin-top:6px; font-family:Arial; }
        .actions { display:flex; gap:12px; margin-top:16px; }
        .btn { border:none; border-radius:8px; padding:12px 16px; cursor:pointer; }
        .btn.primary { background:#c33; color:#fff; }
        .btn.secondary { background:#eee; color:#333; }
        .msg { margin-top:12px; color:#0a7; font-weight:600; }
        .preview { margin-top: 16px; border: 1px solid #eee; border-radius: 8px; }
        .preview-header { padding: 10px 12px; border-bottom: 1px solid #eee; color: #c33; font-weight: 600; }
        .preview-body { padding: 12px; }
      `}</style>

      <div className="topbar">
        <img src="/kurin.png" alt="Kurin" style={{ height: 54 }} />
        <div className="nav">
          <a href="/admin/dashboard">Dashboard</a>
          <a href="/terms">Lihat Halaman Publik</a>
        </div>
      </div>

      <div className="container">
        <h2 style={{ color:'#c33' }}>Edit Syarat & Ketentuan</h2>
        {loading ? (
          <div>Memuat data...</div>
        ) : (
          <form className="card" onSubmit={handleSubmit}>
            <div style={{ color:'#666', marginBottom:12 }}>Isi tiap bagian tanpa perlu kode HTML. Setiap baris pada "Isi" akan menjadi poin bullet.</div>

            {sections.map((s, idx) => (
              <div key={s.key} style={{ marginTop: idx === 0 ? 0 : 16 }}>
                <label>Judul</label>
                <input type="text" value={s.title} onChange={(e) => {
                  const v = e.target.value;
                  setSections(prev => prev.map((x, i) => i === idx ? { ...x, title: v } : x));
                }} />
                <label>Isi</label>
                <textarea placeholder="Tulis poin-poin, satu baris satu poin" value={s.items} onChange={(e) => {
                  const v = e.target.value;
                  setSections(prev => prev.map((x, i) => i === idx ? { ...x, items: v } : x));
                }} />
              </div>
            ))}

            <div className="actions">
              <button className="btn secondary" type="button" onClick={() => navigate('/admin/dashboard')}>Kembali</button>
              <button className="btn primary" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
            {message && <div className="msg">{message}</div>}
          </form>
        )}

        {!loading && (
          <div className="preview">
            <div className="preview-header">Preview</div>
            <div className="preview-body" dangerouslySetInnerHTML={{ __html: localPreview || '<p><em>Belum ada konten. Isi terlebih dahulu, lalu simpan.</em></p>' }} />
          </div>
        )}
      </div>
    </div>
  );
}