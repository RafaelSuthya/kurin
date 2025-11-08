# Struktur Proyek dan Panduan

## Lisensi
- Kode dalam repositori ini didedikasikan ke public domain menggunakan `CC0 1.0 Universal`.
- Lihat file `LICENSE` di root untuk detail lengkap dan legal code.
- Catatan penting:
  - Ketergantungan pihak ketiga (mis. `Laravel`, `React`, library npm/composer) tetap berada di bawah lisensi masing-masing (umumnya MIT). Gunakan dan distribusikan dengan tetap mematuhi lisensi mereka.
  - Aset seperti gambar, logo, atau materi brand di `frontend/public/` dan `public/` hanya dianggap public domain jika secara eksplisit dinyatakan demikian. Jika ragu, harap ganti atau sertakan atribusi yang sesuai.
  - Skema database & sample data juga didedikasikan ke public domain; lihat `database/DATA_LICENSE` dan `database/README.md`.

## Membuka ke Publik
- Jika menggunakan GitHub/Render/Railway:
  - Pastikan repository diatur ke `Public` di GitHub.
  - Pastikan tidak ada rahasia/credential dalam histori git atau file konfigurasi. Gunakan `.env` untuk environment dan jangan commit.
  - Tambahkan `CONTRIBUTING.md` (opsional) dan `CODE_OF_CONDUCT.md` (opsional) untuk panduan kontribusi.

## Operasional (Backend, Frontend, Database)
- Backend (Laravel):
  - `composer install`
  - Salin `.env.example` ke `.env`, set DB & `APP_KEY` (`php artisan key:generate`)
  - Migrasi: `php artisan migrate --force`
  - Dev server: `php artisan serve`
- Frontend (React):
  - `cd frontend && npm ci`
  - Dev server: `npm start` (proxy ke backend via `frontend/package.json`)
  - Produksi: `npm run build` lalu build disajikan via Laravel `public/` sesuai proses deploy.
- Database:
  - Lihat `database/README.md` untuk opsi MySQL/SQLite, migrasi, dan seeding aman.

## Distribusi
- Field lisensi telah diperbarui ke `CC0-1.0` di `composer.json` serta `package.json` (root, `frontend/`, dan `frontend/admin-dashboard/`).
- Untuk rilis, buat tag dan lampirkan file `LICENSE` agar downstream jelas status lisensi.

Dokumen ini merapikan struktur folder backend dan frontend, serta memberi panduan singkat untuk pengembangan lokal dan deploy (Railway).

## Struktur Folder

```
.
├─ app/                   # Laravel app (Controllers, Models, Policies)
├─ bootstrap/
├─ config/
├─ database/              # Migrations, Seeders
├─ public/                # Public web root (termasuk build frontend)
├─ resources/             # Views, lang, dll
├─ routes/                # Web/API routes
├─ storage/
├─ vendor/
├─ frontend/              # React app (source code frontend)
│  ├─ src/
│  ├─ public/
│  └─ cypress/            # E2E tests
├─ Procfile               # Entry untuk Railway
├─ start.sh               # Build & start script untuk Railway
└─ README.md              # Dokumen ini
```

Catatan:
- Folder `kurin/` dan `kurinn/` dihapus karena hanya berisi placeholder dan tidak dipakai.
- Folder kosong di `src/` (root) tidak digunakan; semua kode frontend berada di `frontend/`.

## Konvensi Koneksi API

- Frontend membaca base URL API dari env `REACT_APP_API_URL`. Jika tidak diset, default `"/api"` sehingga frontend dan backend berada di domain yang sama.
- Contoh env saat deploy satu domain: `REACT_APP_API_URL=/api`.

## Pengembangan Lokal

- Backend: jalankan Laravel dev server atau Valet/Apache/Nginx
  - `php artisan serve` → `http://localhost:8000`
- Frontend: jalankan dev server React
  - `cd frontend`
  - `npm install`
  - `npm start` → `http://localhost:3000`
- Untuk lintas domain lokal, set `REACT_APP_API_URL=http://localhost:8000/api` saat menjalankan frontend.

## Deploy ke Railway (Single Service)

Railway menggunakan `Procfile` dan `start.sh` di root untuk:
- Install dependensi Laravel, build React, copy hasil build ke `public/`, lalu start server PHP.

Environment penting:
- `APP_KEY` (generate dengan `php artisan key:generate` secara lokal lalu copy nilainya)
- `APP_ENV=production`, `APP_DEBUG=false`
- `APP_URL` (domain Railway)
- Database: `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`

Start Command: `bash start.sh`
Port: Railway akan mengisi env `PORT` otomatis, skrip sudah menggunakannya.

## E2E Testing

E2E Cypress berada di `frontend/cypress/e2e/`. Jalankan dari folder `frontend/`:
- `npm run cypress:open` atau `npx cypress run`

## Catatan Perapihan

- Hindari menambahkan folder duplikat di root. Semua kode frontend harus berada di `frontend/`, sedangkan backend di root.
- Bila perlu folder baru untuk dokumentasi/skrip, taruh di root dan dokumentasikan di `README.md` ini.