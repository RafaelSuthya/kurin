<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cancellation extends Model
{
    protected $fillable = [
        'order_id',
        'reason',
        'cancellation_date',
        'initiator',
        'decision',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
