import React from "react";
import { Button } from "@/components/ui/button";

interface FollowUpQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
  primaryColor: string;
}

const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({
  questions,
  onSelectQuestion,
  primaryColor,
}) => {
  if (!questions.length) return null;

  return (
    <div className="p-3 border-t">
      <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelectQuestion(question)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-full transition-colors duration-200"
            style={{
              borderColor: primaryColor,
              borderWidth: "1px",
              borderStyle: "solid",
              color: "#4b5563",
              outlineColor: primaryColor
            }}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FollowUpQuestions;
