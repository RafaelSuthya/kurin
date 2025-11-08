<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cancellation;
use App\Models\Order;
use App\Models\OrderStatus;

class CancellationController extends Controller
{
    /**
     * List all cancellation requests with related order and items.
     */
    public function index(Request $request)
    {
        $cancellations = Cancellation::with(['order.items', 'order.status'])
            ->orderBy('cancellation_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'ok' => true,
            'data' => $cancellations,
        ]);
    }

    /**
     * User requests cancellation for their own order.
     */
    public function request(Request $request, $orderId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $order = Order::where('user_id', $user->id)->find($orderId);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $validated = $request->validate([
            'reason' => 'required|string',
        ]);

        // If already cancelled, block duplicate requests
        $currentStatus = strtolower($order->status->name ?? '');
        if ($currentStatus === 'cancelled') {
            return response()->json(['message' => 'Order already cancelled'], 400);
        }

        // Create a cancellation request record (pending decision by admin)
        Cancellation::create([
            'order_id' => $order->id,
            'reason' => $validated['reason'],
            'cancellation_date' => now()->toDateString(),
            'initiator' => 'buyer',
            'decision' => null,
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Admin approves a cancellation request: mark order as Cancelled and keep record as approved.
     */
    public function approve(Request $request, $cancellationId)
    {
        $cancellation = Cancellation::with('order')->find($cancellationId);
        if (!$cancellation || !$cancellation->order) {
            return response()->json(['message' => 'Cancellation not found'], 404);
        }

        $order = $cancellation->order;
        $cancelled = OrderStatus::firstOrCreate(['name' => 'Cancelled'], ['description' => 'Dibatalkan']);
        $order->status_id = $cancelled->id;
        $order->save();

        // Pulihkan stok jika sebelumnya sudah dikurangi (user cancel disetujui)
        try {
            $order->restoreStockIfDeducted();
        } catch (\Throwable $e) {
            // Silent failure: pembatalan tetap berhasil meski pemulihan stok gagal
        }

        // Mark the request as approved and keep it for history
        $cancellation->decision = 'approved';
        // Optional: update date to approval date, keep or overwrite depending on business needs
        $cancellation->cancellation_date = now()->toDateString();
        $cancellation->save();

        return response()->json(['ok' => true, 'status' => 'Cancelled']);
    }

    /**
     * Admin rejects a cancellation request: keep order status unchanged and remove request record.
     */
    public function reject(Request $request, $cancellationId)
    {
        $cancellation = Cancellation::find($cancellationId);
        if (!$cancellation) {
            return response()->json(['message' => 'Cancellation not found'], 404);
        }

        $cancellation->delete();

        return response()->json(['ok' => true]);
    }
}