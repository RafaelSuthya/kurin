<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatus;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * List orders with items for admin.
     */
    public function index(Request $request)
    {
        $orders = Order::with(['items', 'status', 'returnOrders'])
            ->orderBy('order_date', 'desc')
            ->orderBy('id', 'desc')
            ->limit((int)$request->query('per_page', 200))
            ->get();

        return response()->json([
            'ok' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Store a new order from checkout-static page.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'buyer' => 'required|array',
            'buyer.name' => 'required|string',
            'buyer.phone' => 'required|string',
            'buyer.address' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|integer',
            'items.*.name' => 'required|string',
            'items.*.image' => 'nullable|string',
            'items.*.variant' => 'nullable|string',
            'items.*.price' => 'required|numeric',
            'items.*.quantity' => 'required|integer|min:1',
            'total' => 'required|numeric',
            'order_date' => 'nullable|date',
        ]);

        // Ensure we have a default status
        $pending = OrderStatus::firstOrCreate(['name' => 'Pending'], ['description' => 'Menunggu diproses']);

        // Create or find a guest user using phone-based email
        $email = 'guest-' . preg_replace('/[^0-9]/', '', $validated['buyer']['phone']) . '@example.com';
        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $validated['buyer']['name'], 'password' => Hash::make(Str::random(12))]
        );

        $order = new Order();
        $order->user_id = $user->id;
        $order->total = $validated['total'];
        $order->order_date = $validated['order_date'] ?? now()->toDateString();
        $order->status_id = $pending->id;
        $order->buyer_name = $validated['buyer']['name'];
        $order->buyer_phone = $validated['buyer']['phone'];
        $order->buyer_address = $validated['buyer']['address'];
        $order->save();

        foreach ($validated['items'] as $it) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $it['product_id'] ?? null,
                'product_name' => $it['name'],
                // Hindari menyimpan data URL base64 yang panjang ke kolom string 255
                'product_image' => Str::startsWith($it['image'] ?? '', 'data:') ? null : Str::limit($it['image'] ?? '', 255, ''),
                'variant' => $it['variant'] ?? null,
                'price' => $it['price'],
                'quantity' => $it['quantity'],
            ]);
        }

        // Kurangi stok segera saat checkout (status Pending / Belum Bayar)
        try {
            $order->deductStockIfNeeded();
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'message' => 'Gagal mengurangi stok: ' . $e->getMessage()], 500);
        }

        return response()->json(['ok' => true, 'order_id' => $order->id]);
    }

    /**
     * Cancel an order (admin).
     */
    public function cancel(Request $request, $id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $cancelled = OrderStatus::firstOrCreate(['name' => 'Cancelled'], ['description' => 'Dibatalkan']);
        $order->status_id = $cancelled->id;
        $order->save();

        // Pulihkan stok jika sebelumnya sudah dikurangi
        try {
            $order->restoreStockIfDeducted();
        } catch (\Throwable $e) {
            // Jangan blokir pembatalan jika pemulihan stok gagal, tetapi beri pesan
            // (opsional: log error)
        }

        \App\Models\Cancellation::create([
            'order_id' => $order->id,
            'reason' => $request->input('reason'),
            'cancellation_date' => now()->toDateString(),
            'initiator' => 'seller',
            'decision' => 'approved',
        ]);

        return response()->json(['ok' => true, 'status' => 'Cancelled']);
    }

    /**
     * Update status of an order (admin).
     */
    public function updateStatus(Request $request, $id)
    {
        $order = Order::with('status')->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $current = strtolower($order->status->name ?? '');
        if ($current === 'cancelled') {
            return response()->json(['message' => 'Cannot change a cancelled order'], 400);
        }

        $validated = $request->validate([
            'status' => 'required|string'
        ]);

        $input = strtolower($validated['status']);
        $map = [
            'pending' => 'Pending',
            'belum bayar' => 'Pending',
            'processing' => 'Processing',
            'diproses' => 'Processing',
            'shipped' => 'Shipped',
            'dikirim' => 'Shipped',
            'delivered' => 'Delivered',
            'sampai' => 'Delivered',
            'completed' => 'Completed',
            'selesai' => 'Completed',
            'in refund process' => 'In Refund Process',
            'dalam proses refund' => 'In Refund Process',
        ];
        $targetName = $map[$input] ?? null;
        if (!$targetName) {
            return response()->json(['message' => 'Invalid status'], 422);
        }

        $target = OrderStatus::firstOrCreate(['name' => $targetName], ['description' => $targetName]);
        $order->status_id = $target->id;
        $order->save();

        // Ketika status menjadi Processing/Diproses, kurangi stok produk sekali saja
        if (strtolower($target->name) === 'processing') {
            try {
                $order->deductStockIfNeeded();
            } catch (\Throwable $e) {
                return response()->json(['ok' => false, 'message' => 'Gagal mengurangi stok: ' . $e->getMessage()], 500);
            }
        }

        return response()->json(['ok' => true, 'status' => $target->name]);
    }

    /**
     * Update tracking number (admin).
     */
    public function updateTrackingNumber(Request $request, $id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $validated = $request->validate([
            'tracking_number' => 'required|string'
        ]);

        $order->tracking_number = $validated['tracking_number'];
        $order->save();

        return response()->json(['ok' => true, 'tracking_number' => $order->tracking_number]);
    }

    /**
     * List orders of the authenticated user.
     */
    public function myOrders(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $orders = Order::with(['items', 'status', 'returnOrders'])
            ->where('user_id', $user->id)
            ->orderBy('order_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'ok' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Store a new order for the authenticated user.
     */
    public function storeForUser(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'buyer' => 'required|array',
            'buyer.name' => 'required|string',
            'buyer.phone' => 'required|string',
            'buyer.address' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|integer',
            'items.*.name' => 'required|string',
            'items.*.image' => 'nullable|string',
            'items.*.variant' => 'nullable|string',
            'items.*.price' => 'required|numeric',
            'items.*.quantity' => 'required|integer|min:1',
            'total' => 'required|numeric',
            'order_date' => 'nullable|date',
        ]);

        $pending = OrderStatus::firstOrCreate(['name' => 'Pending'], ['description' => 'Menunggu diproses']);

        $order = new Order();
        $order->user_id = $user->id;
        $order->total = $validated['total'];
        $order->order_date = $validated['order_date'] ?? now()->toDateString();
        $order->status_id = $pending->id;
        $order->buyer_name = $validated['buyer']['name'];
        $order->buyer_phone = $validated['buyer']['phone'];
        $order->buyer_address = $validated['buyer']['address'];
        $order->save();

        foreach ($validated['items'] as $it) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $it['product_id'] ?? null,
                'product_name' => $it['name'],
                'product_image' => Str::startsWith($it['image'] ?? '', 'data:') ? null : Str::limit($it['image'] ?? '', 255, ''),
                'variant' => $it['variant'] ?? null,
                'price' => $it['price'],
                'quantity' => $it['quantity'],
            ]);
        }

        // Kurangi stok segera saat checkout (status Pending / Belum Bayar)
        try {
            $order->deductStockIfNeeded();
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'message' => 'Gagal mengurangi stok: ' . $e->getMessage()], 500);
        }

        return response()->json(['ok' => true, 'order_id' => $order->id]);
    }

    // Hapus pesanan (admin) hanya jika: dibatalkan (oleh admin/user), pembatalan disetujui, atau sudah selesai
    public function destroy(Request $request, $id)
    {
        $order = Order::with(['status', 'cancellations', 'items', 'returnOrders'])->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $status = strtolower($order->status->name ?? '');
        // Jika relasi cancellations belum termuat, gunakan query exists
        $hasApprovedCancel = $order->cancellations()->where('decision', 'approved')->exists();

        $isDeletable = ($status === 'cancelled') || $hasApprovedCancel || ($status === 'completed');
        if (!$isDeletable) {
            return response()->json(['message' => 'Order must be cancelled or completed to delete'], 400);
        }

        // Hapus relasi untuk aman terhadap FK (returnOrders tidak cascade)
        $order->items()->delete();
        $order->cancellations()->delete();
        $order->returnOrders()->delete();

        $order->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Update total amount of an order (admin).
     */
    public function updateTotal(Request $request, $id)
    {
        $order = Order::with('status')->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $status = strtolower($order->status->name ?? '');
        if ($status === 'cancelled') {
            return response()->json(['message' => 'Cannot update a cancelled order'], 400);
        }

        $validated = $request->validate([
            'total' => 'required|numeric|min:0',
        ]);

        $order->total = $validated['total'];
        $order->save();

        return response()->json(['ok' => true, 'total' => $order->total]);
    }

    /**
     * Mark order as paid by the authenticated user: set status to Processing.
     */
    public function markPaid(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $order = Order::with('status')->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if ((int) $order->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $current = strtolower($order->status->name ?? '');
        if ($current === 'cancelled') {
            return response()->json(['message' => 'Cannot update a cancelled order'], 400);
        }

        $status = OrderStatus::firstOrCreate(['name' => 'Processing'], ['description' => 'Diproses']);
        $order->status_id = $status->id;
        $order->save();

        // Kurangi stok saat user menandai sebagai sudah bayar (Processing)
        try {
            $order->deductStockIfNeeded();
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'message' => 'Gagal mengurangi stok: ' . $e->getMessage()], 500);
        }

        return response()->json(['ok' => true, 'status' => $status->name]);
    }
}