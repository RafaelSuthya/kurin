# Authenticating requests

Sebagian endpoint memerlukan autentikasi menggunakan Bearer token. Alur umum:

- Admin: `POST /api/admin/login` untuk mendapatkan token.
- User: `POST /api/user/login` untuk mendapatkan token.
- Kirim token pada request berikutnya melalui header `Authorization`.

Header yang diperlukan:

```
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
```

Contoh penggunaan dengan cURL (user login → panggil endpoint terproteksi):

```
# Login user
curl -X POST \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}' \
  http://127.0.0.1:8000/api/user/login

# Misal respons berisi { "ok": true, "token": "<JWT or API token>" }

# Memanggil endpoint yang membutuhkan autentikasi
curl -X GET \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <token>" \
  http://127.0.0.1:8000/api/user/orders
```

Catatan:
- Simpan token dengan aman di sisi klien dan sertakan pada setiap request yang membutuhkan autentikasi.
- Jika token kedaluwarsa/invalid, server akan mengembalikan error yang dapat ditangani di frontend (mis. arahkan pengguna untuk login ulang).
