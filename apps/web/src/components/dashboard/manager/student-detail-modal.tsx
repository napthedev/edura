"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Loader2,
  BookOpen,
  GraduationCap,
  DollarSign,
} from "lucide-react";
import Loader from "@/components/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StudentDetailModalProps {
  studentId: string;
  studentName: string;
  trigger?: React.ReactNode;
}

export function StudentDetailModal({
  studentId,
  studentName,
  trigger,
}: StudentDetailModalProps) {
  const t = useTranslations("StudentDetailModal");
  const [open, setOpen] = useState(false);

  const studentDetailsQuery = useQuery({
    queryKey: ["student-details", studentId],
    queryFn: () => trpcClient.education.getStudentDetails.query({ studentId }),
    enabled: open, // Only fetch when modal is open
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description", { name: studentName })}
          </DialogDescription>
        </DialogHeader>

        {studentDetailsQuery.isLoading ? (
          <div className="py-8">
            <Loader />
          </div>
        ) : studentDetailsQuery.error ? (
          <div className="text-center py-8 text-red-600">{t("error")}</div>
        ) : studentDetailsQuery.data ? (
          <div className="space-y-6">
            {/* Status and Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  {t("classCount")}
                </div>
                <div className="text-2xl font-bold">
                  {studentDetailsQuery.data.classCount}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  {t("totalTuition")}
                </div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(studentDetailsQuery.data.totalTuition)}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {t("status")}
                </div>
                <div>
                  {studentDetailsQuery.data.isActive ? (
                    <Badge variant="default" className="bg-green-600">
                      {t("active")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{t("inactive")}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Classes List */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {t("classes")}
              </h3>
              {studentDetailsQuery.data.classes.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-semibold">
                          {t("className")}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t("subject")}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t("enrolledDate")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentDetailsQuery.data.classes.map((classData) => (
                        <TableRow key={classData.classId}>
                          <TableCell className="font-medium">
                            {classData.className}
                            <div className="text-xs text-muted-foreground">
                              {classData.classCode}
                            </div>
                          </TableCell>
                          <TableCell>
                            {classData.subject || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(
                              classData.enrolledAt
                            ).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground rounded-lg border">
                  {t("noClasses")}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
