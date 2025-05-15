import { useState, useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { chatService } from "@/services/chatService";
import useChatWebSocket from "@/hooks/useChatWebSocket";
import { api } from "@/services/api/core/apiClient";
import { widgetClientService } from "@/services/widgetClientService";

interface VisualSettings {
  primaryColor?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  width?: number;
  height?: number;
}

interface ContentSettings {
  allowAttachments?: boolean;
  allowEmoji?: boolean;
  welcomeMessage?: string;
}



interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: string;
  status?: "sending" | "sent" | "error";
  created_at?: string;
  metadata?: {
    error?: boolean;
  };
}

interface ChatWidgetProps {
  config?: any;
  previewMode?: boolean;
  widgetId?: string;
  onClose?: () => void;
  embedded?: boolean;
  isFullPage?: boolean;
  title?: string;
  subtitle?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  primaryColor?: string;
  initiallyOpen?: boolean;
  allowAttachments?: boolean;
  allowEmoji?: boolean;
  visualSettings?: VisualSettings;
  contentSettings?: ContentSettings;
  messages?: Message[];
  isLoading?: boolean;
  onSendMessage?: (message: string) => Promise<void>;
}

function ChatWidget({
  config,
  previewMode = false,
  widgetId,
  onClose,
  embedded = false,
  isFullPage,
  title,
  subtitle,
  position = "bottom-right",
  primaryColor = "#4f46e5",
  initiallyOpen,
  allowAttachments = false,
  allowEmoji = false,
  visualSettings,
  contentSettings,
  messages: externalMessages,
  isLoading: externalLoading = false,
  onSendMessage: externalSendMessage
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(previewMode || initiallyOpen || false);
  const [messages, setMessages] = useState<Message[]>(externalMessages || []);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Generate client ID for anonymous users
  const [clientId] = useState<string>(() => {
    // Generate a client ID for unauthenticated sessions
    const storedId = localStorage.getItem('chat_client_id');
    if (storedId) return storedId;

    const newId = `anonymous-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('chat_client_id', newId);
    return newId;
  });

  // Add WebSocket integration if we have a session ID
  const {
    isConnected: wsConnected, messages: wsMessages, typingUsers, sendTypingStatus
  } = sessionId ? useChatWebSocket({
    sessionId,
    clientId,
    isPublic: embedded
  }) : { isConnected: false, messages: [], typingUsers: {}, sendTypingStatus: () => { } };

  // Default configuration
  const defaultConfig = {
    primaryColor: "#4f46e5",
    secondaryColor: "#f3f4f6",
    fontFamily: "Inter",
    borderRadius: 8,
    position: "bottom-right",
    initialMessage: "Hello! How can I help you today?",
    placeholderText: "Type your message here...",
    titleText: "Chat Support",
    subtitleText: "We typically reply within a few minutes",
    showBranding: true,
    allowAttachments: false,
    allowFeedback: true,
  };

  // Merge provided config with defaults
  const widgetConfig = {
    ...defaultConfig,
    ...config,
    primaryColor: primaryColor || defaultConfig.primaryColor,
    titleText: title || defaultConfig.titleText,
    subtitleText: subtitle || defaultConfig.subtitleText,
    position: position || defaultConfig.position,
    placeholderText: defaultConfig.placeholderText,
    allowAttachments: allowAttachments !== undefined ? allowAttachments : defaultConfig.allowAttachments,
    visualSettings: visualSettings || {},
    contentSettings: contentSettings || {}
  };

  // Use external messages if provided (for embedded mode)
  useEffect(() => {
    if (widgetId && !previewMode) {
      loadWidgetConfig();
    }
  }, [widgetId]);

  const loadWidgetConfig = async () => {
    try {
      // Load widget configuration from the server
      await api.get(`/widget/${widgetId}/config`);

      // Update the widget configuration if needed
      // This would be handled based on the response structure
    } catch (error) {
      console.error("Error loading widget configuration:", error);
    }
  };

  // Initialize chat session
  useEffect(() => {
    if (isOpen && widgetId && !sessionId && !externalMessages) {
      initializeSession();
    }
  }, [isOpen, widgetId, sessionId, externalMessages]);

  // Handle WebSocket messages
  useEffect(() => {
    // Merge local messages with WebSocket messages
    if (wsConnected && wsMessages.length > 0) {
      // Add only new messages that we don't already have
      const newMessages = wsMessages.filter(
        wsMsg => !messages.some(localMsg => localMsg.id === wsMsg.id)
      );

      if (newMessages.length > 0) {
        setMessages(prev => [
          ...prev,
          ...newMessages.map(msg => ({
            id: msg.id,
            content: msg.content,
            role: msg.role as "user" | "assistant" | "system",
            timestamp: msg.created_at || new Date().toISOString(),
            status: 'sent' as const,
          }))
        ]);
      }
    }
  }, [wsConnected, wsMessages, messages]);

  // Update typing indicator based on WebSocket data
  useEffect(() => {
    // If any user other than the current user is typing, show the indicator
    const anyoneTyping = Object.entries(typingUsers).some(
      ([userId, isTyping]) => userId !== clientId && isTyping
    );

    setIsTyping(anyoneTyping);
  }, [typingUsers, clientId]);

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

      // Load previous messages if any
      const history = await chatService.getSession(session.session_id);
      if (history.messages && history.messages.length > 0) {
        setMessages(history.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : new Date(msg.timestamp).toISOString()
        })));
      } else {
        // Add initial message locally
        setMessages([
          {
            id: "initial",
            content: widgetConfig.initialMessage,
            role: "assistant",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
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

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Call the provided onSendMessage prop if available
    if (externalSendMessage) {
      await externalSendMessage(content);
    }

    // Create a new message object
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date().toISOString(),
      status: "sending",
    };

    // Add the message to the UI immediately
    setMessages((prev) => [...prev, newMessage]);

    // In preview mode, simulate a response
    if (previewMode) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `response-${Date.now()}`,
            content: "This is a simulated response in preview mode.",
            role: "assistant",
            timestamp: new Date().toISOString(),
          },
        ]);
      }, 1500);
      return;
    }

    try {
      // Update message status to sent
      setMessages((prev) => prev.map((msg) => msg.id === newMessage.id ? { ...msg, status: "sent" } : msg
      )
      );

      // If WebSocket is connected, the server will automatically broadcast the response
      // We'll still call the REST API to send the message through the regular flow
      // The WebSocket response will come through the websocket event
      if (!wsConnected || !sessionId) {
        // Fallback to REST API if WebSocket is not connected
        const response = await chatService.sendMessage(sessionId || '', content);

        // Only add the AI response if it didn't come through the websocket
        if (response && response.aiResponse) {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: response.aiResponse.id,
              content: response.aiResponse.content,
              role: "assistant",
              timestamp: typeof response.aiResponse.timestamp === 'string'
                ? response.aiResponse.timestamp
                : new Date(response.aiResponse.timestamp).toISOString(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Update message status to error
      setMessages((prev) => prev.map((msg) => msg.id === newMessage.id ? { ...msg, status: "error" } : msg
      )
      );
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }

    // If we have a WebSocket connection, send typing status
    if (wsConnected) {
      sendTypingStatus(false); // Clear typing status when sending a message
    }
  };

  // Handle typing status changes
  const handleTypingStatusChange = (isTyping: boolean) => {
    if (wsConnected) {
      sendTypingStatus(isTyping);
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
        <ChatHeader
          title={widgetConfig.titleText}
          subtitle={widgetConfig.subtitleText}
          logoUrl={widgetConfig.logoUrl}
          onClose={onClose}
          primaryColor={widgetConfig.primaryColor} />

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
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${msg.role === "user"
                      ? `text-white ml-auto`
                      : msg.role === "system"
                        ? "bg-gray-200 text-gray-800"
                        : "bg-white text-gray-800 shadow-sm"
                      }`}
                    style={{
                      backgroundColor:
                        msg.role === "user" ? primaryColor : undefined,
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    <span className="text-xs opacity-70 mt-1 block text-right">
                      {msg.created_at ? formatTimestamp(msg.created_at) : ''}
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
        <ChatInput
          onSendMessage={handleSendMessage}
          placeholder={widgetConfig.placeholderText}
          allowAttachments={widgetConfig.allowAttachments}
          allowEmoji={allowEmoji}
          primaryColor={widgetConfig.primaryColor}
          onTypingStatusChange={handleTypingStatusChange} />
        {widgetConfig.showBranding && (
          <div className="text-center py-2 text-xs text-gray-500">
            Powered by ChatAdmin
          </div>
        )}
      </div>
    );
  }

  // Position classes
  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  }[position];

  // If isFullPage is true, render a full-page version
  if (isFullPage) {
    return (
      <div
        className="chat-widget-container h-full w-full flex flex-col overflow-hidden bg-white"
      >
        <ChatHeader
          title={widgetConfig.titleText}
          onClose={onClose}
          primaryColor={widgetConfig.primaryColor} />
        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          allowFeedback={widgetConfig.allowFeedback}
          messagesEndRef={messagesEndRef} />
        <ChatInput
          onSendMessage={handleSendMessage}
          placeholder={widgetConfig.placeholderText}
          allowAttachments={widgetConfig.allowAttachments}
          allowEmoji={allowEmoji}
          primaryColor={widgetConfig.primaryColor}
          onTypingStatusChange={handleTypingStatusChange} />
        {widgetConfig.showBranding && (
          <div className="text-center py-2 text-xs text-gray-500">
            Powered by ChatAdmin
          </div>
        )}
      </div>
    );
  }

  // If embedded, render the full widget without the toggle button
  if (embedded) {
    return (
      <div
        className="chat-widget-container h-full flex flex-col overflow-hidden rounded-lg border shadow-lg bg-white"
      >
        <ChatHeader
          title={widgetConfig.titleText}
          subtitle={widgetConfig.subtitleText}
          logoUrl={widgetConfig.logoUrl}
          onClose={onClose}
          primaryColor={widgetConfig.primaryColor} />
        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          allowFeedback={widgetConfig.allowFeedback}
          messagesEndRef={messagesEndRef} />
        <ChatInput
          onSendMessage={handleSendMessage}
          placeholder={widgetConfig.placeholderText}
          allowAttachments={widgetConfig.allowAttachments}
          allowEmoji={allowEmoji}
          primaryColor={widgetConfig.primaryColor}
          onTypingStatusChange={handleTypingStatusChange} />
        {widgetConfig.showBranding && (
          <div className="text-center py-2 text-xs text-gray-500">
            Powered by ChatAdmin
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`chat-widget fixed ${positionClasses} z-50`}
    >
      {isOpen ? (
        <div className="chat-widget-expanded flex flex-col w-80 h-[500px] rounded-lg border shadow-lg bg-white overflow-hidden">
          <ChatHeader
            title={widgetConfig.titleText}
            subtitle={widgetConfig.subtitleText}
            logoUrl={widgetConfig.logoUrl}
            onClose={toggleChat}
            primaryColor={widgetConfig.primaryColor} />
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            allowFeedback={widgetConfig.allowFeedback}
            messagesEndRef={messagesEndRef} />
          <ChatInput
            onSendMessage={handleSendMessage}
            placeholder={widgetConfig.placeholderText}
            allowAttachments={widgetConfig.allowAttachments}
            allowEmoji={allowEmoji}
            primaryColor={widgetConfig.primaryColor}
            onTypingStatusChange={handleTypingStatusChange} />
          {widgetConfig.showBranding && (
            <div className="text-center py-2 text-xs text-gray-500">
              Powered by ChatAdmin
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={toggleChat}
          className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </button>
      )}
    </div>
  );
}

export default ChatWidget;
