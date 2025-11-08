<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\CategoryController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\UserAuthController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\ProductReviewController;

// Gunakan AdminAuthController untuk register & login agar email verifikasi dikirim via Gmail
Route::post('/admin/register', [AdminAuthController::class, 'register']);
Route::post('/admin/login', [AdminAuthController::class, 'login']);
// Tambahkan nama rute untuk tautan verifikasi email admin
Route::get('/admin/email/verify/{id}/{hash}', [AdminAuthController::class, 'verifyEmail'])->middleware('signed')->name('admin.verification.verify');
// Endpoint resend verifikasi email admin
Route::post('/admin/email/resend', [AdminAuthController::class, 'resendVerification']);

// User authentication (API)
Route::post('/user/register', [UserAuthController::class, 'register']);
Route::post('/user/login', [UserAuthController::class, 'login']);
Route::get('/user/email/verify/{id}/{hash}', [UserAuthController::class, 'verifyEmail'])->name('api.user.verification.verify');
Route::post('/user/email/resend', [UserAuthController::class, 'resendVerification']);
// Forgot / Reset Password
Route::post('/user/password/request', [UserAuthController::class, 'requestPasswordReset']);
Route::get('/user/password/reset/{id}/{hash}', [UserAuthController::class, 'validateResetLink']);
Route::post('/user/password/reset', [UserAuthController::class, 'resetPassword']);

// Health check to verify API routing is active
Route::get('/ping', function () {
    return response()->json(['pong' => true]);
});

// Root of API (GET /api) for quick verification
Route::get('/', function () {
    return response()->json([
        'ok' => true,
        'service' => 'ecommerceapp-api',
        'laravel' => app()->version(),
        'time' => now()->toIso8601String(),
    ]);
});

// Convenience alias: visiting /api/admin redirects to the products list
Route::get('/admin', function () {
    return redirect('/api/admin/products');
});

// Endpoint publik untuk halaman Contact (dibaca oleh frontend user)
Route::get('/settings/contact', [SettingController::class, 'publicContact']);
// Endpoint publik untuk halaman Terms (dibaca oleh frontend user)
Route::get('/settings/terms', [SettingController::class, 'publicTerms']);

Route::middleware('auth:sanctum')->group(function () {
    // Dashboard
    Route::get('/admin/dashboard', [DashboardController::class, 'index'])->middleware('auth:sanctum');
    // Settings
    Route::get('/admin/settings', [SettingController::class, 'index'])->middleware('auth:sanctum');
    Route::put('/admin/settings/terms', [SettingController::class, 'updateTerms'])->middleware('auth:sanctum');
    Route::put('/admin/settings/contact', [SettingController::class, 'updateContact'])->middleware('auth:sanctum');
    Route::post('/admin/settings/contact/image', [SettingController::class, 'uploadContactImage'])->middleware('auth:sanctum');
    Route::put('/admin/settings/profile', [SettingController::class, 'updateProfile'])->middleware('auth:sanctum');
    Route::post('/admin/settings/profile/image', [SettingController::class, 'uploadProfileImage'])->middleware('auth:sanctum');
    // Categories
    Route::get('/admin/categories', [CategoryController::class, 'index'])->middleware('auth:sanctum');
    Route::post('/admin/categories', [CategoryController::class, 'store'])->middleware('auth:sanctum');
    Route::put('/admin/categories/{id}', [CategoryController::class, 'update'])->middleware('auth:sanctum');
    // Categories (lanjutan)
    Route::delete('/admin/categories/{id}', [CategoryController::class, 'destroy'])->middleware('auth:sanctum');

    // Pembatalan pesanan admin
    Route::get('/admin/cancellations', [\App\Http\Controllers\CancellationController::class, 'index']);
    Route::post('/admin/cancellations/{id}/approve', [\App\Http\Controllers\CancellationController::class, 'approve']);
    Route::post('/admin/cancellations/{id}/reject', [\App\Http\Controllers\CancellationController::class, 'reject']);

    Route::get('/payments/midtrans/config', [\App\Http\Controllers\Api\PaymentController::class, 'config']);
    Route::post('/payments/midtrans/token', [\App\Http\Controllers\Api\PaymentController::class, 'token']);

    // Orders untuk user terautentikasi
    Route::get('/user/orders', [\App\Http\Controllers\OrderController::class, 'myOrders']);
    Route::post('/user/orders', [\App\Http\Controllers\OrderController::class, 'storeForUser']);
    // Tandai pesanan sudah dibayar oleh user (ubah status ke Processing)
    Route::post('/user/orders/{id}/paid', [\App\Http\Controllers\OrderController::class, 'markPaid']);

    // Orders publik (tetap tersedia untuk kompatibilitas)
    Route::post('/orders', [\App\Http\Controllers\OrderController::class, 'store']);
});

// API publik untuk company profile
Route::get('/company-profile', [SettingController::class, 'publicCompanyProfile']);

// Products - tanpa autentikasi untuk pengujian
Route::apiResource('/admin/products', \App\Http\Controllers\ProductController::class);

// Public Product Reviews
Route::get('/products/{id}/reviews', [ProductReviewController::class, 'index']);
Route::post('/products/{id}/reviews', [ProductReviewController::class, 'store'])->middleware('auth:sanctum');

// Shipping (ongkir) - publik
Route::get('/shipping/provinces', [\App\Http\Controllers\Api\ShippingController::class, 'provinces']);
Route::get('/shipping/cities', [\App\Http\Controllers\Api\ShippingController::class, 'cities']);
Route::get('/shipping/subdistricts', [\App\Http\Controllers\Api\ShippingController::class, 'subdistricts']);
Route::post('/shipping/cost', [\App\Http\Controllers\Api\ShippingController::class, 'cost']);

// Orders
Route::get('/admin/orders', [\App\Http\Controllers\OrderController::class, 'index']);
Route::post('/admin/orders/{id}/cancel', [\App\Http\Controllers\OrderController::class, 'cancel']);
// Endpoint update status pesanan oleh admin
Route::post('/admin/orders/{id}/status', [\App\Http\Controllers\OrderController::class, 'updateStatus']);
// Endpoint update nomor resi pengiriman oleh admin
Route::post('/admin/orders/{id}/tracking', [\App\Http\Controllers\OrderController::class, 'updateTrackingNumber']);
// Endpoint update total order (produk + ongkir) oleh admin
Route::post('/admin/orders/{id}/total', [\App\Http\Controllers\OrderController::class, 'updateTotal']);
// Delete order (admin) - hanya diizinkan jika status sudah Cancelled
Route::delete('/admin/orders/{id}', [\App\Http\Controllers\OrderController::class, 'destroy']);

// Cancellations (admin)
Route::get('/admin/cancellations', [\App\Http\Controllers\CancellationController::class, 'index']);
Route::post('/admin/cancellations/{id}/approve', [\App\Http\Controllers\CancellationController::class, 'approve']);
Route::post('/admin/cancellations/{id}/reject', [\App\Http\Controllers\CancellationController::class, 'reject']);

Route::get('/payments/midtrans/config', [\App\Http\Controllers\Api\PaymentController::class, 'config']);
Route::post('/payments/midtrans/token', [\App\Http\Controllers\Api\PaymentController::class, 'token']);
Route::post('/orders', [\App\Http\Controllers\OrderController::class, 'store']);

// Refund routes
Route::middleware('auth:sanctum')->group(function () {
    // user request refund for specific order
    Route::post('/user/orders/{id}/refund', [ReturnController::class, 'request']);
});

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    // list all refunds
    Route::get('/admin/refunds', [ReturnController::class, 'index']);
    // approve specific refund
    Route::post('/admin/refunds/{id}/approve', [ReturnController::class, 'approve']);
    // reject specific refund
    Route::post('/admin/refunds/{id}/reject', [ReturnController::class, 'reject']);
});

// Routes for new PaymentController
// Accept both GET and POST to avoid 405 when accessed via browser
Route::match(['GET', 'POST'], '/payments/midtrans/transaction', [\App\Http\Controllers\PaymentController::class, 'create']);
Route::post('/payments/midtrans/webhook', [\App\Http\Controllers\PaymentController::class, 'webhook']);

// ------------------------------------------------------------
// Utilities: API route directory and friendly fallback (GET)
// ------------------------------------------------------------
// List all API routes for quick inspection in browser
Route::get('/routes', function () {
    $routes = collect(Route::getRoutes())
        ->map(function ($route) {
            return [
                'methods' => implode('|', $route->methods()),
                'uri' => $route->uri(),
                'name' => $route->getName(),
                'action' => $route->getActionName(),
            ];
        })
        ->filter(function ($r) {
            return strpos($r['uri'], 'api/') === 0;
        })
        ->values();

    return response()->json([
        'ok' => true,
        'count' => count($routes),
        'routes' => $routes,
    ]);
});

// Catch-all for GET on any API path: give friendly JSON instead of 404/405
Route::get('/{any}', function (\Illuminate\Http\Request $request) {
    $path = '/api/' . ltrim($request->path(), '/');
    return response()->json([
        'ok' => true,
        'message' => 'Endpoint API ini tidak tersedia sebagai GET atau memerlukan parameter.',
        'requested' => [
            'method' => 'GET',
            'path' => $path,
            'query' => $request->query(),
        ],
        'hint' => [
            'lihat' => '/api/routes',
            'contoh' => [
                ['method' => 'GET', 'path' => '/api/payments/midtrans/config'],
                ['method' => 'POST', 'path' => '/api/payments/midtrans/token', 'body' => ['order_id' => 'ORDER-123', 'amount' => 15000]],
                ['method' => 'POST', 'path' => '/api/user/login', 'body' => ['email' => 'user@example.com', 'password' => '******']],
            ],
        ],
    ], 200);
})->where('any', '.*');

// Friendly fallback for GET: avoid 404 when opening API URLs directly
Route::fallback(function (\Illuminate\Http\Request $request) {
    $method = $request->method();
    $path = '/api/' . ltrim($request->path(), '/');

    return response()->json([
        'ok' => true,
        'message' => 'Rute API tidak tersedia sebagai GET. Gunakan method yang tepat atau lihat dokumentasi.',
        'requested' => [
            'method' => $method,
            'path' => $path,
        ],
        'hint' => [
            'lihat' => '/api/routes',
            'contoh' => [
                ['method' => 'POST', 'path' => '/api/user/login', 'body' => ['email' => 'user@example.com', 'password' => '******']],
                ['method' => 'POST', 'path' => '/api/payments/midtrans/token', 'body' => ['order_id' => 'ORDER-123', 'amount' => 15000]],
            ],
        ],
    ], 200);
});