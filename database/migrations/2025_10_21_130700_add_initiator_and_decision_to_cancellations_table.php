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
        Schema::table('cancellations', function (Blueprint $table) {
            if (!Schema::hasColumn('cancellations', 'initiator')) {
                $table->string('initiator')->default('buyer')->after('order_id'); // buyer | seller
            }
            if (!Schema::hasColumn('cancellations', 'decision')) {
                $table->string('decision')->nullable()->after('reason'); // approved | rejected | null (pending)
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cancellations', function (Blueprint $table) {
            if (Schema::hasColumn('cancellations', 'decision')) {
                $table->dropColumn('decision');
            }
            if (Schema::hasColumn('cancellations', 'initiator')) {
                $table->dropColumn('initiator');
            }
        });
    }
};