import React from "react";
import { Button } from "@/components/ui/button";

interface FollowUpSuggestionsProps {
  questions: string[];
  displayStyle: "buttons" | "chips" | "list";
  onQuestionClick: (question: string) => void;
  className?: string;
}

const FollowUpSuggestions: React.FC<FollowUpSuggestionsProps> = ({
  questions,
  displayStyle,
  onQuestionClick,
  className = "",
}) => {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {displayStyle === "buttons" && (
        <div className="flex flex-col space-y-2">
          {questions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => onQuestionClick(question)}
              className="justify-start text-left"
            >
              {question}
            </Button>
          ))}
        </div>
      )}

      {displayStyle === "chips" && (
        <div className="flex flex-wrap gap-2">
          {questions.map((question, index) => (
            <Button
              key={index}
              variant="secondary"
              size="sm"
              onClick={() => onQuestionClick(question)}
              className="rounded-full"
            >
              {question}
            </Button>
          ))}
        </div>
      )}

      {displayStyle === "list" && (
        <div className="border rounded-lg overflow-hidden">
          {questions.map((question, index) => (
            <div
              key={index}
              className={`p-3 hover:bg-muted cursor-pointer ${index !== questions.length - 1 ? "border-b" : ""}`}
              onClick={() => onQuestionClick(question)}
            >
              {question}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowUpSuggestions;
