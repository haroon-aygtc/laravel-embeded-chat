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
        Schema::table('chat_sessions', function (Blueprint $table) {
            $table->uuid('widget_id')->nullable()->after('context_mode');
            $table->boolean('is_active')->default(true)->after('widget_id');
            $table->foreign('widget_id')->references('id')->on('widgets')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_sessions', function (Blueprint $table) {
            $table->dropForeign(['widget_id']);
            $table->dropColumn(['widget_id', 'is_active']);
        });
    }
}; 