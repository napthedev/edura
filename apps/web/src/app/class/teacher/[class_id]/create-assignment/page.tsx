"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Brain, PenLine, Upload, Layers } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { GenerateQuestions } from "@/components/assignment/generate-questions";
import { FileUploader } from "@/components/assignment/file-uploader";
import { RichTextEditor } from "@/components/assignment/rich-text-editor";
import { AssignmentTypeGuide } from "@/components/assignment/assignment-type-guide";
import { FlashcardEditor } from "@/components/assignment/flashcard-editor";
import { AddFlashcard } from "@/components/assignment/add-flashcard";
import { BulkImportDialog } from "@/components/assignment/bulk-import-dialog";
import type {
  Question,
  AssignmentType,
  FileAttachment,
  WrittenAssignmentContent,
  Flashcard,
  FlashcardContent,
} from "@/lib/assignment-types";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";

type SessionUser = {
  id: string;
  role: string;
  name: string;
  email: string;
  image?: string | null;
};

const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  moduleId: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  testingDuration: z
    .number()
    .min(1, "Testing duration must be at least 1 minute")
    .optional(),
});

type CreateAssignmentForm = z.infer<typeof createAssignmentSchema>;

export default function CreateAssignmentPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const router = useRouter();
  const [assignmentType, setAssignmentType] = useState<AssignmentType | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [showAIGeneration, setShowAIGeneration] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  // Written assignment state
  const [writtenInstructions, setWrittenInstructions] = useState("");
  const [writtenAttachments, setWrittenAttachments] = useState<
    FileAttachment[]
  >([]);
  // Flashcard state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const t = useTranslations("CreateAssignment");
  const tWritten = useTranslations("WrittenAssignment");
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

  const modulesQuery = useQuery({
    queryKey: [["education", "getClassModules"], { classId }],
    queryFn: async () => {
      return await trpcClient.education.getClassModules.query({ classId });
    },
  });

  const form = useForm<CreateAssignmentForm>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: undefined,
      testingDuration: undefined,
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (
      data: CreateAssignmentForm & {
        assignmentContent?: string;
        assignmentType?: AssignmentType;
      }
    ) => {
      return await trpcClient.education.createAssignment.mutate({
        classId,
        moduleId: data.moduleId === "none" ? undefined : data.moduleId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
        testingDuration:
          data.assignmentType === "quiz" ? data.testingDuration : undefined,
        assignmentType: data.assignmentType || "quiz",
        assignmentContent: data.assignmentContent,
      });
    },
    onSuccess: (data) => {
      if (data) {
        router.push(
          `/class/teacher/${classId}/edit-assignment/${data.assignmentId}`
        );
      }
    },
  });

  if (sessionQuery.isLoading) {
    return <Loader />;
  }

  if (!sessionQuery.data?.user) {
    router.push("/login");
    return null;
  }

  if ((sessionQuery.data?.user as unknown as SessionUser).role === "student") {
    router.push("/dashboard");
    return null;
  }

  const handleManualInput = () => {
    setAssignmentType("quiz");
    setShowForm(true);
    setShowAIGeneration(false);
  };

  const handleAIGeneration = () => {
    setAssignmentType("quiz");
    setShowAIGeneration(true);
    setShowForm(false);
  };

  const handleWrittenAssignment = () => {
    setAssignmentType("written");
    setShowForm(true);
    setShowAIGeneration(false);
    setGeneratedQuestions([]);
  };

  const handleFlashcardAssignment = () => {
    setAssignmentType("flashcard");
    setShowForm(true);
    setShowAIGeneration(false);
    setGeneratedQuestions([]);
  };

  const handleQuestionsGenerated = (questions: Question[]) => {
    setGeneratedQuestions(questions);
    setShowAIGeneration(false);
    setShowForm(true);
  };

  const handleCancelAIGeneration = () => {
    setShowAIGeneration(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setShowAIGeneration(false);
    setAssignmentType(null);
    setGeneratedQuestions([]);
    setWrittenInstructions("");
    setWrittenAttachments([]);
    setFlashcards([]);
    form.reset();
  };

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

  const onSubmit = (data: CreateAssignmentForm) => {
    let assignmentContent: string | undefined;

    if (assignmentType === "written") {
      const content: WrittenAssignmentContent = {
        instructions: writtenInstructions,
        attachments: writtenAttachments,
      };
      assignmentContent = JSON.stringify(content);
    } else if (assignmentType === "flashcard") {
      const content: FlashcardContent = {
        cards: flashcards.map((c, index) => ({ ...c, index: index + 1 })),
      };
      assignmentContent = JSON.stringify(content);
    } else if (generatedQuestions.length > 0) {
      assignmentContent = JSON.stringify({ questions: generatedQuestions });
    }

    createAssignmentMutation.mutate({
      ...data,
      assignmentType: assignmentType || "quiz",
      assignmentContent,
    });
  };

  return (
    <div className="space-y-6 overflow-hidden">
      <div className="flex items-center gap-4 min-w-0">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 truncate">
          <FileText className="h-6 w-6" />
          {t("title")}
        </h2>
      </div>

      {!assignmentType && (
        <Card>
          <CardHeader>
            <CardTitle>{t("chooseAssignmentType")}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Quiz Assignment Options */}
              <div className="space-y-3 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("quizAssignment")}
                </p>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4 overflow-hidden"
                  onClick={handleManualInput}
                >
                  <PenLine className="w-5 h-5 mr-3 shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="font-medium truncate">
                      {t("manuallyInputQuestions")}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {t("manualInputDescription")}
                    </p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4 overflow-hidden"
                  onClick={handleAIGeneration}
                >
                  <Brain className="w-5 h-5 mr-3 shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="font-medium truncate">
                      {t("generateQuestionsAI")}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {t("aiGenerationDescription")}
                    </p>
                  </div>
                </Button>
              </div>

              {/* Written Assignment Option */}
              <div className="space-y-3 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  {tWritten("writtenAssignment")}
                </p>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4 overflow-hidden"
                  onClick={handleWrittenAssignment}
                >
                  <Upload className="w-5 h-5 mr-3 shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="font-medium truncate">
                      {tWritten("writtenAssignment")}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {tWritten("writtenAssignmentDescription")}
                    </p>
                  </div>
                </Button>
              </div>

              {/* Flashcard Assignment Option */}
              <div className="space-y-3 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  {tFlashcard("flashcardAssignment")}
                </p>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4 overflow-hidden"
                  onClick={handleFlashcardAssignment}
                >
                  <Layers className="w-5 h-5 mr-3 shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="font-medium truncate">
                      {tFlashcard("flashcardAssignment")}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {tFlashcard("flashcardDescription")}
                    </p>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!assignmentType && <AssignmentTypeGuide />}

      {showAIGeneration && (
        <GenerateQuestions
          onCancel={handleCancelAIGeneration}
          classId={classId}
        />
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {assignmentType === "written"
                ? tWritten("createWrittenAssignment")
                : assignmentType === "flashcard"
                ? tFlashcard("createFlashcard")
                : t("createAssignment")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                {generatedQuestions.length > 0 && (
                  <div className="p-3 bg-primary/10 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                      {generatedQuestions.length} {t("questionsGeneratedNote")}
                    </p>
                  </div>
                )}
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
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("dueDateOptional")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>{t("pickDate")}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setDate(date);
                            }}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Written assignment specific fields */}
                {assignmentType === "written" && (
                  <>
                    <div className="space-y-2">
                      <Label>{tWritten("instructions")}</Label>
                      <RichTextEditor
                        content={writtenInstructions}
                        onChange={setWrittenInstructions}
                        placeholder={tWritten("instructionsPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{tWritten("attachments")}</Label>
                      <FileUploader
                        uploadedFiles={writtenAttachments}
                        onFilesChange={setWrittenAttachments}
                        uploadEndpoint="/api/upload/assignment"
                      />
                    </div>
                  </>
                )}

                {/* Quiz specific fields */}
                {assignmentType === "quiz" && (
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
                )}

                {/* Flashcard specific fields */}
                {assignmentType === "flashcard" && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
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

                <FormField
                  control={form.control}
                  name="moduleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("moduleOptional")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                {generatedQuestions.length > 0 && assignmentType === "quiz" && (
                  <div className="p-3 bg-primary/10 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                      {generatedQuestions.length} {t("questionsGeneratedNote")}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createAssignmentMutation.isPending}
                  >
                    {createAssignmentMutation.isPending
                      ? t("creating")
                      : t("createAssignmentButton")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
