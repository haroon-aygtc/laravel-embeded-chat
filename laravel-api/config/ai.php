<?php

return [
    'providers' => [
        'openai' => [
            'base_url' => env('OPENAI_API_URL', 'https://api.openai.com/v1'),
            'default_model' => env('OPENAI_DEFAULT_MODEL', 'gpt-3.5-turbo'),
            'timeout' => env('OPENAI_TIMEOUT', 30),
            'retry_attempts' => env('OPENAI_RETRY_ATTEMPTS', 3),
        ],

        'anthropic' => [
            'base_url' => env('ANTHROPIC_API_URL', 'https://api.anthropic.com/v1'),
            'default_model' => env('ANTHROPIC_DEFAULT_MODEL', 'claude-3-sonnet-20240229'),
            'timeout' => env('ANTHROPIC_TIMEOUT', 30),
            'retry_attempts' => env('ANTHROPIC_RETRY_ATTEMPTS', 3),
        ],

        'gemini' => [
            'base_url' => env('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1'),
            'default_model' => env('GEMINI_DEFAULT_MODEL', 'gemini-1.5-flash'),
            'timeout' => env('GEMINI_TIMEOUT', 60),
            'retry_attempts' => env('GEMINI_RETRY_ATTEMPTS', 5),
            'retry_delay' => env('GEMINI_RETRY_DELAY', 2000),
        ],

        'grok' => [
            'base_url' => env('GROK_API_URL', 'https://api.grok.x.com/v1'),
            'default_model' => env('GROK_DEFAULT_MODEL', 'grok-1'),
            'timeout' => env('GROK_TIMEOUT', 30),
            'retry_attempts' => env('GROK_RETRY_ATTEMPTS', 3),
        ],

        'huggingface' => [
            'base_url' => env('HUGGINGFACE_API_URL', 'https://api-inference.huggingface.co/models'),
            'default_model' => env('HUGGINGFACE_DEFAULT_MODEL', 'meta-llama/Llama-2-70b-chat-hf'),
            'timeout' => env('HUGGINGFACE_TIMEOUT', 60),
            'retry_attempts' => env('HUGGINGFACE_RETRY_ATTEMPTS', 3),
        ],

        'openrouter' => [
            'base_url' => env('OPENROUTER_API_URL', 'https://openrouter.ai/api/v1'),
            'default_model' => env('OPENROUTER_DEFAULT_MODEL', 'openai/gpt-3.5-turbo'),
            'timeout' => env('OPENROUTER_TIMEOUT', 30),
            'retry_attempts' => env('OPENROUTER_RETRY_ATTEMPTS', 3),
        ],

        'mistral' => [
            'base_url' => env('MISTRAL_API_URL', 'https://api.mistral.ai/v1'),
            'default_model' => env('MISTRAL_DEFAULT_MODEL', 'mistral-large-latest'),
            'timeout' => env('MISTRAL_TIMEOUT', 30),
            'retry_attempts' => env('MISTRAL_RETRY_ATTEMPTS', 3),
        ],

        'deepseek' => [
            'base_url' => env('DEEPSEEK_API_URL', 'https://api.deepseek.com/v1'),
            'default_model' => env('DEEPSEEK_DEFAULT_MODEL', 'deepseek-chat'),
            'timeout' => env('DEEPSEEK_TIMEOUT', 30),
            'retry_attempts' => env('DEEPSEEK_RETRY_ATTEMPTS', 3),
        ],

        'cohere' => [
            'base_url' => env('COHERE_API_URL', 'https://api.cohere.ai/v1'),
            'default_model' => env('COHERE_DEFAULT_MODEL', 'command'),
            'timeout' => env('COHERE_TIMEOUT', 30),
            'retry_attempts' => env('COHERE_RETRY_ATTEMPTS', 3),
        ],
    ],
];
