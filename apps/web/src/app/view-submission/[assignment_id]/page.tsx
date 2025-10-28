"use client";
import { useParams, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const assignmentId = params.assignment_id as string;
  const submissionId = searchParams.get("submissionId");
  const router = useRouter();

  const { data: session, isPending: sessionPending } = authClient.useSession();

  const isTeacherView =
    !!submissionId && (session?.user as any)?.role === "teacher";

  const submissionQuery = useQuery({
    queryKey: isTeacherView
      ? ["teacher-submission", submissionId]
      : ["student-submission", assignmentId],
    queryFn: isTeacherView
      ? () =>
          trpcClient.education.getSubmissionById.query({
            submissionId: submissionId!,
          })
      : () => trpcClient.education.getStudentSubmission.query({ assignmentId }),
    enabled:
      !!session && (isTeacherView || (session.user as any).role === "student"),
  });

  // Redirect if not logged in
  if (!sessionPending && !session) {
    router.push("/login");
    return null;
  }

  // Redirect if not a student and not teacher viewing specific submission
  if (
    !sessionPending &&
    session &&
    !isTeacherView &&
    (session.user as any).role !== "student"
  ) {
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

  const data = submissionQuery.data!;
  const { submission, assignment, class: classData } = data;
  const student = isTeacherView ? (data as any).student : null;

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
                  {isTeacherView && student && (
                    <p>
                      Student: {student.name} ({student.email})
                    </p>
                  )}
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
                <CardTitle>
                  {isTeacherView ? "Student Submission" : "Your Submission"}
                </CardTitle>
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
  const isCorrect =
    answer.trim().toLowerCase() ===
    question.correctAnswer?.trim().toLowerCase();

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
        <div
          className={`p-4 rounded-lg ${
            isCorrect
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Answer:
          </p>
          {question.type === "simple" && (
            <p
              className={`whitespace-pre-wrap ${
                isCorrect ? "text-green-800" : "text-red-800"
              }`}
            >
              {answer}
            </p>
          )}

          {question.type === "multiple" && (
            <p
              className={`font-medium ${
                isCorrect ? "text-green-800" : "text-red-800"
              }`}
            >
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
            <p
              className={`font-medium ${
                isCorrect ? "text-green-800" : "text-red-800"
              }`}
            >
              {answer === "true"
                ? "True"
                : answer === "false"
                ? "False"
                : "No answer"}
            </p>
          )}

          {/* Show correct answer if wrong */}
          {!isCorrect && question.correctAnswer && (
            <div className="mt-2 p-2 bg-green-100 rounded border border-green-300">
              <p className="text-sm font-medium text-green-800 mb-1">
                Correct Answer:
              </p>
              {question.type === "simple" && (
                <p className="text-green-800 whitespace-pre-wrap">
                  {question.correctAnswer}
                </p>
              )}
              {question.type === "multiple" && (
                <p className="text-green-800 font-medium">
                  {question.correctAnswer.toUpperCase()}.{" "}
                  <LaTeXRenderer>
                    {(question as any).options?.[
                      question.correctAnswer.charCodeAt(0) - 97
                    ] || question.correctAnswer}
                  </LaTeXRenderer>
                </p>
              )}
              {question.type === "truefalse" && (
                <p className="text-green-800 font-medium">
                  {question.correctAnswer === "true" ? "True" : "False"}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
