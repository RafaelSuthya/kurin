<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'description',
        'category',
        'stock',
        'price',
        'images',
        'variants',
        'weight',
        'length',
        'width',
        'height',
        'discount_price',
        'discount_percent',
        'discount_active',
        'discount_start',
        'discount_end'
    ];

    protected $casts = [
        'images' => 'array',
        'variants' => 'array',
        'price' => 'decimal:2',
        'weight' => 'decimal:2',
        'length' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'discount_active' => 'boolean',
        'discount_start' => 'date',
        'discount_end' => 'date'
    ];
}
