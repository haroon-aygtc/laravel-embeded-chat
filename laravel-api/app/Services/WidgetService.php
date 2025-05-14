<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Widget;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class WidgetService
{
    /**
     * Get a paginated list of widgets.
     *
     * @param array<string, mixed> $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getWidgets(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = Widget::query();

        // Apply user filter if available
        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        } else {
            // Default to current user if no user_id specified
            $query->where('user_id', Auth::id());
        }

        // Apply name filter if available
        if (isset($filters['name']) && !empty($filters['name'])) {
            $query->where('name', 'like', '%' . $filters['name'] . '%');
        }

        // Apply status filter if available
        if (isset($filters['is_active']) && $filters['is_active'] !== null) {
            $query->where('is_active', $filters['is_active']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get a single widget by ID.
     *
     * @param string $id
     * @return Widget|null
     */
    public function getWidget(string $id): ?Widget
    {
        return Widget::find($id);
    }

    /**
     * Create a new widget.
     *
     * @param array<string, mixed> $data
     * @return Widget
     */
    public function createWidget(array $data): Widget
    {
        // Ensure visual_settings, behavioral_settings, and content_settings are arrays
        $data['visual_settings'] = $data['visual_settings'] ?? [
            'position' => 'bottom-right',
            'theme' => 'light',
            'colors' => [
                'primary' => '#4F46E5',
                'secondary' => '#10B981',
                'background' => '#FFFFFF',
                'text' => '#1F2937'
            ],
            'style' => 'rounded',
            'width' => '380px',
            'height' => '600px',
            'showHeader' => true,
            'showFooter' => true
        ];

        $data['behavioral_settings'] = $data['behavioral_settings'] ?? [
            'autoOpen' => false,
            'openDelay' => 3,
            'notification' => true,
            'mobileBehavior' => 'standard',
            'sounds' => false
        ];

        $data['content_settings'] = $data['content_settings'] ?? [
            'welcomeMessage' => 'Hello! How can I assist you today?',
            'placeholderText' => 'Type your message...',
            'botName' => 'AI Assistant',
            'avatarUrl' => null
        ];

        // Ensure the current user is set as the owner
        $data['user_id'] = $data['user_id'] ?? Auth::id();

        return Widget::create($data);
    }

    /**
     * Update an existing widget.
     *
     * @param string $id
     * @param array<string, mixed> $data
     * @return Widget|null
     */
    public function updateWidget(string $id, array $data): ?Widget
    {
        $widget = $this->getWidget($id);

        if (!$widget) {
            return null;
        }

        // Ensure user can only update their own widgets
        if ($widget->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
            return null;
        }

        $widget->update($data);
        return $widget->fresh();
    }

    /**
     * Delete a widget.
     *
     * @param string $id
     * @return bool
     */
    public function deleteWidget(string $id): bool
    {
        $widget = $this->getWidget($id);

        if (!$widget) {
            return false;
        }

        // Ensure user can only delete their own widgets
        if ($widget->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
            return false;
        }

        return (bool) $widget->delete();
    }

    /**
     * Toggle a widget's active status.
     *
     * @param string $id
     * @return Widget|null
     */
    public function toggleWidgetStatus(string $id): ?Widget
    {
        $widget = $this->getWidget($id);

        if (!$widget) {
            return null;
        }

        // Ensure user can only update their own widgets
        if ($widget->user_id !== Auth::id() && !Auth::user()->hasRole('admin')) {
            return null;
        }

        $widget->is_active = !$widget->is_active;
        $widget->save();

        return $widget;
    }

    /**
     * Generate embed code for a widget.
     *
     * @param string $id
     * @param string $type Either 'iframe' or 'webcomponent'
     * @return string|null
     */
    public function generateEmbedCode(string $id, string $type = 'iframe'): ?string
    {
        $widget = $this->getWidget($id);

        if (!$widget || !$widget->is_active) {
            return null;
        }

        $baseUrl = config('app.frontend_url', 'http://localhost:3000');

        if ($type === 'iframe') {
            return "<iframe 
                src=\"{$baseUrl}/chat-embed?widgetId={$widget->id}\" 
                width=\"100%\" 
                height=\"600px\" 
                frameborder=\"0\" 
                allow=\"microphone\" 
                style=\"border: none; width: 100%; height: 600px;\"
                title=\"AI Chat Widget\">
            </iframe>";
        } elseif ($type === 'webcomponent') {
            $scriptUrl = "{$baseUrl}/chat-widget.js";
            return "<script src=\"{$scriptUrl}\" defer></script>\n<ai-chat-widget widget-id=\"{$widget->id}\"></ai-chat-widget>";
        }

        return null;
    }

    /**
     * Validate an embedding domain against allowed domains for a widget.
     *
     * @param string $widgetId
     * @param string $domain
     * @return bool
     */
    public function isValidDomain(string $widgetId, string $domain): bool
    {
        $widget = $this->getWidget($widgetId);

        if (!$widget || !$widget->is_active) {
            return false;
        }

        // If no allowed domains are set, allow all
        if (empty($widget->allowed_domains)) {
            return true;
        }

        // Check if domain is in allowed list
        foreach ($widget->allowed_domains as $allowedDomain) {
            // Allow exact matches
            if ($allowedDomain === $domain) {
                return true;
            }

            // Allow wildcard subdomains
            if (str_starts_with($allowedDomain, '*.')) {
                $baseDomain = substr($allowedDomain, 2);
                if (str_ends_with($domain, $baseDomain)) {
                    return true;
                }
            }
        }

        return false;
    }
} 