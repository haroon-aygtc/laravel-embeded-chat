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
        Schema::create('chat_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('context_rule_id')->nullable();
            $table->string('context_name')->nullable();
            $table->enum('context_mode', ['restricted', 'general'])->default('general');
            $table->timestamps();

            $table->index('user_id');
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('chat_session_id');
            $table->enum('role', ['user', 'assistant', 'system']);
            $table->text('content');
            $table->json('attachments')->nullable();
            $table->json('context_snippets')->nullable();
            $table->timestamps();

            $table->index('chat_session_id');
            $table->foreign('chat_session_id')
                  ->references('id')
                  ->on('chat_sessions')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_sessions');
    }
};
