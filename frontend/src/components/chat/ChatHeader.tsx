import React from "react";
import { X } from "lucide-react";

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  logoUrl?: string;
  onClose?: () => void;
  primaryColor: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  subtitle,
  logoUrl,
  onClose,
  primaryColor,
}) => {
  return (
    <div
      className="chat-header flex items-center justify-between p-4"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="flex items-center">
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Chat Logo"
            className="w-8 h-8 rounded-full mr-3"
          />
        )}
        <div>
          <h3 className="text-white font-medium text-base">{title}</h3>
          {subtitle && (
            <p className="text-white/80 text-xs">{subtitle}</p>
          )}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-white opacity-80 hover:opacity-100 transition-opacity"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default ChatHeader;
