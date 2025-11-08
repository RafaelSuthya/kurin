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
        // If products table doesn't exist (fresh SQLite), create it
        if (!Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('category')->nullable();
                $table->integer('stock')->default(0);
                $table->decimal('price', 12, 2)->default(0);
                $table->json('images')->nullable();
                $table->json('variants')->nullable();
                $table->decimal('weight', 8, 2)->nullable();
                $table->decimal('length', 8, 2)->nullable();
                $table->decimal('width', 8, 2)->nullable();
                $table->decimal('height', 8, 2)->nullable();
                $table->timestamps();
            });
        } else {
            Schema::table('products', function (Blueprint $table) {
                if (!Schema::hasColumn('products', 'name')) $table->string('name')->after('id');
                if (!Schema::hasColumn('products', 'description')) $table->text('description')->nullable()->after('name');
                if (!Schema::hasColumn('products', 'category')) $table->string('category')->nullable()->after('description');
                if (!Schema::hasColumn('products', 'stock')) $table->integer('stock')->default(0)->after('category');
                if (!Schema::hasColumn('products', 'price')) $table->decimal('price', 12, 2)->default(0)->after('stock');
                if (!Schema::hasColumn('products', 'images')) $table->json('images')->nullable()->after('price');
                if (!Schema::hasColumn('products', 'variants')) $table->json('variants')->nullable()->after('images');
                if (!Schema::hasColumn('products', 'weight')) $table->decimal('weight', 8, 2)->nullable()->after('variants');
                if (!Schema::hasColumn('products', 'length')) $table->decimal('length', 8, 2)->nullable()->after('weight');
                if (!Schema::hasColumn('products', 'width')) $table->decimal('width', 8, 2)->nullable()->after('length');
                if (!Schema::hasColumn('products', 'height')) $table->decimal('height', 8, 2)->nullable()->after('width');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
