<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use Illuminate\Support\Facades\Log;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;

class PaymentController extends Controller
{
    public function create(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|unique:transactions',
            'amount' => 'required|numeric',
        ]);

        $transaction = Transaction::create([
            'order_id' => $validated['order_id'],
            'amount' => $validated['amount'],
            'status' => 'pending',
        ]);

        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized = config('midtrans.is_sanitized');
        Config::$is3ds = config('midtrans.is_3ds');

        $payload = [
            'transaction_details' => [
                'order_id' => $transaction->order_id,
                'gross_amount' => $transaction->amount,
            ],
            // Add customer details, item details, etc., as needed
        ];

        $snapToken = Snap::getSnapToken($payload);

        $transaction->update(['snap_token' => $snapToken]);

        return response()->json(['snap_token' => $snapToken]);
    }

    public function webhook(Request $request)
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');

        $notif = new Notification();

        $transactionStatus = $notif->transaction_status;
        $orderId = $notif->order_id;

        $transaction = Transaction::where('order_id', $orderId)->first();

        if ($transaction) {
            if (in_array($transactionStatus, ['capture', 'settlement'])) {
                $transaction->status = 'paid';
                
                // Update order status to 'Processing' (paid)
                $order = \App\Models\Order::find($transaction->order_id);
                if ($order) {
                    $processingStatus = \App\Models\OrderStatus::firstOrCreate(
                        ['name' => 'Processing'], 
                        ['description' => 'Pembayaran Berhasil']
                    );
                    $order->status_id = $processingStatus->id;
                    $order->save();
                    // Kurangi stok setelah pembayaran berhasil dan status menjadi Processing
                    try {
                        $order->deductStockIfNeeded();
                    } catch (\Throwable $e) {
                        // Catat error tetapi jangan gagalkan webhook
                        Log::error('Gagal mengurangi stok via webhook: ' . $e->getMessage());
                    }
                }
            } elseif (in_array($transactionStatus, ['deny', 'expire', 'cancel'])) {
                $transaction->status = 'failed';
                
                // Keep order status as 'Pending' or update to 'Cancelled' if needed
                $order = \App\Models\Order::find($transaction->order_id);
                if ($order) {
                    $pendingStatus = \App\Models\OrderStatus::firstOrCreate(
                        ['name' => 'Pending'], 
                        ['description' => 'Belum Bayar']
                    );
                    $order->status_id = $pendingStatus->id;
                    $order->save();
                }
            }
            $transaction->save();
        }

        return response()->json(['status' => 'success']);
    }
}
