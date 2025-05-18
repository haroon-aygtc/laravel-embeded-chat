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
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;
use App\Http\Controllers\Api\User\RoleController;

// Sanctum CSRF cookie route
Route::get('/sanctum/csrf-cookie', [CsrfCookieController::class, 'show']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Auth module routes
Route::prefix('auth')->as('auth.')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh-token', [AuthController::class, 'refreshToken']);

        // Simple auth check endpoint that just returns success if authenticated
        Route::get('/check', function () {
            return response()->json([
                'status' => 'success',
                'message' => 'Authenticated',
                'authenticated' => true
            ]);
        });
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
        Route::get('/', [AuthController::class, 'profile']);
        Route::patch('/update-profile', [ProfileController::class, 'updateProfile']);
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
        Route::post('/{id}/activate', [WidgetController::class, 'activate']);
        Route::post('/{id}/deactivate', [WidgetController::class, 'deactivate']);
        Route::get('/{id}/embed-code', [WidgetController::class, 'getEmbedCode']);
        Route::post('/{id}/status', [WidgetController::class, 'toggleStatus']);
        Route::get('/{id}/analytics', [WidgetController::class, 'getAnalytics']);
        Route::get('/user/{userId}', [WidgetController::class, 'getUserWidgets']);
        Route::post('/{id}/validate-domain', [WidgetController::class, 'validateDomain']);
        Route::get('/default', [WidgetController::class, 'getDefaultWidget']);
        Route::get('/config/user/{userId}', [WidgetController::class, 'getWidgetConfigByUser']);
    });

    // User role management
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::get('/permissions', [RoleController::class, 'permissions']);
        Route::get('/check/{role}', [RoleController::class, 'check']);
        Route::get('/check-permission/{permission}', [RoleController::class, 'checkPermission']);
        Route::put('/users/{userId}', [RoleController::class, 'update'])->middleware('permission:manage_users');
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
    Route::get('/', [KnowledgeBaseController::class, 'index']);
    Route::post('/', [KnowledgeBaseController::class, 'store']);
    Route::get('/{id}', [KnowledgeBaseController::class, 'show']);
    Route::put('/{id}', [KnowledgeBaseController::class, 'update']);
    Route::delete('/{id}', [KnowledgeBaseController::class, 'destroy']);

    // Knowledge Base entries
    Route::get('/{id}/entries', [KnowledgeBaseController::class, 'getEntries']);
    Route::post('/{id}/entries', [KnowledgeBaseController::class, 'addEntry']);
    Route::put('/entries/{entryId}', [KnowledgeBaseController::class, 'updateEntry']);
    Route::delete('/entries/{entryId}', [KnowledgeBaseController::class, 'deleteEntry']);

    // Search and knowledge retrieval
    Route::post('/search', [KnowledgeBaseController::class, 'search']);
    Route::post('/advanced-search', [KnowledgeBaseController::class, 'advancedSearch']);

    // Import/export
    Route::post('/{id}/export', [KnowledgeBaseController::class, 'export']);
    Route::post('/import', [KnowledgeBaseController::class, 'import']);

    // Vector search and embeddings
    Route::post('/semantic-search', [VectorSearchController::class, 'semanticSearch']);
    Route::post('/hybrid-search', [VectorSearchController::class, 'hybridSearch']);
    Route::post('/entries/{entryId}/embeddings', [VectorSearchController::class, 'generateEmbeddings']);
    Route::post('/{id}/generate-embeddings', [VectorSearchController::class, 'generateEmbeddingsForKnowledgeBase']);
    Route::post('/entries/{entryId}/chunk', [VectorSearchController::class, 'chunkEntry']);
    Route::post('/{id}/process-chunking', [VectorSearchController::class, 'processKnowledgeBaseChunking']);
    Route::put('/{id}/vector-settings', [VectorSearchController::class, 'updateVectorSearchSettings']);

    // Stats and Analytics
    Route::get('/{id}/stats', [KnowledgeBaseController::class, 'getStats']);
    Route::post('/entries/{entryId}/keyword-highlights', [KnowledgeBaseController::class, 'generateKeywordHighlights']);
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

        // Public route for default widget configuration
        Route::get('/default-config', function() {
            $widgetService = app(\App\Services\WidgetService::class);
            $defaultWidget = $widgetService->getDefaultWidget();

            return response()->json([
                'success' => true,
                'data' => $defaultWidget,
                'message' => 'Default widget configuration retrieved'
            ]);
        });
    });

    // Chat functionality for embedded widgets
    Route::prefix('chat')->group(function () {
        Route::get('/sessions/{sessionId}/messages', [PublicChatController::class, 'getMessages']);
        Route::post('/sessions/{sessionId}/messages', [PublicChatController::class, 'sendMessage']);
    });
});

// WebSocket routes
Route::middleware(['auth:sanctum', 'throttle:60,1'])->prefix('websocket')->group(function () {
    Route::get('/auth', [WebSocketController::class, 'auth']);
});

// Guest WebSocket authentication with strict rate limiting
Route::middleware(['throttle:10,1'])->prefix('websocket')->group(function () {
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

/**
 * WebSocket Status Endpoint
 * Checks if the WebSocket server is available and running
 */
Route::middleware(['throttle:30,1'])->get('/websocket-status', function () {
    // Check if the WebSocket server is configured
    $wsEnabled = config('broadcasting.default') === 'reverb';
    $wsHost = config('reverb.server.reverb.host', '127.0.0.1');
    $wsPort = config('reverb.server.reverb.port', 9001);
    $available = false;
    $status = 'unknown';
    $error = null;

    try {
        if ($wsEnabled) {
            // Try to connect to the WebSocket server to check if it's actually running
            $socket = @fsockopen($wsHost, $wsPort, $errno, $errstr, 2);

            if ($socket) {
                $available = true;
                $status = 'online';
                fclose($socket);

                // Log successful connection check
                \Illuminate\Support\Facades\Log::info('WebSocket server status check: online', [
                    'host' => $wsHost,
                    'port' => $wsPort
                ]);
            } else {
                $available = false;
                $status = 'offline';
                $error = "Cannot connect to WebSocket server: $errstr ($errno)";

                // Log failed connection
                \Illuminate\Support\Facades\Log::warning('WebSocket server status check: offline', [
                    'host' => $wsHost,
                    'port' => $wsPort,
                    'error' => $error
                ]);
            }
        } else {
            $status = 'disabled';
            $error = 'WebSocket broadcasting is not enabled in configuration';

            // Log disabled status
            \Illuminate\Support\Facades\Log::info('WebSocket server status check: disabled', [
                'broadcasting_driver' => config('broadcasting.default')
            ]);
        }
    } catch (\Exception $e) {
        $available = false;
        $status = 'error';
        $error = $e->getMessage();

        // Log exception
        \Illuminate\Support\Facades\Log::error('WebSocket server status check error', [
            'exception' => $e,
            'host' => $wsHost,
            'port' => $wsPort
        ]);
    }

    // Add cache headers to prevent frequent calls
    return response()->json([
        'available' => $available,
        'status' => $status,
        'message' => $available
            ? 'WebSocket server is available and running'
            : 'WebSocket server is unavailable, using polling fallback',
        'error' => $error,
        'host' => $wsHost,
        'port' => $wsPort,
        'secure' => request()->secure(),
        'cache_time' => now()->toIso8601String(),
        'next_check' => now()->addMinutes(2)->toIso8601String(),
    ])->withHeaders([
        'Cache-Control' => 'public, max-age=120', // Cache for 2 minutes
        'Expires' => now()->addMinutes(2)->toRfc7231String(),
    ]);
});

/**
 * API Status Endpoint
 * Simple endpoint to check if the API is working
 */
Route::get('/status', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'API is working',
        'timestamp' => now()->toIso8601String(),
        'version' => '1.0.0',
    ]);
});
