# Database — Publik dan Operasional

## Lisensi Data
- Skema/migrasi dan sample data di repo ini didedikasikan ke public domain (CC0 1.0). Lihat `database/DATA_LICENSE`.
- Jangan commit data produksi (PII, transaksi nyata, materi berlisensi pihak ketiga).

## Jalankan Database Secara Lokal
- Atur koneksi di `.env`:
  - `DB_CONNECTION=mysql` (atau `sqlite` untuk cepat coba)
  - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- Buat tabel: `php artisan migrate --force`
- (Opsional) Isi contoh data: `php artisan db:seed --force`

## Gunakan SQLite (cepat tanpa server DB)
- Di `.env`: set `DB_CONNECTION=sqlite` dan pastikan `DB_DATABASE=database/database.sqlite`
- File SQLite akan dibuat saat `composer create-project` (atau jalankan: `php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"`)

## Seed Data
- Seeder default: `database/seeders/DatabaseSeeder.php` dapat diperluas untuk menambah kategori/produk contoh.
- Pastikan setiap data contoh yang ditambahkan tidak melanggar hak cipta atau privasi; idealnya gunakan data sintetis.

## Produksi
- Jalankan migrasi saat deploy: `php artisan migrate --force`
- Jangan jalankan seeder pada produksi kecuali memang diperlukan dan aman.
- Pastikan backup dan kebijakan privasi data sesuai regulasi.