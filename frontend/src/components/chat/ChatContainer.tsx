"use client";

import React, { useState, useEffect, useRef } from "react";
import ChatMessages, { Message } from "./ChatMessages";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Send, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { aiFeatures, GenerateResponse, GenerateOptions } from "@/services/api/features/aiService";
import { FollowUpQuestion as ApiFollowUpQuestion } from "@/services/api/features/followupfeatures";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

// Define internal Message type used by ChatContainer
interface ContainerMessage {
    id: string;
    content: string;
    role: "user" | "assistant" | "system";
    timestamp: Date;
    status?: "sending" | "sent" | "error";
    followUpQuestions?: ApiFollowUpQuestion[];
}

// Custom API response type for our needs
interface ChatResponse {
    id: string;
    content: string;
    follow_up_questions?: ApiFollowUpQuestion[];
}

interface ChatContainerProps {
    initialMessages?: ContainerMessage[];
    contextRuleId?: string;
    followUpConfigId?: string;
    onError?: (error: Error) => void;
    widgetId?: string;
    sessionId?: string;
}

export default function ChatContainer({
    initialMessages = [],
    contextRuleId,
    followUpConfigId,
    onError,
    widgetId,
    sessionId,
}: ChatContainerProps) {
    const [messages, setMessages] = useState<ContainerMessage[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUserMessage, setLastUserMessage] = useState<ContainerMessage | null>(null);
    const [lastAiResponse, setLastAiResponse] = useState<ContainerMessage | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Transform ContainerMessage[] to Message[]
    const transformMessages = (messages: ContainerMessage[]): Message[] => {
        return messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : String(msg.timestamp),
            status: msg.status,
            followUpQuestions: msg.followUpQuestions?.map(q => q.question) || []
        }));
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        // Clear any previous errors
        setError(null);

        const userMessage: ContainerMessage = {
            id: crypto.randomUUID(),
            content: input.trim(),
            role: "user",
            timestamp: new Date(),
            status: "sending"
        };

        setMessages((prev) => [...prev, userMessage]);
        setLastUserMessage(userMessage);
        setInput("");
        setIsLoading(true);

        try {
            // Prepare context data with our custom properties
            const contextData = {
                contextRuleId,
                followUpConfigId,
                widgetId,
                sessionId
            };

            const response = await aiFeatures.generate(input.trim(), {
                contextData
            });

            // Update user message status
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === userMessage.id
                        ? { ...msg, status: "sent" }
                        : msg
                )
            );

            if (!response.success || !response.data) {
                throw new Error("Failed to get response from AI");
            }

            // Transform the standard response to our expected format
            // In a real implementation, backend would return follow_up_questions directly
            const chatResponse: ChatResponse = {
                id: response.data.id,
                content: response.data.content,
                // This would come from the backend in a real implementation
                follow_up_questions: []
            };

            const aiMessage: ContainerMessage = {
                id: crypto.randomUUID(),
                content: chatResponse.content || "Sorry, I couldn't generate a response.",
                role: "assistant",
                timestamp: new Date(),
                status: "sent",
                followUpQuestions: chatResponse.follow_up_questions,
            };

            setMessages((prev) => [...prev, aiMessage]);
            setLastAiResponse(aiMessage);
        } catch (error) {
            console.error("Error getting AI response:", error);

            // Update user message to show error
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === userMessage.id
                        ? { ...msg, status: "error" }
                        : msg
                )
            );

            // Set error state for UI
            setError("Failed to get response from AI service. Please try again.");

            // Show toast notification
            toast({
                title: "Error",
                description: "Could not connect to AI service. Please try again later.",
                variant: "destructive",
            });

            // Propagate error to parent component if handler exists
            if (onError && error instanceof Error) {
                onError(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowUpSelected = async (question: string) => {
        if (!question || isLoading) return;

        // Clear any previous errors
        setError(null);

        // Find the actual FollowUpQuestion object
        const followUpObj = messages
            .find(m => m.role === "assistant" && m.followUpQuestions)
            ?.followUpQuestions?.find(q => q.question === question);

        if (!followUpObj) {
            toast({
                title: "Error",
                description: "Could not find the selected follow-up question.",
                variant: "destructive",
            });
            return;
        }

        const followUpMessage: ContainerMessage = {
            id: crypto.randomUUID(),
            content: followUpObj.question,
            role: "user",
            timestamp: new Date(),
            status: "sending"
        };

        setMessages((prev) => [...prev, followUpMessage]);
        setIsLoading(true);

        try {
            // Prepare context data with our custom properties
            const contextData = {
                contextRuleId,
                followUpConfigId,
                widgetId,
                sessionId
            };

            const response = await aiFeatures.generate(followUpObj.question, {
                contextData
            });

            // Update follow-up message status
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === followUpMessage.id
                        ? { ...msg, status: "sent" }
                        : msg
                )
            );

            if (!response.success || !response.data) {
                throw new Error("Failed to get response from AI");
            }

            // Transform the standard response to our expected format
            // In a real implementation, backend would return follow_up_questions directly
            const chatResponse: ChatResponse = {
                id: response.data.id,
                content: response.data.content,
                // This would come from the backend in a real implementation
                follow_up_questions: []
            };

            const aiMessage: ContainerMessage = {
                id: crypto.randomUUID(),
                content: chatResponse.content || "Sorry, I couldn't generate a response.",
                role: "assistant",
                timestamp: new Date(),
                status: "sent",
                followUpQuestions: chatResponse.follow_up_questions,
            };

            setMessages((prev) => [...prev, aiMessage]);
            setLastUserMessage(followUpMessage);
            setLastAiResponse(aiMessage);
        } catch (error) {
            console.error("Error processing follow-up:", error);

            // Update follow-up message to show error
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === followUpMessage.id
                        ? { ...msg, status: "error" }
                        : msg
                )
            );

            // Set error state for UI
            setError("Failed to get response for follow-up question. Please try again.");

            // Show toast notification
            toast({
                title: "Error",
                description: "Could not process follow-up question. Please try again later.",
                variant: "destructive",
            });

            if (onError && error instanceof Error) {
                onError(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                        <h3 className="font-medium text-lg mb-2">No messages yet</h3>
                        <p>Start a conversation by typing a message below.</p>
                    </div>
                ) : (
                    <ChatMessages
                        messages={transformMessages(messages)}
                        isTyping={isLoading}
                        messagesEndRef={messagesEndRef}
                        enableMarkdown={true}
                        onSelectFollowUpQuestion={handleFollowUpSelected}
                    />
                )}

                {isLoading && (
                    <div className="flex justify-center py-4">
                        <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-4 py-1">
                                <div className="h-3 bg-muted rounded w-3/4"></div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-muted rounded"></div>
                                    <div className="h-3 bg-muted rounded w-5/6"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <Separator />

            <div className="p-4">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }}
                    className="flex space-x-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1"
                        disabled={isLoading}
                        aria-label="Chat message input"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        aria-label="Send message"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
} 