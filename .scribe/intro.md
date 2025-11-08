# Introduction

<aside>
  <strong>Base URL</strong>: <code>http://127.0.0.1:8000</code>
</aside>

API ini mendukung fitur e-commerce: autentikasi pengguna/admin, manajemen produk, pesanan, pembayaran (Midtrans), pengaturan toko, dan ongkir. Dokumentasi ini merangkum cara pakai endpoint, format respons, serta praktik umum.

## Autentikasi

- Endpoint publik (mis. `settings`, `company-profile`, `ping`) dapat diakses tanpa token.
- Endpoint admin dan sebagian endpoint pengguna membutuhkan login terlebih dahulu (lihat `POST /api/admin/login`, `POST /api/user/login`). Setelah login, kirim header `Authorization: Bearer <token>` pada request selanjutnya.

## Format Respons

- Umumnya menggunakan JSON, dengan pola `{ ok: boolean, data?: any, message?: string }`.
- Error akan menyertakan `message` yang dapat ditampilkan ke pengguna.

## Kelompok Endpoint Utama

- Auth Admin & User: registrasi, login, verifikasi email, reset password.
- Settings Publik & Admin: profil perusahaan, syarat & ketentuan, kontak.
- Produk & Review: CRUD produk (admin), daftar & ulasan produk.
- Pesanan: membuat pesanan (user/admin), update status, nomor resi, total, refund.
- Pembayaran Midtrans: konfigurasi, pembuatan transaksi, webhook.
- Pengiriman: `POST /api/shipping/cost` untuk menghitung biaya kirim.

Catatan: Endpoint pemilihan wilayah (provinsi/kota/kecamatan) tidak digunakan di aplikasi saat ini dan telah dihapus dari dokumentasi.

## Tips Penggunaan

- Gunakan `Accept: application/json` pada semua request.
- Ikuti batasan rate provider eksternal (mis. Midtrans, layanan ongkir).
- Untuk integrasi Frontend, tangani error dan tampilkan pesan dari server kepada pengguna.

<aside>
  Contoh kode tersedia di sisi kanan; ubah bahasa dengan tab yang disediakan.
</aside>

