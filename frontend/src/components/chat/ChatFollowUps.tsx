"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Chip } from "@/components/ui/chip";
import { CornerDownRight } from "lucide-react";
import { FollowUpQuestion } from "@/services/api/features/followupfeatures";

interface ChatFollowUpsProps {
    followUpQuestions: FollowUpQuestion[];
    isLoading?: boolean;
    onFollowUpSelected: (question: FollowUpQuestion) => void;
    displayStyle?: "buttons" | "chips" | "dropdown" | "list";
}

export default function ChatFollowUps({
    followUpQuestions,
    isLoading = false,
    onFollowUpSelected,
    displayStyle = "buttons",
}: ChatFollowUpsProps) {
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-2 my-2">
                <div className="animate-pulse bg-muted h-8 w-32 rounded-md"></div>
            </div>
        );
    }

    if (!followUpQuestions || followUpQuestions.length === 0) {
        return null;
    }

    const handleSelectQuestion = (question: FollowUpQuestion) => {
        setSelectedQuestion(question.id);
        onFollowUpSelected(question);
    };

    const renderFollowUps = () => {
        switch (displayStyle) {
            case "buttons":
                return (
                    <div className="flex flex-col gap-2 w-full">
                        {followUpQuestions.map((question) => (
                            <Button
                                key={question.id}
                                variant={selectedQuestion === question.id ? "default" : "outline"}
                                size="sm"
                                className="justify-start text-left whitespace-normal h-auto py-2"
                                onClick={() => handleSelectQuestion(question)}
                                disabled={selectedQuestion !== null}
                            >
                                <CornerDownRight className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>{question.question}</span>
                            </Button>
                        ))}
                    </div>
                );

            case "chips":
                return (
                    <div className="flex flex-wrap gap-2 w-full">
                        {followUpQuestions.map((question) => (
                            <Chip
                                key={question.id}
                                variant={selectedQuestion === question.id ? "default" : "outline"}
                                onClick={() => handleSelectQuestion(question)}
                                disabled={selectedQuestion !== null}
                            >
                                {question.question}
                            </Chip>
                        ))}
                    </div>
                );

            case "list":
                return (
                    <div className="flex flex-col gap-1 w-full">
                        {followUpQuestions.map((question) => (
                            <div
                                key={question.id}
                                className={`p-2 rounded-md cursor-pointer hover:bg-muted/60 transition-colors ${selectedQuestion === question.id ? "bg-muted" : ""
                                    }`}
                                onClick={() => handleSelectQuestion(question)}
                            >
                                <CornerDownRight className="h-4 w-4 mr-2 inline-block" />
                                <span>{question.question}</span>
                            </div>
                        ))}
                    </div>
                );

            case "dropdown":
                return (
                    <div className="w-full">
                        <select
                            className="w-full p-2 border rounded-md"
                            onChange={(e) => {
                                const questionId = e.target.value;
                                const question = followUpQuestions.find((q) => q.id === questionId);
                                if (question) {
                                    handleSelectQuestion(question);
                                }
                            }}
                            disabled={selectedQuestion !== null}
                            value={selectedQuestion || ""}
                        >
                            <option value="" disabled>
                                Select a follow-up question
                            </option>
                            {followUpQuestions.map((question) => (
                                <option key={question.id} value={question.id}>
                                    {question.question}
                                </option>
                            ))}
                        </select>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Card className="p-3 my-2 w-full bg-muted/20">
            <div className="text-sm font-medium mb-2">Follow-up questions:</div>
            <Separator className="mb-2" />
            {renderFollowUps()}
        </Card>
    );
} 