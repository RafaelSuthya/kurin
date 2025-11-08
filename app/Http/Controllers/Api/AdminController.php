<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    public function register(Request $request) 
    { 
        // Validasi data 
        $validator = Validator::make($request->all(), [ 
            'name' => 'required|string|max:255', 
            'email' => 'required|email|unique:admins', 
            'password' => 'required|min:6|confirmed' 
        ]); 
 
        if ($validator->fails()) { 
            return response()->json([ 
                'error' => $validator->errors()->first() 
            ], 422); 
        } 
 
        try { 
            // Create admin 
            $admin = Admin::create([ 
                'name' => $request->name, 
                'email' => $request->email, 
                'password' => Hash::make($request->password) 
            ]); 
 
            // Generate token 
            $token = $admin->createToken('auth_token')->plainTextToken; 
 
            return response()->json([ 
                'success' => true, 
                'message' => 'Admin registered successfully', 
                'data' => $admin, 
                'access_token' => $token, 
                'token_type' => 'Bearer' 
            ], 201); 
        } catch (\Exception $e) { 
            return response()->json([ 
                'success' => false, 
                'message' => 'Registration failed', 
                'error' => $e->getMessage() 
            ], 500); 
        } 
    }
    
    public function login(Request $request) 
    { 
        // Validasi data 
        $validator = Validator::make($request->all(), [ 
            'email' => 'required|email', 
            'password' => 'required' 
        ]); 
 
        if ($validator->fails()) { 
            return response()->json([ 
                'error' => $validator->errors()->first() 
            ], 422); 
        } 
 
        try { 
            // Cari admin berdasarkan email
            $admin = Admin::where('email', $request->email)->first();
            if (! $admin) {
                return response()->json([
                    'success' => false,
                    'error' => 'Admin not found.'
                ], 404);
            }

            // Verifikasi password secara eksplisit (tanpa bergantung pada session guard)
            $valid = false;
            try {
                $valid = Hash::check($request->password, $admin->password);
            } catch (\RuntimeException $e) {
                // Fallback ke native password_verify untuk jaga-jaga
                $valid = password_verify($request->password, $admin->password);
            }

            if (! $valid) {
                return response()->json([
                    'success' => false,
                    'error' => 'Incorrect password.'
                ], 401);
            }

            // Rehash ke algoritma aktif bila diperlukan
            if (Hash::needsRehash($admin->password)) {
                $admin->password = Hash::make($request->password);
                $admin->save();
            }
 
            // Buat token Sanctum untuk autentikasi API
            $token = $admin->createToken('auth_token')->plainTextToken; 
 
            return response()->json([ 
                'success' => true,
                'message' => 'Admin logged in successfully',
                'data' => $admin,
                'access_token' => $token,
                'token_type' => 'Bearer'
            ], 200);
        } catch (\Exception $e) { 
            return response()->json([ 
                'success' => false, 
                'message' => 'Login failed', 
                'error' => $e->getMessage() 
            ], 500); 
        } 
    }
}
