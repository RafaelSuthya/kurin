<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\Setting;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        $admin = Auth::user();
        if (!$admin) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $setting = Setting::first();
        if (!$setting) {
            $setting = Setting::create([
                'terms_conditions' => '',
                'contact_help' => '',
                'company_profile' => json_encode([]),
            ]);
        }
        $companyProfile = json_decode($setting->company_profile ?: '{}', true);

        return response()->json([
            'settings' => [
                'terms' => $setting->terms_conditions,
                'contact' => $setting->contact_help,
                'company_profile' => $companyProfile,
                'profile' => [
                    'name' => $admin->name ?? 'Admin',
                    'email' => $admin->email ?? 'admin@example.com',
                ],
            ],
        ]);
    }

    public function updateTerms(Request $request)
    {
        $terms = (string) $request->input('terms_conditions', '');
        $setting = Setting::firstOrCreate([], []);
        $setting->terms_conditions = $terms;
        $setting->save();
        return response()->json(['message' => 'Terms updated', 'terms_conditions' => $setting->terms_conditions]);
    }

    public function updateContact(Request $request)
    {
        $contact = (string) $request->input('contact_help', '');
        $setting = Setting::firstOrCreate([], []);
        $setting->contact_help = $contact;
        $setting->save();
        return response()->json(['message' => 'Contact updated', 'contact_help' => $setting->contact_help]);
    }

    public function updateProfile(Request $request)
    {
        $profile = $request->input('company_profile');
        $setting = Setting::firstOrCreate([], []);
        if (is_array($profile)) {
            $setting->company_profile = json_encode($profile);
        } elseif (is_string($profile)) {
            $setting->company_profile = $profile;
        } else {
            $setting->company_profile = json_encode([]);
        }
        $setting->save();

        $decoded = json_decode($setting->company_profile ?: '{}', true);
        return response()->json(['message' => 'Profile updated', 'company_profile' => $decoded]);
    }

    // API publik untuk halaman Company Profile
    public function publicCompanyProfile()
    {
        $setting = Setting::first();
        $decoded = json_decode(optional($setting)->company_profile ?: '{}', true);
        return response()->json(['company_profile' => $decoded]);
    }

    // Endpoint publik untuk mengambil kontak bantuan
    public function publicContact()
    {
        $setting = Setting::first();
        $raw = $setting?->contact_help ?: '';
        $data = [];
        try { $data = json_decode($raw, true) ?: []; } catch (\Throwable $e) { $data = []; }

        // Nilai default jika belum ada
        $defaults = [
            'image' => '/kurin.png',
            'hero_title' => 'KONTAK KURIN',
            'hero_subtitle' => '',
            'phone' => '+62 858-8886-2104',
            'email' => 'kurinhousehold@gmail.com',
            'address' => 'Jalan Kedoya Raya (Kedoya Pesing No.12-16 2, RT.2/RW.7, Kedoya Utara, Kec. Kb. Jeruk, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11520)',
            'social' => 'Instagram / Facebook',
            'map_query' => 'Jalan Kedoya Raya (Kedoya Pesing No.12-16 2, RT.2/RW.7, Kedoya Utara, Kec. Kb. Jeruk, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11520)',
            'map_zoom' => 16,
        ];
        $contact = array_merge($defaults, is_array($data) ? $data : []);
        return response()->json(['contact' => $contact]);
    }

    // Endpoint publik untuk mengambil Syarat & Ketentuan
    public function publicTerms()
    {
        $setting = Setting::first();
        $terms = $setting?->terms_conditions ?: '';

        // Default konten jika belum diisi admin
        $defaultHtml = '<section><h2>Pembatalan Pesanan</h2><ul><li>Pembatalan hanya bisa dilakukan saat status masih <strong>Belum Bayar (Pending)</strong>.</li><li>Setelah pembayaran berhasil (<strong>Diproses</strong> atau seterusnya), pesanan tidak dapat dibatalkan.</li><li>Ajukan pembatalan melalui halaman <strong>Pesanan → Batal</strong> dan tunggu keputusan admin.</li></ul></section>'
            .'<section><h2>Pengembalian Dana (Refund)</h2><ul><li>Refund untuk produk rusak/cacat/tidak sesuai deskripsi.</li><li>Ajukan via <strong>Pesanan → Refund</strong> dengan <strong>foto bukti</strong> dan <strong>alasan jelas</strong>.</li><li>Admin memverifikasi dan dapat menyetujui/menolak.</li></ul></section>'
            .'<section><h2>Pembayaran</h2><ul><li>Metode Midtrans: Kartu Kredit, VA, GoPay, ShopeePay, QRIS, dll.</li><li>Total bayar = total produk + ongkir.</li><li>Jika berhasil, status menjadi <strong>Diproses</strong>.</li></ul></section>'
            .'<section><h2>Pengiriman</h2><ul><li>Admin memperbarui nomor resi untuk pelacakan.</li><li>Status: <strong>Diproses → Dikirim → Sampai</strong>.</li></ul></section>'
            .'<section><h2>Privasi Data</h2><ul><li>Data digunakan untuk pemrosesan pesanan dan pengiriman.</li><li>Kurin melindungi data pribadi sesuai ketentuan.</li></ul></section>'
            .'<section><h2>Perubahan Syarat & Ketentuan</h2><ul><li>Kebijakan dapat diperbarui sewaktu-waktu.</li><li>Dengan menggunakan layanan, Anda menyetujui ketentuan yang berlaku.</li></ul></section>';

        $html = trim($terms) !== '' ? $terms : $defaultHtml;
        return response()->json(['terms_html' => $html]);
    }

    public function uploadContactImage(Request $request)
    {
        $admin = Auth::user();
        if (!$admin) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
    
        if (!$request->hasFile('hero_image')) {
            return response()->json(['error' => 'No file uploaded.'], 422);
        }
    
        $request->validate([
            'hero_image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:4096'
        ]);
    
        $file = $request->file('hero_image');
        $path = $file->store('contact', 'public'); // e.g., contact/xxx.png
        $url = asset('storage/' . $path);
        $publicPath = '/storage/' . $path;
    
        $setting = Setting::firstOrCreate([], []);
        $raw = $setting->contact_help ?: '';
        $data = [];
        try { $data = json_decode($raw, true) ?: []; } catch (\Throwable $e) { $data = []; }
        $data['image'] = $publicPath;
        $setting->contact_help = json_encode($data);
        $setting->save();
    
        return response()->json([
            'message' => 'Image uploaded',
            'path' => $publicPath,
            'url' => $url,
        ]);
    }

    public function uploadProfileImage(Request $request)
    {
        $admin = Auth::user();
        if (!$admin) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (!$request->hasFile('hero_image')) {
            return response()->json(['error' => 'No file uploaded.'], 422);
        }

        $request->validate([
            'hero_image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:4096'
        ]);

        $file = $request->file('hero_image');
        $path = $file->store('profile', 'public'); // e.g., profile/xxx.png
        $url = asset('storage/' . $path);
        $publicPath = '/storage/' . $path;

        $setting = Setting::firstOrCreate([], []);
        $raw = $setting->company_profile ?: '{}';
        $data = [];
        try { $data = json_decode($raw, true) ?: []; } catch (\Throwable $e) { $data = []; }
        $data['heroImageUrl'] = $publicPath;
        $setting->company_profile = json_encode($data);
        $setting->save();

        return response()->json([
            'message' => 'Image uploaded',
            'path' => $publicPath,
            'url' => $url,
        ]);
    }
}