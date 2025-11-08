<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReturnOrder extends Model
{
    protected $fillable = [
        'order_id',
        'reason',
        'return_date',
        'photo_path',
        'video_path',
        'decision',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
