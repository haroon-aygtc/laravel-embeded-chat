import React, { RefObject } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import FollowUpQuestions from './FollowUpQuestions';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
  followUpQuestions?: string[];
}

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  allowFeedback?: boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
  enableMarkdown?: boolean;
  onSelectFollowUpQuestion?: (question: string) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping,
  allowFeedback = false,
  messagesEndRef,
  enableMarkdown = false,
  onSelectFollowUpQuestion,
}) => {
  const renderMessageContent = (content: string) => {
    if (!enableMarkdown) {
      return <p className="whitespace-pre-wrap break-words">{content}</p>;
    }

    // Very simple markdown-like rendering
    // For production, use a proper markdown library like react-markdown
    const renderParagraphs = content.split('\n\n').map((paragraph, index) => (
      <p key={index} className="whitespace-pre-wrap break-words mb-4 last:mb-0">
        {paragraph}
      </p>
    ));

    return <>{renderParagraphs}</>;
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <div key={message.id} className="message-container">
          <div
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[85%] shadow-sm ${message.role === 'user'
                ? 'bg-primary text-primary-foreground ml-auto'
                : message.role === 'system'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-card border'
                }`}
            >
              {renderMessageContent(message.content)}
              <div className="flex justify-between items-center mt-2 text-xs opacity-70">
                <span>{formatTime(message.timestamp)}</span>
                {message.status === 'sending' && <span>Sending...</span>}
                {message.status === 'error' && (
                  <span className="text-destructive">Error sending</span>
                )}
              </div>
            </div>
          </div>

          {message.role === 'assistant' && message.followUpQuestions && message.followUpQuestions.length > 0 && onSelectFollowUpQuestion && (
            <div className="mt-2">
              <FollowUpQuestions
                questions={message.followUpQuestions}
                onSelectQuestion={onSelectFollowUpQuestion}
                primaryColor="var(--primary)"
              />
            </div>
          )}

          {allowFeedback && message.role === 'assistant' && (
            <div className="flex justify-start gap-2 mt-1 pl-2">
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <ThumbsUp size={14} />
              </button>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <ThumbsDown size={14} />
              </button>
            </div>
          )}
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-card rounded-lg px-4 py-3 border shadow-sm">
            <div className="flex space-x-2 items-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Generating response...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
