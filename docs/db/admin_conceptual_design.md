# Admin Conceptual Design

Dokumen ini merangkum desain konseptual modul Admin: cakupan fitur, tabel yang dioperasikan admin, atribut utama per tabel, dan relasi antar entitas. Fokusnya adalah bagaimana admin mengelola katalog, pesanan, pembatalan, pengembalian, transaksi, pengaturan, diskon, serta status pesanan.

Catatan penting:
- Tidak ada foreign key langsung ke `admins` pada tabel operasional; peran admin bersifat aktor (melakukan create/update/approve). Jika diperlukan audit, pertimbangkan penambahan `created_by_admin_id` dan `updated_by_admin_id` secara fisik.
- `orders.tracking_number` disimpan sebagai string (nullable).
- `products.category` saat ini berupa string (denormalisasi). Konseptual: hubungkan ke `categories` melalui `category_id` (opsional per implementasi).
- `transactions.order_id` saat ini bertipe string unik (misalnya nomor pesanan/snap reference). Konseptual: relasi 1–1 ke `orders` (gunakan `orders.id` atau `orders.numeric_id` bila tersedia).
- `orders.stock_deducted_at` menyatakan waktu pengurangan stok dari gudang; nullable (belum diproses).

## Tabel dan Atribut (perspektif Admin)

### Admins
- Tujuan: Akun admin untuk login ke panel, verifikasi email, dan akses API.
- Kunci: `id` (PK), `email` (unique), `username` (unique, nullable).
- Atribut utama: `name`, `email`, `username`, `password`, `email_verified_at` (nullable), `timestamps`.
- Relasi (konseptual):
  - 1–N ke `personal_access_tokens` via morph `tokenable` (untuk API/Admin).
  - Aktor pada operasi create/update/approve di tabel lain (tanpa FK saat ini).

### Personal Access Tokens
- Tujuan: Token API (Sanctum) untuk autentikasi Admin (dan User).
- Kunci: `id` (PK), `token` (unique), `tokenable_type`, `tokenable_id` (polimorfik).
- Atribut: `name`, `abilities` (nullable), `last_used_at` (nullable), `expires_at` (nullable), `timestamps`.
- Relasi: N–1 ke `admins` (atau entitas lain) melalui morph `tokenable`.

### Settings
- Tujuan: Konten halaman kebijakan, bantuan, dan profil perusahaan yang dikelola admin.
- Kunci: `id` (PK).
- Atribut: `terms_conditions` (nullable), `contact_help` (nullable), `company_profile` (nullable), `timestamps`.
- Relasi: Tidak ada FK; dikelola penuh oleh admin.

### Categories
- Tujuan: Pengelompokan produk.
- Kunci: `id` (PK), `slug` (unique).
- Atribut: `name`, `slug`, `timestamps`.
- Relasi (konseptual): 1–N ke `products` melalui `products.category_id` (opsional). Saat ini kolom fisik adalah `products.category` (string).

### Products
- Tujuan: Katalog produk (konten, stok, harga, media, varian, dimensi, diskon).
- Kunci: `id` (PK).
- Atribut utama:
  - Konten: `name`, `description` (nullable), `images` (json, nullable), `variants` (json, nullable).
  - Katalog: `category` (string, nullable), `stock` (int, default 0), `price` (decimal 12,2, default 0).
  - Dimensi/berat: `weight`, `length`, `width`, `height` (decimal, nullable).
  - Diskon: `discount_price` (decimal, nullable), `discount_percent` (decimal, nullable), `discount_active` (boolean, default false), `discount_start`/`discount_end` (date, nullable).
  - `timestamps`.
- Relasi:
  - (Konseptual) N–1 ke `categories` via `category_id` (opsional, tidak ada kolom fisik saat ini).
  - 1–N ke `order_items` (melalui `order_items.product_id` yang nullable; fallback ke `product_name`/`product_image`).

### Discounts
- Tujuan: Kupon atau potongan harga terkelola admin.
- Kunci: `id` (PK), `code` (unique).
- Atribut: `code`, `description` (nullable), `amount` (decimal 10,2), `start_date`, `end_date`, `timestamps`.
- Relasi: Tidak ada FK saat ini; penerapan ke `orders`/`order_items` dilakukan di level aplikasi.

### Order Statuses
- Tujuan: Kamus status pesanan.
- Kunci: `id` (PK).
- Atribut: `name`, `description` (nullable), `timestamps`.
- Relasi: 1–N ke `orders` (`orders.status_id`).

### Orders
- Tujuan: Data pesanan, buyer info, status, dan logistik.
- Kunci: `id` (PK).
- Atribut utama: `user_id` (FK ke `users`), `total` (decimal 15,2), `order_date` (date), `status_id` (FK ke `order_statuses`), `stock_deducted_at` (timestamp, nullable), `buyer_name` (nullable), `buyer_phone` (nullable), `buyer_address` (nullable), `tracking_number` (nullable), `timestamps`.
 
- Relasi:
  - N–1 ke `users`.
  - N–1 ke `order_statuses`.
  - 1–N ke `order_items`.
  - 1–N ke `cancellations`.
  - 1–N ke `return_orders`.
  - (Konseptual) 1–1 ke `transactions` (mengacu pada order reference/ID).

### Order Items
- Tujuan: Item baris dalam pesanan.
- Kunci: `id` (PK).
- Atribut: `order_id` (FK ke `orders`), `product_id` (nullable), `product_name`, `product_image` (nullable), `variant` (nullable), `price` (decimal 12,2), `quantity` (uint), `timestamps`.
- Relasi: N–1 ke `orders`; (opsional) N–1 ke `products` via `product_id`.

### Cancellations
- Tujuan: Pembatalan pesanan oleh buyer/seller, disetujui atau ditolak oleh admin.
- Kunci: `id` (PK).
- Atribut: `order_id` (FK), `reason` (nullable), `cancellation_date` (date), tambahan: `initiator` (`buyer|seller`, default `buyer`), `decision` (`approved|rejected|null`).
- Relasi: N–1 ke `orders`.

### Return Orders
- Tujuan: Pengembalian barang/refund, diproses dan diputuskan admin.
- Kunci: `id` (PK).
- Atribut: `order_id` (FK), `reason` (nullable), `return_date` (date), tambahan: `photo_path`/`video_path` (nullable), `decision` (`approved|rejected|null`).
- Relasi: N–1 ke `orders`.

### Transactions
- Tujuan: Transaksi pembayaran (Midtrans) terkait pesanan.
- Kunci: `id` (PK), `order_id` (string unique, mereferensikan order reference), `snap_token` (nullable).
- Atribut: `amount` (decimal 10,2), `status` (default `pending`), `timestamps`.
- Relasi (konseptual): 1–1 ke `orders` (gunakan `order_id` konsisten dengan nomor pesanan yang direferensikan oleh aplikasi).

### System Tables (ops)
- Jobs/Job Batches/Failed Jobs: Antrian background job, dipicu oleh aksi admin (mis. sinkronisasi, notifikasi).
- Cache/Cache Locks: Cache aplikasi.
- Sessions: Sesi user; admin menggunakan mekanisme login berbeda, namun prinsip serupa.

## Relasi Kunci (Konseptual, perspektif Admin)
- Admins 1..N PersonalAccessTokens (morph `tokenable`).
- Categories 1..N Products (opsional bila `category_id` dipakai).
- OrderStatuses 1..N Orders.
- Users 1..N Orders.
- Orders 1..N OrderItems.
- Orders 1..N Cancellations.
- Orders 1..N ReturnOrders.
- Orders 1..1 Transactions (berdasarkan reference yang konsisten).
- Products 1..N OrderItems (opsional via `product_id`).
 - Users 1..N ProductReviews.
 - Products 1..N ProductReviews.

## Alur Operasi Admin (ringkas)
- Katalog: Admin membuat/mengubah `categories`, `products`, dan mengatur `discounts`.
- Pesanan: Admin memantau `orders` (status, buyer info, `tracking_number`), mengubah `order_statuses` jika diperlukan.
- Pembatalan/Pengembalian: Admin memutuskan `cancellations.decision` dan `return_orders.decision`, serta menyimpan bukti (`photo_path`/`video_path`).
- Pembayaran: Admin memantau `transactions.status` dan `snap_token` (integrasi Midtrans).
- Ulasan: Admin memoderasi `product_reviews` (hapus/takedown, kebijakan konten).
- Pengaturan: Admin memperbarui `settings` untuk konten kebijakan dan profil.

## Catatan Implementasi & Saran (opsional)
- Audit Admin: Tambahkan `created_by_admin_id`/`updated_by_admin_id` (FK ke `admins`) pada tabel yang kritikal bila perlu jejak kepemilikan perubahan.
- Normalisasi Kategori: Ganti `products.category` dengan `category_id` (FK) agar relasi ke `categories` eksplisit.
- Konsistensi Transaksi: Pertimbangkan `transactions.order_numeric_id` (FK ke `orders.id`) sambil tetap menyimpan `order_reference` string untuk gateway.
### Product Reviews
- Tujuan: Ulasan produk yang ditulis user dan dapat dimoderasi admin.
- Kunci: `id` (PK).
- Atribut: `product_id` (indexed), `user_id` (nullable), `author` (nullable), `rating` (tinyint), `text` (text), `created_at` (timestamp).
- Relasi: N–1 ke `products`; (opsional) N–1 ke `users`.