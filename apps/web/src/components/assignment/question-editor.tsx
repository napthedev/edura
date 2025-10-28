"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus } from "lucide-react";
import type { Question } from "@/lib/assignment-types";
import { MathJaxProvider, LaTeXRenderer } from "@/components/latex-renderer";

interface QuestionEditorProps {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
  fieldErrors?: Record<string, boolean>;
}

export function QuestionEditor({
  question,
  onUpdate,
  onDelete,
  fieldErrors = {},
}: QuestionEditorProps) {
  const [localQuestion, setLocalQuestion] = useState<Question>(question);

  useEffect(() => {
    setLocalQuestion(question);
  }, [question]);

  const updateQuestion = (updates: Partial<Question>) => {
    const newQuestion = { ...localQuestion, ...updates } as Question;
    setLocalQuestion(newQuestion);
    onUpdate(newQuestion);
  };

  const getFieldError = (fieldKey: string) => {
    return fieldErrors[fieldKey] || false;
  };

  const getInputClassName = (fieldKey: string) => {
    return getFieldError(fieldKey)
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "";
  };

  const renderQuestionContent = () => {
    switch (localQuestion.type) {
      case "simple":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="statement">Question Statement</Label>
              <Textarea
                id="statement"
                value={localQuestion.statement}
                onChange={(e) => updateQuestion({ statement: e.target.value })}
                placeholder="Enter the question"
                className={getInputClassName(
                  `question-${question.id}-statement`
                )}
              />
              {localQuestion.statement && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <Label className="text-sm text-muted-foreground">
                    Preview:
                  </Label>
                  <div className="mt-1">
                    <LaTeXRenderer>{localQuestion.statement}</LaTeXRenderer>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="correctAnswer">Correct Answer</Label>
              <Textarea
                id="correctAnswer"
                value={localQuestion.correctAnswer}
                onChange={(e) =>
                  updateQuestion({ correctAnswer: e.target.value })
                }
                placeholder="Enter the correct answer"
                className={getInputClassName(`question-${question.id}-answer`)}
              />
            </div>
          </div>
        );

      case "multiple":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="statement">Question Statement</Label>
              <Textarea
                id="statement"
                value={localQuestion.statement}
                onChange={(e) => updateQuestion({ statement: e.target.value })}
                placeholder="Enter the question"
                className={getInputClassName(
                  `question-${question.id}-statement`
                )}
              />
              {localQuestion.statement && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <Label className="text-sm text-muted-foreground">
                    Preview:
                  </Label>
                  <div className="mt-1">
                    <LaTeXRenderer>{localQuestion.statement}</LaTeXRenderer>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label>Answer Options</Label>
              <div className="space-y-2">
                {(localQuestion.type === "multiple"
                  ? localQuestion.options
                  : ["", "", "", ""]
                ).map((option: string, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium w-6">
                        {String.fromCharCode(97 + index)}.
                      </span>
                      <Input
                        value={option}
                        onChange={(e) => {
                          if (localQuestion.type === "multiple") {
                            const newOptions = [...localQuestion.options] as [
                              string,
                              string,
                              string,
                              string
                            ];
                            newOptions[index] = e.target.value;
                            updateQuestion({
                              options: newOptions,
                            } as Partial<Question>);
                          }
                        }}
                        placeholder={`Option ${String.fromCharCode(
                          97 + index
                        )}`}
                        className={getInputClassName(
                          `question-${question.id}-option-${index}`
                        )}
                      />
                    </div>
                    {option && (
                      <div className="ml-8 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <Label className="text-xs text-muted-foreground">
                          Preview:
                        </Label>
                        <div className="mt-1">
                          <LaTeXRenderer>{option}</LaTeXRenderer>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Correct Answer</Label>
              <RadioGroup
                value={localQuestion.correctAnswer}
                onValueChange={(value) =>
                  updateQuestion({ correctAnswer: value })
                }
              >
                {["a", "b", "c", "d"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option}>{option.toUpperCase()}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case "truefalse":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="statement">Question Statement</Label>
              <Textarea
                id="statement"
                value={localQuestion.statement}
                onChange={(e) => updateQuestion({ statement: e.target.value })}
                placeholder="Enter the true/false question"
                className={getInputClassName(
                  `question-${question.id}-statement`
                )}
              />
              {localQuestion.statement && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <Label className="text-sm text-muted-foreground">
                    Preview:
                  </Label>
                  <div className="mt-1">
                    <LaTeXRenderer>{localQuestion.statement}</LaTeXRenderer>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label>Correct Answer</Label>
              <RadioGroup
                value={localQuestion.correctAnswer}
                onValueChange={(value) =>
                  updateQuestion({ correctAnswer: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true">True</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false">False</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MathJaxProvider>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            Question {localQuestion.index}
          </CardTitle>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderQuestionContent()}
          <div>
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={localQuestion.explanation || ""}
              onChange={(e) => updateQuestion({ explanation: e.target.value })}
              placeholder="Provide an explanation for the answer"
            />
          </div>
        </CardContent>
      </Card>
    </MathJaxProvider>
  );
}
