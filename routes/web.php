<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Scribe API documentation route (Blade view)
Route::get('/docs', function () {
    return view('scribe.index');
})->name('api.docs');

Route::get('/contact', function () {
    return Inertia::render('contact');
})->name('contact');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

// Simple listing route for refunds storage (photos & videos)
Route::get('/admin/storage-refunds', function () {
    $photos = Storage::disk('public')->files('refunds/photos');
    $videos = Storage::disk('public')->files('refunds/videos');

    $escape = function ($str) {
        return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
    };

    $makeItem = function ($title, $paths) use ($escape) {
        $html = "<h2 style='margin:16px 0 8px;color:#c33;'>" . $escape($title) . "</h2>\n<ul style='margin:0 0 16px 18px;'>";
        foreach ($paths as $p) {
            $url = Storage::url($p);
            $html .= "<li><a href='" . $escape($url) . "' target='_blank' rel='noopener noreferrer'>" . $escape($p) . "</a></li>\n";
        }
        $html .= "</ul>";
        return $html;
    };

    $html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Refunds Storage</title></head><body style='font-family:system-ui, sans-serif;padding:16px;'>";
    $html .= "<h1 style='color:#c33;margin-bottom:8px;'>Daftar File Refunds</h1>";
    $html .= "<p style='color:#555;margin-top:0;'>Klik untuk membuka file mentah di tab baru.</p>";
    $html .= $makeItem('Photos', $photos);
    $html .= $makeItem('Videos', $videos);
    $html .= "</body></html>";

    return response($html);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
