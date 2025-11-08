<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Admin;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Ambil admin yang sedang login
        $admin = Auth::guard('admin')->user();
        if (!$admin) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        // Contoh data dashboard
        $jumlahUser = \App\Models\User::count();
        $jumlahAdmin = \App\Models\Admin::count();
        // TODO: Tambahkan data lain sesuai kebutuhan (misal: pesanan, produk, dll)
        return response()->json([
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
            ],
            'dashboard' => [
                'jumlah_user' => $jumlahUser,
                'jumlah_admin' => $jumlahAdmin,
            ]
        ]);
    }
}