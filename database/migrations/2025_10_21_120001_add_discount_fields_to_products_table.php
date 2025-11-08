<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'discount_price')) {
                $table->decimal('discount_price', 12, 2)->nullable()->after('price');
            }
            if (!Schema::hasColumn('products', 'discount_percent')) {
                $table->decimal('discount_percent', 5, 2)->nullable()->after('discount_price');
            }
            if (!Schema::hasColumn('products', 'discount_active')) {
                $table->boolean('discount_active')->default(false)->after('discount_percent');
            }
            if (!Schema::hasColumn('products', 'discount_start')) {
                $table->date('discount_start')->nullable()->after('discount_active');
            }
            if (!Schema::hasColumn('products', 'discount_end')) {
                $table->date('discount_end')->nullable()->after('discount_start');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'discount_price')) {
                $table->dropColumn('discount_price');
            }
            if (Schema::hasColumn('products', 'discount_percent')) {
                $table->dropColumn('discount_percent');
            }
            if (Schema::hasColumn('products', 'discount_active')) {
                $table->dropColumn('discount_active');
            }
            if (Schema::hasColumn('products', 'discount_start')) {
                $table->dropColumn('discount_start');
            }
            if (Schema::hasColumn('products', 'discount_end')) {
                $table->dropColumn('discount_end');
            }
        });
    }
};