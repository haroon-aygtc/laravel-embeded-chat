<?php

namespace Database\Seeders;

use App\Models\AI\AIModel;
use App\Models\AI\AIPromptTemplate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AIDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seed AI Models
        $this->seedAIModels();

        // Seed Prompt Templates
        $this->seedPromptTemplates();
    }

    /**
     * Seed the AI models table.
     */
    private function seedAIModels(): void
    {
        $models = [
            [
                'id' => 'gpt-3.5-turbo',
                'name' => 'GPT-3.5 Turbo',
                'provider' => 'openai',
                'description' => 'Most capable GPT-3.5 model, optimized for chat.',
                'max_tokens' => 4096,
                'training_data' => 'Up to Sep 2021',
                'is_available' => true,
                'is_default' => true,
                'capabilities' => json_encode([
                    'chat' => true,
                    'completion' => true,
                    'embedding' => false,
                ]),
                'pricing' => json_encode([
                    'input' => 0.0015,
                    'output' => 0.002,
                ]),
                'last_updated' => now()->subMonths(1),
            ],
            [
                'id' => 'gpt-4',
                'name' => 'GPT-4',
                'provider' => 'openai',
                'description' => 'Most capable GPT-4 model, optimized for chat and complex tasks.',
                'max_tokens' => 8192,
                'training_data' => 'Up to Apr 2023',
                'is_available' => true,
                'is_default' => false,
                'capabilities' => json_encode([
                    'chat' => true,
                    'completion' => true,
                    'embedding' => false,
                ]),
                'pricing' => json_encode([
                    'input' => 0.03,
                    'output' => 0.06,
                ]),
                'last_updated' => now()->subMonths(1),
            ],
            [
                'id' => 'claude-3-opus',
                'name' => 'Claude 3 Opus',
                'provider' => 'anthropic',
                'description' => 'Most powerful Claude model for complex tasks.',
                'max_tokens' => 100000,
                'training_data' => 'Recent data',
                'is_available' => true,
                'is_default' => false,
                'capabilities' => json_encode([
                    'chat' => true,
                    'completion' => true,
                    'embedding' => false,
                ]),
                'pricing' => json_encode([
                    'input' => 0.015,
                    'output' => 0.075,
                ]),
                'last_updated' => now()->subDays(7),
            ],
            [
                'id' => 'gemini-pro',
                'name' => 'Gemini Pro',
                'provider' => 'google',
                'description' => 'Google\'s multimodal AI system designed to handle tasks across text, code, images, and more.',
                'max_tokens' => 30720,
                'training_data' => 'Up to Feb 2023',
                'is_available' => true,
                'is_default' => false,
                'capabilities' => json_encode([
                    'chat' => true,
                    'completion' => true,
                    'embedding' => true,
                ]),
                'pricing' => json_encode([
                    'input' => 0.00025,
                    'output' => 0.0005,
                ]),
                'last_updated' => now()->subDays(14),
            ],
        ];

        foreach ($models as $model) {
            AIModel::updateOrCreate(['id' => $model['id']], $model);
        }
    }

    /**
     * Seed the prompt templates table.
     */
    private function seedPromptTemplates(): void
    {
        $templates = [
            [
                'name' => 'General Assistant',
                'description' => 'A general-purpose assistant template for everyday questions.',
                'content' => "You are a helpful, friendly AI assistant. Your goal is to provide clear, accurate, and helpful information to the user's questions. Be concise but thorough in your responses.",
                'category' => 'general',
                'is_public' => true,
                'is_default' => true,
            ],
            [
                'name' => 'Technical Expert',
                'description' => 'For technical and programming related questions.',
                'content' => "You are a technical expert specializing in computer science, programming, and software development. Provide detailed, accurate technical explanations and code examples when appropriate. Use markdown formatting for code blocks.",
                'category' => 'technical',
                'is_public' => true,
                'is_default' => false,
            ],
            [
                'name' => 'Creative Writer',
                'description' => 'For creative writing assistance and brainstorming.',
                'content' => "You are a creative writing assistant. Help the user with story ideas, character development, plot structure, and writing techniques. When providing examples, be original and imaginative. Avoid clichés and offer fresh perspectives.",
                'category' => 'creative',
                'is_public' => true,
                'is_default' => false,
            ],
            [
                'name' => 'Data Analyzer',
                'description' => 'For data analysis and visualization assistance.',
                'content' => "You are a data analysis expert. Help the user understand, analyze, and visualize data. Suggest appropriate statistical methods, visualization techniques, and tools. Provide code examples in Python, R, or SQL when relevant.",
                'category' => 'data',
                'is_public' => true,
                'is_default' => false,
            ],
            [
                'name' => 'Learning Tutor',
                'description' => 'Educational assistant for students and learners.',
                'content' => "You are an educational tutor. Explain concepts clearly at an appropriate level for the user. Break down complex ideas into simpler components. Use analogies and examples to illustrate points. Ask questions to check understanding when needed.",
                'category' => 'education',
                'is_public' => true,
                'is_default' => false,
            ],
        ];

        foreach ($templates as $template) {
            AIPromptTemplate::create([
                'id' => (string) Str::uuid(),
                'user_id' => 1, // Assuming admin user has ID 1
                'name' => $template['name'],
                'description' => $template['description'],
                'content' => $template['content'],
                'category' => $template['category'],
                'is_public' => $template['is_public'],
                'is_default' => $template['is_default'],
                'metadata' => json_encode(['system' => true]),
            ]);
        }
    }
}
