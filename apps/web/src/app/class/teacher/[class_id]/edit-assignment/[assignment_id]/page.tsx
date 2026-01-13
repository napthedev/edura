"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/assignment/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Copy, Trash2, Layers, FileText } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import { QuestionEditor } from "@/components/assignment/question-editor";
import { AddQuestion } from "@/components/assignment/add-question";
import { FlashcardEditor } from "@/components/assignment/flashcard-editor";
import { AddFlashcard } from "@/components/assignment/add-flashcard";
import { BulkImportDialog } from "@/components/assignment/bulk-import-dialog";
import type {
  Question,
  AssignmentContent,
  Flashcard,
  FlashcardContent,
} from "@/lib/assignment-types";
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
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";

type SessionUser = {
  id: string;
  role: string;
  name: string;
  email: string;
  image?: string | null;
};

const assignmentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  moduleId: z.string().optional(),
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
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const t = useTranslations("EditAssignment");
  const tFlashcard = useTranslations("FlashcardAssignment");

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

  const modulesQuery = useQuery({
    queryKey: [["education", "getClassModules"], { classId }],
    queryFn: async () => {
      return await trpcClient.education.getClassModules.query({ classId });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async (
      data: AssignmentForm & { assignmentContent: string }
    ) => {
      const { moduleId, ...rest } = data;
      return await trpcClient.education.updateAssignment.mutate({
        assignmentId,
        moduleId: !moduleId || moduleId === "none" ? null : moduleId,
        ...rest,
      });
    },
    onSuccess: () => {
      assignmentQuery.refetch();
      toast.success(t("saveSuccess"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.education.deleteAssignment.mutate({
        assignmentId,
      });
    },
    onSuccess: () => {
      toast.success(t("assignmentDeletedSuccess"));
      router.push(`/class/teacher/${classId}/assignments`);
    },
  });

  const form = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      moduleId: "none",
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
        moduleId: assignment.moduleId || "none",
        description: assignment.description || "",
        dueDate: assignment.dueDate
          ? new Date(assignment.dueDate).toISOString().split("T")[0]
          : "",
        testingDuration: assignment.testingDuration || undefined,
      });

      if (assignment.assignmentContent) {
        try {
          if (assignment.assignmentType === "flashcard") {
            const content: FlashcardContent = JSON.parse(
              assignment.assignmentContent
            );
            setFlashcards(content.cards || []);
          } else {
            const content: AssignmentContent = JSON.parse(
              assignment.assignmentContent
            );
            setQuestions(content.questions || []);
          }
        } catch (error) {
          console.error("Failed to parse assignment content:", error);
          setQuestions([]);
          setFlashcards([]);
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

  // Redirect to view-statement page for written assignments (editing not allowed)
  useEffect(() => {
    if (assignmentQuery.data) {
      const assignment = assignmentQuery.data.assignments;
      if (assignment.assignmentType === "written") {
        router.replace(
          `/class/teacher/${classId}/view-statement/${assignmentId}`
        );
      }
    }
  }, [assignmentQuery.data, router, assignmentId, classId]);

  // Flashcard handlers
  const handleAddFlashcard = (card: Flashcard) => {
    setFlashcards((prev) => [...prev, card]);
  };

  const handleUpdateFlashcard = (updatedCard: Flashcard) => {
    setFlashcards((prev) =>
      prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
    );
  };

  const handleDeleteFlashcard = (cardId: string) => {
    setFlashcards((prev) => {
      const filtered = prev.filter((c) => c.id !== cardId);
      return filtered.map((c, index) => ({ ...c, index: index + 1 }));
    });
  };

  const handleImportFlashcards = (cards: Flashcard[]) => {
    setFlashcards((prev) => {
      const newCards = cards.map((card, index) => ({
        ...card,
        index: prev.length + index + 1,
      }));
      return [...prev, ...newCards];
    });
  };

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

  const validateFlashcards = (): boolean => {
    const errors: Record<string, boolean> = {};

    flashcards.forEach((card) => {
      const cardKey = `card-${card.id}`;

      if (!card.front.trim()) {
        errors[`${cardKey}-front`] = true;
      }

      if (!card.back.trim()) {
        errors[`${cardKey}-back`] = true;
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (formData: AssignmentForm) => {
    // Clear previous validation errors
    setFieldErrors({});

    const isFlashcardAssignment =
      assignmentQuery.data?.assignments.assignmentType === "flashcard";

    // Validate based on assignment type
    if (isFlashcardAssignment) {
      if (!validateFlashcards()) {
        return;
      }

      const flashcardContent: FlashcardContent = {
        cards: flashcards.map((c, index) => ({ ...c, index: index + 1 })),
      };

      updateAssignmentMutation.mutate({
        ...formData,
        assignmentContent: JSON.stringify(flashcardContent),
      });
    } else {
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
    }
  };

  const handleCopyAssignmentUrl = async () => {
    const url = `${window.location.origin}/do-assignment/${assignmentId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("assignmentUrlCopied"));
    } catch (error) {
      toast.error(t("failedToCopyUrl"));
    }
  };

  const handleDeleteAssignment = () => {
    if (confirm(t("confirmDeleteAssignment"))) {
      deleteAssignmentMutation.mutate();
    }
  };

  if (sessionQuery.isLoading || assignmentQuery.isLoading) {
    return <Loader />;
  }

  if (assignmentQuery.error) {
    return (
      <div className="text-center">
        <p>
          {t("errorLoadingAssignment")}: {assignmentQuery.error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          {assignmentQuery.data?.assignments.assignmentType === "flashcard" ? (
            <>
              <Layers className="h-6 w-6" />
              {tFlashcard("editFlashcard")}
            </>
          ) : (
            <>
              <FileText className="h-6 w-6" />
              {t("title")}
            </>
          )}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopyAssignmentUrl}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {t("copyAssignmentUrl")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAssignment}
            disabled={deleteAssignmentMutation.isPending}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t("deleteAssignment")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("assignmentDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("titleLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assignmentTitlePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("moduleOptional")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectModule")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t("noModule")}</SelectItem>
                        {modulesQuery.data?.map((module: any) => (
                          <SelectItem
                            key={module.moduleId}
                            value={module.moduleId}
                          >
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("descriptionOptional")}</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        content={field.value || ""}
                        onChange={field.onChange}
                        placeholder={t("assignmentDescriptionPlaceholder")}
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
                    <FormLabel>{t("dueDateOptional")}</FormLabel>
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
                    <FormLabel>{t("testingDurationOptional")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t("testingDurationPlaceholder")}
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

      {/* Quiz Questions Card */}
      {assignmentQuery.data?.assignments.assignmentType === "quiz" && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t("questionsCount")} ({questions.length})
            </CardTitle>
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
      )}

      {/* Flashcard Cards */}
      {assignmentQuery.data?.assignments.assignmentType === "flashcard" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                {tFlashcard("cardsCount")} ({flashcards.length})
              </CardTitle>
              <BulkImportDialog
                onImport={handleImportFlashcards}
                startIndex={flashcards.length + 1}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {flashcards.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {tFlashcard("noCards")}
              </p>
            ) : (
              flashcards.map((card) => (
                <FlashcardEditor
                  key={card.id}
                  card={card}
                  onUpdate={handleUpdateFlashcard}
                  onDelete={() => handleDeleteFlashcard(card.id)}
                  fieldErrors={fieldErrors}
                />
              ))
            )}
            <AddFlashcard
              onAdd={handleAddFlashcard}
              nextIndex={flashcards.length + 1}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={form.handleSubmit(handleSave)}
          disabled={updateAssignmentMutation.isPending}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {updateAssignmentMutation.isPending
            ? t("saving")
            : t("saveAssignment")}
        </Button>
      </div>
    </div>
  );
}
