"use client";

import React, { useState, useEffect, useRef } from "react";
import ChatMessages from "./ChatMessages";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import aiService from "@/services/aiService";
import { FollowUpQuestion } from "@/services/api/features/followupfeatures";

// Define internal Message type used by ChatContainer
interface ContainerMessage {
    id: string;
    content: string;
    role: "user" | "assistant" | "system";
    timestamp: Date;
    status?: "sending" | "sent" | "error";
    followUpQuestions?: FollowUpQuestion[];
}

// Message interface for ChatMessages component
interface ChatMessagesMessage {
    id: string;
    content: string;
    role: "user" | "assistant" | "system";
    timestamp: Date;
    status?: "sending" | "sent" | "error";
    followUpQuestions?: string[];
}

interface ChatContainerProps {
    initialMessages?: ContainerMessage[];
    contextRuleId?: string;
    followUpConfigId?: string;
    onError?: (error: Error) => void;
}

export default function ChatContainer({
    initialMessages = [],
    contextRuleId,
    followUpConfigId,
    onError,
}: ChatContainerProps) {
    const [messages, setMessages] = useState<ContainerMessage[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [lastUserMessage, setLastUserMessage] = useState<ContainerMessage | null>(null);
    const [lastAiResponse, setLastAiResponse] = useState<ContainerMessage | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Transform ContainerMessage[] to ChatMessagesMessage[]
    const transformMessages = (messages: ContainerMessage[]): ChatMessagesMessage[] => {
        return messages.map(message => ({
            ...message,
            followUpQuestions: message.followUpQuestions?.map(q => q.question)
        }));
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: ContainerMessage = {
            id: crypto.randomUUID(),
            content: input.trim(),
            role: "user",
            timestamp: new Date(),
            status: "sent"
        };

        setMessages((prev) => [...prev, userMessage]);
        setLastUserMessage(userMessage);
        setInput("");
        setIsLoading(true);

        try {
            const response = await aiService.sendQuery(input.trim(), {
                contextRuleId,
                followUpConfigId,
            });

            const aiMessage: ContainerMessage = {
                id: crypto.randomUUID(),
                content: response.ai_response,
                role: "assistant",
                timestamp: new Date(),
                status: "sent",
                followUpQuestions: response.follow_up_questions,
            };

            setMessages((prev) => [...prev, aiMessage]);
            setLastAiResponse(aiMessage);
        } catch (error) {
            console.error("Error getting AI response:", error);
            if (onError && error instanceof Error) {
                onError(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowUpSelected = async (question: string) => {
        if (!lastUserMessage || !lastAiResponse) return;

        // Find the actual FollowUpQuestion object
        const followUpObj = messages
            .find(m => m.role === "assistant" && m.followUpQuestions)
            ?.followUpQuestions?.find(q => q.question === question);

        if (!followUpObj) return;

        const followUpMessage: ContainerMessage = {
            id: crypto.randomUUID(),
            content: followUpObj.question,
            role: "user",
            timestamp: new Date(),
            status: "sent"
        };

        setMessages((prev) => [...prev, followUpMessage]);
        setIsLoading(true);

        try {
            const response = await aiService.processFollowUp(
                followUpObj,
                lastUserMessage.content,
                lastAiResponse.content,
                contextRuleId
            );

            const aiMessage: ContainerMessage = {
                id: crypto.randomUUID(),
                content: response.ai_response,
                role: "assistant",
                timestamp: new Date(),
                status: "sent",
                followUpQuestions: response.follow_up_questions,
            };

            setMessages((prev) => [...prev, aiMessage]);
            setLastUserMessage(followUpMessage);
            setLastAiResponse(aiMessage);
        } catch (error) {
            console.error("Error processing follow-up:", error);
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
                <ChatMessages
                    messages={transformMessages(messages)}
                    isTyping={isLoading}
                    messagesEndRef={messagesEndRef}
                    enableMarkdown={true}
                    onSelectFollowUpQuestion={handleFollowUpSelected}
                />
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
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
} 