# Admin Logical Database Design

Scope: sudut pandang modul Admin. Shipping area tidak termasuk; nomor resi (`tracking_number`) disimpan di tabel `orders`.

## Spesifikasi Tabel (tipe, nullability, indeks)

### admins
- PK: `id` (bigint)
- Kolom: `name` (string, req), `username` (string, nullable, unique), `email` (string, unique), `password` (string, req), `email_verified_at` (timestamp, nullable), `created_at`/`updated_at` (timestamps)
- Indeks/unik: `email` unique, `username` unique
- Catatan: akun admin untuk login panel dan API; memanfaatkan verifikasi email

### personal_access_tokens (Sanctum)
- PK: `id` (bigint)
- Kolom: `tokenable_type` (string), `tokenable_id` (bigint), `name` (text), `token` (string(64), unique), `abilities` (text, nullable), `last_used_at` (timestamp, nullable), `expires_at` (timestamp, nullable, indexed), `created_at`/`updated_at` (timestamps)
- Relasi: N..1 polimorfik ke `admins` (dan juga `users`) melalui `tokenable_type`/`tokenable_id`

### settings
- PK: `id` (bigint)
- Kolom: `terms_conditions` (text, nullable), `contact_help` (text, nullable), `company_profile` (text, nullable), `created_at`/`updated_at` (timestamps)
- Catatan: konten statis dikelola admin

### categories
- PK: `id` (bigint)
- Kolom: `name` (string, req), `slug` (string, unique), `created_at`/`updated_at` (timestamps)
- Indeks/unik: `slug` unique

### products
- PK: `id` (bigint)
- Kolom inti: `name` (string), `description` (text, nullable), `category` (string, nullable), `stock` (int, default 0), `price` (decimal(12,2), default 0), `images` (json, nullable), `variants` (json, nullable)
- Dimensi: `weight` (decimal(8,2), nullable), `length` (decimal(8,2), nullable), `width` (decimal(8,2), nullable), `height` (decimal(8,2), nullable)
- Diskon: `discount_price` (decimal(12,2), nullable), `discount_percent` (decimal(5,2), nullable), `discount_active` (boolean, default false), `discount_start` (date, nullable), `discount_end` (date, nullable)
- Timestamps: `created_at`/`updated_at`
- Relasi: (opsional, konseptual) N..1 ke `categories` via `category_id`

### discounts
- PK: `id` (bigint)
- Kolom: `code` (string, unique), `description` (string, nullable), `amount` (decimal(10,2)), `start_date` (date), `end_date` (date), `created_at`/`updated_at` (timestamps)
- Indeks/unik: `code` unique

### order_statuses
- PK: `id` (bigint)
- Kolom: `name` (string, req), `description` (string, nullable), `created_at`/`updated_at` (timestamps)
- Relasi: 1..N ke `orders`

### orders
- PK: `id` (bigint)
- Kolom inti: `user_id` (bigint, FK -> `users.id`), `status_id` (bigint, FK -> `order_statuses.id`), `total` (decimal(15,2)), `order_date` (date), `stock_deducted_at` (timestamp, nullable), `created_at`/`updated_at` (timestamps)
- Kolom buyer/logistik: `buyer_name` (string, nullable), `buyer_phone` (string, nullable), `buyer_address` (text, nullable), `tracking_number` (string, nullable)
 
- Relasi: N..1 ke `users`, N..1 ke `order_statuses`, 1..N ke `order_items`, `cancellations`, `return_orders`; 1..1 (konseptual) ke `transactions`

### order_items
- PK: `id` (bigint)
- Kolom: `order_id` (bigint, FK -> `orders.id`, cascade), `product_id` (bigint, nullable), `product_name` (string), `product_image` (string, nullable), `variant` (string, nullable), `price` (decimal(12,2)), `quantity` (unsigned int), `created_at`/`updated_at` (timestamps)
- Relasi: N..1 ke `orders`; (opsional) N..1 ke `products` via `product_id`

### cancellations
- PK: `id` (bigint)
- Kolom: `order_id` (bigint, FK -> `orders.id`), `reason` (text, nullable), `cancellation_date` (date), `created_at`/`updated_at` (timestamps)
- Tambahan: `initiator` (string, default 'buyer'), `decision` (string, nullable)
- Relasi: N..1 ke `orders`

### return_orders
- PK: `id` (bigint)
- Kolom: `order_id` (bigint, FK -> `orders.id`), `reason` (text, nullable), `return_date` (date), `photo_path` (string, nullable), `video_path` (string, nullable), `decision` (string, nullable), `created_at`/`updated_at` (timestamps)
- Relasi: N..1 ke `orders`

### transactions (Midtrans)
- PK: `id` (bigint)
- Kolom: `order_id` (string, unique), `amount` (decimal(10,2)), `status` (string, default 'pending'), `snap_token` (string, nullable), `created_at`/`updated_at` (timestamps)
- Relasi: 1..1 (konseptual) ke `orders` berdasarkan business order reference

### users (referensi)
- PK: `id` (bigint)
- Kolom: `name` (string), `email` (string, unique), `password` (string), `email_verified_at` (timestamp, nullable), 2FA kolom (opsional), `remember_token` (string, nullable), `created_at`/`updated_at` (timestamps)

### product_reviews
- PK: `id` (bigint)
- Kolom: `product_id` (bigint, indexed), `user_id` (bigint, nullable), `author` (string, nullable), `rating` (tinyint), `text` (text), `created_at` (timestamp, useCurrent)
- Relasi: N..1 ke `products`; (opsional) N..1 ke `users`

### system tables
- `cache` (key PK, value text, expiration int), `cache_locks` (key PK, owner, expiration)
- `jobs`, `job_batches`, `failed_jobs` (tabel queue Laravel)
- `sessions`, `password_reset_tokens` (tabel sistem autentikasi)

## Relasi & Kardinalitas
- Admins 1..N PersonalAccessTokens (polimorfik `tokenable`)
- Categories 1..N Products (konseptual bila dinormalisasi)
- Users 1..N Orders
- OrderStatuses 1..N Orders
- Orders 1..N OrderItems
- Orders 1..N Cancellations
- Orders 1..N ReturnOrders
- Orders 1..1 Transactions (konseptual)
- Products 1..N OrderItems (opsional via `product_id`)

## Indeks & Constraints
- Unique: `admins.email`, `admins.username`, `categories.slug`, `discounts.code`, `personal_access_tokens.token`, `users.email`, `transactions.order_id`
- Foreign keys:
  - `orders.user_id` → `users.id`
  - `orders.status_id` → `order_statuses.id`
  - `order_items.order_id` → `orders.id` (cascade)
  - `cancellations.order_id` → `orders.id`
  - `return_orders.order_id` → `orders.id`
  - `product_reviews.product_id` (index), `product_reviews.user_id` (opsional)

## Catatan Implementasi
- Audit Admin: bila perlu jejak perubahan, tambahkan `created_by_admin_id`/`updated_by_admin_id` (FK ke `admins`) pada tabel operasional.
- Normalisasi kategori: ganti `products.category` (string) dengan `products.category_id` (FK).
- Transaksi: pertimbangkan `transactions.order_numeric_id` (FK → `orders.id`) sambil tetap simpan string `order_reference` untuk gateway.
 

## Quick Import (draw.io)
- File: `docs/db/erd_admin_nodes.csv` (entities) dan `docs/db/erd_admin_edges.csv` (relations).
- Cara pakai: Insert → Advanced → CSV. Import nodes sebagai shapes, kemudian edges sebagai connectors. Map `label` sebagai teks shape/konektor.