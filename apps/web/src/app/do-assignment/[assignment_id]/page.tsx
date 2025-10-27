"use client";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import type { AssignmentContent, Question } from "@/lib/assignment-types";
import Loader from "@/components/loader";

export default function DoAssignmentPage() {
  const params = useParams();
  const assignmentId = params.assignment_id as string;
  const router = useRouter();

  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const assignmentQuery = useQuery({
    queryKey: ["student-assignment", assignmentId],
    queryFn: () =>
      trpcClient.education.getStudentAssignment.query({ assignmentId }),
    enabled: !!session && (session.user as any).role === "student",
  });

  const submitMutation = useMutation({
    mutationFn: (submissionContent: string) =>
      trpcClient.education.submitAssignment.mutate({
        assignmentId,
        submissionContent,
      }),
    onSuccess: () => {
      toast.success("Assignment submitted successfully!");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(`Failed to submit assignment: ${error.message}`);
    },
  });

  // Redirect if not logged in
  if (!sessionPending && !session) {
    router.push("/login");
    return null;
  }

  // Redirect if not a student
  if (!sessionPending && session && (session.user as any).role !== "student") {
    toast.error("Access denied: Only students can take assignments");
    router.push("/dashboard");
    return null;
  }

  if (sessionPending || assignmentQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <Loader />
        </div>
      </div>
    );
  }

  if (assignmentQuery.error) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500">
            {assignmentQuery.error.message}
          </div>
          <Button
            onClick={() => router.back()}
            className="mt-4"
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { assignment, class: classData } = assignmentQuery.data!;

  let assignmentContent: AssignmentContent | null = null;
  try {
    assignmentContent = assignment.assignmentContent
      ? JSON.parse(assignment.assignmentContent)
      : null;
  } catch (error) {
    console.error("Failed to parse assignment content:", error);
  }

  const handleSubmit = () => {
    if (!assignmentContent) return;

    // Validate that all questions are answered
    const unanswered = assignmentContent.questions.filter(
      (q) => !answers[q.id]?.trim()
    );

    if (unanswered.length > 0) {
      toast.error(
        `Please answer all questions. ${unanswered.length} unanswered.`
      );
      return;
    }

    // Submit answers as JSON
    submitMutation.mutate(JSON.stringify(answers));
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Assignment Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <div className="text-sm text-muted-foreground">
                <p>Class: {classData.className}</p>
                {assignment.dueDate && (
                  <p>Due: {new Date(assignment.dueDate).toLocaleString()}</p>
                )}
                {assignment.testingDuration && (
                  <p>Duration: {assignment.testingDuration} minutes</p>
                )}
              </div>
            </CardHeader>
            {assignment.description && (
              <CardContent>
                <p>{assignment.description}</p>
              </CardContent>
            )}
          </Card>

          {/* Assignment Content */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {assignmentContent && assignmentContent.questions.length > 0 ? (
                <div className="space-y-6">
                  {assignmentContent.questions.map((question: Question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      answer={answers[question.id] || ""}
                      onAnswerChange={(answer) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: answer,
                        }))
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No questions available for this assignment.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting..." : "Submit Assignment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  answer,
  onAnswerChange,
}: {
  question: Question;
  answer: string;
  onAnswerChange: (answer: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Question {question.index}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-medium">{question.statement}</p>
        </div>

        {/* Answer Input based on type */}
        {question.type === "simple" && (
          <div>
            <textarea
              className="w-full p-2 border rounded-md"
              placeholder="Enter your answer"
              rows={3}
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
            />
          </div>
        )}

        {question.type === "multiple" && (
          <div className="space-y-2">
            {(question as any).options.map((option: string, index: number) => {
              const optionValue = String.fromCharCode(97 + index);
              return (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={optionValue}
                    checked={answer === optionValue}
                    onChange={(e) => onAnswerChange(e.target.value)}
                  />
                  <label>
                    {optionValue.toUpperCase()}. {option}
                  </label>
                </div>
              );
            })}
          </div>
        )}

        {question.type === "truefalse" && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="true"
                checked={answer === "true"}
                onChange={(e) => onAnswerChange(e.target.value)}
              />
              <label>True</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="false"
                checked={answer === "false"}
                onChange={(e) => onAnswerChange(e.target.value)}
              />
              <label>False</label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
