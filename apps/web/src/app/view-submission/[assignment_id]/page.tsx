"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/loader";
import type { AssignmentContent, Question } from "@/lib/assignment-types";
import { MathJaxProvider, LaTeXRenderer } from "@/components/latex-renderer";

export default function ViewSubmissionPage() {
  const params = useParams();
  const assignmentId = params.assignment_id as string;
  const router = useRouter();

  const { data: session, isPending: sessionPending } = authClient.useSession();

  const submissionQuery = useQuery({
    queryKey: ["student-submission", assignmentId],
    queryFn: () =>
      trpcClient.education.getStudentSubmission.query({ assignmentId }),
    enabled: !!session && (session.user as any).role === "student",
  });

  // Redirect if not logged in
  if (!sessionPending && !session) {
    router.push("/login");
    return null;
  }

  // Redirect if not a student
  if (!sessionPending && session && (session.user as any).role !== "student") {
    router.push("/dashboard");
    return null;
  }

  if (sessionPending || submissionQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <Loader />
        </div>
      </div>
    );
  }

  if (submissionQuery.error) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500">
            {submissionQuery.error.message}
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

  const { submission, assignment, class: classData } = submissionQuery.data!;

  let assignmentContent: AssignmentContent | null = null;
  let submissionAnswers: Record<string, string> = {};

  try {
    assignmentContent = assignment.assignmentContent
      ? JSON.parse(assignment.assignmentContent)
      : null;
    submissionAnswers = submission.submissionContent
      ? JSON.parse(submission.submissionContent)
      : {};
  } catch (error) {
    console.error("Failed to parse content:", error);
  }

  return (
    <MathJaxProvider>
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Submission Header */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{assignment.title}</CardTitle>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Class: {classData.className}</p>
                  <p>
                    Submitted:{" "}
                    {new Date(submission.submittedAt).toLocaleString()}
                  </p>
                  {assignment.dueDate && (
                    <p>Due: {new Date(assignment.dueDate).toLocaleString()}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <Badge
                    variant="secondary"
                    className="text-green-700 bg-green-100"
                  >
                    ✅ Submitted
                  </Badge>
                  {submission.grade !== null ? (
                    <Badge
                      variant="outline"
                      className="text-blue-700 border-blue-300"
                    >
                      Grade: {submission.grade}/100
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-gray-600 border-gray-300"
                    >
                      Not graded yet
                    </Badge>
                  )}
                </div>
              </CardHeader>
              {assignment.description && (
                <CardContent>
                  <p>{assignment.description}</p>
                </CardContent>
              )}
            </Card>

            {/* Submission Content */}
            <Card>
              <CardHeader>
                <CardTitle>Your Submission</CardTitle>
              </CardHeader>
              <CardContent>
                {assignmentContent && assignmentContent.questions.length > 0 ? (
                  <div className="space-y-6">
                    {assignmentContent.questions.map((question: Question) => (
                      <SubmittedQuestionCard
                        key={question.id}
                        question={question}
                        answer={
                          submissionAnswers[question.id] || "No answer provided"
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

            {/* Back Button */}
            <div className="flex justify-start">
              <Button onClick={() => router.back()} variant="outline">
                Back to Class
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MathJaxProvider>
  );
}

function SubmittedQuestionCard({
  question,
  answer,
}: {
  question: Question;
  answer: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Question {question.index}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-medium">
            <LaTeXRenderer>{question.statement}</LaTeXRenderer>
          </p>
        </div>

        {/* Display Answer based on type */}
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Your Answer:
          </p>
          {question.type === "simple" && (
            <p className="whitespace-pre-wrap">{answer}</p>
          )}

          {question.type === "multiple" && (
            <p className="font-medium">
              {answer ? (
                <>
                  {answer.toUpperCase()}.{" "}
                  <LaTeXRenderer>
                    {(question as any).options?.[answer.charCodeAt(0) - 97] ||
                      answer}
                  </LaTeXRenderer>
                </>
              ) : (
                "No answer"
              )}
            </p>
          )}

          {question.type === "truefalse" && (
            <p className="font-medium">
              {answer === "true"
                ? "True"
                : answer === "false"
                ? "False"
                : "No answer"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
