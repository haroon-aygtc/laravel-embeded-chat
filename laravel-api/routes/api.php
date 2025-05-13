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
use App\Http\Controllers\Api\User\NotificationController;
use App\Http\Controllers\Api\AI\AILogController;
use App\Http\Controllers\Api\AI\AIProviderController;
use App\Http\Controllers\Api\FollowUp\FollowUpController;
use App\Http\Controllers\Api\KnowledgeBase\KnowledgeBaseController;

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

        // Prompt management
        Route::get('/prompt-templates', [AIController::class, 'getPromptTemplates']);
        Route::get('/prompt-templates/{id}', [AIController::class, 'getPromptTemplate']);
        Route::post('/prompt-templates', [AIController::class, 'createPromptTemplate']);
        Route::put('/prompt-templates/{id}', [AIController::class, 'updatePromptTemplate']);
        Route::delete('/prompt-templates/{id}', [AIController::class, 'deletePromptTemplate']);

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

    // AI logs routes
    Route::get('/ai/logs', [AILogController::class, 'index']);
    Route::get('/ai/logs/{id}', [AILogController::class, 'show']);
    Route::post('/ai/logs/export', [AILogController::class, 'export']);
    Route::delete('/ai/logs/{id}', [AILogController::class, 'destroy']);

    // Context rules routes
    Route::get('/context-rules', [ContextRuleController::class, 'index']);
    Route::get('/context-rules/{id}', [ContextRuleController::class, 'show']);
    Route::post('/context-rules', [ContextRuleController::class, 'store']);
    Route::put('/context-rules/{id}', [ContextRuleController::class, 'update']);
    Route::delete('/context-rules/{id}', [ContextRuleController::class, 'destroy']);

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

        Route::post('/generate', [FollowUpController::class, 'generateFollowUps']);
        Route::post('/process', [FollowUpController::class, 'processSelectedFollowUp']);
    });
});

// AI Provider Routes
Route::middleware(['auth:sanctum'])->prefix('ai/providers')->name('ai.providers.')->group(function () {
    Route::get('/', 'Api\AI\AIProviderController@getProviders')->name('all');
    Route::get('/{providerId}', 'Api\AI\AIProviderController@getProvider')->name('show');
    Route::post('/{providerId}/configure', 'Api\AI\AIProviderController@configureProvider')->name('configure');
    Route::post('/{providerId}/test', 'Api\AI\AIProviderController@testProviderConnection')->name('test');
    Route::post('/{providerId}/status', 'Api\AI\AIProviderController@toggleProviderStatus')->name('status');
    Route::get('/{providerId}/models', 'Api\AI\AIProviderController@getProviderModels')->name('models');
    Route::post('/{providerId}/default-model', 'Api\AI\AIProviderController@setDefaultModel')->name('default-model');
});

// Knowledge Base routes
Route::middleware(['auth:sanctum'])->prefix('knowledge-base')->group(function () {
    Route::get('/', [KnowledgeBaseController::class, 'index']);
    Route::post('/', [KnowledgeBaseController::class, 'store']);
    Route::get('/{id}', [KnowledgeBaseController::class, 'show']);
    Route::put('/{id}', [KnowledgeBaseController::class, 'update']);
    Route::delete('/{id}', [KnowledgeBaseController::class, 'destroy']);
    Route::get('/{id}/export', [KnowledgeBaseController::class, 'export']);
    Route::post('/import', [KnowledgeBaseController::class, 'import']);

    // Knowledge entries routes
    Route::get('/{knowledgeBaseId}/entries', [KnowledgeBaseController::class, 'getEntries']);
    Route::post('/{knowledgeBaseId}/entries', [KnowledgeBaseController::class, 'storeEntry']);
    Route::post('/{knowledgeBaseId}/entries/bulk', [KnowledgeBaseController::class, 'storeBulkEntries']);
    Route::post('/{knowledgeBaseId}/generate-embeddings', [KnowledgeBaseController::class, 'generateEmbeddings']);
    Route::put('/entries/{id}', [KnowledgeBaseController::class, 'updateEntry']);
    Route::delete('/entries/{id}', [KnowledgeBaseController::class, 'destroyEntry']);
    Route::post('/entries/bulk-delete', [KnowledgeBaseController::class, 'bulkDestroyEntries']);

    // Search routes
    Route::post('/search', [KnowledgeBaseController::class, 'search']);
    Route::get('/entries/{entryId}/similar', [KnowledgeBaseController::class, 'findSimilar']);
});
