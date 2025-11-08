<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('return_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('return_orders', 'photo_path')) {
                $table->string('photo_path')->nullable();
            }
            if (!Schema::hasColumn('return_orders', 'video_path')) {
                $table->string('video_path')->nullable();
            }
            if (!Schema::hasColumn('return_orders', 'decision')) {
                $table->string('decision')->nullable(); // approved / rejected / null
            }
        });
    }

    public function down(): void
    {
        Schema::table('return_orders', function (Blueprint $table) {
            if (Schema::hasColumn('return_orders', 'photo_path')) {
                $table->dropColumn('photo_path');
            }
            if (Schema::hasColumn('return_orders', 'video_path')) {
                $table->dropColumn('video_path');
            }
            if (Schema::hasColumn('return_orders', 'decision')) {
                $table->dropColumn('decision');
            }
        });
    }
};