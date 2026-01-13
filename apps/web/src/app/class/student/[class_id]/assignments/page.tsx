"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { FileText, Eye, Pencil } from "lucide-react";
import { RichTextDisplay } from "@/components/assignment/rich-text-editor";

export default function AssignmentsPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const router = useRouter();
  const t = useTranslations("StudentClassPage");

  const assignmentsQuery = useQuery({
    queryKey: ["class-assignments", classId],
    queryFn: () =>
      trpcClient.education.getStudentAssignmentStatuses.query({ classId }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" />
          {t("assignments")}
        </h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {t("assignments")} ({assignmentsQuery.data?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignmentsQuery.isLoading ? (
            <Loader />
          ) : assignmentsQuery.data && assignmentsQuery.data.length > 0 ? (
            <div className="space-y-2">
              {assignmentsQuery.data.map(
                (assignment: {
                  assignmentId: string;
                  title: string;
                  description: string | null;
                  dueDate: string | null;
                  createdAt: string;
                  submitted: boolean;
                  submittedAt: string | null;
                }) => (
                  <div
                    key={assignment.assignmentId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{assignment.title}</h3>
                        <div className="flex items-center gap-2">
                          {assignment.submitted ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {t("submitted")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {t("notSubmitted")}
                            </span>
                          )}
                        </div>
                      </div>
                      {assignment.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          <RichTextDisplay content={assignment.description} />
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          {t("created")}:{" "}
                          {new Date(assignment.createdAt).toLocaleDateString()}
                        </span>
                        {assignment.dueDate && (
                          <span>
                            {t("due")}:{" "}
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {assignment.submitted && assignment.submittedAt && (
                          <span>
                            {t("submittedAt")}:{" "}
                            {new Date(
                              assignment.submittedAt
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button
                        size="sm"
                        onClick={() => {
                          const route = assignment.submitted
                            ? `/view-submission/${assignment.assignmentId}`
                            : `/do-assignment/${assignment.assignmentId}`;
                          router.push(route as any);
                        }}
                      >
                        {assignment.submitted ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            {t("viewSubmission")}
                          </>
                        ) : (
                          <>
                            <Pencil className="h-4 w-4 mr-2" />
                            {t("takeAssignment")}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noAssignmentsAvailable")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
