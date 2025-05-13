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
        Schema::create('knowledge_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('knowledge_base_id');
            $table->string('title');
            $table->text('content');
            $table->string('source_url')->nullable();
            $table->string('source_type')->default('text'); // text, html, pdf, image
            $table->text('summary')->nullable();
            $table->json('tags')->nullable();
            $table->json('metadata')->nullable();
            $table->json('vector_embedding')->nullable()->comment('Vector representation of content for similarity search');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('knowledge_base_id')
                ->references('id')
                ->on('knowledge_bases')
                ->onDelete('cascade');

            // Create full-text indexes for better search (MySQL-specific)
            $table->fullText(['title', 'content']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('knowledge_entries');
    }
};
