import React, { useEffect, useState } from "react";
import { widgetClientService, WidgetConfig, ChatSession } from "@/services/widgetClientService";
import ChatWidget from "@/components/chat/ChatWidget";


interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

const ChatEmbedPage: React.FC = () => {

  
  const searchParams = new URLSearchParams(window.location.search);
  const widgetId = searchParams.get('widgetId');
  const sessionId = searchParams.get('sessionId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  // Load widget configuration and initialize session
  useEffect(() => {
    const initWidget = async () => {
      if (!widgetId || typeof widgetId !== 'string') {
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
        if (sessionId && typeof sessionId === 'string') {
          session = { session_id: sessionId, name: 'Embedded Chat' };
        } else {
          session = await widgetClientService.createChatSession(widgetId);
        }
        setChatSession(session);

        // Fetch existing messages
        await loadMessages(session.session_id);

        // Notify parent window that widget is loaded
        window.parent.postMessage({ action: 'widget-loaded' }, '*');

        setLoading(false);
      } catch (err) {
        console.error('Error initializing chat widget:', err);
        setError('Failed to initialize chat. Please try again later.');
        setLoading(false);
      }
    };

    initWidget();
  }, [widgetId, sessionId]);

  // Load messages for the session
  const loadMessages = async (sessionId: string) => {
    try {
      const response = await widgetClientService.getMessages(sessionId);
      if (response.status === 'success') {
        // Sort messages by creation date (oldest first)
        const sortedMessages = response.data.data.sort((a: Message, b: Message) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sortedMessages);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  // Send a message
  const sendMessage = async (content: string) => {
    if (!chatSession || !content.trim()) return;

    setSending(true);

    try {
      // Optimistically add user message to UI
      const tempUserMessage: Message = {
        id: 'temp-' + Date.now(),
        content,
        role: 'user',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, tempUserMessage]);

      // Send to API
      const response = await widgetClientService.sendMessage(chatSession.session_id, content);

      if (response.status === 'success') {
        // Replace temp message with real one and add AI response
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempUserMessage.id);
          return [
            ...filtered,
            response.data.user_message,
            response.data.ai_message
          ];
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== 'temp-' + Date.now()));

      // Show error message
      setError('Failed to send message. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  };

  // Close widget
  const handleClose = () => {
    window.parent.postMessage({ action: 'close-widget' }, '*');
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

  // Main chat UI
  return (
    <div className="flex flex-col h-screen bg-white">
      {widgetConfig && (
        <ChatWidget
          title={widgetConfig.title || 'Chat'}
          subtitle={widgetConfig.subtitle || null}
          onSendMessage={sendMessage}
          onClose={handleClose}
          visualSettings={widgetConfig.visual_settings}
          contentSettings={widgetConfig.content_settings}
          embedded={true} config={undefined} widgetId={undefined} isFullPage={undefined} position={undefined} contextMode={undefined} contextName={undefined} contextRuleId={undefined} primaryColor={undefined} avatarSrc={undefined} initiallyOpen={undefined} allowAttachments={undefined} allowVoice={undefined} allowEmoji={undefined} width={undefined} height={undefined} messages={undefined} isLoading={undefined}        />
      )}
    </div>
  );
};

export default ChatEmbedPage;