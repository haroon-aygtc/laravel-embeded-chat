import React from "react";
import ChatWidgetWithConfig from "@/components/chat/ChatWidgetWithConfig";

const ChatPage = () => {
  return (
    <div className="w-full h-screen">
      <ChatWidgetWithConfig
        config={{
          titleText: "AI Chat Assistant",
          subtitleText: "Ask me anything about our services"
        }}
        embedded={true}
      />
    </div>
  );
};

export default ChatPage;
