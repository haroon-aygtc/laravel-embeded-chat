import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PaperclipIcon, SendIcon, SmileIcon, MicIcon } from "lucide-react";
import debounce from 'lodash/debounce';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  placeholder?: string;
  allowAttachments?: boolean;
  allowEmoji?: boolean;
  primaryColor?: string;
  onTypingStatusChange?: (isTyping: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder = "Type your message here...",
  disabled = false,
  allowAttachments = true,
  allowVoice = true,
  allowEmoji = true,
  primaryColor = '#4F46E5',
  onTypingStatusChange
}) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debounced typing status update
  const debouncedTypingStatus = useCallback(
    debounce((isTyping: boolean) => {
      if (onTypingStatusChange) {
        onTypingStatusChange(isTyping);
      }
    }, 500),
    [onTypingStatusChange]
  );

  // Handle message change and notify about typing
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // If there's content, send typing indicator
    if (value.trim() && onTypingStatusChange) {
      debouncedTypingStatus(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      await handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) return;

    setIsLoading(true);
    setMessage('');

    // Notify that user is no longer typing
    if (onTypingStatusChange) {
      debouncedTypingStatus.cancel();
      onTypingStatusChange(false);
    }

    try {
      await onSendMessage(trimmedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(trimmedMessage); // Restore message on error
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleAttachmentClick = () => {
    // This would typically open a file picker
    console.log('Attachment button clicked');
  };

  const handleEmojiClick = () => {
    // This would typically open an emoji picker
    console.log('Emoji button clicked');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      {allowAttachments && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleAttachmentClick}
          disabled={disabled}
          className="text-muted-foreground hover:text-foreground"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
      )}

        <Textarea
          placeholder={placeholder}
          value={message}
          onChange={handleMessageChange}
          className="flex-1 min-h-[40px] resize-none overflow-hidden rounded-full py-2"
          disabled={disabled}
          ref={textareaRef}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />

        {allowEmoji && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleEmojiClick}
            disabled={disabled}
            className="absolute right-2 bottom-2 text-muted-foreground hover:text-foreground"
          >
            <Smile className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Button
        type="submit"
        size="icon"
        disabled={!message.trim() || disabled}
        style={{
          backgroundColor: primaryColor,
          color: '#ffffff',
        }}
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};

export default ChatInput;
