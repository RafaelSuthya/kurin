<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Hindari error "Out of sort memory" dengan tidak melakukan ORDER BY pada kolom
        // yang tidak terindeks. Gunakan primary key (id) yang sudah terindeks, dan batasi
        // jumlah hasil agar respon lebih ringan untuk halaman daftar.

        $perPage = (int)($request->query('per_page', 100));
        if ($perPage < 1) { $perPage = 1; }
        if ($perPage > 500) { $perPage = 500; }

        // Tampilkan semua field termasuk 'images' dan 'variants' agar UI bisa menampilkan gambar
        $products = Product::orderBy('id', 'desc')
            ->limit($perPage)
            ->get();

        return response()->json($products);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            // Validasi data
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'stock' => 'required|integer|min:0',
                'price' => 'required|numeric|min:0',
            ]);
            
            // Siapkan data produk
            $productData = [
                'name' => $request->name,
                'description' => $request->description ?? '',
                'category' => $request->category ?? '',
                'stock' => (int)$request->stock,
                'price' => (float)$request->price,
                // Biarkan Eloquent meng-encode array ke JSON via $casts
                'images' => is_array($request->images) ? $request->images : [],
                'variants' => is_array($request->variants) ? $request->variants : [],
                'weight' => (float)($request->weight ?? 0),
                'length' => (float)($request->length ?? 0),
                'width' => (float)($request->width ?? 0),
                'height' => (float)($request->height ?? 0),
            ];
            
            // Buat produk
            $product = Product::create($productData);
            
            return response()->json($product, 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menyimpan produk',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }
        return response()->json($product);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        // Validasi minimal
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'stock' => 'sometimes|required|integer|min:0',
            'price' => 'sometimes|required|numeric|min:0',
            // Izinkan nilai null untuk mengosongkan diskon
            'discount_price' => 'sometimes|nullable|numeric|min:0',
            'discount_percent' => 'sometimes|nullable|numeric|min:0|max:100',
            'discount_active' => 'sometimes|boolean',
            'discount_start' => 'sometimes|date',
            'discount_end' => 'sometimes|date|after_or_equal:discount_start',
        ]);

        // Siapkan data update
        $updateData = [
            'name' => $request->name ?? $product->name,
            'description' => $request->description ?? $product->description,
            'category' => $request->category ?? $product->category,
            'stock' => $request->has('stock') ? (int)$request->stock : $product->stock,
            'price' => $request->has('price') ? (float)$request->price : $product->price,
            'weight' => $request->has('weight') ? (float)$request->weight : $product->weight,
            'length' => $request->has('length') ? (float)$request->length : $product->length,
            'width' => $request->has('width') ? (float)$request->width : $product->width,
            'height' => $request->has('height') ? (float)$request->height : $product->height,
        ];

        // Diskon
        if ($request->has('discount_price')) {
            $updateData['discount_price'] = $request->discount_price !== null ? (float) $request->discount_price : null;
        }
        if ($request->has('discount_percent')) {
            $updateData['discount_percent'] = $request->discount_percent !== null ? (float) $request->discount_percent : null;
        }
        if ($request->has('discount_active')) {
            $updateData['discount_active'] = (bool) $request->discount_active;
        }
        if ($request->has('discount_start')) {
            $updateData['discount_start'] = $request->discount_start;
        }
        if ($request->has('discount_end')) {
            $updateData['discount_end'] = $request->discount_end;
        }

        // Images & variants
        if ($request->has('images') && is_array($request->images)) {
            $updateData['images'] = $request->images;
        }
        if ($request->has('variants') && is_array($request->variants)) {
            $updateData['variants'] = $request->variants;
        }

        $product->update($updateData);
        return response()->json($product);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }
        $product->delete();
        return response()->json(['message' => 'Product deleted']);
    }
}
