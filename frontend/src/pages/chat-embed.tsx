import React, { useEffect, useState, useRef } from 'react';
import ChatWidget from '@/components/chat/ChatWidget';
import { widgetClientService, WidgetConfig, ChatSession, ChatMessage as ApiChatMessage } from '@/services/widgetClientService';

// Define the Message interface since we can't import it from @/types/chat
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  status: 'sending' | 'sent' | 'error';
  metadata?: Record<string, any>;
}

interface EmbedPageProps { }

const ChatEmbedPage: React.FC<EmbedPageProps> = () => {
  // Parse URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const widgetId = searchParams.get('widgetId');
  const sessionId = searchParams.get('sessionId');
  const embedded = searchParams.get('embedded') === 'true';
  const primaryColor = searchParams.get('primaryColor') || '#4f46e5';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [clientId] = useState<string>(`client-${Math.random().toString(36).substring(2, 9)}`);

  // Load widget configuration and initialize session
  useEffect(() => {
    const initWidget = async () => {
      if (!widgetId) {
        setError('Widget ID is required');
        setLoading(false);
        return;
      }

      try {
        // Fetch widget configuration
        const config = await widgetClientService.getWidgetConfig(widgetId);
        setWidgetConfig(config);

        // Create or use existing session
        let session: ChatSession;
        if (sessionId) {
          session = {
            session_id: sessionId,
            widget_id: widgetId,
            created_at: new Date().toISOString()
          };
        } else {
          session = await widgetClientService.createChatSession(widgetId);

          // Notify parent window of session creation
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              action: 'session-created',
              sessionId: session.session_id
            }, '*');
          }
        }
        setChatSession(session);

        // Fetch existing messages
        await loadMessages(session.session_id);

        // Notify parent window that widget is loaded
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ action: 'widget-loaded' }, '*');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error initializing chat widget:', err);
        setError('Failed to initialize chat. Please try again later.');
        setLoading(false);
      }
    };

    initWidget();
  }, [widgetId, sessionId]);

  // Load messages for the current session
  const loadMessages = async (sessionId: string) => {
    try {
      const apiMessages = await widgetClientService.getMessages(sessionId);

      // Convert API messages to the format expected by the ChatWidget component
      const formattedMessages: Message[] = apiMessages.map((msg: ApiChatMessage) => ({
        id: msg.id,
        content: msg.content,
        role: msg.type === 'user' ? 'user' : 'assistant',
        timestamp: new Date(msg.created_at).toISOString(),
        status: 'sent',
        metadata: msg.metadata || {}
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!chatSession || !content.trim() || sending) {
      return;
    }

    setSending(true);

    try {
      // Add the user message to UI immediately for better UX
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
        status: 'sending'
      };

      setMessages(prev => [...prev, tempUserMessage]);

      // Send to API
      const response = await widgetClientService.sendMessage(chatSession.session_id, content);

      // Replace temp message with actual message and add the AI response
      setMessages(prev => {
        // Remove the temp message
        const filtered = prev.filter(m => m.id !== tempUserMessage.id);

        // Add the real user and AI messages
        return [
          ...filtered,
          {
            id: response.userMessage.id,
            content: response.userMessage.content,
            role: 'user',
            timestamp: new Date(response.userMessage.created_at).toISOString(),
            status: 'sent'
          },
          {
            id: response.aiMessage.id,
            content: response.aiMessage.content,
            role: 'assistant',
            timestamp: new Date(response.aiMessage.created_at).toISOString(),
            status: 'sent',
            metadata: response.aiMessage.metadata || {}
          }
        ];
      });
    } catch (err) {
      console.error('Error sending message:', err);
      // Update the temp message to show error
      setMessages(prev =>
        prev.map(m =>
          m.id === `temp-${Date.now()}`
            ? { ...m, status: 'error' }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  // Update typing status
  const handleTypingStatusChange = async (isTyping: boolean) => {
    if (!chatSession) return;

    try {
      await widgetClientService.updateTypingStatus(
        chatSession.session_id,
        isTyping,
        clientId
      );
    } catch (err) {
      console.error('Error updating typing status:', err);
    }
  };

  // Close widget
  const handleClose = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ action: 'close-widget' }, '*');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
        <div className="text-red-500 text-center mb-4">
          <svg className="h-12 w-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  // Render ChatWidget component with the fetched data
  return (
    <div className="h-screen w-full overflow-hidden">
      {widgetConfig && (
        <ChatWidget
          config={widgetConfig}
          embedded={true}
          isFullPage={true}
          widgetId={widgetId || ''}
          primaryColor={primaryColor}
          onClose={handleClose}
          messages={messages}
          onSendMessage={handleSendMessage}
          onTypingStatusChange={handleTypingStatusChange}
        />
      )}
    </div>
  );
};

export default ChatEmbedPage;