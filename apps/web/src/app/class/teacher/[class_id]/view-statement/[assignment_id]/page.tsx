"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/loader";
import type { WrittenAssignmentContent } from "@/lib/assignment-types";
import { useTranslations } from "next-intl";
import { ArrowLeft, FileText, Paperclip, Calendar, Clock } from "lucide-react";
import { FilePreview } from "@/components/assignment/file-preview";
import { RichTextDisplay } from "@/components/assignment/rich-text-editor";

type SessionUser = {
  id: string;
  role: string;
  name: string;
  email: string;
  image?: string | null;
};

export default function ViewStatementPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const assignmentId = params.assignment_id as string;
  const router = useRouter();
  const t = useTranslations("ViewStatement");
  const tWritten = useTranslations("WrittenAssignment");

  const { data: session, isPending: sessionPending } = authClient.useSession();

  const assignmentQuery = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => trpcClient.education.getAssignment.query({ assignmentId }),
    enabled: !!session && (session.user as any)?.role === "teacher",
  });

  // Redirect if not logged in
  if (!sessionPending && !session) {
    router.push("/login");
    return null;
  }

  // Redirect if not a teacher
  if (
    !sessionPending &&
    session &&
    (session.user as unknown as SessionUser).role !== "teacher"
  ) {
    router.push("/dashboard");
    return null;
  }

  if (sessionPending || assignmentQuery.isLoading) {
    return <Loader />;
  }

  if (assignmentQuery.error) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/class/teacher/${classId}/assignments`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("back")}
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-500">
              {t("errorLoading")}: {assignmentQuery.error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assignment = assignmentQuery.data?.assignments;
  const classData = assignmentQuery.data?.classes;

  if (!assignment) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/class/teacher/${classId}/assignments`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("back")}
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {t("assignmentNotFound")}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse written assignment content
  let writtenContent: WrittenAssignmentContent | null = null;
  try {
    if (assignment.assignmentContent) {
      writtenContent = JSON.parse(
        assignment.assignmentContent
      ) as WrittenAssignmentContent;
    }
  } catch (error) {
    console.error("Failed to parse assignment content:", error);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          variant="outline"
          onClick={() => router.push(`/class/teacher/${classId}/assignments`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("back")}
        </Button>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>

      {/* Assignment Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6" />
                {assignment.title}
              </CardTitle>
              {classData && (
                <p className="text-sm text-muted-foreground">
                  {t("class")}: {classData.className}
                </p>
              )}
            </div>
            <Badge variant="secondary">{tWritten("writtenAssignment")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignment.description && (
            <div>
              <p className="text-sm font-medium mb-1">{t("description")}</p>
              <p className="text-muted-foreground">{assignment.description}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {t("created")}:{" "}
                {new Date(assignment.createdAt).toLocaleDateString()}
              </span>
            </div>
            {assignment.dueDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {t("due")}:{" "}
                  {new Date(assignment.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      {writtenContent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {tWritten("instructions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {writtenContent.instructions ? (
              <RichTextDisplay content={writtenContent.instructions} />
            ) : (
              <p className="text-muted-foreground italic">
                {t("noInstructions")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attachments Card */}
      {writtenContent &&
        writtenContent.attachments &&
        writtenContent.attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                {tWritten("attachments")} ({writtenContent.attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FilePreview files={writtenContent.attachments} />
            </CardContent>
          </Card>
        )}

      {/* No content message */}
      {!writtenContent && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {t("noContent")}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
