import React, { useState, KeyboardEvent, useRef } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  allowAttachments?: boolean;
  allowEmoji?: boolean;
  primaryColor: string;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder = 'Type your message here...',
  allowAttachments = false,
  allowEmoji = false,
  primaryColor,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage(trimmedMessage);
    setMessage('');

    // Focus back on the textarea after sending
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter without shift key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Check if paste contains any files and attachments are allowed
    if (allowAttachments && e.clipboardData.files.length > 0) {
      // For now, we just log it, but this could be extended to handle file uploads
      console.log('File pasted:', e.clipboardData.files[0].name);
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

      <div className="relative flex-1">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          className="min-h-[40px] max-h-[120px] resize-none pr-10"
          style={{
            outlineColor: primaryColor,
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
