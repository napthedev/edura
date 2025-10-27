"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { GenerateQuestions } from "@/components/assignment/generate-questions";
import type { Question } from "@/lib/assignment-types";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";

type SessionUser = {
  id: string;
  role: string;
  name: string;
  email: string;
  image?: string | null;
};

const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
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
  const [showForm, setShowForm] = useState(false);
  const [showAIGeneration, setShowAIGeneration] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const t = useTranslations("CreateAssignment");

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const result = await authClient.getSession();
      if (result.error) throw result.error;
      return result.data;
    },
    staleTime: Infinity,
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
      data: CreateAssignmentForm & { assignmentContent?: string }
    ) => {
      return await trpcClient.education.createAssignment.mutate({
        classId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
        testingDuration: data.testingDuration,
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
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
          <Loader />
        </div>
      </div>
    );
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
    setShowForm(true);
    setShowAIGeneration(false);
  };

  const handleAIGeneration = () => {
    setShowAIGeneration(true);
    setShowForm(false);
  };

  const handleQuestionsGenerated = (questions: Question[]) => {
    setGeneratedQuestions(questions);
    setShowAIGeneration(false);
    setShowForm(true);
  };

  const handleCancelAIGeneration = () => {
    setShowAIGeneration(false);
  };

  const onSubmit = (data: CreateAssignmentForm) => {
    const assignmentContent =
      generatedQuestions.length > 0
        ? JSON.stringify({ questions: generatedQuestions })
        : undefined;

    createAssignmentMutation.mutate({
      ...data,
      assignmentContent,
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/class/teacher/${classId}#assignments`)
              }
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("back")}
            </Button>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("chooseAssignmentType")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleManualInput}
                >
                  {t("manuallyInputQuestions")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAIGeneration}
                >
                  {t("generateQuestionsAI")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {showAIGeneration && (
            <GenerateQuestions
              onCancel={handleCancelAIGeneration}
              classId={classId}
            />
          )}

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>{t("createAssignment")}</CardTitle>
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
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-700">
                          {generatedQuestions.length}{" "}
                          {t("questionsGeneratedNote")}
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
                            <Textarea
                              placeholder={t(
                                "assignmentDescriptionPlaceholder"
                              )}
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  setDate(date);
                                }}
                                disabled={(date) =>
                                  date < new Date() ||
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
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
                        onClick={() => {
                          setShowForm(false);
                          setGeneratedQuestions([]);
                        }}
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
      </div>
    </div>
  );
}
