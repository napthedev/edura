"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpcClient } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import {
  FileText,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function StudentAssignmentsClient() {
  const t = useTranslations("StudentDashboard");
  const assignmentsQuery = useQuery({
    queryKey: ["studentAssignments"],
    queryFn: () => trpcClient.education.getStudentAssignments.query(),
  });

  const isOverdue = (dueDate: Date | string | null | undefined) => {
    if (!dueDate) return false;
    const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
    return date < new Date();
  };

  const getStatusBadge = (submitted: boolean, overdue: boolean) => {
    if (submitted) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-medium">Submitted</span>
        </div>
      );
    }
    if (overdue) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <Clock className="h-4 w-4" />
          <span className="text-xs font-medium">Overdue</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-slate-500">
        <Clock className="h-4 w-4" />
        <span className="text-xs font-medium">Pending</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          All Assignments
        </h1>
      </div>

      {assignmentsQuery.isLoading ? (
        <Loader />
      ) : assignmentsQuery.data && assignmentsQuery.data.length > 0 ? (
        <div className="space-y-4">
          {assignmentsQuery.data.map((assignment) => {
            const overdue = isOverdue(assignment.dueDate);
            return (
              <Link
                className="block group"
                href={`/do-assignment/${assignment.assignmentId}`}
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
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(assignment.submitted, overdue)}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-slate-400">
                        Posted:{" "}
                        {new Date(assignment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            No assignments yet. Assignments from your classes will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
