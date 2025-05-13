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
        // AI Models Table
        Schema::create('ai_models', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('provider');
            $table->text('description')->nullable();
            $table->integer('max_tokens')->default(4096);
            $table->string('training_data')->nullable();
            $table->boolean('is_available')->default(true);
            $table->boolean('is_default')->default(false);
            $table->json('capabilities')->nullable();
            $table->json('pricing')->nullable();
            $table->timestamp('last_updated')->nullable();
            $table->timestamps();
        });

        // AI Interaction Logs Table
        Schema::create('ai_interaction_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('model_used');
            $table->text('query');
            $table->text('response');
            $table->string('context_rule_id')->nullable();
            $table->integer('knowledge_base_results')->nullable();
            $table->json('knowledge_base_ids')->nullable();
            $table->json('metadata')->nullable();
            $table->integer('prompt_tokens')->nullable();
            $table->integer('completion_tokens')->nullable();
            $table->integer('total_tokens')->nullable();
            $table->integer('latency_ms')->nullable();
            $table->boolean('success')->default(true);
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('model_used');
            $table->index('created_at');
        });

        // AI Prompt Templates Table
        Schema::create('ai_prompt_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('content');
            $table->string('category')->nullable();
            $table->boolean('is_public')->default(false);
            $table->boolean('is_default')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('category');
        });

        // AI Cache Items Table
        Schema::create('ai_cache_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('prompt');
            $table->text('response');
            $table->string('model');
            $table->integer('tokens')->nullable();
            $table->integer('hit_count')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('model');
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_cache_items');
        Schema::dropIfExists('ai_prompt_templates');
        Schema::dropIfExists('ai_interaction_logs');
        Schema::dropIfExists('ai_models');
    }
};
