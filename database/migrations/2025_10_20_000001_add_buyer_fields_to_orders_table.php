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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'buyer_name')) {
                $table->string('buyer_name')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('orders', 'buyer_phone')) {
                $table->string('buyer_phone')->nullable()->after('buyer_name');
            }
            if (!Schema::hasColumn('orders', 'buyer_address')) {
                $table->text('buyer_address')->nullable()->after('buyer_phone');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'buyer_address')) {
                $table->dropColumn('buyer_address');
            }
            if (Schema::hasColumn('orders', 'buyer_phone')) {
                $table->dropColumn('buyer_phone');
            }
            if (Schema::hasColumn('orders', 'buyer_name')) {
                $table->dropColumn('buyer_name');
            }
        });
    }
};