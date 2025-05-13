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
        Schema::create('follow_up_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->boolean('enable_follow_up_questions')->default(true);
            $table->integer('max_follow_up_questions')->default(3);
            $table->string('show_follow_up_as')->default('buttons');
            $table->boolean('generate_automatically')->default(true);
            $table->boolean('is_default')->default(false);
            $table->json('predefined_question_sets')->nullable();
            $table->json('topic_based_question_sets')->nullable();
            $table->timestamps();
        });

        Schema::create('follow_up_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('config_id');
            $table->text('question');
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('priority')->default('medium'); // high, medium, low
            $table->string('display_position')->default('end'); // beginning, middle, end
            $table->string('category')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('config_id')
                  ->references('id')
                  ->on('follow_up_configs')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('follow_up_questions');
        Schema::dropIfExists('follow_up_configs');
    }
};
