"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpcClient } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import {
  CalendarClock,
  BookOpen,
  FileText,
  ExternalLink,
  Eye,
} from "lucide-react";

type FilterType = "all" | "upcoming" | "overdue" | "submitted";

export default function DeadlinesClient() {
  const t = useTranslations("DeadlineManagement");
  const [filter, setFilter] = useState<FilterType>("all");

  const assignmentsQuery = useQuery({
    queryKey: ["studentAssignments"],
    queryFn: () => trpcClient.education.getStudentAssignments.query(),
  });

  const isOverdue = (dueDate: Date | string | null | undefined) => {
    if (!dueDate) return false;
    const date = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
    return date < new Date();
  };

  const getStatus = (
    submitted: boolean,
    dueDate: Date | string | null | undefined
  ): "submitted" | "pending" | "overdue" => {
    if (submitted) return "submitted";
    if (isOverdue(dueDate)) return "overdue";
    return "pending";
  };

  const getStatusBadge = (status: "submitted" | "pending" | "overdue") => {
    switch (status) {
      case "submitted":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-700 hover:bg-green-100"
          >
            {t("status.submitted")}
          </Badge>
        );
      case "overdue":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-700 hover:bg-red-100"
          >
            {t("status.overdue")}
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-slate-100 text-slate-700 hover:bg-slate-100"
          >
            {t("status.pending")}
          </Badge>
        );
    }
  };

  // Filter to only show assignments with due dates
  const assignmentsWithDeadlines =
    assignmentsQuery.data?.filter((a) => a.dueDate) ?? [];

  // Apply client-side filter
  const filteredAssignments = assignmentsWithDeadlines.filter((assignment) => {
    const status = getStatus(assignment.submitted, assignment.dueDate);

    switch (filter) {
      case "upcoming":
        return status === "pending";
      case "overdue":
        return status === "overdue";
      case "submitted":
        return status === "submitted";
      default:
        return true;
    }
  });

  // Sort by due date (earliest first)
  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return dateA - dateB;
  });

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: "all", label: t("filters.all") },
    { key: "upcoming", label: t("filters.upcoming") },
    { key: "overdue", label: t("filters.overdue") },
    { key: "submitted", label: t("filters.submitted") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarClock className="size-6 text-primary" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("description")}
          </p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <Button
            key={btn.key}
            variant={filter === btn.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(btn.key)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {assignmentsQuery.isLoading ? (
        <Loader />
      ) : sortedAssignments.length > 0 ? (
        <Card className="shadow-sm border-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="size-5 text-slate-600" />
              {t("title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-lg border overflow-hidden mx-6 mb-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <BookOpen className="size-4 text-muted-foreground" />
                        {t("columns.class")}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("columns.task")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("columns.type")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("columns.status")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="size-4 text-muted-foreground" />
                        {t("columns.dueDate")}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("columns.action")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAssignments.map((assignment) => {
                    const status = getStatus(
                      assignment.submitted,
                      assignment.dueDate
                    );
                    return (
                      <TableRow
                        key={assignment.assignmentId}
                        className="hover:bg-slate-50"
                      >
                        <TableCell className="font-medium">
                          {assignment.className}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {assignment.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t("types.assignment")}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {assignment.dueDate
                            ? new Date(assignment.dueDate).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : t("noDueDate")}
                        </TableCell>
                        <TableCell>
                          {assignment.submitted ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-primary hover:text-blue-700"
                            >
                              <Link
                                href={`/view-submission/${assignment.assignmentId}`}
                              >
                                <Eye className="size-4 mr-1" />
                                {t("actions.viewSubmission")}
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-primary hover:text-blue-700"
                            >
                              <Link
                                href={`/do-assignment/${assignment.assignmentId}`}
                              >
                                <ExternalLink className="size-4 mr-1" />
                                {t("actions.takeAssignment")}
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16">
          <CalendarClock className="size-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">{t("noDeadlines")}</p>
        </div>
      )}
    </div>
  );
}
