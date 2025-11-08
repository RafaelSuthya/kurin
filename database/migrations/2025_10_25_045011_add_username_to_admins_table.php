<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->string('username')->nullable()->after('id');
            $table->unique('username');
        });

        // Backfill username from existing name values
        DB::statement('UPDATE admins SET username = name WHERE username IS NULL OR username = ""');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            // Drop unique index and column
            $table->dropUnique('admins_username_unique');
            $table->dropColumn('username');
        });
    }
};
