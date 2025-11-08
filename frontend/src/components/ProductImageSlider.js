import React, { useEffect, useMemo, useRef, useState } from 'react';

// Sumber default gambar dari public/kurinproduk
const defaultImages = [
  '/kurinproduk/1.png','/kurinproduk/2.png','/kurinproduk/3.png','/kurinproduk/4.png','/kurinproduk/5.png',
  '/kurinproduk/6.png','/kurinproduk/7.png','/kurinproduk/8.png','/kurinproduk/9.png','/kurinproduk/10.png',
  '/kurinproduk/11.png','/kurinproduk/12.png','/kurinproduk/13.png','/kurinproduk/14.png','/kurinproduk/15.png',
];


export default function ProductImageSlider({ images = defaultImages, intervalMs = 3000 }) {
  const validImages = useMemo(() => (Array.isArray(images) && images.length ? images : defaultImages), [images]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  const goTo = (i) => {
    const next = (i + validImages.length) % validImages.length;
    setIndex(next);
  };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  // Autoplay
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % validImages.length);
    }, intervalMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [validImages.length, intervalMs]);

  return (
    <div className="product-slider" aria-label="Katalog produk">
      <style>{`
        .product-slider { position: relative; width: 100%; max-width: 1100px; margin: 24px auto; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); background: #fff; }
        .product-slider .viewport { overflow: hidden; width: 100%; }
        .product-slider .track { display: flex; width: 100%; transform: translateX(-${index * 100}%); transition: transform 500ms ease; }
        .product-slider .slide { flex: 0 0 100%; display: flex; align-items: center; justify-content: center; background: #fafafa; }
        .product-slider img { width: 100%; height: auto; display: block; }

        .product-slider .controls { position: absolute; top: 50%; left: 0; right: 0; display: flex; justify-content: space-between; transform: translateY(-50%); pointer-events: none; }
        .product-slider .btn { pointer-events: auto; background: rgba(255,255,255,0.85); border: 1px solid #eee; color: #c33; border-radius: 999px; width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .product-slider .btn:hover { background: #fff; }

        .product-slider .dots { display: flex; gap: 8px; justify-content: center; padding: 12px; }
        .product-slider .dot { width: 10px; height: 10px; border-radius: 50%; background: #ffd8d8; cursor: pointer; }
        .product-slider .dot.active { background: #e52b2b; }
      `}</style>

      <div className="viewport">
        <div className="track">
          {validImages.map((src, i) => (
            <div className="slide" key={i}>
              <img src={src} alt={`Produk ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="controls" aria-hidden="false" aria-label="Kontrol slider">
        <button className="btn" onClick={prev} aria-label="Sebelumnya">‹</button>
        <button className="btn" onClick={next} aria-label="Berikutnya">›</button>
      </div>

      <div className="dots" aria-label="Indikator slide">
        {validImages.map((_, i) => (
          <span key={i} className={`dot ${i === index ? 'active' : ''}`} onClick={() => goTo(i)} />
        ))}
      </div>
    </div>
  );
}