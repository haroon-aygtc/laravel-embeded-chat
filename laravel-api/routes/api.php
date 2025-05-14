<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\User\UserController;
use App\Http\Controllers\Api\Profile\ProfileController;
use App\Http\Controllers\Api\UserActivity\UserActivityController;
use App\Http\Controllers\Api\Scraping\ScrapingController;
use App\Http\Controllers\Api\Chat\ChatController;
use App\Http\Controllers\Api\AI\AIController;
use App\Http\Controllers\Api\ContextRule\ContextRuleController;
use App\Http\Controllers\Api\PromptTemplate\PromptTemplateController;
use App\Http\Controllers\Api\User\NotificationController;
use App\Http\Controllers\Api\AI\AILogController;
use App\Http\Controllers\Api\AI\AIProviderController;
use App\Http\Controllers\Api\FollowUp\FollowUpController;
use App\Http\Controllers\Api\KnowledgeBase\KnowledgeBaseController;
use App\Http\Controllers\Api\KnowledgeBase\VectorSearchController;
use App\Http\Controllers\Api\Widget\WidgetController;
use App\Http\Controllers\Api\Widget\PublicWidgetController;
use App\Http\Controllers\Api\Chat\PublicChatController;
use App\Http\Controllers\Api\WebSocket\WebSocketController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Auth module routes
Route::prefix('auth')->as('auth.')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
    });
});

// Routes that require authentication
Route::middleware('auth:sanctum')->group(function () {
    // User module routes
    Route::prefix('users')->as('users.')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::post('/', [UserController::class, 'store']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
    });

    // Profile module routes
    Route::prefix('profile')->as('profile.')->group(function () {
        Route::patch('/', [ProfileController::class, 'updateProfile']);
        Route::patch('/security', [ProfileController::class, 'updateSecurity']);
        Route::get('/sessions', [ProfileController::class, 'getSessions']);
        Route::delete('/sessions/{sessionId}', [ProfileController::class, 'revokeSession']);
        Route::post('/feedback', [ProfileController::class, 'submitFeedback']);
    });

    // User Activity module routes
    Route::prefix('user-activity')->as('user-activity.')->group(function () {
        Route::get('/', [UserActivityController::class, 'index']);
        Route::get('/user/{user}', [UserActivityController::class, 'getByUser']);
        Route::post('/', [UserActivityController::class, 'store']);
    });

    // Scraping module routes
    Route::prefix('scraping')->as('scraping.')->group(function () {
        Route::get('/selectors', [ScrapingController::class, 'getSelectors']);
        Route::get('/tables', [ScrapingController::class, 'getDatabaseTables']);
        Route::get('/proxy', [ScrapingController::class, 'proxyUrl']);
    });

    // Chat module routes
    Route::middleware('auth:sanctum')->prefix('chat')->group(function () {
        Route::get('/sessions', [ChatController::class, 'getSessions']);
        Route::get('/sessions/{sessionId}', [ChatController::class, 'getSession']);
        Route::post('/sessions', [ChatController::class, 'createSession']);
        Route::put('/sessions/{sessionId}', [ChatController::class, 'updateSession']);
        Route::delete('/sessions/{sessionId}', [ChatController::class, 'deleteSession']);

        Route::get('/sessions/{sessionId}/messages', [ChatController::class, 'getMessages']);
        Route::post('/sessions/{sessionId}/messages', [ChatController::class, 'sendMessage']);
        Route::delete('/sessions/{sessionId}/messages', [ChatController::class, 'clearMessages']);

        Route::put('/sessions/{sessionId}/read', [ChatController::class, 'markAsRead']);
        Route::post('/attachments', [ChatController::class, 'uploadAttachment']);
        Route::get('/attachments/{id}', [ChatController::class, 'getAttachment']);
        Route::get('/attachments/{id}/download', [ChatController::class, 'downloadAttachment']);

        Route::get('/users/{userId}/sessions', [ChatController::class, 'getUserSessions']);
        Route::get('/widgets/{widgetId}/sessions', [ChatController::class, 'getWidgetSessions']);

        Route::get('/analytics', [ChatController::class, 'getAnalytics']);
        Route::get('/stats/sessions', [ChatController::class, 'getSessionStats']);
        Route::get('/stats/messages', [ChatController::class, 'getMessageStats']);

        // Add the typing status endpoint
        Route::post('/sessions/{sessionId}/typing', [ChatController::class, 'updateTypingStatus']);
    });

    // AI module routes
    Route::prefix('ai')->group(function () {
        // Core AI functionality
        Route::post('/generate', [AIController::class, 'generate']);
        Route::post('/generate/stream', [AIController::class, 'streamGenerate']);

        // Model management
        Route::get('/models', [AIController::class, 'getModels']);
        Route::get('/models/{id}', [AIController::class, 'getModel']);
        Route::get('/models/default', [AIController::class, 'getDefaultModel']);
        Route::post('/models/default', [AIController::class, 'setDefaultModel']);

        // Logging and analytics
        Route::get('/logs', [AIController::class, 'getLogs']);
        Route::get('/logs/{id}', [AIController::class, 'getLog']);
        Route::post('/logs', [AIController::class, 'createLog']);
        Route::get('/performance', [AIController::class, 'getPerformance']);

        // Cache management
        Route::get('/cache', [AIController::class, 'getCache']);
        Route::get('/cache/{id}', [AIController::class, 'getCacheItem']);
        Route::post('/cache/clear', [AIController::class, 'clearCache']);

        // AI Provider routes
        Route::post('/providers', [AIProviderController::class, 'store']);
        Route::get('/providers', [AIProviderController::class, 'index']);
        Route::get('/providers/{id}', [AIProviderController::class, 'show']);
        Route::put('/providers/{id}', [AIProviderController::class, 'update']);
        Route::delete('/providers/{id}', [AIProviderController::class, 'destroy']);
        Route::post('/model/{id}/default', [AIController::class, 'setDefaultModel']);
        Route::post('/model/{id}/status', [AIController::class, 'updateModelStatus']);

        // AI logs routes
        Route::prefix('logs')->group(function () {
            Route::get('/', [AILogController::class, 'index']);
            Route::get('/export', [AILogController::class, 'export']);
            Route::get('/{id}', [AILogController::class, 'show']);
        });

        // Performance metrics
        Route::get('/performance', [AIController::class, 'getPerformanceMetrics']);
    });

    // Context Rules module routes
    Route::prefix('context-rules')->as('context-rules.')->group(function () {
        // Context rule management
        Route::get('/', [ContextRuleController::class, 'index']);
        Route::get('/{id}', [ContextRuleController::class, 'show']);
        Route::post('/', [ContextRuleController::class, 'store']);
        Route::put('/{id}', [ContextRuleController::class, 'update']);
        Route::delete('/{id}', [ContextRuleController::class, 'destroy']);

        // User specific rules
        Route::get('/user/{userId}', [ContextRuleController::class, 'getUserRules']);
        Route::get('/user/{userId}/default', [ContextRuleController::class, 'getDefaultRule']);
        Route::post('/{id}/set-default', [ContextRuleController::class, 'setDefault']);

        // Testing and validation
        Route::post('/{id}/test', [ContextRuleController::class, 'testRule']);
        Route::post('/validate', [ContextRuleController::class, 'validateRule']);

        // Templates
        Route::get('/templates', [ContextRuleController::class, 'getTemplates']);
        Route::get('/templates/{id}', [ContextRuleController::class, 'getTemplate']);

        // Knowledge base integration
        Route::get('/{ruleId}/knowledge-bases', [ContextRuleController::class, 'getKnowledgeBases']);
    });

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::post('/notifications/mark-read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Follow-up configuration routes
    Route::prefix('follow-up')->group(function () {
        Route::get('/configs', [FollowUpController::class, 'index']);
        Route::post('/configs', [FollowUpController::class, 'store']);
        Route::get('/configs/{id}', [FollowUpController::class, 'show']);
        Route::put('/configs/{id}', [FollowUpController::class, 'update']);
        Route::delete('/configs/{id}', [FollowUpController::class, 'destroy']);

        Route::get('/configs/{configId}/questions', [FollowUpController::class, 'getQuestions']);
        Route::post('/configs/{configId}/questions', [FollowUpController::class, 'addQuestion']);
        Route::put('/questions/{id}', [FollowUpController::class, 'updateQuestion']);
        Route::delete('/questions/{id}', [FollowUpController::class, 'deleteQuestion']);
        Route::put('/configs/{configId}/questions/reorder', [FollowUpController::class, 'reorderQuestions']);

        Route::post('/generate', [FollowUpController::class, 'generateFollowUps']);
        Route::post('/process', [FollowUpController::class, 'processSelectedFollowUp']);
    });
    
    // Widget management routes (authenticated)
    Route::prefix('widgets')->group(function () {
        Route::get('/', [WidgetController::class, 'index']);
        Route::get('/{id}', [WidgetController::class, 'show']);
        Route::post('/', [WidgetController::class, 'store']);
        Route::put('/{id}', [WidgetController::class, 'update']);
        Route::delete('/{id}', [WidgetController::class, 'destroy']);
        Route::post('/{id}/toggle-status', [WidgetController::class, 'toggleStatus']);
        Route::get('/{id}/embed-code', [WidgetController::class, 'generateEmbedCode']);
        Route::post('/{id}/validate-domain', [WidgetController::class, 'validateDomain']);
    });
});

// AI Provider Routes
Route::middleware(['auth:sanctum'])->prefix('ai/providers')->name('ai.providers.')->group(function () {
    Route::get('/', [AIProviderController::class, 'getProviders'])->name('all');
    Route::get('/{providerId}', [AIProviderController::class, 'getProvider'])->name('show');
    Route::post('/{providerId}/configure', [AIProviderController::class, 'configureProvider'])->name('configure');
    Route::post('/{providerId}/test', [AIProviderController::class, 'testProviderConnection'])->name('test');
    Route::post('/{providerId}/status', [AIProviderController::class, 'toggleProviderStatus'])->name('status');
    Route::get('/{providerId}/models', [AIProviderController::class, 'getProviderModels'])->name('models');
    Route::post('/{providerId}/default-model', [AIProviderController::class, 'setDefaultModel'])->name('default-model');
});

/*
|--------------------------------------------------------------------------
| Knowledge Base Routes
|--------------------------------------------------------------------------
*/
Route::group(['prefix' => 'knowledge-base', 'middleware' => ['auth:sanctum']], function () {
    // Existing Knowledge Base routes
    Route::get('/', 'Api\KnowledgeBase\KnowledgeBaseController@index');
    Route::post('/', 'Api\KnowledgeBase\KnowledgeBaseController@store');
    Route::get('/{id}', 'Api\KnowledgeBase\KnowledgeBaseController@show');
    Route::put('/{id}', 'Api\KnowledgeBase\KnowledgeBaseController@update');
    Route::delete('/{id}', 'Api\KnowledgeBase\KnowledgeBaseController@destroy');
    
    // Knowledge Base entries
    Route::get('/{id}/entries', 'Api\KnowledgeBase\KnowledgeBaseController@getEntries');
    Route::post('/{id}/entries', 'Api\KnowledgeBase\KnowledgeBaseController@addEntry');
    Route::put('/entries/{entryId}', 'Api\KnowledgeBase\KnowledgeBaseController@updateEntry');
    Route::delete('/entries/{entryId}', 'Api\KnowledgeBase\KnowledgeBaseController@deleteEntry');
    
    // Search and knowledge retrieval
    Route::post('/search', 'Api\KnowledgeBase\KnowledgeBaseController@search');
    Route::post('/advanced-search', 'Api\KnowledgeBase\KnowledgeBaseController@advancedSearch');
    
    // Import/export
    Route::post('/{id}/export', 'Api\KnowledgeBase\KnowledgeBaseController@export');
    Route::post('/import', 'Api\KnowledgeBase\KnowledgeBaseController@import');
    
    // Vector search and embeddings
    Route::post('/semantic-search', 'Api\KnowledgeBase\VectorSearchController@semanticSearch');
    Route::post('/hybrid-search', 'Api\KnowledgeBase\VectorSearchController@hybridSearch');
    Route::post('/entries/{entryId}/embeddings', 'Api\KnowledgeBase\VectorSearchController@generateEmbeddings');
    Route::post('/{id}/generate-embeddings', 'Api\KnowledgeBase\VectorSearchController@generateEmbeddingsForKnowledgeBase');
    Route::post('/entries/{entryId}/chunk', 'Api\KnowledgeBase\VectorSearchController@chunkEntry');
    Route::post('/{id}/process-chunking', 'Api\KnowledgeBase\VectorSearchController@processKnowledgeBaseChunking');
    Route::put('/{id}/vector-settings', 'Api\KnowledgeBase\VectorSearchController@updateVectorSearchSettings');

    // Stats and Analytics
    Route::get('/{id}/stats', 'Api\KnowledgeBase\KnowledgeBaseController@getStats');
    Route::post('/entries/{entryId}/keyword-highlights', 'Api\KnowledgeBase\KnowledgeBaseController@generateKeywordHighlights');
});

// Prompt Templates
Route::prefix('prompt-templates')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [PromptTemplateController::class, 'index']);
    Route::get('/{id}', [PromptTemplateController::class, 'show']);
    Route::post('/', [PromptTemplateController::class, 'store']);
    Route::put('/{id}', [PromptTemplateController::class, 'update']);
    Route::delete('/{id}', [PromptTemplateController::class, 'destroy']);
    Route::post('/preview', [PromptTemplateController::class, 'preview']);
});

// Public Widget routes (no authentication required)
Route::prefix('public')->group(function () {
    // Widget configuration and session management
    Route::prefix('widgets')->group(function () {
        Route::get('/{id}/config', [PublicWidgetController::class, 'getConfig']);
        Route::post('/{id}/sessions', [PublicWidgetController::class, 'createChatSession']);
    });
    
    // Chat functionality for embedded widgets
    Route::prefix('chat')->group(function () {
        Route::get('/sessions/{sessionId}/messages', [PublicChatController::class, 'getMessages']);
        Route::post('/sessions/{sessionId}/messages', [PublicChatController::class, 'sendMessage']);
    });
});

// WebSocket routes
Route::middleware('auth:sanctum')->prefix('websocket')->group(function () {
    Route::get('/auth', [WebSocketController::class, 'auth']);
});

Route::prefix('websocket')->group(function () {
    Route::post('/guest-auth', [WebSocketController::class, 'guestAuth']);
});

// Chat typing status routes
Route::middleware('auth:sanctum')->prefix('chat')->group(function () {
    // Add the typing status endpoint
    Route::post('/sessions/{sessionId}/typing', [ChatController::class, 'updateTypingStatus']);
});

Route::prefix('public/chat')->group(function () {
    // Add the public typing status endpoint
    Route::post('/sessions/{sessionId}/typing', [PublicChatController::class, 'updateTypingStatus']);
});
