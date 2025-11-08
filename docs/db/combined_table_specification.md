# Combined Table Specification (User & Admin)

This document provides a consolidated view of the database schema, merging the logical designs for both the customer-facing (User) and back-office (Admin) domains of the e-commerce application.

## 1. Authentication & Authorization

### `users`
* **Purpose**: Stores customer account data, including credentials and profile information.
* **Attributes**:
  - `id` (PK, bigint): Unique identifier for the user.
  - `name` (string): User's full name.
  - `email` (string, unique): User's email address, used for login and communication.
  - `password` (string): Hashed password for authentication.
  - `email_verified_at` (timestamp, nullable): Timestamp of email verification.
  - `two_factor_secret` (text, nullable): Secret key for 2FA.
  - `two_factor_recovery_codes` (text, nullable): Recovery codes for 2FA.
  - `two_factor_confirmed_at` (timestamp, nullable): Timestamp of 2FA confirmation.
  - `remember_token` (string, nullable): Token for "remember me" functionality.
  - `created_at` / `updated_at` (timestamps): Record timestamps.

### `admins`
* **Purpose**: Stores administrator account data for back-office access.
* **Attributes**:
  - `id` (PK, bigint): Unique identifier for the admin.
  - `name` (string): Admin's full name.
  - `username` (string, unique, nullable): Unique username for login.
  - `email` (string, unique): Admin's email address.
  - `password` (string): Hashed password.
  - `email_verified_at` (timestamp, nullable): Timestamp of email verification.
  - `created_at` / `updated_at` (timestamps): Record timestamps.

### `personal_access_tokens`
* **Purpose**: Manages API tokens (Sanctum) for both `users` and `admins`.
* **Attributes**:
  - `id` (PK, bigint): Unique identifier for the token.
  - `tokenable_type` (string): The model class of the token owner (e.g., `App\Models\User`).
  - `tokenable_id` (bigint): The ID of the token owner.
  - `name` (text): Name of the token.
  - `token` (string(64), unique): The token value.
  - `abilities` (text, nullable): JSON array of token abilities/permissions.
  - `last_used_at` (timestamp, nullable): Timestamp of the last token usage.
  - `expires_at` (timestamp, nullable): Token expiration date.
  - `created_at` / `updated_at` (timestamps): Record timestamps.

## 2. Product Catalog

### `categories`
* **Purpose**: Organizes products into hierarchical groups.
* **Attributes**:
  - `id` (PK, bigint): Unique identifier for the category.
  - `name` (string): Category name.
  - `slug` (string, unique): URL-friendly identifier for the category.
  - `created_at` / `updated_at` (timestamps): Record timestamps.

### `products`
* **Purpose**: Stores all product information, including details, pricing, and inventory.
* **Attributes**:
  - `id` (PK, bigint): Unique identifier for the product.
  - `name` (string): Product title.
  - `description` (text, nullable): Detailed product description.
  - `category` (string, nullable): **Note**: Denormalized. Recommended to be `category_id` (FK).
  - `price` (decimal(12,2)): Base price of the product.
  - `stock` (integer, default 0): Available quantity.
  - `images` (json, nullable): JSON array of image paths.
  - `variants` (json, nullable): JSON object for product variations (e.g., size, color).
  - `weight` (decimal(8,2), nullable): Product weight for shipping calculations.
  - `length` / `width` / `height` (decimal(8,2), nullable): Product dimensions.
  - `discount_price` (decimal(12,2), nullable): Price after discount.
  - `discount_percent` (decimal(5,2), nullable): Discount percentage.
  - `discount_active` (boolean, default false): Whether the discount is currently active.
  - `discount_start` / `discount_end` (date, nullable): Validity period for the discount.
  - `created_at` / `updated_at` (timestamps): Record timestamps.

### `product_reviews`
* **Purpose**: Stores user-written product reviews for catalog items.
* **Attributes**:
  - `id` (PK, bigint): Unique identifier for the review.
  - `product_id` (bigint, indexed): References `products.id`.
  - `user_id` (bigint, nullable): References `users.id` when available.
  - `author` (string, nullable): Free-text reviewer name if not linked to user.
  - `rating` (tinyint): Star rating (e.g., 1–5).
  - `text` (text): Review body.
  - `created_at` (timestamp): Creation time (use current).

### `discounts`
* **Purpose**: Stores promotional codes managed by admins.
* **Attributes**:
  - `id` (PK, bigint): Unique identifier for the discount.
  - `code` (string, unique): The promo code to be used by customers.
  - `description` (string, nullable): Details about the discount.
  - `amount` (decimal(10,2)): The value of the discount.
  - `start_date` / `end_date` (date): Validity period.
  - `created_at` / `updated_at` (timestamps): Record timestamps.

## 3. Order Management

### `order_statuses`
* **Purpose**: Defines the possible states of an order (e.g., pending, paid, shipped).
* **Attributes**:
  - `id` (PK, bigint): Unique identifier for the status.
  - `name` (string): The status name.
  - `description` (string, nullable): Explanation of the status.
  - `created_at` / `updated_at` (timestamps): Record timestamps.

### `orders`
* **Purpose**: Main table for customer orders.
* **Attributes**:
  - `id` (PK, bigint): Unique identifier for the order.
  - `user_id` (FK, bigint): References `users.id`.
  - `status_id` (FK, bigint): References `order_statuses.id`.
  - `total` (decimal(15,2)): The final amount of the order.
  - `order_date` (date): Date the order was placed.
  - `stock_deducted_at` (timestamp, nullable): When inventory was deducted.
  - `buyer_name` / `buyer_phone` / `buyer_address` (string/text, nullable): Buyer's shipping information.
  - `tracking_number` (string, nullable): Shipping tracking code.
  - `created_at` / `updated_at` (timestamps): Record timestamps.

### `order_items`
* **Purpose**: Stores individual items within an order (line items).
* **Attributes**:
  - `id` (PK, bigint): Unique identifier for the line item.
  - `order_id` (FK, bigint): References `orders.id` (on delete cascade).
  - `product_id` (FK, bigint, nullable): References `products.id`. Nullable to keep a snapshot.
  - `product_name` (string): Snapshot of the product name at the time of order.
  - `product_image` (string, nullable): Snapshot of the product image.
  - `variant` (string, nullable): Selected variant at the time of order.
  - `price` (decimal(12,2)): Price of a single unit.
  - `quantity` (unsigned integer): Number of units ordered.
  - `created_at` / `updated_at` (timestamps): Record timestamps.

## 4. Post-Order Processes

### `cancellations`
* **Purpose**: Tracks order cancellation requests.
* **Attributes**:
  - `id` (PK, bigint): Unique identifier for the cancellation.
  - `order_id` (FK, bigint): References `orders.id`.
  - `reason` (text, nullable): Justification for cancellation.
  - `cancellation_date` (date): Date of request.
  - `initiator` (string, default 'buyer'): Who started the request (`buyer` or `seller`).
  - `decision` (string, nullable): Admin's decision (`approved`, `rejected`).
  - `created_at` / `updated_at` (timestamps): Record timestamps.

### `return_orders`
* **Purpose**: Tracks order return and refund requests.
* **Attributes**:
  - `id` (PK, bigint): Unique identifier for the return.
  - `order_id` (FK, bigint): References `orders.id`.
  - `reason` (text, nullable): Justification for return.
  - `return_date` (date): Date of request.
  - `photo_path` / `video_path` (string, nullable): Path to evidence files.
  - `decision` (string, nullable): Admin's decision (`approved`, `rejected`).
  - `created_at` / `updated_at` (timestamps): Record timestamps.

### `transactions`
* **Purpose**: Logs payment gateway transactions (Midtrans).
* **Attributes**:
  - `id` (PK, bigint): Unique identifier for the transaction log.
  - `order_id` (string, unique): Business code for the order, used by Midtrans.
  - `amount` (decimal(10,2)): Transaction amount.
  - `status` (string, default 'pending'): Payment status from Midtrans.
  - `snap_token` (string, nullable): Midtrans Snap token for the payment page.
  - `created_at` / `updated_at` (timestamps): Record timestamps.

## 5. Application & System

### `settings`
* **Purpose**: Stores global, admin-managed content like T&C and company profile.
* **Attributes**:
  - `id` (PK, bigint): Unique identifier.
  - `terms_conditions` / `contact_help` / `company_profile` (text, nullable): Static content.
  - `created_at` / `updated_at` (timestamps): Record timestamps.

### System Tables (Laravel Built-in)
* `cache` & `cache_locks`: Application cache.
* `jobs`, `job_batches`, `failed_jobs`: Queue and background job management.
* `sessions`: User session data.
* `password_reset_tokens`: Tokens for password reset functionality.
* `migrations`: Database migration history.

---

## Spesifikasi Tabel (Format Seperti Contoh)

Catatan kolom: "Nullvalue" = apakah kolom boleh `NULL`; "Multivalue" = apakah kolom menampung banyak nilai (array/JSON); "Composite" = atribut gabungan dari beberapa kolom.

### Users
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key user | bigint | No | No | No |
| name | Nama user | string | No | No | No |
| email | Email unik untuk login | string | No | No | No |
| password | Password ter-hash | string | No | No | No |
| email_verified_at | Waktu verifikasi email | timestamp | Yes | No | No |
| two_factor_secret | Secret 2FA | text | Yes | No | No |
| two_factor_recovery_codes | Recovery codes 2FA | text | Yes | Yes | No |
| two_factor_confirmed_at | Waktu konfirmasi 2FA | timestamp | Yes | No | No |
| remember_token | Token remember me | string | Yes | No | No |
| created_at / updated_at | Timestamps | timestamp | No | No | No |

### Admins
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key admin | bigint | No | No | No |
| name | Nama admin | string | No | No | No |
| username | Username unik admin | string | Yes | No | No |
| email | Email unik admin | string | No | No | No |
| password | Password ter-hash | string | No | No | No |
| email_verified_at | Waktu verifikasi email | timestamp | Yes | No | No |
| created_at / updated_at | Timestamps | timestamp | No | No | No |

### PersonalAccessTokens
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key token | bigint | No | No | No |
| tokenable_type | Tipe pemilik token (model class) | string | No | No | No |
| tokenable_id | ID pemilik token | bigint | No | No | No |
| name | Nama token | text | No | No | No |
| token | Nilai token (unik) | string(64) | No | No | No |
| abilities | Daftar abilities | text | Yes | Yes | No |
| last_used_at | Terakhir digunakan | timestamp | Yes | No | No |
| expires_at | Kedaluwarsa | timestamp | Yes | No | No |
| created_at / updated_at | Timestamps | timestamp | No | No | No |

### Categories
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key kategori | bigint | No | No | No |
| name | Nama kategori | string | No | No | No |
| slug | Slug unik kategori | string | No | No | No |
| created_at / updated_at | Timestamps | timestamp | No | No | No |

### Products
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key produk | bigint | No | No | No |
| name | Nama produk | string | No | No | No |
| description | Deskripsi produk | text | Yes | No | No |
| category | Nama kategori (denormalisasi) | string | Yes | No | No |
| stock | Stok tersedia | int | No | No | No |
| price | Harga dasar | decimal(12,2) | No | No | No |
| images | Daftar gambar produk | json | Yes | Yes | No |
| variants | Variasi produk (size/color) | json | Yes | Yes | No |
| weight | Berat produk | decimal(8,2) | Yes | No | No |
| length | Panjang produk | decimal(8,2) | Yes | No | No |
| width | Lebar produk | decimal(8,2) | Yes | No | No |
| height | Tinggi produk | decimal(8,2) | Yes | No | No |
| discount_price | Harga setelah diskon | decimal(12,2) | Yes | No | No |
| discount_percent | Persen diskon | decimal(5,2) | Yes | No | No |
| discount_active | Status diskon aktif | boolean | No | No | No |
| discount_start | Tanggal mulai diskon | date | Yes | No | No |
| discount_end | Tanggal akhir diskon | date | Yes | No | No |
| created_at / updated_at | Timestamps | timestamp | No | No | No |

### ProductReviews
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key ulasan | bigint | No | No | No |
| product_id | Referensi ke produk | bigint | No | No | No |
| user_id | Referensi ke user (opsional) | bigint | Yes | No | No |
| author | Nama penulis bebas | string | Yes | No | No |
| rating | Skor ulasan (1–5) | tinyint | No | No | No |
| text | Konten ulasan | text | No | No | No |
| created_at | Waktu dibuat | timestamp | No | No | No |

### Discounts
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key diskon | bigint | No | No | No |
| code | Kode diskon unik | string | No | No | No |
| description | Deskripsi diskon | string | Yes | No | No |
| amount | Nilai diskon | decimal(10,2) | No | No | No |
| start_date | Mulai berlaku | date | No | No | No |
| end_date | Berakhir | date | No | No | No |
| created_at / updated_at | Timestamps | timestamp | No | No | No |

### OrderStatuses
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key status | bigint | No | No | No |
| name | Nama status | string | No | No | No |
| description | Deskripsi status | string | Yes | No | No |
| created_at / updated_at | Timestamps | timestamp | No | No | No |

### Orders
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key order | bigint | No | No | No |
| user_id | FK ke users.id | bigint | No | No | No |
| status_id | FK ke order_statuses.id | bigint | No | No | No |
| total | Total pembayaran | decimal(15,2) | No | No | No |
| order_date | Tanggal order | date | No | No | No |
| stock_deducted_at | Waktu pengurangan stok | timestamp | Yes | No | No |
| buyer_name | Nama penerima | string | Yes | No | No |
| buyer_phone | No. telepon penerima | string | Yes | No | No |
| buyer_address | Alamat penerima | text | Yes | No | No |
| tracking_number | Nomor resi | string | Yes | No | No |
| created_at / updated_at | Timestamps | timestamp | No | No | No |

### OrderItems
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key item | bigint | No | No | No |
| order_id | FK ke orders.id (cascade) | bigint | No | No | No |
| product_id | FK ke products.id | bigint | Yes | No | No |
| product_name | Snapshot nama produk | string | No | No | No |
| product_image | Snapshot gambar produk | string | Yes | No | No |
| variant | Varian terpilih (opsional) | string | Yes | No | No |
| price | Harga per unit | decimal(12,2) | No | No | No |
| quantity | Jumlah unit | unsigned int | No | No | No |
| created_at / updated_at | Timestamps | timestamp | No | No | No |

### Cancellations
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key pembatalan | bigint | No | No | No |
| order_id | FK ke orders.id | bigint | No | No | No |
| reason | Alasan pembatalan | text | Yes | No | No |
| cancellation_date | Tanggal pengajuan | date | No | No | No |
| initiator | Pengaju (buyer/seller) | string | No | No | No |
| decision | Keputusan admin | string | Yes | No | No |
| created_at / updated_at | Timestamps | timestamp | No | No | No |

### ReturnOrders
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key retur | bigint | No | No | No |
| order_id | FK ke orders.id | bigint | No | No | No |
| reason | Alasan retur | text | Yes | No | No |
| return_date | Tanggal pengajuan | date | No | No | No |
| photo_path | Path foto bukti | string | Yes | No | No |
| video_path | Path video bukti | string | Yes | No | No |
| decision | Keputusan admin | string | Yes | No | No |
| created_at / updated_at | Timestamps | timestamp | No | No | No |

### Transactions
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key transaksi | bigint | No | No | No |
| order_id | Kode bisnis order (unik) | string | No | No | No |
| amount | Nilai transaksi | decimal(10,2) | No | No | No |
| status | Status pembayaran | string | No | No | No |
| snap_token | Token Snap Midtrans | string | Yes | No | No |
| created_at / updated_at | Timestamps | timestamp | No | No | No |

### Settings
| Attributes | Deskripsi | Data Types | Nullvalue | Multivalue | Composite |
|---|---|---|---|---|---|
| id | Primary key setting | bigint | No | No | No |
| terms_conditions | Konten syarat & ketentuan | text | Yes | No | No |
| contact_help | Konten bantuan kontak | text | Yes | No | No |
| company_profile | Profil perusahaan | text | Yes | No | No |
| created_at / updated_at | Timestamps | timestamp | No | No | No |