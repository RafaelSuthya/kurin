<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Return Midtrans Snap public config for frontend.
     */
    public function config()
    {
        $clientKey = config('midtrans.client_key') ?? env('MIDTRANS_CLIENT_KEY');
        $isProd = (bool) (config('midtrans.is_production') ?? env('MIDTRANS_IS_PRODUCTION', false));
        $base = $isProd ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
        return response()->json([
            'ok' => true,
            'client_key' => $clientKey,
            'base' => $base,
        ]);
    }

    /**
     * Create Midtrans Snap transaction and return token.
     */
    public function token(Request $request)
    {
        $serverKey = config('midtrans.server_key') ?? env('MIDTRANS_SERVER_KEY');
        $isProd = (bool) (config('midtrans.is_production') ?? env('MIDTRANS_IS_PRODUCTION', false));
        $base = $isProd ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
        if (!$serverKey) {
            return response()->json(['ok' => false, 'message' => 'MIDTRANS_SERVER_KEY is not set'], 500);
        }

        // Robust parsing: support JSON body and form-urlencoded
        $json = $request->json()->all();
        $grossAmountInput = $json['gross_amount'] ?? $request->input('gross_amount');
        $grossAmount = (int) ($grossAmountInput ?? 0);
        if ($grossAmount < 1) {
            return response()->json(['ok' => false, 'message' => 'gross_amount must be >= 1'], 422);
        }

        $orderId = ($json['order_id'] ?? $request->input('order_id')) ?: ('ORDER-' . (($json['order']['id'] ?? $request->input('order.id')) ?? Str::random(6)) . '-' . time());
        $order = $json['order'] ?? $request->input('order', []);
        $customer = $order['customer'] ?? [];
        $items = $order['items'] ?? [];

        // Build payload according to Midtrans Snap API
        $payload = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $grossAmount,
            ],
            'credit_card' => [ 'secure' => true ],
            // Optional: set finish callback to return to our UI
            'callbacks' => [
                'finish' => rtrim(config('app.url') ?? env('APP_URL', 'http://127.0.0.1:8000'), '/') . '/finish',
            ],
        ];

        // Hanya sertakan enabled_payments jika ada isi; jika kosong, biarkan Snap menampilkan semua channel yang aktif
        $enabledPayments = $json['enabled_payments'] ?? $request->input('enabled_payments');
        if (is_array($enabledPayments) && count($enabledPayments) > 0) {
            $payload['enabled_payments'] = $enabledPayments;
        }

        if (!empty($customer) || !empty($order)) {
            $payload['customer_details'] = [
                'first_name' => $customer['first_name'] ?? ($order['buyer_name'] ?? 'Customer'),
                'email' => $customer['email'] ?? ($order['buyer_email'] ?? 'customer@example.com'),
                'phone' => $customer['phone'] ?? ($order['buyer_phone'] ?? ''),
                'billing_address' => [
                    'address' => $order['buyer_address'] ?? '',
                ],
            ];
        }

        if (!empty($items)) {
            $payload['item_details'] = array_map(function ($it) {
                return [
                    'id' => (string) ($it['id'] ?? 'item'),
                    'price' => (int) round($it['price'] ?? 0),
                    'quantity' => (int) ($it['quantity'] ?? 1),
                    'name' => (string) ($it['name'] ?? 'Item'),
                ];
            }, $items);
        }

        // Request to Midtrans Snap API
        $url = rtrim($base, '/') . '/snap/v1/transactions';
        $res = Http::withBasicAuth($serverKey, '')
            ->withHeaders(['Content-Type' => 'application/json', 'Accept' => 'application/json'])
            ->post($url, $payload);

        if (!$res->successful()) {
            return response()->json([
                'ok' => false,
                'message' => 'Failed to create transaction',
                'status' => $res->status(),
                'body' => $res->json(),
            ], $res->status());
        }

        $json = $res->json();
        return response()->json([
            'ok' => true,
            'token' => $json['token'] ?? null,
            'redirect_url' => $json['redirect_url'] ?? null,
        ]);
    }
}