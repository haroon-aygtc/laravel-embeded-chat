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
        // Add enhancements to knowledge_bases table
        Schema::table('knowledge_bases', function (Blueprint $table) {
            // Add vector search configuration settings
            $table->float('similarity_threshold')->default(0.75)->comment('Minimum similarity score (0-1) for vector search results');
            $table->string('embedding_model')->default('text-embedding-ada-002')->comment('Model used for generating vector embeddings');
            $table->json('vector_search_config')->nullable()->comment('Additional vector search configuration options');
            $table->boolean('use_hybrid_search')->default(true)->comment('Whether to combine vector and keyword search');
            $table->integer('keyword_search_weight')->default(30)->comment('Weight given to keyword search results in hybrid search (0-100)');
            $table->integer('vector_search_weight')->default(70)->comment('Weight given to vector search results in hybrid search (0-100)');
            $table->boolean('auto_chunk_content')->default(true)->comment('Whether to automatically chunk large content');
            $table->integer('chunk_size')->default(512)->comment('Size of content chunks in tokens when auto-chunking is enabled');
            $table->integer('chunk_overlap')->default(50)->comment('Overlap between chunks in tokens');
        });

        // Add enhancements to knowledge_entries table
        Schema::table('knowledge_entries', function (Blueprint $table) {
            // Add fields for chunking and search relevance
            $table->string('chunk_id')->nullable()->comment('ID of the chunk this entry belongs to');
            $table->integer('chunk_index')->nullable()->comment('Index of this chunk in the original document');
            $table->uuid('parent_entry_id')->nullable()->comment('ID of the parent entry if this is a chunk');
            $table->float('search_relevance_score')->nullable()->comment('Pre-calculated relevance score for common searches');
            $table->json('keyword_highlights')->nullable()->comment('Top keywords and their importance for this entry');
            $table->boolean('vector_indexed')->default(false)->comment('Whether this entry has been indexed for vector search');
            
            // Add index for faster vector search filtering
            $table->index(['knowledge_base_id', 'vector_indexed']);
            $table->index(['parent_entry_id', 'chunk_index']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove enhancements from knowledge_bases table
        Schema::table('knowledge_bases', function (Blueprint $table) {
            $table->dropColumn([
                'similarity_threshold',
                'embedding_model',
                'vector_search_config',
                'use_hybrid_search',
                'keyword_search_weight',
                'vector_search_weight',
                'auto_chunk_content',
                'chunk_size',
                'chunk_overlap'
            ]);
        });

        // Remove enhancements from knowledge_entries table
        Schema::table('knowledge_entries', function (Blueprint $table) {
            $table->dropIndex(['knowledge_base_id', 'vector_indexed']);
            $table->dropIndex(['parent_entry_id', 'chunk_index']);
            
            $table->dropColumn([
                'chunk_id',
                'chunk_index',
                'parent_entry_id',
                'search_relevance_score',
                'keyword_highlights',
                'vector_indexed'
            ]);
        });
    }
};
