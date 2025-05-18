<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Widget;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\Collection;

class WidgetService
{
    /**
     * Get all widgets with optional filtering and pagination
     *
     * @param array $filters Associative array of filter conditions
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array
     */
    public function getAllWidgets(array $filters = [], int $page = 1, int $perPage = 10): array
    {
        try {
            $query = Widget::query();

            // Apply filters
            if (isset($filters['name'])) {
                $query->where('name', 'like', '%' . $filters['name'] . '%');
            }

            if (isset($filters['is_active']) && in_array($filters['is_active'], ['true', 'false', true, false], true)) {
                $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
            }

            // Apply pagination
            $widgets = $query->paginate($perPage, ['*'], 'page', $page);

            return [
                'status' => 'success',
                'data' => $widgets,
                'message' => 'Widgets retrieved successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error retrieving widgets: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to retrieve widgets'
            ];
        }
    }

    /**
     * Get a widget by ID
     *
     * @param string $id Widget ID
     * @return array
     */
    public function getWidget(string $id): array
    {
        try {
            $widget = Widget::findOrFail($id);

            return [
                'status' => 'success',
                'data' => $widget,
                'message' => 'Widget retrieved successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error retrieving widget: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Widget not found'
            ];
        }
    }

    /**
     * Get all widgets for a specific user
     *
     * @param int $userId User ID
     * @return Collection
     */
    public function getAllWidgetsByUser(int $userId): Collection
    {
        return Widget::where('user_id', $userId)->get();
    }

    /**
     * Get a widget by ID
     *
     * @param string $id Widget ID
     * @return Widget|null
     */
    public function getWidgetById(string $id): ?Widget
    {
        return Widget::find($id);
    }

    /**
     * Create a new widget
     *
     * @param array $data Widget data
     * @return Widget
     */
    public function createWidget(array $data): Widget
    {
        // Set defaults for required JSON fields if not provided
        if (!isset($data['visual_settings'])) {
            $data['visual_settings'] = [
                'primaryColor' => '#4F46E5',
                'secondaryColor' => '#10B981',
                'backgroundColor' => '#FFFFFF',
                'textColor' => '#1F2937',
                'fontFamily' => 'Inter, sans-serif',
            ];
        }

        if (!isset($data['behavioral_settings'])) {
            $data['behavioral_settings'] = [
                'initialState' => 'closed',
                'autoOpen' => false,
                'openDelay' => 3,
            ];
        }

        if (!isset($data['content_settings'])) {
            $data['content_settings'] = [
                'initialMessage' => 'Hello! How can I assist you today?',
                'placeholderText' => 'Type your message...',
                'allowAttachments' => true,
                'allowVoice' => true,
                'allowEmoji' => true,
            ];
        }

        // Default to active unless specified
        if (!isset($data['is_active'])) {
            $data['is_active'] = true;
        }

        // Create and return the widget
        return Widget::create($data);
    }

    /**
     * Update a widget
     *
     * @param string $id Widget ID
     * @param array $data Updated widget data
     * @return Widget|null
     */
    public function updateWidget(string $id, array $data): ?Widget
    {
        $widget = $this->getWidgetById($id);

        if (!$widget) {
            return null;
        }

        $widget->update($data);

        return $widget->fresh();
    }

    /**
     * Delete a widget
     *
     * @param string $id Widget ID
     * @return bool
     */
    public function deleteWidget(string $id): bool
    {
        $widget = $this->getWidgetById($id);

        if (!$widget) {
            return false;
        }

        return $widget->delete();
    }

    /**
     * Update the widget's active status
     *
     * @param string $id Widget ID
     * @param bool $isActive Whether to activate or deactivate
     * @return Widget|null
     */
    public function updateWidgetStatus(string $id, bool $isActive): ?Widget
    {
        return $this->updateWidget($id, ['is_active' => $isActive]);
    }

    /**
     * Get widgets by domain
     *
     * @param string $domain Domain name
     * @return Collection
     */
    public function getWidgetsByDomain(string $domain): Collection
    {
        return Widget::where('domain', $domain)
            ->orWhereJsonContains('allowed_domains', $domain)
            ->where('is_active', true)
            ->get();
    }

    /**
     * Check if a widget can be embedded on a domain
     *
     * @param string $widgetId Widget ID
     * @param string $domain Domain to check
     * @return bool
     */
    public function canEmbedOnDomain(string $widgetId, string $domain): bool
    {
        $widget = $this->getWidgetById($widgetId);

        if (!$widget || !$widget->is_active) {
            return false;
        }

        // If no domain restrictions, allow all
        if (empty($widget->domain) && empty($widget->allowed_domains)) {
            return true;
        }

        // Check primary domain
        if ($widget->domain === $domain) {
            return true;
        }

        // Check allowed domains list
        if (!empty($widget->allowed_domains)) {
            foreach ($widget->allowed_domains as $allowedDomain) {
                // Exact match
                if ($allowedDomain === $domain) {
                    return true;
                }

                // Wildcard match (e.g., *.example.com)
                if (Str::startsWith($allowedDomain, '*.')) {
                    $wildcardDomain = substr($allowedDomain, 2); // Remove '*.'
                    if (Str::endsWith($domain, $wildcardDomain)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Get widget configuration for public use (embedding)
     *
     * @param string $widgetId Widget ID
     * @param string|null $domain Requesting domain for validation
     * @return array|null Widget configuration or null if not allowed
     */
    public function getPublicWidgetConfig(string $widgetId, ?string $domain = null): ?array
    {
        $widget = $this->getWidgetById($widgetId);

        if (!$widget || !$widget->is_active) {
            return null;
        }

        // Validate domain if provided
        if ($domain && !$this->canEmbedOnDomain($widgetId, $domain)) {
            return null;
        }

        // Return only the necessary data for the public widget
        return [
            'id' => $widget->id,
            'title' => $widget->title,
            'subtitle' => $widget->subtitle,
            'visual_settings' => $widget->visual_settings,
            'behavioral_settings' => $widget->behavioral_settings,
            'content_settings' => $widget->content_settings,
            'context_rule_id' => $widget->context_rule_id,
        ];
    }

    /**
     * Get the default widget configuration
     *
     * @return array
     */
    public function getDefaultWidget(): array
    {
        // Create default widget data
        return [
            'id' => 'default',
            'name' => 'Default Widget',
            'title' => 'Chat Assistant',
            'subtitle' => 'Ask me anything',
            'description' => 'Default chat widget configuration',
            'initiallyOpen' => false,
            'contextMode' => 'restricted',
            'contextName' => 'Website Assistance',
            'primaryColor' => '#4f46e5',
            'position' => 'bottom-right',
            'showOnMobile' => true,
            'visual_settings' => [
                'position' => 'bottom-right',
                'theme' => 'light',
                'colors' => [
                    'primary' => '#4f46e5',
                    'secondary' => '#10b981',
                    'background' => '#ffffff',
                    'text' => '#1f2937'
                ],
                'fonts' => [
                    'primary' => 'Inter, sans-serif',
                    'size' => 'medium'
                ],
                'logo' => null,
                'avatar' => null
            ],
            'behavior_settings' => [
                'auto_open' => false,
                'auto_open_delay' => 3,
                'greeting_message' => 'Hello! How can I help you today?',
                'placeholder_text' => 'Type your message here...',
                'persistent_chat' => true,
                'show_sources' => true,
                'show_timestamps' => true
            ],
            'connection_settings' => [
                'ai_model' => 'default',
                'knowledge_base' => 'general'
            ],
            'custom_fields' => [
                'company_name' => 'The Last Lab',
                'website_url' => 'https://thelastlab.com'
            ],
            'created_at' => now()->toIso8601String(),
            'updated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Toggle a widget's active status
     *
     * @param string $id Widget ID
     * @return array
     */
    public function toggleWidgetStatus(string $id): array
    {
        try {
            $widget = Widget::findOrFail($id);

            // Check authorization
            if ($widget->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return [
                    'status' => 'error',
                    'message' => 'Unauthorized to toggle widget status'
                ];
            }

            // Toggle status
            $widget->is_active = !$widget->is_active;
            $widget->save();

            return [
                'status' => 'success',
                'data' => $widget,
                'message' => 'Widget status toggled successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error toggling widget status: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to toggle widget status'
            ];
        }
    }

    /**
     * Generate embed code for a widget
     *
     * @param string $id Widget ID
     * @param string $type The type of embed code (script, iframe, webcomponent)
     * @return array
     */
    public function generateEmbedCode(string $id, string $type = 'script'): array
    {
        try {
            $widget = Widget::findOrFail($id);

            // Check authorization
            if ($widget->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return [
                    'status' => 'error',
                    'message' => 'Unauthorized to access widget embed code'
                ];
            }

            // Base URLs from config
            $apiUrl = rtrim(config('app.url'), '/');
            $frontendUrl = rtrim(config('app.frontend_url') ?? $apiUrl, '/');
            $widgetId = $widget->id;
            $embedCode = '';

            switch ($type) {
                case 'script':
                    // JavaScript embed - the most flexible option
                    $embedCode = "<script src=\"{$frontendUrl}/public/widget.js\" defer></script>\n" .
                        "<script>\n" .
                        "  document.addEventListener('DOMContentLoaded', function() {\n" .
                        "    TheLastLab.initChat({\n" .
                        "      widgetId: '{$widgetId}',\n" .
                        "      container: 'tllab-chat-container', // Optional custom container ID\n" .
                        "      position: " . json_encode($widget->behavioral_settings['position'] ?? 'bottom-right') . ",\n" .
                        "      primaryColor: " . json_encode($widget->visual_settings['primaryColor'] ?? '#4F46E5') . ",\n" .
                        "    });\n" .
                        "  });\n" .
                        "</script>\n" .
                        "<div id=\"tllab-chat-container\"></div>";
                    break;

                case 'iframe':
                    // iFrame embed - simplest option but limited customization
                    $embedCode = "<iframe\n" .
                        "  src=\"{$frontendUrl}/chat-embed?widgetId={$widgetId}&embedded=true\"\n" .
                        "  style=\"width: 100%; height: 600px; border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\"\n" .
                        "  allow=\"microphone\"\n" .
                        "  title=\"AI Chat Widget\"\n" .
                        "></iframe>";
                    break;

                case 'webcomponent':
                    // Web Component - modern approach with shadow DOM for style isolation
                    $embedCode = "<script src=\"{$frontendUrl}/public/chat-widget.js\" defer></script>\n" .
                        "<ai-chat-widget\n" .
                        "  widget-id=\"{$widgetId}\"\n" .
                        "  position=\"" . ($widget->behavioral_settings['position'] ?? 'bottom-right') . "\"\n" .
                        "  primary-color=\"" . ($widget->visual_settings['primaryColor'] ?? '#4F46E5') . "\"\n" .
                        "></ai-chat-widget>";
                    break;

                default:
                    return [
                        'status' => 'error',
                        'message' => 'Invalid embed code type'
                    ];
            }

            return [
                'status' => 'success',
                'data' => [
                    'embed_code' => $embedCode,
                    'type' => $type,
                    'widget' => [
                        'id' => $widget->id,
                        'name' => $widget->name,
                        'title' => $widget->title
                    ]
                ],
                'message' => 'Embed code generated successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error generating embed code: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to generate embed code: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get widget analytics data
     *
     * @param string $id Widget ID
     * @param string $timeRange Time range for analytics (7d, 30d, 90d)
     * @return array
     */
    public function getWidgetAnalytics(string $id, string $timeRange = '7d'): array
    {
        try {
            $widget = Widget::findOrFail($id);

            // Check authorization
            if ($widget->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return [
                    'status' => 'error',
                    'message' => 'Unauthorized to access widget analytics'
                ];
            }

            // Calculate date range
            $endDate = now();
            $startDate = match($timeRange) {
                '30d' => now()->subDays(30),
                '90d' => now()->subDays(90),
                default => now()->subDays(7), // Default to 7 days
            };

            // Get chat sessions for this widget
            $chatSessions = $widget->chatSessions()
                ->where('created_at', '>=', $startDate)
                ->where('created_at', '<=', $endDate)
                ->get();

            // Calculate metrics
            $totalSessions = $chatSessions->count();
            $totalMessages = 0;
            $messagesByDay = [];
            $sessionsByDay = [];
            $uniqueUsers = [];
            $averageSessionLength = 0;
            $totalSessionDuration = 0;

            // Initialize arrays for daily data
            $period = new \DatePeriod(
                $startDate,
                new \DateInterval('P1D'),
                $endDate->addDay() // Add a day to include the end date
            );

            foreach ($period as $date) {
                $dateKey = $date->format('Y-m-d');
                $messagesByDay[$dateKey] = 0;
                $sessionsByDay[$dateKey] = 0;
            }

            foreach ($chatSessions as $session) {
                $sessionDate = $session->created_at->format('Y-m-d');
                $sessionsByDay[$sessionDate] = ($sessionsByDay[$sessionDate] ?? 0) + 1;

                // Count messages in session
                $messageCount = $session->messages()->count();
                $totalMessages += $messageCount;
                $messagesByDay[$sessionDate] = ($messagesByDay[$sessionDate] ?? 0) + $messageCount;

                // Track unique users by IP or user_id
                $userIdentifier = $session->user_id ?? $session->ip_address ?? 'anonymous';
                if (!in_array($userIdentifier, $uniqueUsers)) {
                    $uniqueUsers[] = $userIdentifier;
                }

                // Calculate session duration if available
                if ($session->ended_at) {
                    $duration = $session->created_at->diffInSeconds($session->ended_at);
                    $totalSessionDuration += $duration;
                }
            }

            // Calculate average session length
            if ($totalSessions > 0) {
                $averageSessionLength = $totalSessionDuration / $totalSessions;
            }

            // Format data for response
            $chartData = [
                'sessions' => [],
                'messages' => []
            ];

            foreach ($sessionsByDay as $date => $count) {
                $chartData['sessions'][] = [
                    'date' => $date,
                    'count' => $count
                ];
            }

            foreach ($messagesByDay as $date => $count) {
                $chartData['messages'][] = [
                    'date' => $date,
                    'count' => $count
                ];
            }

            return [
                'status' => 'success',
                'data' => [
                    'widget' => [
                        'id' => $widget->id,
                        'name' => $widget->name,
                        'title' => $widget->title
                    ],
                    'metrics' => [
                        'totalSessions' => $totalSessions,
                        'totalMessages' => $totalMessages,
                        'uniqueUsers' => count($uniqueUsers),
                        'averageSessionLength' => round($averageSessionLength),
                        'timeRange' => $timeRange
                    ],
                    'chartData' => $chartData
                ],
                'message' => 'Widget analytics retrieved successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error retrieving widget analytics: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to retrieve widget analytics: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get widgets for a specific user
     *
     * @param int $userId User ID
     * @return array
     */
    public function getWidgetsByUser(int $userId): array
    {
        try {
            // Skip authorization check for now to simplify
            // We'll handle this at the controller level

            Log::info('Fetching widgets for user ID: ' . $userId);

            $widgets = Widget::where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();

            Log::info('Found ' . $widgets->count() . ' widgets for user');

            return [
                'status' => 'success',
                'data' => $widgets,
                'message' => 'Widgets retrieved successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error retrieving user widgets: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
                'userId' => $userId
            ]);

            return [
                'status' => 'error',
                'message' => 'Failed to retrieve widgets: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check if a domain is valid for a widget
     *
     * @param string $widgetId Widget ID
     * @param string $domain Domain to check
     * @return bool
     */
    public function isValidDomain(string $widgetId, string $domain): bool
    {
        return $this->canEmbedOnDomain($widgetId, $domain);
    }

    /**
     * Validate if a domain is allowed for a specific widget
     *
     * @param string $widgetId Widget ID
     * @param string $domain Domain to validate
     * @return array
     */
    public function validateDomain(string $widgetId, string $domain): array
    {
        try {
            $widget = Widget::findOrFail($widgetId);

            // If no restrictions are set, all domains are allowed
            if (empty($widget->allowed_domains)) {
                return [
                    'status' => 'success',
                    'data' => [
                        'isAllowed' => true,
                        'domain' => $domain
                    ],
                    'message' => 'Domain is allowed (no restrictions set)'
                ];
            }

            $isAllowed = false;

            foreach ($widget->allowed_domains as $allowedDomain) {
                // Check exact match
                if ($allowedDomain === $domain) {
                    $isAllowed = true;
                    break;
                }

                // Check wildcard match (e.g., *.example.com)
                if (str_starts_with($allowedDomain, '*.')) {
                    $wildcardDomain = substr($allowedDomain, 2); // Remove '*.'
                    if (str_ends_with($domain, $wildcardDomain) && substr_count($domain, '.') >= substr_count($wildcardDomain, '.') + 1) {
                        $isAllowed = true;
                        break;
                    }
                }
            }

            return [
                'status' => 'success',
                'data' => [
                    'isAllowed' => $isAllowed,
                    'domain' => $domain,
                    'allowedDomains' => $widget->allowed_domains
                ],
                'message' => $isAllowed ? 'Domain is allowed' : 'Domain is not allowed'
            ];
        } catch (\Exception $e) {
            Log::error('Error validating domain: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to validate domain: ' . $e->getMessage()
            ];
        }
    }
}
