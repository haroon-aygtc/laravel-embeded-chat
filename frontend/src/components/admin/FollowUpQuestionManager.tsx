import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, MoveUp, MoveDown } from "lucide-react";
import followUpQuestionService, {
  FollowUpQuestionData,
} from "@/services/followUpQuestionService";

interface FollowUpQuestionManagerProps {
  configId: string;
  onUpdate?: () => void;
}

const FollowUpQuestionManager: React.FC<FollowUpQuestionManagerProps> = ({
  configId,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<FollowUpQuestionData[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (configId) {
      loadQuestions();
    }
  }, [configId]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data =
        await followUpQuestionService.getQuestionsByConfigId(configId);
      setQuestions(data);
    } catch (error) {
      console.error("Error loading follow-up questions:", error);
      toast({
        title: "Error",
        description: "Failed to load follow-up questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;

    try {
      const result = await followUpQuestionService.createQuestion({
        configId,
        question: newQuestion,
        displayOrder: questions.length,
      });

      if (result) {
        setQuestions([...questions, result]);
        setNewQuestion("");
        toast({
          title: "Success",
          description: "Follow-up question added successfully",
        });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error adding follow-up question:", error);
      toast({
        title: "Error",
        description: "Failed to add follow-up question",
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuestion = async (
    id: string,
    data: Partial<FollowUpQuestionData>,
  ) => {
    try {
      const result = await followUpQuestionService.updateQuestion(id, data);
      if (result) {
        setQuestions(
          questions.map((q) => (q.id === id ? { ...q, ...data } : q)),
        );
        toast({
          title: "Success",
          description: "Follow-up question updated successfully",
        });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error updating follow-up question:", error);
      toast({
        title: "Error",
        description: "Failed to update follow-up question",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      const success = await followUpQuestionService.deleteQuestion(id);
      if (success) {
        setQuestions(questions.filter((q) => q.id !== id));
        toast({
          title: "Success",
          description: "Follow-up question deleted successfully",
        });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Error deleting follow-up question:", error);
      toast({
        title: "Error",
        description: "Failed to delete follow-up question",
        variant: "destructive",
      });
    }
  };

  const moveQuestion = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[newIndex];
    newQuestions[newIndex] = temp;

    // Update display order
    const updatedQuestions = newQuestions.map((q, i) => ({
      ...q,
      displayOrder: i,
    }));
    setQuestions(updatedQuestions);

    // Save the new order to the database
    try {
      const success = await followUpQuestionService.reorderQuestions(
        configId,
        updatedQuestions.map((q) => q.id!),
      );
      if (success && onUpdate) onUpdate();
    } catch (error) {
      console.error("Error reordering questions:", error);
      toast({
        title: "Error",
        description: "Failed to reorder questions",
        variant: "destructive",
      });
      // Revert to original order on error
      loadQuestions();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Follow-up Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Add a new follow-up question..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddQuestion()}
              className="flex-1"
            />
            <Button
              onClick={handleAddQuestion}
              disabled={!newQuestion.trim() || loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {loading ? (
            <div className="py-4 text-center text-muted-foreground">
              Loading questions...
            </div>
          ) : questions.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              No follow-up questions added yet. Add some questions above.
            </div>
          ) : (
            <div className="space-y-2">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex items-center space-x-2 p-2 border rounded-md bg-card"
                >
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveQuestion(index, "up")}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveQuestion(index, "down")}
                      disabled={index === questions.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={question.question}
                    onChange={(e) => {
                      const updatedQuestions = [...questions];
                      updatedQuestions[index] = {
                        ...question,
                        question: e.target.value,
                      };
                      setQuestions(updatedQuestions);
                    }}
                    onBlur={() => {
                      if (question.question !== questions[index].question) {
                        handleUpdateQuestion(question.id!, {
                          question: question.question,
                        });
                      }
                    }}
                    className="flex-1"
                  />
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`active-${question.id}`}
                        checked={question.isActive}
                        onCheckedChange={(checked) => {
                          handleUpdateQuestion(question.id!, {
                            isActive: checked,
                          });
                        }}
                      />
                      <Label
                        htmlFor={`active-${question.id}`}
                        className="text-sm"
                      >
                        Active
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteQuestion(question.id!)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FollowUpQuestionManager;
