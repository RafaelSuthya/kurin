<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Order;
use App\Models\OrderStatus;
use App\Models\ReturnOrder;

class ReturnController extends Controller
{
    /**
     * List all refund/return requests for admin.
     */
    public function index(Request $request)
    {
        $list = ReturnOrder::with(['order.items', 'order.status'])
            ->orderBy('return_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'ok' => true,
            'data' => $list,
        ]);
    }

    /**
     * User requests a refund for their own order.
     * Accepts multipart/form-data with optional video/photo and required reason.
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
            'photo' => 'nullable|file|mimes:jpg,jpeg,png|max:5120', // 5MB
            'video' => 'nullable|file|mimes:mp4,mov,avi,webm|max:51200', // 50MB
        ]);

        $photoPath = null; $videoPath = null;
        if ($request->file('photo')) {
            $photoPath = $request->file('photo')->store('refunds/photos', 'public');
        }
        if ($request->file('video')) {
            $videoPath = $request->file('video')->store('refunds/videos', 'public');
        }

        $rec = ReturnOrder::create([
            'order_id' => $order->id,
            'reason' => $validated['reason'],
            'return_date' => now()->toDateString(),
            'photo_path' => $photoPath,
            'video_path' => $videoPath,
            'decision' => null, // null = mengajukan refund
        ]);

        return response()->json(['ok' => true, 'id' => $rec->id]);
    }

    /**
     * Admin approves a refund request.
     */
    public function approve(Request $request, $returnId)
    {
        $return = ReturnOrder::with('order')->find($returnId);
        if (!$return || !$return->order) {
            return response()->json(['message' => 'Refund not found'], 404);
        }

        $order = $return->order;
        // Set status to "In Refund Process" when refund is approved
        $inRefund = OrderStatus::firstOrCreate(['name' => 'In Refund Process'], ['description' => 'Dalam proses refund']);
        $order->status_id = $inRefund->id;
        $order->save();

        $return->decision = 'approved';
        $return->save();

        return response()->json(['ok' => true, 'status' => 'Refund Disetujui']);
    }

    /**
     * Admin rejects a refund request.
     */
    public function reject(Request $request, $returnId)
    {
        $return = ReturnOrder::with('order')->find($returnId);
        if (!$return || !$return->order) {
            return response()->json(['message' => 'Refund not found'], 404);
        }

        // When refund is rejected, mark order as Completed
        $order = $return->order;
        $completed = OrderStatus::firstOrCreate(['name' => 'Completed'], ['description' => 'Selesai']);
        if ($order) {
            $order->status_id = $completed->id;
            $order->save();
        }

        $return->decision = 'rejected';
        $return->save();

        return response()->json(['ok' => true, 'status' => 'Refund Ditolak']);
    }
}