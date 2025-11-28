"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Edit, Trash2, BarChart3, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import AssignmentMetricsDialog from "@/components/assignment/assignment-metrics-dialog";

export default function AssignmentsPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const router = useRouter();
  const t = useTranslations("ClassPage");
  const [metricsDialogOpen, setMetricsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const studentsQuery = useQuery({
    queryKey: ["class-students", classId],
    queryFn: () => trpcClient.education.getClassStudents.query({ classId }),
  });

  const assignmentsQuery = useQuery({
    queryKey: ["class-assignments", classId],
    queryFn: () => trpcClient.education.getClassAssignments.query({ classId }),
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      trpcClient.education.deleteAssignment.mutate({ assignmentId }),
    onSuccess: () => {
      toast.success("Assignment deleted successfully");
      assignmentsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete assignment: ${error.message}`);
    },
  });

  const copyAssignmentUrl = (assignmentId: string) => {
    const url = `${window.location.origin}/do-assignment/${assignmentId}`;
    navigator.clipboard.writeText(url);
    toast.success("Assignment URL copied to clipboard");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" />
          {t("assignments")}
        </h2>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>
            {t("assignmentsCount")} ({assignmentsQuery.data?.length || 0})
          </CardTitle>
          <Button
            onClick={() =>
              router.push(`/class/teacher/${classId}/create-assignment`)
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("createAssignment")}
          </Button>
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
                  submissionCount: number;
                }) => (
                  <div
                    key={assignment.assignmentId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {assignment.description}
                        </p>
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
                        <span>
                          {assignment.submissionCount}/
                          {studentsQuery.data?.length || 0}{" "}
                          {t("studentsSubmitted")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyAssignmentUrl(assignment.assignmentId)
                        }
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {t("copyUrl")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment({
                            id: assignment.assignmentId,
                            title: assignment.title,
                          });
                          setMetricsDialogOpen(true);
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        {t("viewMetrics")}
                      </Button>
                      <Link
                        href={`/class/teacher/${classId}/edit-assignment/${assignment.assignmentId}`}
                      >
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          {t("edit")}
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("deleteAssignment")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("deleteAssignmentDescription")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteAssignmentMutation.mutate(
                                  assignment.assignmentId
                                )
                              }
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              {deleteAssignmentMutation.isPending
                                ? t("deleting")
                                : t("deleteButton")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noAssignmentsCreated")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAssignment && (
        <AssignmentMetricsDialog
          assignmentId={selectedAssignment.id}
          assignmentTitle={selectedAssignment.title}
          isOpen={metricsDialogOpen}
          onClose={() => {
            setMetricsDialogOpen(false);
            setSelectedAssignment(null);
          }}
        />
      )}
    </div>
  );
}
