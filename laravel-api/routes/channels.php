<?php

declare(strict_types=1);

use App\Models\Chat\ChatSession;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// User-specific private channel
Broadcast::channel('user.{userId}', function (User $user, string $userId) {
    return (string) $user->id === $userId;
});

// Chat session channel
Broadcast::channel('chat.{sessionId}', function (User $user, string $sessionId) {
    $session = ChatSession::find($sessionId);
    
    // If it's a public embedded session with no user, allow access
    if ($session && $session->context_mode === 'embedded') {
        return true;
    }
    
    // Otherwise, check if the user owns the session
    return $session && (string) $session->user_id === (string) $user->id;
});

// Public widget channel - anyone can subscribe
Broadcast::channel('widget.{widgetId}', function ($user, string $widgetId) {
    return true;
});
