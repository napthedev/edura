"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpcClient } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { FileText, Calendar, BookOpen } from "lucide-react";

export default function TeacherAssignmentsClient() {
  const t = useTranslations("TeacherDashboard");
  const ta = useTranslations("TeacherAssignments");
  const assignmentsQuery = useQuery({
    queryKey: ["teacherAssignments"],
    queryFn: () => trpcClient.education.getTeacherAssignments.query(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("yourAssignments")}
        </h1>
      </div>

      {assignmentsQuery.isLoading ? (
        <Loader />
      ) : assignmentsQuery.data && assignmentsQuery.data.length > 0 ? (
        <div className="space-y-4">
          {assignmentsQuery.data.map((assignment) => (
            <Link
              className="block group"
              href={`/class/teacher/${assignment.classId}/assignments`}
              key={assignment.assignmentId}
            >
              <Card className="shadow-sm border-none hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {assignment.title}
                        </h3>
                      </div>
                      {assignment.description && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{assignment.className}</span>
                        </div>
                        {assignment.dueDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(
                                assignment.dueDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>
                            {assignment.submissionCount} {ta("submissions")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-slate-400">
                      {ta("created")}:{" "}
                      {new Date(assignment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {t("noAssignmentsCreated")}
          </p>
          <Link href="/dashboard/teacher/classes">
            <Button variant="outline">{ta("createAssignment")}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
