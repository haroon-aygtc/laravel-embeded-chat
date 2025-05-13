<?php

declare(strict_types=1);

namespace App\Services\Chat;

use App\Models\Chat\ChatSession;
use App\Models\Chat\ChatMessage;
use App\Models\Chat\ChatAttachment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChatService
{
    /**
     * Get all chat sessions for a user
     */
    public function getSessions(User $user): JsonResponse
    {
        $sessions = ChatSession::where('user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($sessions);
    }

    /**
     * Get a specific chat session
     */
    public function getSession(User $user, string $sessionId): JsonResponse
    {
        $session = ChatSession::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        return response()->json($session);
    }

    /**
     * Create a new chat session
     */
    public function createSession(User $user, array $data): JsonResponse
    {
        $session = new ChatSession();
        $session->id = (string) Str::uuid();
        $session->user_id = $user->id;
        $session->name = $data['name'];
        $session->context_rule_id = $data['contextRuleId'] ?? null;
        $session->context_name = $data['contextName'] ?? null;
        $session->context_mode = $data['contextMode'] ?? 'general';
        $session->save();

        return response()->json($session, 201);
    }

    /**
     * Update a chat session
     */
    public function updateSession(User $user, string $sessionId, array $data): JsonResponse
    {
        $session = ChatSession::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        if (isset($data['name'])) {
            $session->name = $data['name'];
        }

        if (array_key_exists('contextRuleId', $data)) {
            $session->context_rule_id = $data['contextRuleId'];
        }

        if (array_key_exists('contextName', $data)) {
            $session->context_name = $data['contextName'];
        }

        if (array_key_exists('contextMode', $data)) {
            $session->context_mode = $data['contextMode'];
        }

        $session->save();

        return response()->json($session);
    }

    /**
     * Delete a chat session
     */
    public function deleteSession(User $user, string $sessionId): JsonResponse
    {
        $session = ChatSession::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        try {
            DB::beginTransaction();

            // Delete all attachments associated with messages in the session
            $messageIds = ChatMessage::where('chat_session_id', $sessionId)->pluck('id')->toArray();
            $attachments = ChatAttachment::whereIn('chat_message_id', $messageIds)->get();

            foreach ($attachments as $attachment) {
                // Delete the file from storage
                if (Storage::disk('private')->exists($attachment->file_path)) {
                    Storage::disk('private')->delete($attachment->file_path);
                }

                // Delete the attachment record
                $attachment->delete();
            }

            // Delete all messages in the session
            ChatMessage::where('chat_session_id', $sessionId)->delete();

            // Delete the session
            $session->delete();

            DB::commit();
            return response()->json(['message' => 'Session deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete chat session: ' . $e->getMessage(), [
                'session_id' => $sessionId,
                'exception' => $e
            ]);
            return response()->json(['message' => 'Failed to delete session'], 500);
        }
    }

    /**
     * Get messages from a chat session
     */
    public function getMessages(User $user, string $sessionId): JsonResponse
    {
        $session = ChatSession::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $messages = ChatMessage::where('chat_session_id', $sessionId)
            ->orderBy('created_at', 'asc')
            ->get();

        // Load file attachments for each message
        $messages->each(function ($message) {
            $message->load('fileAttachments');
        });

        return response()->json($messages);
    }

    /**
     * Send a message in a chat session
     */
    public function sendMessage(User $user, string $sessionId, array $data): JsonResponse
    {
        $session = ChatSession::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        try {
            DB::beginTransaction();

            // Create user message
            $message = new ChatMessage();
            $message->id = (string) Str::uuid();
            $message->chat_session_id = $sessionId;
            $message->role = 'user';
            $message->content = $data['content'];
            $message->attachments = $data['attachments'] ?? null;
            $message->context_snippets = $data['contextSnippets'] ?? null;
            $message->save();

            // Update session timestamp and message count
            $session->updated_at = now();
            $session->last_message_at = now();
            $session->message_count = $session->message_count + 1;
            $session->save();

            // Process attachments if they exist in the message JSON
            if (!empty($data['attachments']) && is_array($data['attachments'])) {
                foreach ($data['attachments'] as $attachmentData) {
                    if (isset($attachmentData['id'])) {
                        // Link existing attachment to this message
                        $attachment = ChatAttachment::find($attachmentData['id']);
                        if ($attachment && $attachment->user_id === $user->id) {
                            $attachment->chat_message_id = $message->id;
                            $attachment->save();
                        }
                    }
                }
            }

            // Here you would call an AI service to generate a response
            // For a production app, this would be an actual AI service integration
            $aiResponse = new ChatMessage();
            $aiResponse->id = (string) Str::uuid();
            $aiResponse->chat_session_id = $sessionId;
            $aiResponse->role = 'assistant';
            $aiResponse->content = $this->generateAIResponse($data['content'], $session);
            $aiResponse->save();

            // Update session message count again for AI response
            $session->message_count = $session->message_count + 1;
            $session->save();

            DB::commit();

            return response()->json([
                'userMessage' => $message->load('fileAttachments'),
                'aiResponse' => $aiResponse
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to send message: ' . $e->getMessage(), [
                'session_id' => $sessionId,
                'exception' => $e
            ]);
            return response()->json(['message' => 'Failed to send message: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate an AI response
     *
     * In a production application, this would integrate with an actual AI service
     */
    private function generateAIResponse(string $userMessage, ChatSession $session): string
    {
        // This is a placeholder method that would be replaced with actual AI integration
        // Options include OpenAI, Anthropic, Google, etc.

        // For now, just return a simple message that looks like a real response
        $contextName = $session->context_name ?? 'general assistant';
        return "Based on your message: \"{$userMessage}\", as a {$contextName}, I would respond with relevant information to address your query. In a production environment, this would be generated by a real AI model like GPT-4, Claude, or another LLM.";
    }

    /**
     * Clear messages in a chat session
     */
    public function clearMessages(User $user, string $sessionId): JsonResponse
    {
        $session = ChatSession::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        try {
            DB::beginTransaction();

            // Find all messages in this session
            $messageIds = ChatMessage::where('chat_session_id', $sessionId)->pluck('id')->toArray();

            // Delete all attachments associated with messages in the session
            $attachments = ChatAttachment::whereIn('chat_message_id', $messageIds)->get();

            foreach ($attachments as $attachment) {
                // Delete the file from storage
                if (Storage::disk('private')->exists($attachment->file_path)) {
                    Storage::disk('private')->delete($attachment->file_path);
                }

                // Delete the attachment record
                $attachment->delete();
            }

            // Delete all messages
            ChatMessage::where('chat_session_id', $sessionId)->delete();

            // Reset message counts in session
            $session->message_count = 0;
            $session->unread_count = 0;
            $session->save();

            DB::commit();
            return response()->json(['message' => 'Messages cleared successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to clear messages: ' . $e->getMessage(), [
                'session_id' => $sessionId,
                'exception' => $e
            ]);
            return response()->json(['message' => 'Failed to clear messages'], 500);
        }
    }

    /**
     * Get chat sessions for a specific user
     */
    public function getUserSessions(User $currentUser, string $userId): JsonResponse
    {
        // Check if the current user is authorized to view the sessions
        if ($currentUser->id !== (int)$userId && !in_array($currentUser->role, ['admin'])) {
            return response()->json(['message' => 'Unauthorized to view these sessions'], 403);
        }

        $sessions = ChatSession::where('user_id', $userId)
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($sessions);
    }

    /**
     * Get chat sessions for a specific widget
     */
    public function getWidgetSessions(User $user, string $widgetId): JsonResponse
    {
        $sessions = ChatSession::where('user_id', $user->id)
            ->where('widget_id', $widgetId)
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($sessions);
    }

    /**
     * Mark messages in a session as read
     */
    public function markAsRead(User $user, string $sessionId): JsonResponse
    {
        $session = ChatSession::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        try {
            DB::beginTransaction();

            // Mark all unread messages as read
            $unreadCount = ChatMessage::where('chat_session_id', $sessionId)
                ->where('is_read', false)
                ->where('role', '!=', 'user') // Only mark non-user messages as read (typically AI responses)
                ->count();

            ChatMessage::where('chat_session_id', $sessionId)
                ->where('is_read', false)
                ->where('role', '!=', 'user')
                ->update([
                    'is_read' => true,
                    'read_at' => now()
                ]);

            // Update session unread count
            $session->unread_count = 0;
            $session->save();

            DB::commit();
            return response()->json([
                'message' => 'Messages marked as read',
                'markedCount' => $unreadCount
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to mark messages as read: ' . $e->getMessage(), [
                'session_id' => $sessionId,
                'exception' => $e
            ]);
            return response()->json(['message' => 'Failed to mark messages as read'], 500);
        }
    }

    /**
     * Upload a file attachment
     */
    public function uploadAttachment(User $user, array $data): JsonResponse
    {
        $session = ChatSession::where('id', $data['sessionId'])
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        /** @var UploadedFile $file */
        $file = $data['file'];

        try {
            // Validate file
            $this->validateAttachment($file);

            // Generate unique filename using UUID
            $uuid = (string) Str::uuid();
            $diskFilename = $uuid . '.' . $file->getClientOriginalExtension();

            // Store file in a private directory organized by user ID and session ID
            $storagePath = "attachments/{$user->id}/{$session->id}";
            $filePath = $file->storeAs($storagePath, $diskFilename, 'private');

            if (!$filePath) {
                return response()->json(['message' => 'Failed to upload file'], 500);
            }

            // Create attachment record in database
            $attachment = new ChatAttachment();
            $attachment->id = $uuid;
            $attachment->user_id = $user->id;
            $attachment->chat_message_id = null; // Will be linked when the message is sent
            $attachment->original_filename = $file->getClientOriginalName();
            $attachment->disk_filename = $diskFilename;
            $attachment->file_path = $filePath;
            $attachment->mime_type = $file->getMimeType();
            $attachment->file_size = $file->getSize();
            $attachment->is_public = false;
            $attachment->save();

            return response()->json([
                'message' => 'File uploaded successfully',
                'attachment' => [
                    'id' => $attachment->id,
                    'name' => $attachment->original_filename,
                    'type' => $attachment->mime_type,
                    'size' => $attachment->file_size,
                    'url' => "/api/chat/attachments/{$attachment->id}",
                    'uploaded_at' => $attachment->created_at->toIso8601String(),
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('File upload failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'session_id' => $data['sessionId'],
                'file_name' => $file->getClientOriginalName(),
                'exception' => $e
            ]);

            return response()->json([
                'message' => 'File upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate an attachment
     *
     * @throws \Exception
     */
    private function validateAttachment(UploadedFile $file): void
    {
        // Check file size (10MB maximum)
        $maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if ($file->getSize() > $maxSize) {
            throw new \Exception('File size exceeds maximum limit of 10MB');
        }

        // Validate mime type
        $allowedMimeTypes = [
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/rtf',
            'application/vnd.oasis.opendocument.text',
            'text/plain',
            'text/csv',

            // Images
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',

            // Archives
            'application/zip',
            'application/x-rar-compressed',
            'application/gzip',

            // Code
            'application/json',
            'text/html',
            'text/css',
            'text/javascript',
            'application/xml'
        ];

        if (!in_array($file->getMimeType(), $allowedMimeTypes)) {
            throw new \Exception('File type not allowed');
        }
    }

    /**
     * Get a specific attachment
     */
    public function getAttachment(User $user, string $id): JsonResponse
    {
        $attachment = ChatAttachment::find($id);

        if (!$attachment) {
            return response()->json(['message' => 'Attachment not found'], 404);
        }

        // Check if the user has permission to access this attachment
        if (!$attachment->is_public && $attachment->user_id !== $user->id && !in_array($user->role, ['admin'])) {
            return response()->json(['message' => 'Unauthorized to access this attachment'], 403);
        }

        // Check if the file exists in storage
        if (!Storage::disk('private')->exists($attachment->file_path)) {
            return response()->json(['message' => 'Attachment file not found'], 404);
        }

        // For the frontend, return attachment details
        // The actual file will be served by a separate route that handles streaming
        return response()->json([
            'id' => $attachment->id,
            'name' => $attachment->original_filename,
            'type' => $attachment->mime_type,
            'size' => $attachment->file_size,
            'url' => "/api/chat/attachments/{$attachment->id}/download",
            'uploaded_at' => $attachment->created_at->toIso8601String(),
        ]);
    }

    /**
     * Download an attachment file
     *
     * Note: This method is not in the controller interface yet, but should be added
     */
    public function downloadAttachment(User $user, string $id): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $attachment = ChatAttachment::find($id);

        if (!$attachment) {
            abort(404, 'Attachment not found');
        }

        // Check if the user has permission to access this attachment
        if (!$attachment->is_public && $attachment->user_id !== $user->id && !in_array($user->role, ['admin'])) {
            abort(403, 'Unauthorized to access this attachment');
        }

        // Check if the file exists in storage
        if (!Storage::disk('private')->exists($attachment->file_path)) {
            abort(404, 'Attachment file not found');
        }

        // Stream the file
        return Storage::disk('private')->download(
            $attachment->file_path,
            $attachment->original_filename,
            [
                'Content-Type' => $attachment->mime_type,
                'Content-Disposition' => 'attachment; filename="' . $attachment->original_filename . '"'
            ]
        );
    }

    /**
     * Get chat analytics
     */
    public function getAnalytics(User $user, array $filters = []): JsonResponse
    {
        // In a production app, you would compute these analytics from database queries
        // This would involve complex SQL queries with aggregations on the actual data

        $startDate = $filters['startDate'] ?? now()->subDays(30)->startOfDay();
        $endDate = $filters['endDate'] ?? now()->endOfDay();
        $userId = $filters['userId'] ?? null;

        // Build base queries
        $sessionsQuery = ChatSession::whereBetween('created_at', [$startDate, $endDate]);
        $messagesQuery = ChatMessage::whereHas('chatSession', function ($query) use ($startDate, $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        });

        // Apply user filter if specified
        if ($userId) {
            // Admin can view analytics for any user
            if ($user->role !== 'admin' && $user->id !== (int)$userId) {
                return response()->json(['message' => 'Unauthorized to view analytics for this user'], 403);
            }

            $sessionsQuery->where('user_id', $userId);
            $messagesQuery->whereHas('chatSession', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            });
        } else {
            // If no user specified, limit to current user unless admin
            if ($user->role !== 'admin') {
                $sessionsQuery->where('user_id', $user->id);
                $messagesQuery->whereHas('chatSession', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                });
            }
        }

        // Execute count queries
        $totalSessions = $sessionsQuery->count();
        $totalMessages = $messagesQuery->count();

        // Calculate average messages per session
        $averageMessagesPerSession = $totalSessions > 0 ? round($totalMessages / $totalSessions, 1) : 0;

        // Get timeline data (simplified example)
        $timelineData = [];
        $currentDate = clone $startDate;
        while ($currentDate <= $endDate) {
            $dayStart = clone $currentDate;
            $dayEnd = clone $currentDate->copy()->endOfDay();

            $daySessions = $sessionsQuery->clone()
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->count();

            $dayMessages = $messagesQuery->clone()
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->count();

            $timelineData[] = [
                'date' => $dayStart->toDateString(),
                'sessions' => $daySessions,
                'messages' => $dayMessages
            ];

            $currentDate->addDay();
        }

        // Top users by message count (only for admins)
        $topUsers = [];
        if ($user->role === 'admin') {
            // In a real app, this would be a complex SQL query with joins and aggregations
            // Simplified example:
            $topUsers = [
                ['id' => 1, 'name' => 'User 1', 'sessions' => 12, 'messages' => 350],
                ['id' => 2, 'name' => 'User 2', 'sessions' => 10, 'messages' => 320],
                ['id' => 3, 'name' => 'User 3', 'sessions' => 8, 'messages' => 280],
            ];
        }

        return response()->json([
            'summary' => [
                'totalSessions' => $totalSessions,
                'totalMessages' => $totalMessages,
                'averageMessagesPerSession' => $averageMessagesPerSession,
                'timeRange' => [
                    'start' => $startDate->toDateTimeString(),
                    'end' => $endDate->toDateTimeString(),
                ],
            ],
            'timeline' => [
                'daily' => $timelineData,
            ],
            'topUsers' => $topUsers,
        ]);
    }

    /**
     * Get session statistics
     */
    public function getSessionStats(User $user, array $filters = []): JsonResponse
    {
        // In a production app, you would compute these stats from database queries
        // For now, we'll return simplified example data

        $startDate = $filters['startDate'] ?? now()->subDays(30)->startOfDay();
        $endDate = $filters['endDate'] ?? now()->endOfDay();
        $userId = $filters['userId'] ?? null;

        // Query builder for sessions
        $query = ChatSession::whereBetween('created_at', [$startDate, $endDate]);

        // Apply user filter
        if ($userId) {
            // Admin can view stats for any user
            if ($user->role !== 'admin' && $user->id !== (int)$userId) {
                return response()->json(['message' => 'Unauthorized to view session stats for this user'], 403);
            }

            $query->where('user_id', $userId);
        } else {
            // If no user specified, limit to current user unless admin
            if ($user->role !== 'admin') {
                $query->where('user_id', $user->id);
            }
        }

        // Basic counts
        $total = $query->count();
        $active = $query->clone()->where('is_active', true)->count();
        $inactive = $total - $active;

        return response()->json([
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
            'timeRange' => [
                'start' => $startDate->toDateTimeString(),
                'end' => $endDate->toDateTimeString(),
            ],
        ]);
    }

    /**
     * Get message statistics
     */
    public function getMessageStats(User $user, array $filters = []): JsonResponse
    {
        // In a production app, you would compute these stats from database queries
        // For now, we'll return simplified example data

        $startDate = $filters['startDate'] ?? now()->subDays(30)->startOfDay();
        $endDate = $filters['endDate'] ?? now()->endOfDay();
        $userId = $filters['userId'] ?? null;
        $sessionId = $filters['sessionId'] ?? null;

        // Query builder for messages
        $query = ChatMessage::whereBetween('created_at', [$startDate, $endDate]);

        if ($sessionId) {
            // Verify the user has access to this session
            $session = ChatSession::find($sessionId);
            if (!$session) {
                return response()->json(['message' => 'Session not found'], 404);
            }

            if ($session->user_id !== $user->id && $user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized to view message stats for this session'], 403);
            }

            $query->where('chat_session_id', $sessionId);
        } else {
            // Apply session/user filters
            $query->whereHas('chatSession', function ($q) use ($user, $userId) {
                if ($userId) {
                    // Admin can view stats for any user
                    if ($user->role !== 'admin' && $user->id !== (int)$userId) {
                        // This will effectively return no results
                        $q->where('user_id', 0);
                    } else {
                        $q->where('user_id', $userId);
                    }
                } else {
                    // If no user specified, limit to current user unless admin
                    if ($user->role !== 'admin') {
                        $q->where('user_id', $user->id);
                    }
                }
            });
        }

        // Basic counts
        $total = $query->count();
        $userMessages = $query->clone()->where('role', 'user')->count();
        $assistantMessages = $query->clone()->where('role', 'assistant')->count();

        return response()->json([
            'total' => $total,
            'byRole' => [
                'user' => $userMessages,
                'assistant' => $assistantMessages,
            ],
            'timeRange' => [
                'start' => $startDate->toDateTimeString(),
                'end' => $endDate->toDateTimeString(),
            ],
        ]);
    }
}
