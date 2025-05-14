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

    // Embedding configuration
    'embeddings' => [
        'default_provider' => env('DEFAULT_EMBEDDING_PROVIDER', 'huggingface'),
        'dimensions' => env('EMBEDDING_DIMENSIONS', 384),

        'providers' => [
            'openai' => [
                'model' => env('OPENAI_EMBEDDING_MODEL', 'text-embedding-ada-002'),
                'max_tokens' => env('OPENAI_MAX_TOKENS', 8000),
            ],

            'huggingface' => [
                'model' => env('HUGGINGFACE_EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2'),
                'use_free_inference' => env('HUGGINGFACE_USE_FREE_INFERENCE', true),
            ],
        ],
    ],

    // Cache configuration
    'cache' => [
        'enabled' => env('AI_CACHE_ENABLED', true),
        'ttl' => env('AI_CACHE_TTL', 3600), // 1 hour
    ],

    // Logging configuration
    'logging' => [
        'enabled' => env('AI_LOGGING_ENABLED', true),
        'level' => env('AI_LOGGING_LEVEL', 'info'),
    ],

    // Rate limiting
    'rate_limits' => [
        'enabled' => env('AI_RATE_LIMITS_ENABLED', true),
        'max_requests_per_minute' => env('AI_MAX_REQUESTS_PER_MINUTE', 60),
        'openai' => env('OPENAI_RATE_LIMIT', 60),
        'anthropic' => env('ANTHROPIC_RATE_LIMIT', 30),
        'gemini' => env('GEMINI_RATE_LIMIT', 60),
        'grok' => env('GROK_RATE_LIMIT', 20),
        'huggingface' => env('HUGGINGFACE_RATE_LIMIT', 10),
        'openrouter' => env('OPENROUTER_RATE_LIMIT', 60),
        'mistral' => env('MISTRAL_RATE_LIMIT', 30),
        'deepseek' => env('DEEPSEEK_RATE_LIMIT', 20),
        'cohere' => env('COHERE_RATE_LIMIT', 30),
    ],

    // Global retry configuration
    'retry' => [
        'attempts' => env('AI_RETRY_ATTEMPTS', 3),
        'delay' => env('AI_RETRY_DELAY', 1000), // milliseconds
    ],

    // Fallback configuration
    'fallback' => [
        'enabled' => env('AI_FALLBACK_ENABLED', true),
        'provider_order' => [
            'openai',
            'anthropic',
            'gemini',
            'mistral',
            'openrouter',
            'cohere',
            'deepseek',
            'huggingface',
            'grok',
        ],
    ],

    // Token budget controls
    'token_budget' => [
        'enabled' => env('AI_TOKEN_BUDGET_ENABLED', true),
        'default_budget' => env('AI_DEFAULT_TOKEN_BUDGET', 1000000), // per month
        'alert_threshold' => env('AI_BUDGET_ALERT_THRESHOLD', 0.8), // 80% of budget
    ],

    // Prompt templates
    'prompt_templates' => [
        'cache_ttl' => env('AI_PROMPT_TEMPLATE_CACHE_TTL', 3600), // 1 hour
        'version_history_limit' => env('AI_PROMPT_TEMPLATE_VERSION_HISTORY', 10),
    ],
];
