import React from "react";
import { Button } from "@/components/ui/button";

interface FollowUpQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
  displayStyle?: "buttons" | "chips" | "list";
}

const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({
  questions,
  onSelectQuestion,
  displayStyle = "buttons",
}) => {
  if (!questions || questions.length === 0) return null;

  switch (displayStyle) {
    case "chips":
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {questions.map((question, index) => (
            <button
              key={index}
              onClick={() => onSelectQuestion(question)}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-800 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      );

    case "list":
      return (
        <ul className="mt-2 space-y-1 text-sm">
          {questions.map((question, index) => (
            <li key={index}>
              <button
                onClick={() => onSelectQuestion(question)}
                className="text-blue-600 hover:underline text-left"
              >
                {question}
              </button>
            </li>
          ))}
        </ul>
      );

    case "buttons":
    default:
      return (
        <div className="flex flex-col gap-2">
          {questions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSelectQuestion(question)}
              className="justify-start text-left h-auto py-2 text-sm font-normal"
            >
              {question}
            </Button>
          ))}
        </div>
      );
  }
};

export default FollowUpQuestions;
