<?php

namespace App\Http\Controllers\Api;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use App\Http\Controllers\Controller;

class AdminAuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|unique:admins,username',
            'email' => 'required|email|unique:admins,email',
            'password' => 'required|min:6|confirmed',
            'unique_code' => 'required',
        ], [
            'unique_code.required' => 'Kode unik wajib diisi.',
        ]);

        // Validasi nilai kode unik dari environment (privasi, tidak di-hardcode)
        $expected = env('ADMIN_REGISTRATION_CODE');
        if (!is_string($expected) || trim($expected) === '') {
            // Fallback: jika env kosong, anggap gagal untuk keamanan
            return response()->json(['error' => 'Invalid unique code.'], 422);
        }
        if ((string) $request->unique_code !== (string) $expected) {
            return response()->json(['error' => 'Invalid unique code.'], 422);
        }

        $admin = Admin::create([
            'name' => $request->username,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        try {
            event(new Registered($admin));
        } catch (\Throwable $e) {
            // Abaikan error pengiriman email verifikasi pada lingkungan lokal
        }

        // Fallback: kirimkan URL verifikasi di respons agar bisa diverifikasi manual
        $verificationUrl = URL::temporarySignedRoute(
            'admin.verification.verify',
            now()->addMinutes(60),
            [
                'id' => $admin->getKey(),
                'hash' => sha1($admin->getEmailForVerification()),
            ]
        );

        return response()->json([
            'message' => 'Registration successful. Please check your email for verification link.',
            'verification_url' => $verificationUrl,
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $admin = Admin::where('email', $request->email)->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            return response()->json(['error' => 'Invalid credentials.'], 401);
        }

        if (!$admin->hasVerifiedEmail()) {
            return response()->json(['error' => 'Email not verified.'], 403);
        }

        Auth::guard('admin')->login($admin);

        $token = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'admin' => $admin,
        ]);
    }

    public function verifyEmail(Request $request, $id, $hash)
    {
        $admin = Admin::findOrFail($id);

        if (!hash_equals((string) $hash, sha1($admin->email))) {
            return response()->json(['error' => 'Invalid verification link.'], 403);
        }

        if (!$admin->hasVerifiedEmail()) {
            $admin->markEmailAsVerified();
            event(new Verified($admin));
        }

        return response()->json(['message' => 'Email verified!']);
    }

    public function resendVerification(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $admin = Admin::where('email', $request->email)->first();
        if (! $admin) {
            return response()->json(['error' => 'Admin not found.'], 404);
        }

        if ($admin->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        try {
            $admin->sendEmailVerificationNotification();
        } catch (\Throwable $e) {
            // ignore mail errors in local env
        }

        $verificationUrl = URL::temporarySignedRoute(
            'admin.verification.verify',
            now()->addMinutes(60),
            [
                'id' => $admin->getKey(),
                'hash' => sha1($admin->getEmailForVerification()),
            ]
        );

        return response()->json([
            'message' => 'Verification email resent. Please check your inbox.',
            'verification_url' => $verificationUrl,
        ]);
    }
}