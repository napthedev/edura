"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Brain, PenLine, Upload } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
import type {
  Question,
  AssignmentType,
  FileAttachment,
  WrittenAssignmentContent,
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
  const t = useTranslations("CreateAssignment");
  const tWritten = useTranslations("WrittenAssignment");

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
    form.reset();
  };

  const onSubmit = (data: CreateAssignmentForm) => {
    let assignmentContent: string | undefined;

    if (assignmentType === "written") {
      const content: WrittenAssignmentContent = {
        instructions: writtenInstructions,
        attachments: writtenAttachments,
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/class/teacher/${classId}/assignments`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("back")}
        </Button>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>

      {!assignmentType && (
        <Card>
          <CardHeader>
            <CardTitle>{t("chooseAssignmentType")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Quiz Assignment Options */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("quizAssignment")}
                </p>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                  onClick={handleManualInput}
                >
                  <PenLine className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">{t("manuallyInputQuestions")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("manualInputDescription")}
                    </p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                  onClick={handleAIGeneration}
                >
                  <Brain className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">{t("generateQuestionsAI")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("aiGenerationDescription")}
                    </p>
                  </div>
                </Button>
              </div>

              {/* Written Assignment Option */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {tWritten("writtenAssignment")}
                </p>
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                  onClick={handleWrittenAssignment}
                >
                  <Upload className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">
                      {tWritten("writtenAssignment")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tWritten("writtenAssignmentDescription")}
                    </p>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
