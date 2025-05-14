import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { widgetClientService, WidgetConfig } from '@/services/widgetClientService';

interface WebComponentWrapperProps {
  widgetId: string;
}

export const WebComponentWrapper: React.FC<WebComponentWrapperProps> = ({ widgetId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Load widget configuration on mount
  useEffect(() => {
    const loadWidgetConfig = async () => {
      try {
        const config = await widgetClientService.getWidgetConfig(widgetId);
        setConfig(config);
        
        // Auto-open if configured
        if (config.behavioral_settings.autoOpen) {
          setTimeout(() => {
            setIsOpen(true);
          }, config.behavioral_settings.openDelay * 1000);
        }
        
        // Create a new chat session
        const session = await widgetClientService.createChatSession(widgetId);
        setSessionId(session.session_id);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading widget config:', err);
        setError('Failed to load chat widget. Please try again later.');
        setLoading(false);
      }
    };
    
    loadWidgetConfig();
  }, [widgetId]);
  
  // Toggle chat widget visibility
  const toggleChat = () => {
    setIsOpen(!isOpen);
    
    // Load messages if opening the chat
    if (!isOpen && sessionId && messages.length === 0) {
      fetchMessages();
    }
  };
  
  // Fetch messages for the session
  const fetchMessages = async () => {
    if (!sessionId) return;
    
    try {
      const response = await widgetClientService.getMessages(sessionId);
      if (response.status === 'success') {
        // Sort messages by creation date (oldest first)
        const sortedMessages = response.data.data.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sortedMessages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };
  
  // Send a message
  const sendMessage = async (content: string) => {
    if (!sessionId || !content.trim()) return;
    
    setSending(true);
    
    try {
      // Add user message to UI immediately
      const tempUserMessage = {
        id: 'temp-' + Date.now(),
        content,
        role: 'user',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempUserMessage]);
      
      // Send to API
      const response = await widgetClientService.sendMessage(sessionId, content);
      
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
      
      // Show error notification
      setError('Failed to send message. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  };
  
  if (loading) {
    return (
      <div className="ai-chat-widget-loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="ai-chat-widget-error">
        {error}
      </div>
    );
  }
  
  if (!config) {
    return null;
  }
  
  return (
    <div className="ai-chat-widget-container" ref={containerRef}>
      {/* Chat button */}
      <button 
        className="ai-chat-widget-button"
        onClick={toggleChat}
        style={{ 
          backgroundColor: config.visual_settings.colors.primary,
          borderRadius: config.visual_settings.style === 'rounded' ? '50%' : '8px'
        }}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>
      
      {/* Chat window */}
      {isOpen && (
        <div 
          className="ai-chat-widget-window"
          style={{ 
            width: config.visual_settings.width,
            height: config.visual_settings.height,
            borderRadius: config.visual_settings.style === 'rounded' ? '12px' : config.visual_settings.style === 'square' ? '4px' : '8px',
            backgroundColor: config.visual_settings.colors.background,
            color: config.visual_settings.colors.text,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <ChatWidget
            title={config.title}
            subtitle={config.subtitle}
            messages={messages}
            onSendMessage={sendMessage}
            onClose={toggleChat}
            isLoading={sending}
            visualSettings={config.visual_settings}
            contentSettings={config.content_settings}
            embedded={true}
          />
        </div>
      )}
    </div>
  );
};

// Register as a Web Component
export class AIChatWidgetElement extends HTMLElement {
  connectedCallback() {
    const widgetId = this.getAttribute('widget-id');
    
    if (!widgetId) {
      console.error('AI Chat Widget: No widget-id attribute provided');
      return;
    }
    
    // Create shadow root
    const shadow = this.attachShadow({ mode: 'open' });
    
    // Create container for React
    const container = document.createElement('div');
    shadow.appendChild(container);
    
    // Add base styles
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
      
      .ai-chat-widget-container {
        position: relative;
      }
      
      .ai-chat-widget-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.2s ease;
        border: none;
        z-index: 9999;
        color: white;
      }
      
      .ai-chat-widget-button:hover {
        transform: scale(1.05);
      }
      
      .ai-chat-widget-window {
        position: fixed;
        bottom: 100px;
        right: 20px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        transition: all 0.3s ease;
      }
      
      .ai-chat-widget-loading {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #4F46E5;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
      }
      
      .spinner {
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top: 3px solid white;
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .ai-chat-widget-error {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px;
        background-color: #EF4444;
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
      }
    `;
    shadow.appendChild(style);
    
    // Render React component
    const root = createRoot(container);
    root.render(<WebComponentWrapper widgetId={widgetId} />);
  }
}

// Register the custom element
if (typeof customElements !== 'undefined' && !customElements.get('ai-chat-widget')) {
  customElements.define('ai-chat-widget', AIChatWidgetElement);
}
