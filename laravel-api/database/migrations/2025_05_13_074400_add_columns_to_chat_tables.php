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
        // Add columns to chat_sessions table
        Schema::table('chat_sessions', function (Blueprint $table) {
            $table->boolean('status')->default(true)->after('widget_id');
            $table->timestamp('last_message_at')->nullable()->after('is_active');
            $table->integer('message_count')->default(0)->after('last_message_at');
            $table->integer('unread_count')->default(0)->after('message_count');
        });

        // Add columns to chat_messages table
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->boolean('is_read')->default(false)->after('context_snippets');
            $table->timestamp('read_at')->nullable()->after('is_read');
            $table->integer('token_count')->nullable()->after('read_at');
            $table->float('sentiment_score')->nullable()->after('token_count');
            $table->json('metadata')->nullable()->after('sentiment_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove columns from chat_sessions table
        Schema::table('chat_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'status',
                'last_message_at',
                'message_count',
                'unread_count',
            ]);
        });

        // Remove columns from chat_messages table
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropColumn([
                'is_read',
                'read_at',
                'token_count',
                'sentiment_score',
                'metadata',
            ]);
        });
    }
};
