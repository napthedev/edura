"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Loader2 } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import type { Question } from "@/lib/assignment-types";
import { toast } from "sonner";

const generateQuestionsSchema = z.object({
  numberOfQuestions: z.number().min(1).max(100),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
});

type GenerateQuestionsForm = z.infer<typeof generateQuestionsSchema>;

interface GenerateQuestionsProps {
  onCancel: () => void;
  classId: string;
}

export function GenerateQuestions({
  onCancel,
  classId,
}: GenerateQuestionsProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const form = useForm<GenerateQuestionsForm>({
    resolver: zodResolver(generateQuestionsSchema),
    defaultValues: {
      numberOfQuestions: 10,
      difficulty: "mixed",
    },
  });

  const generateQuestionsMutation = useMutation({
    mutationFn: async (data: GenerateQuestionsForm & { file: File }) => {
      // Check if API key is configured
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new Error("Google AI API key not configured");
      }

      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (data.file.size > maxSize) {
        throw new Error("File size must be less than 10MB");
      }

      const { GoogleGenAI, Type } = await import("@google/genai");

      // Initialize Google AI
      const genAI = new GoogleGenAI({
        apiKey,
      });

      // Build difficulty instruction
      let difficultyInstruction = "";
      switch (data.difficulty) {
        case "easy":
          difficultyInstruction =
            "Generate questions at an EASY difficulty level. Focus on basic concepts, definitions, and straightforward applications. Questions should test fundamental understanding and recall.";
          break;
        case "medium":
          difficultyInstruction =
            "Generate questions at a MEDIUM difficulty level. Include questions that require analysis, comparison, and application of concepts. Mix conceptual understanding with practical application.";
          break;
        case "hard":
          difficultyInstruction =
            "Generate questions at a HARD difficulty level. Create challenging questions that require critical thinking, synthesis of multiple concepts, complex problem-solving, and deep analysis.";
          break;
        case "mixed":
          difficultyInstruction =
            "Generate questions with MIXED difficulty levels, progressing from easy to hard. Start with basic recall questions, move to medium-level analysis questions, and end with challenging synthesis and application questions.";
          break;
      }

      // Define the JSON schema for structured output
      const questionsSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.INTEGER,
              description: "Unique identifier for the question",
            },
            question: {
              type: Type.STRING,
              description: "The question text in plain text format",
            },
            options: {
              type: Type.OBJECT,
              properties: {
                A: {
                  type: Type.STRING,
                  description: "Option A text in plain text format",
                },
                B: {
                  type: Type.STRING,
                  description: "Option B text in plain text format",
                },
                C: {
                  type: Type.STRING,
                  description: "Option C text in plain text format",
                },
                D: {
                  type: Type.STRING,
                  description: "Option D text in plain text format",
                },
              },
              required: ["A", "B", "C", "D"],
              propertyOrdering: ["A", "B", "C", "D"],
            },
            correctAnswer: {
              type: Type.STRING,
              enum: ["A", "B", "C", "D"],
              description: "The correct answer option",
            },
            explanation: {
              type: Type.STRING,
              description:
                "Brief explanation for why the correct answer is right in plain text format",
            },
          },
          required: [
            "id",
            "question",
            "options",
            "correctAnswer",
            "explanation",
          ],
          propertyOrdering: [
            "id",
            "question",
            "options",
            "correctAnswer",
            "explanation",
          ],
        },
      };

      // Create the prompt for generating multiple choice questions
      const prompt = `
        Please analyze the content of this PDF document and generate exactly ${data.numberOfQuestions} multiple choice questions based on the material.
        
        DIFFICULTY REQUIREMENTS:
        ${difficultyInstruction}
        
        EXPLANATION REQUIREMENTS:
        Include brief, concise explanations for the correct answer. Keep explanations clear and to the point, focusing on the key reason why the answer is correct.
        
        For each question:
        1. Create a clear, well-structured question appropriate for the specified difficulty level
        2. Provide 4 answer options (A, B, C, D)
        3. Indicate the correct answer
        4. Include a brief explanation following the detail level specified above
        5. If the content contains mathematical formulas, equations, or symbols, write them in plain text format (e.g., "x squared" instead of "x^2", "square root of 2" instead of symbols)
        6. Make sure all text is properly formatted for JSON
        7. Generate exactly ${data.numberOfQuestions} questions
        8. Follow the ${data.difficulty} difficulty level requirement strictly
        9. Provide brief explanations as specified
        10. Use plain text for all mathematical content (avoid special symbols or notation)
        11. Focus on creating meaningful questions that test understanding
        
        The response will be automatically formatted as JSON according to the specified schema.
        `;

      // Prepare the file data for Google AI
      const fileBuffer = await data.file.arrayBuffer();
      const filePart = {
        inlineData: {
          data: Buffer.from(fileBuffer).toString("base64"),
          mimeType: "application/pdf",
        },
      };

      try {
        // Generate content using structured output
        const result = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }, filePart],
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: questionsSchema,
          },
        });

        const text = result.text;

        if (!text) {
          throw new Error(
            "No response received from the AI model. Please try again."
          );
        }

        // Parse the JSON response directly
        let questions: any[];
        try {
          questions = JSON.parse(text);
        } catch (parseError) {
          console.error("Failed to parse JSON response:", text);
          console.error("Parse error:", parseError);
          throw new Error(
            "The AI had trouble processing your document. This might be due to poor document quality, unclear text, or unsupported PDF format. Please try again with a clearer PDF document."
          );
        }

        if (questions.length === 0) {
          throw new Error(
            "Your document doesn't contain enough readable content to generate questions. Please try a more detailed PDF with clear text."
          );
        }

        // Transform questions to match the app's question format
        const transformedQuestions = questions.map((q, index) => ({
          id: crypto.randomUUID(),
          index: index + 1,
          type: "multiple" as const,
          statement: q.question,
          options: [q.options.A, q.options.B, q.options.C, q.options.D],
          correctAnswer: q.correctAnswer.toLowerCase(),
          explanation: q.explanation,
        }));

        // Now save to database
        // @ts-ignore
        const assignment =
          await trpcClient.education.generateQuestionsFromDocument.mutate({
            // @ts-ignore
            questions: transformedQuestions,
            classId,
          });

        return assignment;
      } catch (error) {
        console.error("Error generating questions:", error);

        // Provide more specific error messages based on the error type
        let errorMessage =
          "An unexpected error occurred while processing your document.";

        if (error instanceof Error) {
          if (error.message.includes("API key")) {
            errorMessage =
              "There's a configuration issue with our AI service. Please contact support.";
          } else if (
            error.message.includes("quota") ||
            error.message.includes("limit")
          ) {
            errorMessage =
              "Our AI service is currently experiencing high demand. Please try again in a few minutes.";
          } else if (error.message.includes("timeout")) {
            errorMessage =
              "The request took too long to process. Please try with a smaller PDF or try again later.";
          } else if (
            error.message.includes("network") ||
            error.message.includes("fetch")
          ) {
            errorMessage =
              "Network connection issue. Please check your internet connection and try again.";
          }
          // If it's one of our custom error messages, use it directly
          else if (
            error.message.includes("File size must be") ||
            error.message.includes("trouble processing") ||
            error.message.includes("doesn't contain enough")
          ) {
            errorMessage = error.message;
          }
        }

        throw new Error(errorMessage);
      }
    },
    onSuccess: (assignment) => {
      // Instead of calling onQuestionsGenerated, redirect to edit page
      // @ts-ignore
      window.location.href = `/class/teacher/${classId}/edit-assignment/${assignment.assignmentId}`;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate questions");
    },
  });

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const onSubmit = (data: GenerateQuestionsForm) => {
    if (!selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }

    generateQuestionsMutation.mutate({ ...data, file: selectedFile });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Generate Questions from Document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-2">
            <Label>Upload PDF Document</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-green-600" />
                  <p className="text-sm font-medium text-green-700">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Drag and drop a PDF file here, or click to select
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    Select File
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Maximum file size: 10MB. Only PDF files are supported.
            </p>
          </div>

          {/* Settings Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfQuestions">Number of Questions</Label>
              <Input
                id="numberOfQuestions"
                type="number"
                min={1}
                max={100}
                {...form.register("numberOfQuestions", {
                  valueAsNumber: true,
                })}
              />
              {form.formState.errors.numberOfQuestions && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.numberOfQuestions.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={form.watch("difficulty")}
                onValueChange={(value) =>
                  form.setValue("difficulty", value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.difficulty && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.difficulty.message}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={generateQuestionsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={generateQuestionsMutation.isPending || !selectedFile}
            >
              {generateQuestionsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Questions"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
