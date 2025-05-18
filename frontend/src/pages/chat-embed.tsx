import React, { useEffect, useState, useRef } from 'react';
import ChatWidgetWithConfig from '@/components/chat/ChatWidgetWithConfig';
import { widgetClientService, WidgetConfig, ChatSession, ChatMessage as ApiChatMessage } from '@/services/widgetClientService';
import { useRouter } from 'next/router';

// Define custom message interface
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
}

const ChatEmbed: React.FC = () => {
  const router = useRouter();
  const { widgetId } = router.query;
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWidget = async () => {
      if (!widgetId) return;

      try {
        const widgetConfig = await widgetClientService.getWidgetConfig(widgetId as string);
        setConfig(widgetConfig);
      } catch (err) {
        console.error('Error loading widget:', err);
        setError('Failed to load the chat widget. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadWidget();
  }, [widgetId]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading chat widget...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  if (!config) {
    return <div className="min-h-screen flex items-center justify-center">Widget not found</div>;
  }

  // Convert config properties to match ChatWidgetWithConfig format
  const widgetConfig = {
    titleText: config.title || 'Chat Support',
    subtitleText: config.subtitle || 'How can we help you?',
    primaryColor: config.visual_settings?.colors?.primary || '#4f46e5',
    position: config.visual_settings?.position || 'bottom-right',
    fontFamily: config.visual_settings?.fonts?.primary || 'Inter, sans-serif',
    placeholderText: config.content_settings?.placeholderText || 'Type your message here...',
    allowAttachments: config.content_settings?.allowAttachments || false,
    allowFeedback: true,
    showBranding: config.visual_settings?.showFooter !== false
  };

  // Follow-up config
  const followUpConfig = {
    enableFollowUpQuestions: true,
    generateAutomatically: true,
    maxFollowUpQuestions: 3,
    predefinedQuestions: []
  };

  // Response config
  const responseConfig = {
    enableMarkdown: true
  };

  return (
    <div className="w-full h-screen">
      <ChatWidgetWithConfig
        widgetId={widgetId as string}
        config={widgetConfig}
        embedded={true}
        isFullPage={true}
        followUpConfig={followUpConfig}
        responseConfig={responseConfig}
      />
    </div>
  );
};

export default ChatEmbed;