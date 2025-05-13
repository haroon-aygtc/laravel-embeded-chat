import React, { useState } from "react";
import { X, Minus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  title?: string;
  subtitle?: string;
  isOnline?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  logoUrl?: string;
  primaryColor?: string;
}

const ChatHeader = ({
  title = "AI Assistant",
  subtitle,
  isOnline = true,
  onClose = () => { },
  onMinimize = () => { },
  logoUrl,
  primaryColor,
}: ChatHeaderProps) => {
  // Use primaryColor if provided, otherwise let CSS handle it
  const headerStyle = primaryColor ? { backgroundColor: primaryColor } : {};

  return (
    <div
      className="flex flex-col bg-primary text-primary-foreground rounded-t-lg"
      style={headerStyle}
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-5 h-5 rounded" />
          ) : (
            <MessageCircle size={20} />
          )}
          <h3 className="font-medium text-sm">{title}</h3>
          <div className="flex items-center">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-green-400" : "bg-gray-400",
              )}
            />
            <span className="text-xs ml-1">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={onMinimize}
            aria-label="Minimize chat"
          >
            <Minus size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X size={16} />
          </Button>
        </div>
      </div>
      {subtitle && (
        <div className="px-3 pb-2 -mt-1">
          <p className="text-xs text-primary-foreground/80">{subtitle}</p>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
