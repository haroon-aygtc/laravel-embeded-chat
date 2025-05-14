<?php

namespace Database\Seeders;

use App\Models\AI\FollowUpConfig;
use App\Models\AI\FollowUpQuestion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class FollowUpConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a default follow-up configuration
        $defaultConfig = FollowUpConfig::create([
            'id' => (string) Str::uuid(),
            'user_id' => 1, // Adjust based on your user setup
            'name' => 'Default Follow-up Configuration',
            'enable_follow_up_questions' => true,
            'max_follow_up_questions' => 3,
            'show_follow_up_as' => 'buttons',
            'generate_automatically' => false,
            'is_default' => true,
            'predefined_question_sets' => [
                [
                    'id' => 'general',
                    'name' => 'General Follow-ups',
                    'description' => 'General follow-up questions for any topic',
                    'questions' => [
                        'Can you explain that in more detail?',
                        'How does this apply to my situation?',
                        'What are the next steps I should take?',
                    ],
                ],
                [
                    'id' => 'technical',
                    'name' => 'Technical Support',
                    'description' => 'Follow-up questions for technical issues',
                    'questions' => [
                        'What error messages are you seeing?',
                        'Have you tried restarting the application?',
                        'What version are you currently using?',
                    ],
                    'triggerKeywords' => ['error', 'bug', 'issue', 'problem', 'not working'],
                ],
            ],
            'topic_based_question_sets' => [
                [
                    'id' => 'product',
                    'topic' => 'Product Information',
                    'questions' => [
                        'What features does this product have?',
                        'How much does it cost?',
                        'Is there a free trial available?',
                    ],
                ],
                [
                    'id' => 'billing',
                    'topic' => 'Billing',
                    'questions' => [
                        'How can I update my payment method?',
                        'When will I be charged?',
                        'How do I cancel my subscription?',
                    ],
                ],
            ],
        ]);

        // Create some follow-up questions for the default configuration
        $questions = [
            [
                'question' => 'Would you like me to explain this in more detail?',
                'display_order' => 0,
                'is_active' => true,
                'priority' => 'high',
                'display_position' => 'end',
                'category' => 'general',
            ],
            [
                'question' => 'Do you need examples of this concept?',
                'display_order' => 1,
                'is_active' => true,
                'priority' => 'medium',
                'display_position' => 'end',
                'category' => 'general',
            ],
            [
                'question' => 'Would you like to know other related topics?',
                'display_order' => 2,
                'is_active' => true,
                'priority' => 'low',
                'display_position' => 'end',
                'category' => 'general',
            ],
        ];

        foreach ($questions as $questionData) {
            FollowUpQuestion::create([
                'id' => (string) Str::uuid(),
                'config_id' => $defaultConfig->id,
                'question' => $questionData['question'],
                'display_order' => $questionData['display_order'],
                'is_active' => $questionData['is_active'],
                'priority' => $questionData['priority'],
                'display_position' => $questionData['display_position'],
                'category' => $questionData['category'],
            ]);
        }

        // Create an AI-generated follow-up configuration
        $aiGeneratedConfig = FollowUpConfig::create([
            'id' => (string) Str::uuid(),
            'user_id' => 1, // Adjust based on your user setup
            'name' => 'AI-Generated Follow-ups',
            'enable_follow_up_questions' => true,
            'max_follow_up_questions' => 3,
            'show_follow_up_as' => 'chips',
            'generate_automatically' => true,
            'is_default' => false,
            'predefined_question_sets' => [],
            'topic_based_question_sets' => [],
        ]);
    }
} 