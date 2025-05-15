import React, { useState, useEffect, useRef, useCallback } from "react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import FollowUpQuestions from "./FollowUpQuestions";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import useWebSocket, { WebSocketMessage } from "@/hooks/useWebSocket";
import { widgetClientService, ChatMessage as ApiChatMessage } from "@/services/widgetClientService";
import { DEFAULT_WIDGET_CONFIG } from "@/config/constants";
import logger from "@/utils/logger";

// Define interface for component props
interface ChatWidgetWithConfigProps {
  config?: any;
  previewMode?: boolean;
  widgetId?: string;
  onClose?: () => void;
  embedded?: boolean;
  followUpConfig?: {
    enableFollowUpQuestions: boolean;
    generateAutomatically: boolean;
    maxFollowUpQuestions: number;
    predefinedQuestions: Array<{
      id: string;
      name: string;
      questions: string[];
    }>;
  };
  responseConfig?: {
    enableMarkdown: boolean;
  };
}

// Message interface for display
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
  followUpQuestions?: string[];
}

const ChatWidgetWithConfig: React.FC<ChatWidgetWithConfigProps> = ({
  config,
  previewMode = false,
  widgetId,
  onClose,
  embedded = false,
  followUpConfig,
  responseConfig,
}) => {
  const [isOpen, setIsOpen] = useState(previewMode || false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // WebSocket setup - use relative path to avoid CORS and proxy issues
  const wsUrl = sessionId ? `/chat/${sessionId}/ws` : undefined;
  const {
    connected,
    lastMessage,
    sendMessage,
    error: wsError,
  } = useWebSocket(wsUrl, {
    onMessage: (data) => {
      if (data && typeof data === 'object') {
        if (data.type === 'message') {
          // Handle incoming message
          const aiMessage: Message = {
            id: data.data.id || `ai-${Date.now()}`,
            content: data.data.content,
            role: 'assistant',
            timestamp: data.data.timestamp || new Date().toISOString(),
          };

          setMessages((prev) => [...prev, aiMessage]);
          setIsTyping(false);

          // Check for follow-up questions
          if (data.data.followUpQuestions) {
            setFollowUpQuestions(data.data.followUpQuestions);
          } else {
            setFollowUpQuestions([]);
          }
        }
        else if (data.type === 'typing') {
          setIsTyping(data.data.isTyping);
        }
      }
    }
  });

  // Default configuration
  const widgetConfig = { ...DEFAULT_WIDGET_CONFIG, ...config };

  // Handle WebSocket connection errors
  useEffect(() => {
    if (wsError && !previewMode) {
      logger.error("WebSocket connection error:", wsError);
      toast({
        title: "Connection Error",
        description:
          "Failed to establish real-time connection. Using fallback method.",
        variant: "destructive",
      });
    }
  }, [wsError, toast, previewMode]);

  // Load widget configuration if widgetId is provided
  useEffect(() => {
    const loadWidgetConfig = async () => {
      if (widgetId && !previewMode) {
        try {
          const widgetData = await widgetClientService.getWidgetConfig(widgetId);
          // Merge the loaded configuration with defaults and current config
          // This would update the config in a real implementation
          setIsConfigLoaded(true);
        } catch (error) {
          logger.error("Error loading widget configuration:", error);
          // Still mark as loaded to continue with defaults
          setIsConfigLoaded(true);
        }
      } else {
        // No need to load config in preview mode
        setIsConfigLoaded(true);
      }
    };

    loadWidgetConfig();
  }, [widgetId, previewMode]);

  // Initialize chat session
  useEffect(() => {
    if (isOpen && isConfigLoaded) {
      initChatSession();
    }
  }, [isOpen, isConfigLoaded]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage && connected && sessionId) {
      // This is now handled by the onMessage callback in useWebSocket
    }
  }, [lastMessage, connected, sessionId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Initialize chat session
  const initChatSession = useCallback(async () => {
    try {
      if (previewMode) {
        // For preview mode, set a fake session ID
        setSessionId("preview-session");

        // Add initial welcome message if configured
        if (widgetConfig.initialMessage) {
          setMessages([
            {
              id: "welcome",
              content: widgetConfig.initialMessage,
              role: "assistant",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
        return;
      }

      if (!widgetId) {
        logger.error("Widget ID is required for non-preview mode");
        return;
      }

      // Get or create a chat session
      const session = await widgetClientService.getOrCreateSession(widgetId);
      setSessionId(session.session_id);

      // Fetch existing messages
      const existingMessages = await widgetClientService.getMessages(session.session_id);

      // Convert API messages to component message format
      const formattedMessages: Message[] = existingMessages.map((msg: ApiChatMessage) => ({
        id: msg.id,
        content: msg.content,
        role: msg.type === 'user' ? 'user' : msg.type === 'ai' ? 'assistant' : 'system',
        timestamp: msg.created_at,
      }));

      setMessages(formattedMessages);

      // Fetch follow-up questions if enabled
      if (followUpConfig?.enableFollowUpQuestions) {
        try {
          const questions = await widgetClientService.getFollowUpQuestions(session.session_id);
          if (questions.length > 0) {
            setFollowUpQuestions(questions.map(q => q.content));
          }
        } catch (error) {
          logger.error("Error fetching follow-up questions:", error);
        }
      }
    } catch (error) {
      logger.error("Error initializing chat session:", error);
      toast({
        title: "Connection Error",
        description: "Failed to initialize chat session. Please try again.",
        variant: "destructive",
      });
    }
  }, [previewMode, widgetConfig.initialMessage, widgetId, toast, followUpConfig]);

  // Send message handler
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Create a new message object
      const newMessage: Message = {
        id: `user-${Date.now()}`,
        content,
        role: "user",
        timestamp: new Date().toISOString(),
        status: "sending",
      };

      // Add user message to the list
      setMessages((prev) => [...prev, newMessage]);

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      try {
        if (previewMode) {
          // In preview mode, simulate a response after a delay
          setIsTyping(true);
          setTimeout(() => {
            const aiResponse: Message = {
              id: `ai-${Date.now()}`,
              content:
                "This is a preview response. In a real chat, this would be generated by AI.",
              role: "assistant",
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [
              ...prev,
              {
                ...newMessage,
                status: "sent",
              },
              aiResponse,
            ]);
            setIsTyping(false);

            // Add mock follow-up questions if enabled
            if (followUpConfig?.enableFollowUpQuestions) {
              const mockQuestions = [
                "What else would you like to know?",
                "Can I help with anything else?",
                "Do you need more details?",
              ].slice(0, followUpConfig.maxFollowUpQuestions || 3);

              setFollowUpQuestions(mockQuestions);
            }
          }, 1500);
          return;
        }

        if (!sessionId) {
          throw new Error("No active chat session");
        }

        // Update message status to sending
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: "sending" } : msg
          )
        );

        // If WebSocket is connected, send message through WebSocket
        if (connected) {
          const wsMessage: WebSocketMessage = {
            type: "message",
            data: {
              content,
              sessionId,
            },
          };

          const sent = sendMessage(wsMessage);

          if (!sent) {
            throw new Error("Failed to send message via WebSocket");
          }

          // Show typing indicator
          setIsTyping(true);

          // Update message status to sent
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newMessage.id ? { ...msg, status: "sent" } : msg
            )
          );

          // Note: The response will be handled by the WebSocket onMessage handler
        } else {
          // Fallback to REST API if WebSocket is not connected
          setIsTyping(true);

          // Send message via HTTP API
          const response = await widgetClientService.sendMessage(sessionId, content);

          // Update the user message status
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newMessage.id
                ? {
                  ...msg,
                  status: "sent",
                  id: response.userMessage.id // Update with server-generated ID
                }
                : msg
            )
          );

          // Add AI response to messages
          const aiResponse: Message = {
            id: response.aiMessage.id,
            content: response.aiMessage.content,
            role: 'assistant',
            timestamp: response.aiMessage.created_at,
          };

          setMessages((prev) => [...prev, aiResponse]);
          setIsTyping(false);

          // Check for follow-up questions
          if (followUpConfig?.enableFollowUpQuestions) {
            try {
              const questions = await widgetClientService.getFollowUpQuestions(sessionId);
              if (questions.length > 0) {
                setFollowUpQuestions(questions.map(q => q.content));
              } else {
                setFollowUpQuestions([]);
              }
            } catch (error) {
              logger.error("Error fetching follow-up questions:", error);
            }
          }
        }
      } catch (error) {
        logger.error("Error sending message:", error);
        // Update message status to error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: "error" } : msg
          )
        );
        setIsTyping(false);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    },
    [previewMode, connected, sessionId, sendMessage, followUpConfig, toast]
  );

  const handleSelectFollowUpQuestion = useCallback(
    (question: string) => {
      // Send the selected follow-up question as a user message
      handleSendMessage(question);
      // Clear follow-up questions after selection
      setFollowUpQuestions([]);
    },
    [handleSendMessage]
  );

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // If still loading configuration, show a loading state
  if (!isConfigLoaded && !previewMode) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
          style={{ backgroundColor: widgetConfig.primaryColor }}
          disabled
        >
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        </Button>
      </div>
    );
  }

  // If embedded, render the full widget without the toggle button
  if (embedded) {
    return (
      <div
        className="chat-widget-container h-full flex flex-col overflow-hidden rounded-lg border shadow-lg bg-white"
        style={{ fontFamily: widgetConfig.fontFamily }}
      >
        <ChatHeader
          title={widgetConfig.titleText}
          subtitle={widgetConfig.subtitleText}
          logoUrl={widgetConfig.logoUrl}
          onClose={onClose}
          primaryColor={widgetConfig.primaryColor}
        />
        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          allowFeedback={widgetConfig.allowFeedback}
          messagesEndRef={messagesEndRef}
          enableMarkdown={responseConfig?.enableMarkdown}
        />
        {followUpQuestions.length > 0 && (
          <FollowUpQuestions
            questions={followUpQuestions}
            onSelectQuestion={handleSelectFollowUpQuestion}
            primaryColor={widgetConfig.primaryColor}
          />
        )}
        <ChatInput
          onSendMessage={handleSendMessage}
          placeholder={widgetConfig.placeholderText}
          allowAttachments={widgetConfig.allowAttachments}
          primaryColor={widgetConfig.primaryColor}
        />
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
  }[widgetConfig.position || "bottom-right"];

  return (
    <div
      className={`chat-widget fixed ${positionClasses} z-50`}
      style={{ fontFamily: widgetConfig.fontFamily }}
    >
      {isOpen ? (
        <div className="chat-widget-expanded flex flex-col w-80 h-[500px] rounded-lg border shadow-lg bg-white overflow-hidden">
          <ChatHeader
            title={widgetConfig.titleText}
            subtitle={widgetConfig.subtitleText}
            logoUrl={widgetConfig.logoUrl}
            onClose={toggleChat}
            primaryColor={widgetConfig.primaryColor}
          />
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            allowFeedback={widgetConfig.allowFeedback}
            messagesEndRef={messagesEndRef}
            enableMarkdown={responseConfig?.enableMarkdown}
          />
          {followUpQuestions.length > 0 && (
            <FollowUpQuestions
              questions={followUpQuestions}
              onSelectQuestion={handleSelectFollowUpQuestion}
              primaryColor={widgetConfig.primaryColor}
            />
          )}
          <ChatInput
            onSendMessage={handleSendMessage}
            placeholder={widgetConfig.placeholderText}
            allowAttachments={widgetConfig.allowAttachments}
            primaryColor={widgetConfig.primaryColor}
          />
          {widgetConfig.showBranding && (
            <div className="text-center py-2 text-xs text-gray-500">
              Powered by ChatAdmin
            </div>
          )}
        </div>
      ) : (
        <Button
          onClick={toggleChat}
          className="chat-widget-button h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
          style={{ backgroundColor: widgetConfig.primaryColor }}
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </Button>
      )}
    </div>
  );
};

export default ChatWidgetWithConfig;
