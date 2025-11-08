# Logical Database Design (Ecommerce App)

Scope: diambil dari database aplikasi ini. Shipping area (provinsi/kota/kecamatan) tidak termasuk; nomor resi disimpan di tabel orders.

## Entitas & Kolom Utama

- users
  - id (PK), name, email (unique), password, email_verified_at, remember_token, timestamps
  - 2FA: two_factor_secret, two_factor_recovery_codes, two_factor_confirmed_at

- admins
  - id (PK), name, username (unique), email (unique), password, email_verified_at, timestamps

- settings
  - id (PK), terms_conditions, contact_help, company_profile, timestamps

- categories
  - id (PK), name, slug (unique), timestamps

- products
  - id (PK), name, description, category (string), stock, price (decimal), images (json), variants (json), weight/length/width/height (decimal), timestamps
  - diskon: discount_price (decimal, nullable), discount_percent (decimal, nullable), discount_active (bool), discount_start (date, nullable), discount_end (date, nullable)

- order_statuses
  - id (PK), name, description (nullable), timestamps

- orders
  - id (PK), user_id (FK -> users.id), status_id (FK -> order_statuses.id), total (decimal), order_date (date), stock_deducted_at (timestamp, nullable), timestamps
  - buyer_name (nullable), buyer_phone (nullable), buyer_address (nullable), tracking_number (nullable)

- order_items
  - id (PK), order_id (FK -> orders.id, cascade delete), product_id (nullable), product_name, product_image (nullable), variant (nullable), price (decimal), quantity (uint), timestamps

- cancellations
  - id (PK), order_id (FK -> orders.id), reason (nullable), cancellation_date (date), timestamps
  - initiator (default: buyer), decision (nullable)

- return_orders
  - id (PK), order_id (FK -> orders.id), reason (nullable), return_date (date), timestamps
  - photo_path (nullable), video_path (nullable), decision (nullable)

- transactions (Midtrans)
  - id (PK), order_id (string, unique), amount (decimal(10,2)), status (default: pending), snap_token (nullable), timestamps
  - Catatan: `order_id` menyimpan business order code untuk Midtrans (bukan FK numeric ke `orders.id`)

- product_reviews
  - id (PK), product_id, user_id (nullable), author (nullable), rating (tinyint), text, created_at (useCurrent)

- personal_access_tokens (Sanctum)
  - id (PK), tokenable_type/tokenable_id (morphs), name (text), token (unique), abilities (nullable), last_used_at, expires_at (indexed), timestamps

- discounts
  - id (PK), code (unique), description (nullable), amount (decimal(10,2)), start_date (date), end_date (date), timestamps

- cache & cache_locks
  - cache: key (PK), value (text), expiration (int)
  - cache_locks: key (PK), owner, expiration

- jobs, job_batches, failed_jobs
  - tabel sistem queue bawaan Laravel

- sessions, password_reset_tokens
  - tabel sistem session & reset password bawaan Laravel

- pegembalians
  - id (PK), timestamps — placeholder, belum terpakai dalam flow utama

- table_name
  - id (PK), timestamps — placeholder, tidak digunakan

## Relasi & Kardinalitas

- User 1..N Orders
- Order N..1 OrderStatus
- Order 1..N OrderItems
- Order 1..N Cancellations
- Order 1..N ReturnOrders
- Order 0..1 Transaction (konseptual via `transactions.order_id` yang unik per business order)
- OrderItem N..1 Order
- OrderItem 0..1 Product (opsional, tidak ada FK; data snapshot disimpan di kolom nama/gambar/harga)
- Product → Category: tidak ternormalisasi (kolom `category` bertipe string, tidak ada `category_id`)
- Product 1..N ProductReviews; ProductReview N..1 Product
- User 0..N ProductReviews (opsional, `user_id` bisa null bila review anonim)

## Indeks & Constraints Penting

- Unique: users.email, admins.email, admins.username, categories.slug, discounts.code, personal_access_tokens.token, transactions.order_id
- Foreign keys:
  - orders.user_id → users.id
  - orders.status_id → order_statuses.id
  - order_items.order_id → orders.id (on delete cascade)
  - cancellations.order_id → orders.id
  - return_orders.order_id → orders.id
  - product_reviews.product_id (indexed), product_reviews.user_id (opsional tanpa FK eksplisit)

## Catatan Desain

- Shipping: tidak ada tabel shipping di database; rute shipping tampak berasal dari API eksternal, sehingga tidak termasuk dalam desain logis ini.
- Transaksi: `transactions.order_id` menyimpan kode pesanan untuk Midtrans. Jika ingin relasi FK langsung di masa depan, pertimbangkan kolom opsional `order_numeric_id` (FK ke `orders.id`).
- Kategori: untuk normalisasi, pertimbangkan mengganti `products.category` (string) menjadi `products.category_id` (FK ke `categories.id`).
- Produk di OrderItem: relasi ke `products` bersifat opsional; saat ini disimpan sebagai snapshot agar riwayat pesanan tidak berubah ketika data produk di-update.
 - Stok: `orders.stock_deducted_at` menandai waktu pengurangan stok dilakukan untuk order tersebut.
 - OrderItem varian: kolom `variant` menyimpan varian yang dipilih (mis. ukuran/warna) pada saat pemesanan.

## Ringkasan Domain

- Katalog: `products`, `categories`, `discounts` (kode diskon umum tanpa relasi langsung ke produk)
- Pesanan: `orders`, `order_items`, `order_statuses`, `cancellations`, `return_orders`
- Pembayaran: `transactions` (integrasi Midtrans token/status)
- Autentikasi: `users`, `admins`, `personal_access_tokens`, `sessions`, `password_reset_tokens`
- Konten: `settings` (terms, contact, company profile)
- Sistem: `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`
 - Ulasan: `product_reviews` (rating/teks, pengguna opsional)
 
## Quick Import (draw.io)
- Files: `docs/db/erd_nodes.csv` (entity boxes) dan `docs/db/erd_edges.csv` (relations).
- Cara pakai: di draw.io, Insert → Advanced → CSV. Import `erd_nodes.csv` terlebih dahulu sebagai shapes, lalu ulangi untuk `erd_edges.csv` sebagai connectors. Map kolom `label` ke teks shape/konektor.