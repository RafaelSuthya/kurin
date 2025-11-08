<?php

namespace App\Http\Controllers;

use App\Models\ProductReview;
use Illuminate\Http\Request;

class ProductReviewController extends Controller
{
    // GET /api/products/{id}/reviews - public
    public function index($id)
    {
        $reviews = ProductReview::where('product_id', (int) $id)
            ->orderBy('created_at', 'desc')
            ->limit(200)
            ->get(['product_id', 'user_id', 'author', 'rating', 'text', 'created_at']);

        // Tampilkan satu ulasan per user untuk produk ini (ambil yang terbaru)
        $unique = $reviews->unique('user_id')->values();
        return response()->json($unique);
    }

    // POST /api/products/{id}/reviews - requires auth
    public function store(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'text' => 'required|string|max:2000',
        ]);

        $author = $user->name ?? $user->email ?? 'Anonim';

        // Satu ulasan per user per produk: update jika sudah ada, create jika belum
        $review = ProductReview::where('product_id', (int) $id)
            ->where('user_id', $user->id)
            ->first();

        if ($review) {
            $review->rating = (int) $data['rating'];
            $review->text = (string) $data['text'];
            $review->author = $author;
            // gunakan created_at sebagai timestamp terakhir edit
            $review->created_at = now();
            $review->save();
            return response()->json($review, 200);
        }

        $created = ProductReview::create([
            'product_id' => (int) $id,
            'user_id' => $user->id,
            'author' => $author,
            'rating' => (int) $data['rating'],
            'text' => (string) $data['text'],
            'created_at' => now(),
        ]);

        return response()->json($created, 201);
    }
}