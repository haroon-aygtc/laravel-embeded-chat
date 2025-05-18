import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, User, Bot } from "lucide-react";
import { GlassContainer } from "@/components/ui/glass-container";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! Welcome to Al Yalayis Business Hub. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue("");

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponses = [
        "Thank you for your message. Our team will get back to you shortly.",
        "I'd be happy to help with your inquiry about our services.",
        "We offer comprehensive solutions for businesses in the UAE.",
        "Would you like to schedule a consultation with one of our experts?",
      ];

      const randomResponse =
        botResponses[Math.floor(Math.random() * botResponses.length)];

      const botMessage: Message = {
        id: messages.length + 2,
        text: randomResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="mb-4"
          >
            <GlassContainer
              intensity="medium"
              borderLight
              className="w-80 sm:w-96 h-96 flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-medium text-white">Al Yalayis Support</h3>
                </div>
                <button
                  onClick={toggleChat}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 ${message.sender === "user" ? "bg-blue-600 text-white" : "bg-white/10 backdrop-blur-sm border border-white/10 text-gray-800 dark:text-gray-200"}`}
                    >
                      <div className="flex items-start gap-2">
                        {message.sender === "bot" && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0 flex items-center justify-center mt-0.5">
                            <Bot className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div>
                          <p>{message.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {message.sender === "user" && (
                          <div className="w-6 h-6 rounded-full bg-blue-700 flex-shrink-0 flex items-center justify-center mt-0.5">
                            <User className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSubmit}
                className="p-3 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </GlassContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </motion.button>
    </div>
  );
};

export default FloatingChatWidget;
