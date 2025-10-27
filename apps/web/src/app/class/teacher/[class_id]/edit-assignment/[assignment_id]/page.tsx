"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Copy, Trash2 } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import { QuestionEditor } from "@/components/assignment/question-editor";
import { AddQuestion } from "@/components/assignment/add-question";
import type { Question, AssignmentContent } from "@/lib/assignment-types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

type SessionUser = {
  id: string;
  role: string;
  name: string;
  email: string;
  image?: string | null;
};

const assignmentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  testingDuration: z
    .number()
    .min(1, "Testing duration must be at least 1 minute")
    .optional(),
});

type AssignmentForm = z.infer<typeof assignmentFormSchema>;

export default function EditAssignmentPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const assignmentId = params.assignment_id as string;
  const router = useRouter();

  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [questions, setQuestions] = useState<Question[]>([]);

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const result = await authClient.getSession();
      if (result.error) throw result.error;
      return result.data;
    },
    staleTime: Infinity,
  });

  const assignmentQuery = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => trpcClient.education.getAssignment.query({ assignmentId }),
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async (
      data: AssignmentForm & { assignmentContent: string }
    ) => {
      return await trpcClient.education.updateAssignment.mutate({
        assignmentId,
        ...data,
      });
    },
    onSuccess: () => {
      assignmentQuery.refetch();
      toast.success("Assignment saved successfully");
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.education.deleteAssignment.mutate({
        assignmentId,
      });
    },
    onSuccess: () => {
      toast.success("Assignment deleted successfully");
      router.push(`/class/teacher/${classId}`);
    },
  });

  const form = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      testingDuration: undefined,
    },
  });

  useEffect(() => {
    if (assignmentQuery.data) {
      const assignment = assignmentQuery.data.assignments;
      form.reset({
        title: assignment.title,
        description: assignment.description || "",
        dueDate: assignment.dueDate
          ? new Date(assignment.dueDate).toISOString().split("T")[0]
          : "",
        testingDuration: assignment.testingDuration || undefined,
      });

      if (assignment.assignmentContent) {
        try {
          const content: AssignmentContent = JSON.parse(
            assignment.assignmentContent
          );
          setQuestions(content.questions || []);
        } catch (error) {
          console.error("Failed to parse assignment content:", error);
          setQuestions([]);
        }
      }
    }
  }, [assignmentQuery.data, form]);

  useEffect(() => {
    if (!sessionQuery.isLoading && !sessionQuery.data?.user) {
      router.push("/login");
    } else if (
      !sessionQuery.isLoading &&
      sessionQuery.data?.user &&
      (sessionQuery.data.user as unknown as SessionUser).role === "student"
    ) {
      router.push("/dashboard");
    }
  }, [sessionQuery.isLoading, sessionQuery.data, router]);

  const handleAddQuestion = (question: Question) => {
    setQuestions((prev) => [...prev, question]);
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
    );

    // Clear field errors for this question when it's updated
    const questionKey = `question-${updatedQuestion.id}`;
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      // Remove all errors for this question
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(questionKey)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions((prev) => {
      const filtered = prev.filter((q) => q.id !== questionId);
      // Re-index questions
      return filtered.map((q, index) => ({ ...q, index: index + 1 }));
    });
  };

  const validateQuestions = (): boolean => {
    const errors: Record<string, boolean> = {};

    questions.forEach((question, index) => {
      const questionNumber = index + 1;
      const questionKey = `question-${question.id}`;

      // Check statement
      if (!question.statement.trim()) {
        errors[`${questionKey}-statement`] = true;
      }

      // Check correct answer
      if (!question.correctAnswer.trim()) {
        errors[`${questionKey}-answer`] = true;
      }

      // Check options for multiple choice
      if (question.type === "multiple") {
        question.options.forEach((option, optionIndex) => {
          if (!option.trim()) {
            errors[`${questionKey}-option-${optionIndex}`] = true;
          }
        });
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (formData: AssignmentForm) => {
    // Clear previous validation errors
    setFieldErrors({});

    // Validate questions
    if (!validateQuestions()) {
      return;
    }

    const assignmentContent: AssignmentContent = {
      questions: questions.map((q, index) => ({ ...q, index: index + 1 })),
    };

    updateAssignmentMutation.mutate({
      ...formData,
      assignmentContent: JSON.stringify(assignmentContent),
    });
  };

  const handleCopyAssignmentUrl = async () => {
    const url = `${window.location.origin}/do-assignment/${assignmentId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Assignment URL copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const handleDeleteAssignment = () => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      deleteAssignmentMutation.mutate();
    }
  };

  if (sessionQuery.isLoading || assignmentQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <p>Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (assignmentQuery.error) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <p>Error loading assignment: {assignmentQuery.error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/class/teacher/${classId}?tab=assignments`)
              }
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Edit Assignment</h1>
            <Button
              variant="outline"
              onClick={handleCopyAssignmentUrl}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Assignment URL
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAssignment}
              disabled={deleteAssignmentMutation.isPending}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Assignment
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Assignment title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Assignment description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="testingDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Testing Duration (minutes, Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 60"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Questions ({questions.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  onUpdate={handleUpdateQuestion}
                  onDelete={() => handleDeleteQuestion(question.id)}
                  fieldErrors={fieldErrors}
                />
              ))}

              <AddQuestion
                onAdd={handleAddQuestion}
                nextIndex={questions.length + 1}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={form.handleSubmit(handleSave)}
              disabled={updateAssignmentMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateAssignmentMutation.isPending
                ? "Saving..."
                : "Save Assignment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
