<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class UserAuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        // Buat URL verifikasi sederhana berbasis hash email
        $verificationUrl = url('/api/user/email/verify/' . $user->id . '/' . sha1($user->email));

        // Kirim email verifikasi sederhana (raw)
        try {
            Mail::raw("Verify your email: $verificationUrl", function ($message) use ($user) {
                $message->to($user->email)->subject('Verify your email address');
            });
        } catch (\Throwable $e) {
            // Abaikan error mail pada lingkungan lokal, tetap kembalikan URL verifikasi
        }

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

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        $valid = false;
        try {
            $valid = Hash::check($request->password, $user->password);
        } catch (\RuntimeException $e) {
            // Fallback ke native password_verify agar mendukung bcrypt/argon2
            $valid = password_verify($request->password, $user->password);
        }

        if (!$valid) {
            // Coba verifikasi native jika sebelumnya gagal
            if (! password_verify($request->password, $user->password)) {
                return response()->json(['error' => 'Incorrect password.'], 401);
            }
        }

        if (!$user->hasVerifiedEmail()) {
            return response()->json(['error' => 'Email not verified.'], 403);
        }

        // Rehash ke driver aktif bila perlu
        if (Hash::needsRehash($user->password)) {
            $user->password = Hash::make($request->password);
            $user->save();
        }

        $token = $user->createToken('user-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function verifyEmail(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);

        if (!hash_equals((string) $hash, sha1($user->email))) {
            return response()->json(['error' => 'Invalid verification link.'], 403);
        }

        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return response()->json(['message' => 'Email verified!']);
    }

    // ===== Forgot & Reset Password (API) =====
    public function requestPasswordReset(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        // Token sederhana untuk lingkungan dev (hash email + password saat ini)
        $hash = sha1($user->email . '|' . $user->password);
        $resetUrl = url('/api/user/password/reset/' . $user->id . '/' . $hash);

        try {
            Mail::raw("Reset your password: $resetUrl", function ($message) use ($user) {
                $message->to($user->email)->subject('Reset your password');
            });
        } catch (\Throwable $e) {
            // Abaikan error mail pada dev
        }

        return response()->json([
            'message' => 'Reset link sent.',
            'reset_url' => $resetUrl,
        ]);
    }

    public function validateResetLink(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);
        $expected = sha1($user->email . '|' . $user->password);
        if (!hash_equals($expected, (string) $hash)) {
            return response()->json(['error' => 'Invalid reset link.'], 403);
        }
        return response()->json(['message' => 'Reset link valid.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'id' => 'required|integer',
            'hash' => 'required|string',
            'password' => 'required|min:6|confirmed',
        ]);

        $user = User::findOrFail($request->id);
        $expected = sha1($user->email . '|' . $user->password);
        if (!hash_equals($expected, (string) $request->hash)) {
            return response()->json(['error' => 'Invalid or expired reset link.'], 403);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Password updated, you can login now.']);
    }
}