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
     * @param string $type The type of embed code (script, iframe)
     * @return array
     */
    public function generateEmbedCode(string $id, string $type = 'script'): array
    {
        try {
            $widget = Widget::findOrFail($id);

            $baseUrl = config('app.frontend_url', 'https://thelastlab.com');

            if ($type === 'iframe') {
                $code = '<iframe src="' . $baseUrl . '/embed/' . $widget->id . '" frameborder="0" width="100%" height="600px"></iframe>';
            } else {
                // Default script embed
                $code = "<script src=\"{$baseUrl}/widget.js\" defer></script>\n" .
                    "<script>\n" .
                    "  document.addEventListener('DOMContentLoaded', function() {\n" .
                    "    TheLastLab.initChat({\n" .
                    "      widgetId: '{$widget->id}',\n" .
                    "      container: 'tllab-chat-container', // Optional custom container ID\n" .
                    "    });\n" .
                    "  });\n" .
                    "</script>\n" .
                    "<div id=\"tllab-chat-container\"></div>";
            }

            return [
                'status' => 'success',
                'data' => [
                    'code' => $code,
                    'type' => $type
                ],
                'message' => 'Embed code generated successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error generating embed code: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to generate embed code'
            ];
        }
    }

    /**
     * Get widget analytics data
     *
     * @param string $id Widget ID
     * @param string $timeRange Time range for analytics (1d, 7d, 30d, etc.)
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
                    'message' => 'Unauthorized to view widget analytics'
                ];
            }

            // Parse time range
            $startDate = now();
            switch ($timeRange) {
                case '1d':
                    $startDate = $startDate->subDay();
                    break;
                case '7d':
                    $startDate = $startDate->subDays(7);
                    break;
                case '30d':
                    $startDate = $startDate->subDays(30);
                    break;
                case '90d':
                    $startDate = $startDate->subDays(90);
                    break;
                default:
                    $startDate = $startDate->subDays(7);
            }

            // Get chat sessions for this widget
            $chatSessions = $widget->chatSessions()
                ->where('created_at', '>=', $startDate)
                ->get();

            // Calculate metrics
            $totalSessions = $chatSessions->count();
            $totalMessages = 0;
            $userMessages = 0;
            $aiMessages = 0;
            $averageResponseTime = 0;

            $sessionData = [];

            foreach ($chatSessions as $session) {
                $messages = $session->messages;
                $totalMessages += $messages->count();

                foreach ($messages as $message) {
                    if ($message->role === 'user') {
                        $userMessages++;
                    } elseif ($message->role === 'assistant') {
                        $aiMessages++;
                    }
                }

                $sessionData[] = [
                    'id' => $session->id,
                    'createdAt' => $session->created_at,
                    'messageCount' => $messages->count(),
                    'lastMessageAt' => $session->updated_at,
                ];
            }

            // Group sessions by day
            $sessionsByDay = $chatSessions->groupBy(function ($session) {
                return $session->created_at->format('Y-m-d');
            });

            $dailySessions = [];

            $currentDate = $startDate->copy();
            $endDate = now();

            while ($currentDate <= $endDate) {
                $dateKey = $currentDate->format('Y-m-d');
                $dailySessions[$dateKey] = [
                    'date' => $dateKey,
                    'count' => isset($sessionsByDay[$dateKey]) ? $sessionsByDay[$dateKey]->count() : 0
                ];
                $currentDate->addDay();
            }

            return [
                'status' => 'success',
                'data' => [
                    'totalSessions' => $totalSessions,
                    'totalMessages' => $totalMessages,
                    'userMessages' => $userMessages,
                    'aiMessages' => $aiMessages,
                    'averageMessagesPerSession' => $totalSessions > 0 ? round($totalMessages / $totalSessions, 2) : 0,
                    'sessionsPerDay' => array_values($dailySessions),
                    'recentSessions' => array_slice($sessionData, 0, 10)
                ],
                'message' => 'Widget analytics retrieved successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error retrieving widget analytics: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to retrieve widget analytics'
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
            // Check authorization
            if ($userId !== Auth::id() && !Auth::user()->hasRole('admin')) {
                return [
                    'status' => 'error',
                    'message' => 'Unauthorized to view these widgets'
                ];
            }

            $widgets = Widget::where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();

            return [
                'status' => 'success',
                'data' => $widgets,
                'message' => 'Widgets retrieved successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error retrieving user widgets: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to retrieve widgets'
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
}
