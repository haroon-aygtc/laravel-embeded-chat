<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Widget;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

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
     * Create a new widget
     *
     * @param array $data Widget data
     * @return array
     */
    public function createWidget(array $data): array
    {
        try {
            // Validate the data
            $validator = Validator::make($data, [
                'name' => 'required|string|max:255',
                'title' => 'required|string|max:255',
                'visual_settings' => 'required|array',
                'behavioral_settings' => 'required|array',
                'content_settings' => 'required|array',
            ]);

            if ($validator->fails()) {
                return [
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ];
            }

            // Create new widget
            $widget = new Widget();
            $widget->id = (string) Str::uuid();
            $widget->name = $data['name'];
            $widget->description = $data['description'] ?? null;
            $widget->user_id = $data['user_id'] ?? auth()->id();
            $widget->context_rule_id = $data['context_rule_id'] ?? null;
            $widget->knowledge_base_ids = $data['knowledge_base_ids'] ?? null;
            $widget->title = $data['title'];
            $widget->subtitle = $data['subtitle'] ?? null;
            $widget->visual_settings = $data['visual_settings'];
            $widget->behavioral_settings = $data['behavioral_settings'];
            $widget->content_settings = $data['content_settings'];
            $widget->allowed_domains = $data['allowed_domains'] ?? null;
            $widget->is_active = $data['is_active'] ?? true;
            $widget->save();

            return [
                'status' => 'success',
                'data' => $widget,
                'message' => 'Widget created successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error creating widget: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to create widget'
            ];
        }
    }

    /**
     * Update an existing widget
     *
     * @param string $id Widget ID
     * @param array $data Updated widget data
     * @return array
     */
    public function updateWidget(string $id, array $data): array
    {
        try {
            $widget = Widget::findOrFail($id);

            // Update fields if provided
            if (isset($data['name'])) {
                $widget->name = $data['name'];
            }

            if (isset($data['description'])) {
                $widget->description = $data['description'];
            }

            if (isset($data['context_rule_id'])) {
                $widget->context_rule_id = $data['context_rule_id'];
            }

            if (isset($data['knowledge_base_ids'])) {
                $widget->knowledge_base_ids = $data['knowledge_base_ids'];
            }

            if (isset($data['title'])) {
                $widget->title = $data['title'];
            }

            if (isset($data['subtitle'])) {
                $widget->subtitle = $data['subtitle'];
            }

            if (isset($data['visual_settings'])) {
                // Merge to preserve any existing settings not provided in the update
                $widget->visual_settings = array_merge($widget->visual_settings, $data['visual_settings']);
            }

            if (isset($data['behavioral_settings'])) {
                // Merge to preserve any existing settings not provided in the update
                $widget->behavioral_settings = array_merge($widget->behavioral_settings, $data['behavioral_settings']);
            }

            if (isset($data['content_settings'])) {
                // Merge to preserve any existing settings not provided in the update
                $widget->content_settings = array_merge($widget->content_settings, $data['content_settings']);
            }

            if (isset($data['allowed_domains'])) {
                $widget->allowed_domains = $data['allowed_domains'];
            }

            if (isset($data['is_active'])) {
                $widget->is_active = $data['is_active'];
            }

            $widget->save();

            return [
                'status' => 'success',
                'data' => $widget,
                'message' => 'Widget updated successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error updating widget: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to update widget'
            ];
        }
    }

    /**
     * Delete a widget
     *
     * @param string $id Widget ID
     * @return array
     */
    public function deleteWidget(string $id): array
    {
        try {
            $widget = Widget::findOrFail($id);
            $widget->delete();

            return [
                'status' => 'success',
                'message' => 'Widget deleted successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error deleting widget: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to delete widget'
            ];
        }
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
            $widget->is_active = !$widget->is_active;
            $widget->save();

            return [
                'status' => 'success',
                'data' => $widget,
                'message' => 'Widget status updated successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error toggling widget status: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to update widget status'
            ];
        }
    }

    /**
     * Generate embed code for a widget
     *
     * @param string $id Widget ID
     * @param string $type Embed type (iframe or webcomponent)
     * @return array
     */
    public function generateEmbedCode(string $id, string $type = 'iframe'): array
    {
        try {
            $widget = Widget::findOrFail($id);
            $baseUrl = config('app.url');

            $embedCode = '';

            if ($type === 'iframe') {
                $embedCode = '<iframe
  src="' . $baseUrl . '/chat-embed/' . $widget->id . '"
  width="100%"
  height="600px"
  style="border: none; position: fixed; bottom: 20px; right: 20px; width: 380px; height: 600px; z-index: 9999;"
  title="Chat Widget"
></iframe>';
            } else {
                $embedCode = '<script src="' . $baseUrl . '/chat-widget.js"></script>
<chat-widget
  widget-id="' . $widget->id . '"
  primary-color="' . ($widget->visual_settings['colors']['primary'] ?? '#4F46E5') . '"
  position="' . ($widget->visual_settings['position'] ?? 'bottom-right') . '"
></chat-widget>';
            }

            return [
                'status' => 'success',
                'data' => [
                    'embed_code' => $embedCode,
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
     * Validate if a domain is allowed for a widget
     *
     * @param string $id Widget ID
     * @param string $domain Domain to validate
     * @return bool
     */
    public function isValidDomain(string $id, string $domain): bool
    {
        try {
            $widget = Widget::findOrFail($id);

            // If no domains are specified, all domains are allowed
            if (!$widget->allowed_domains || count($widget->allowed_domains) === 0) {
                return true;
            }

            foreach ($widget->allowed_domains as $allowedDomain) {
                // Check exact match
                if ($allowedDomain === $domain) {
                    return true;
                }

                // Check wildcard subdomains
                if (str_starts_with($allowedDomain, '*.')) {
                    $baseDomain = substr($allowedDomain, 2); // Remove the '*.' prefix

                    // Check if domain ends with the base domain
                    if (str_ends_with($domain, $baseDomain) && substr_count($domain, '.') > 1) {
                        return true;
                    }
                }
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Error validating domain: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get all widgets for a user
     *
     * @param string $userId User ID
     * @return array
     */
    public function getWidgetsByUser(string $userId): array
    {
        try {
            $widgets = Widget::where('user_id', $userId)->get();

            return [
                'status' => 'success',
                'data' => $widgets,
                'message' => 'User widgets retrieved successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Error retrieving user widgets: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to retrieve user widgets'
            ];
        }
    }

    /**
     * Get widget analytics
     *
     * @param string $id Widget ID
     * @param string $timeRange Time range (e.g., '7d', '30d', '90d')
     * @return array
     */
    public function getWidgetAnalytics(string $id, string $timeRange = '7d'): array
    {
        try {
            $widget = Widget::findOrFail($id);

            // Determine date range based on timeRange
            $startDate = null;
            switch ($timeRange) {
                case '7d':
                    $startDate = now()->subDays(7);
                    break;
                case '30d':
                    $startDate = now()->subDays(30);
                    break;
                case '90d':
                    $startDate = now()->subDays(90);
                    break;
                default:
                    $startDate = now()->subDays(7);
            }

            // Get session analytics
            $sessions = $widget->chatSessions()
                ->where('created_at', '>=', $startDate)
                ->get();

            $totalSessions = $sessions->count();

            // Group sessions by day
            $sessionsPerDay = $sessions->groupBy(function ($session) {
                return $session->created_at->format('Y-m-d');
            })->map(function ($group) {
                return [
                    'date' => $group->first()->created_at->format('Y-m-d'),
                    'count' => $group->count()
                ];
            })->values();

            // Get message analytics
            $totalMessages = 0;
            $messagesPerDay = [];

            if ($totalSessions > 0) {
                $sessionIds = $sessions->pluck('id');

                $messages = \App\Models\Chat\ChatMessage::whereIn('session_id', $sessionIds)
                    ->where('created_at', '>=', $startDate)
                    ->get();

                $totalMessages = $messages->count();

                // Group messages by day
                $messagesPerDay = $messages->groupBy(function ($message) {
                    return $message->created_at->format('Y-m-d');
                })->map(function ($group) {
                    return [
                        'date' => $group->first()->created_at->format('Y-m-d'),
                        'count' => $group->count()
                    ];
                })->values();
            }

            // Calculate average messages per session
            $avgMessagesPerSession = $totalSessions > 0 ? $totalMessages / $totalSessions : 0;

            // Calculate average session duration
            $avgSessionDuration = 0;
            if ($totalSessions > 0) {
                $totalDuration = 0;
                foreach ($sessions as $session) {
                    $messages = $session->messages()->orderBy('created_at')->get();

                    if ($messages->count() >= 2) {
                        $firstMessage = $messages->first();
                        $lastMessage = $messages->last();

                        $duration = $firstMessage->created_at->diffInSeconds($lastMessage->created_at);
                        $totalDuration += $duration;
                    }
                }

                $avgSessionDuration = $totalSessions > 0 ? $totalDuration / $totalSessions : 0;
            }

            // Get top domains
            $topDomains = [];
            if ($totalSessions > 0) {
                $domainsCount = collect();

                foreach ($sessions as $session) {
                    if (isset($session->metadata['referrer'])) {
                        $referrer = $session->metadata['referrer'];
                        $domain = parse_url($referrer, PHP_URL_HOST) ?? 'unknown';

                        if ($domainsCount->has($domain)) {
                            $domainsCount[$domain] += 1;
                        } else {
                            $domainsCount[$domain] = 1;
                        }
                    }
                }

                $topDomains = $domainsCount->sortDesc()
                    ->map(function ($count, $domain) {
                        return [
                            'domain' => $domain,
                            'count' => $count
                        ];
                    })
                    ->take(5)
                    ->values();
            }

            return [
                'status' => 'success',
                'data' => [
                    'totalSessions' => $totalSessions,
                    'totalMessages' => $totalMessages,
                    'averageMessagesPerSession' => round($avgMessagesPerSession, 2),
                    'averageSessionDuration' => round($avgSessionDuration, 2),
                    'sessionsPerDay' => $sessionsPerDay,
                    'messagesPerDay' => $messagesPerDay,
                    'topDomains' => $topDomains,
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
}
