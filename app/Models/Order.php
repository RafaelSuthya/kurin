<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'total',
        'order_date',
        'status_id',
        'stock_deducted_at',
        'buyer_name',
        'buyer_phone',
        'buyer_address',
        'tracking_number',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function status()
    {
        return $this->belongsTo(OrderStatus::class, 'status_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Tambah relasi ke pembatalan agar bisa dimuat di API myOrders
    public function cancellations()
    {
        return $this->hasMany(Cancellation::class);
    }

    // Tambah relasi ke pengembalian/refund
    public function returnOrders()
    {
        return $this->hasMany(ReturnOrder::class);
    }

    /**
     * Kurangi stok produk untuk item-item order jika belum pernah dikurangi.
     * Aman dipanggil berulang kali (idempotent) karena memakai flag stock_deducted_at.
     */
    public function deductStockIfNeeded(): bool
    {
        if ($this->stock_deducted_at) return false;

        // Muat items bila belum dimuat
        if (!$this->relationLoaded('items')) {
            $this->load('items');
        }

        DB::transaction(function () {
            foreach ($this->items as $it) {
                if (!$it->product_id) continue;
                $product = Product::lockForUpdate()->find($it->product_id);
                if (!$product) continue;
                $qty = max(0, (int) $it->quantity);
                $variantKey = trim(strtolower((string) ($it->variant ?? '')));

                // Jika produk memiliki varian, kurangi stok varian yang cocok (color/size/type)
                $variants = is_array($product->variants) ? $product->variants : [];
                $updated = false;
                if (!empty($variants) && $variantKey !== '') {
                    foreach ($variants as $idx => $v) {
                        $candidate = trim(strtolower((string)($v['color'] ?? $v['size'] ?? $v['type'] ?? '')));
                        if ($candidate === $variantKey) {
                            $vStock = max(0, (int)($v['stock'] ?? 0) - $qty);
                            $variants[$idx]['stock'] = $vStock;
                            $updated = true;
                            break;
                        }
                    }
                }

                if ($updated) {
                    // Recalc stok total = jumlah stok varian
                    $sum = 0;
                    foreach ($variants as $v) { $sum += (int)($v['stock'] ?? 0); }
                    $product->variants = $variants;
                    $product->stock = $sum;
                } else {
                    // Fallback: kurangi stok total produk
                    $newStock = max(0, (int)$product->stock - $qty);
                    $product->stock = $newStock;
                }
                $product->save();
            }
            $this->stock_deducted_at = now();
            $this->save();
        });

        return true;
    }

    /**
     * Pulihkan kembali stok produk untuk item-item order jika sebelumnya sudah dikurangi.
     * Idempotent: hanya bertindak bila stock_deducted_at terisi.
     */
    public function restoreStockIfDeducted(): bool
    {
        if (!$this->stock_deducted_at) return false;

        // Muat items bila belum dimuat
        if (!$this->relationLoaded('items')) {
            $this->load('items');
        }

        DB::transaction(function () {
            foreach ($this->items as $it) {
                if (!$it->product_id) continue;
                $product = Product::lockForUpdate()->find($it->product_id);
                if (!$product) continue;
                $qty = max(0, (int) $it->quantity);
                $variantKey = trim(strtolower((string) ($it->variant ?? '')));

                // Jika produk memiliki varian, tambah stok varian yang cocok (color/size/type)
                $variants = is_array($product->variants) ? $product->variants : [];
                $updated = false;
                if (!empty($variants) && $variantKey !== '') {
                    foreach ($variants as $idx => $v) {
                        $candidate = trim(strtolower((string)($v['color'] ?? $v['size'] ?? $v['type'] ?? '')));
                        if ($candidate === $variantKey) {
                            $vStock = max(0, (int)($v['stock'] ?? 0)) + $qty;
                            $variants[$idx]['stock'] = $vStock;
                            $updated = true;
                            break;
                        }
                    }
                }

                if ($updated) {
                    // Recalc stok total = jumlah stok varian
                    $sum = 0;
                    foreach ($variants as $v) { $sum += (int)($v['stock'] ?? 0); }
                    $product->variants = $variants;
                    $product->stock = $sum;
                } else {
                    // Fallback: tambah stok total produk
                    $newStock = max(0, (int)$product->stock) + $qty;
                    $product->stock = $newStock;
                }
                $product->save();
            }
            // Kosongkan flag agar potongan stok bisa terjadi lagi jika status berubah ke Processing
            $this->stock_deducted_at = null;
            $this->save();
        });

        return true;
    }
}
