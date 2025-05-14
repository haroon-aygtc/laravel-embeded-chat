import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import useWebSocket from './useWebSocket';
import { api, ApiResponse, getWebSocketUrl } from '@/services/api/core/apiClient';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  session_id: string;
  created_at: string;
  type?: string;
  metadata?: any;
}

export interface TypingStatus {
  user_id: string;
  session_id: string;
  is_typing: boolean;
  timestamp: string;
}

type MessageHandler = (message: any) => void;

interface UseChatWebSocketOptions {
  sessionId: string;
  clientId?: string;
  isPublic?: boolean;
}

export default function useChatWebSocket({
  sessionId,
  clientId = '',
  isPublic = false
}: UseChatWebSocketOptions) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize WebSocket connection
  const getAuthUrl = useCallback(async () => {
    try {
      setIsLoading(true);

      if (isPublic) {
        // For public widgets, use guest auth
        const response = await api.post<ApiResponse<{ channels: string[] }>>('/websocket/guest-auth', {
          session_id: sessionId,
          client_id: clientId,
        });

        if (response.success) {
          // Set the WebSocket URL for public connections
          setWsUrl(getWebSocketUrl());
        } else {
          setError(response.message || 'Failed to authenticate WebSocket connection');
        }
      } else if (user && token) {
        // For authenticated users
        const response = await api.get<ApiResponse<{ token: string }>>('/websocket/auth', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.success) {
          // Set the WebSocket URL with auth token for authenticated connections
          setWsUrl(getWebSocketUrl('', { token: response.data?.token || '' }));
        } else {
          setError(response.message || 'Failed to authenticate WebSocket connection');
        }
      } else {
        setError('Authentication required for WebSocket connection');
      }
    } catch (err) {
      console.error('Error getting WebSocket auth:', err);
      setError('Failed to authenticate WebSocket connection');
    } finally {
      setIsLoading(false);
    }
  }, [user, token, sessionId, isPublic, clientId]);

  // Initialize authentication on mount
  useEffect(() => {
    if (sessionId) {
      getAuthUrl();
    }
  }, [getAuthUrl, sessionId]);

  // Connect to WebSocket
  const {
    isConnected,
    error: wsError,
    sendMessage,
    subscribe
  } = useWebSocket(wsUrl);

  // Subscribe to events when connected
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to chat message events
    const unsubscribeMessage = subscribe('chat.message', (message) => {
      if (message.data && message.data.session_id === sessionId) {
        setMessages(prev => {
          // Check if we already have this message (to avoid duplicates)
          const exists = prev.some(m => m.id === message.data.id);
          if (exists) return prev;

          return [...prev, message.data];
        });
      }
    });

    // Subscribe to typing events
    const unsubscribeTyping = subscribe('chat.typing', (message) => {
      if (message.data && message.data.session_id === sessionId) {
        setTypingUsers(prev => ({
          ...prev,
          [message.data.user_id]: message.data.is_typing
        }));

        // Auto-clear typing status after 10 seconds if no updates
        if (message.data.is_typing) {
          setTimeout(() => {
            setTypingUsers(current => ({
              ...current,
              [message.data.user_id]: false
            }));
          }, 10000);
        }
      }
    });

    // Subscribe to the chat channel - matches the backend channel.php definition
    // Chat channel name must match routes/channels.php in Laravel
    const channelName = `chat.${sessionId}`;
    sendMessage('subscribe', { channel: channelName });

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();

      // Unsubscribe from the channel when component unmounts
      sendMessage('unsubscribe', { channel: channelName });
    };
  }, [isConnected, sessionId, subscribe, sendMessage, isPublic]);

  // Send typing status
  const sendTypingStatus = async (isTyping: boolean) => {
    try {
      const endpoint = isPublic
        ? `/public/chat/sessions/${sessionId}/typing`
        : `/chat/sessions/${sessionId}/typing`;

      const data = isPublic
        ? { is_typing: isTyping, client_id: clientId || 'anonymous' }
        : { is_typing: isTyping };

      const headers = !isPublic ? { Authorization: `Bearer ${token}` } : undefined;

      await api.post(endpoint, data, { headers });
    } catch (err) {
      console.error('Error sending typing status:', err);
    }
  };

  return {
    messages,
    typingUsers,
    isConnected,
    isLoading,
    error: error || wsError?.message,
    sendTypingStatus
  };
} 