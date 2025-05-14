import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, PaperclipIcon, SmileIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import useWebSocket from "@/hooks/useWebSocket";
import { widgetClientService } from "@/services/widgetClientService";
import { VisualSettings, BehavioralSettings, ContentSettings } from "@/services/widgetService";

export interface ChatMessage {
  id: string;
  content: string;
  type: "user" | "system" | "ai";
  session_id: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface ChatWidgetProps {
  title?: string;
  subtitle?: string;
  widgetId?: string;
  embedded?: boolean;
  allowAttachments?: boolean;
  allowEmoji?: boolean;
  primaryColor?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  initiallyOpen?: boolean;
  logoUrl?: string;
  onClose?: () => void;
  visualSettings?: VisualSettings;
  contentSettings?: ContentSettings;
  behavioralSettings?: BehavioralSettings;
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  title = "Chat Assistant",
  subtitle = "How can I help you today?",
  widgetId,
  embedded = false,
  allowAttachments = false,
  allowEmoji = true,
  primaryColor = "#4f46e5",
  position = "bottom-right",
  initiallyOpen = false,
  logoUrl,
  onClose,
  visualSettings,
  contentSettings,
  behavioralSettings,
  messages: externalMessages,
  onSendMessage,
  isLoading: externalLoading
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Apply visual settings if provided
  const finalPrimaryColor = visualSettings?.colors?.primary || primaryColor;
  const finalPosition = visualSettings?.position || position;
  const finalTitle = contentSettings?.botName || title;
  const finalSubtitle = subtitle;
  const placeholderText = contentSettings?.placeholderText || "Type your message...";

  // WebSocket setup if widgetId is provided
  const wsUrl = widgetId ? `${window.location.protocol.replace('http', 'ws')}//${window.location.host}/api/chat/${widgetId}/ws` : undefined;
  const ws = useWebSocket(wsUrl);

  // Use external messages if provided (for embedded mode)
  useEffect(() => {
    if (externalMessages) {
      setMessages(externalMessages);
    }
  }, [externalMessages]);

  // Initialize session and load messages when opened
  useEffect(() => {
    if (isOpen && widgetId && !sessionId && !externalMessages) {
      initializeSession();
    }
  }, [isOpen, widgetId, sessionId, externalMessages]);

  // Handle WebSocket messages
  useEffect(() => {
    if (ws.lastMessage && sessionId) {
      try {
        const data = typeof ws.lastMessage === 'string'
          ? JSON.parse(ws.lastMessage)
          : ws.lastMessage;

        if (data.type === 'chat_message' && data.sessionId === sessionId) {
          setMessages(prev => [...prev, {
            id: data.id || `temp-${Date.now()}`,
            content: data.content,
            type: data.role === 'user' ? 'user' : 'ai',
            session_id: sessionId,
            created_at: new Date().toISOString(),
            metadata: data.metadata || {}
          }]);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    }
  }, [ws.lastMessage, sessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeSession = async () => {
    if (!widgetId) return;

    setIsLoading(true);

    try {
      // Create a new session
      const session = await widgetClientService.createChatSession(widgetId);
      setSessionId(session.session_id);

      // Get initial messages if any
      const initialMessages = await widgetClientService.getMessages(session.session_id);

      if (initialMessages.length > 0) {
        setMessages(initialMessages);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing chat session:', error);
      toast({
        title: "Error",
        description: "Failed to initialize chat. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const trimmedMessage = message.trim();
    setMessage("");

    // If using external handler (for embedded mode)
    if (onSendMessage) {
      onSendMessage(trimmedMessage);
      return;
    }

    if (!sessionId) {
      toast({
        title: "Error",
        description: "Chat session not initialized",
        variant: "destructive",
      });
      return;
    }

    // Add message to UI immediately
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: trimmedMessage,
      type: "user",
      session_id: sessionId,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);
    setIsLoading(true);

    try {
      // Try to send via WebSocket if connected
      if (ws.connected) {
        ws.sendMessage({
          type: 'chat_message',
          sessionId,
          content: trimmedMessage,
          role: 'user'
        });
      } else {
        // Fallback to REST API
        const response = await widgetClientService.sendMessage(sessionId, trimmedMessage);

        // Replace temp message with actual one and add AI response
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempMessage.id);
          return [
            ...filtered,
            response.userMessage,
            response.aiMessage
          ];
        });

        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Mark the message as error
      setMessages(prev =>
        prev.map(m =>
          m.id === tempMessage.id
            ? { ...m, metadata: { ...m.metadata, error: true } }
            : m
        )
      );

      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });

      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // For embedded mode, render the full chat UI without the floating button
  if (embedded) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden">
        {/* Chat Header */}
        <div
          className="p-4 flex justify-between items-center"
          style={{ backgroundColor: finalPrimaryColor }}
        >
          <div className="flex items-center">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-8 w-8 mr-3 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="font-medium text-white">{finalTitle}</h3>
              {finalSubtitle && (
                <p className="text-xs text-white/80">{finalSubtitle}</p>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400 text-sm">
                {contentSettings?.welcomeMessage || "Send a message to start chatting"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${msg.type === "user"
                      ? `text-white ml-auto`
                      : msg.type === "system"
                        ? "bg-gray-200 text-gray-800"
                        : "bg-white text-gray-800 shadow-sm"
                      }`}
                    style={{
                      backgroundColor:
                        msg.type === "user" ? finalPrimaryColor : undefined,
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    <span className="text-xs opacity-70 mt-1 block text-right">
                      {formatTimestamp(msg.created_at)}
                    </span>
                    {msg.metadata?.error && (
                      <span className="text-xs text-red-500 block mt-1">
                        Error sending message
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(isLoading || externalLoading) && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 rounded-lg p-3 max-w-[80%] shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex space-x-2"
          >
            {allowAttachments && (
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
              >
                <PaperclipIcon size={20} />
              </button>
            )}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholderText}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{
                outlineColor: finalPrimaryColor
              }}
            />
            {allowEmoji && (
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
              >
                <SmileIcon size={20} />
              </button>
            )}
            <button
              type="submit"
              disabled={!message.trim() || isLoading || externalLoading}
              className="p-2 rounded-lg disabled:opacity-50"
              style={{ backgroundColor: finalPrimaryColor }}
            >
              <Send size={20} className="text-white" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Position classes
  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  }[finalPosition];

  // For floating widget mode
  return (
    <div className={`fixed ${positionClasses} z-50`}>
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-lg flex flex-col w-80 h-[500px] overflow-hidden">
          {/* Chat Header */}
          <div
            className="p-4 flex justify-between items-center"
            style={{ backgroundColor: finalPrimaryColor }}
          >
            <div className="flex items-center">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-8 w-8 mr-3 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="font-medium text-white">{finalTitle}</h3>
                {finalSubtitle && (
                  <p className="text-xs text-white/80">{finalSubtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="p-1 rounded-full hover:bg-white/10 text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-400 text-sm">
                  {contentSettings?.welcomeMessage || "Send a message to start chatting"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${msg.type === "user"
                        ? `text-white ml-auto`
                        : msg.type === "system"
                          ? "bg-gray-200 text-gray-800"
                          : "bg-white text-gray-800 shadow-sm"
                        }`}
                      style={{
                        backgroundColor:
                          msg.type === "user" ? finalPrimaryColor : undefined,
                      }}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <span className="text-xs opacity-70 mt-1 block text-right">
                        {formatTimestamp(msg.created_at)}
                      </span>
                      {msg.metadata?.error && (
                        <span className="text-xs text-red-500 block mt-1">
                          Error sending message
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {(isLoading || externalLoading) && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 rounded-lg p-3 max-w-[80%] shadow-sm">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex space-x-2"
            >
              {allowAttachments && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <PaperclipIcon size={20} />
                </button>
              )}
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={placeholderText}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{
                  outlineColor: finalPrimaryColor
                }}
              />
              {allowEmoji && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SmileIcon size={20} />
                </button>
              )}
              <button
                type="submit"
                disabled={!message.trim() || isLoading || externalLoading}
                className="p-2 rounded-lg disabled:opacity-50"
                style={{ backgroundColor: finalPrimaryColor }}
              >
                <Send size={20} className="text-white" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          onClick={toggleChat}
          className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
          style={{ backgroundColor: finalPrimaryColor }}
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </button>
      )}
    </div>
  );
};
