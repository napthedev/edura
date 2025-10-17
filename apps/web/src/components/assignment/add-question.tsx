"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import type {
  Question,
  QuestionType,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
} from "@/lib/assignment-types";

interface AddQuestionProps {
  onAdd: (question: Question) => void;
  nextIndex: number;
}

export function AddQuestion({ onAdd, nextIndex }: AddQuestionProps) {
  const [showSelector, setShowSelector] = useState(false);

  const createQuestion = (type: QuestionType): Question => {
    const baseQuestion = {
      id: crypto.randomUUID(),
      index: nextIndex,
      statement: "",
      correctAnswer: "",
      explanation: "",
    };

    switch (type) {
      case "simple":
        return {
          ...baseQuestion,
          type: "simple",
        };
      case "multiple":
        return {
          ...baseQuestion,
          type: "multiple",
          options: ["", "", "", ""],
          correctAnswer: "a",
        } as MultipleChoiceQuestion;
      case "truefalse":
        return {
          ...baseQuestion,
          type: "truefalse",
          correctAnswer: "true",
        } as TrueFalseQuestion;
      default:
        throw new Error("Invalid question type");
    }
  };

  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion = createQuestion(type);
    onAdd(newQuestion);
    setShowSelector(false);
  };

  if (!showSelector) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <Button
            variant="outline"
            onClick={() => setShowSelector(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Choose Question Type</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => handleAddQuestion("simple")}
          >
            <span className="font-medium">Simple Text</span>
            <span className="text-sm text-muted-foreground">
              Open-ended answer
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => handleAddQuestion("multiple")}
          >
            <span className="font-medium">Multiple Choice</span>
            <span className="text-sm text-muted-foreground">
              A, B, C, D options
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => handleAddQuestion("truefalse")}
          >
            <span className="font-medium">True/False</span>
            <span className="text-sm text-muted-foreground">
              Boolean answer
            </span>
          </Button>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => setShowSelector(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
