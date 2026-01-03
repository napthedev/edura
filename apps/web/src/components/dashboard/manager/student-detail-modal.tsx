"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Plus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
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

  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const allClassesQuery = useQuery({
    queryKey: ["all-classes"],
    queryFn: () => trpcClient.education.getAllClasses.query(),
    enabled: open,
  });

  const queryClient = useQueryClient();
  const enrollMutation = useMutation({
    mutationFn: (data: { studentId: string; classId: string }) =>
      trpcClient.education.manuallyAddStudentToClass.mutate(data),
    onSuccess: () => {
      toast.success(t("enrollSuccess"));
      queryClient.invalidateQueries({
        queryKey: ["student-details", studentId],
      });
      setSelectedClassId("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEnroll = () => {
    if (!selectedClassId) return;
    enrollMutation.mutate({ studentId, classId: selectedClassId });
  };

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

            {/* Add to Class Section */}
            <div className="rounded-lg border p-4 bg-slate-50/50">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t("addToClass")}
              </h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={selectedClassId}
                    onValueChange={setSelectedClassId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectClass")} />
                    </SelectTrigger>
                    <SelectContent>
                      {allClassesQuery.data?.map((c) => (
                        <SelectItem key={c.classId} value={c.classId}>
                          {c.className} ({c.classCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleEnroll}
                  disabled={!selectedClassId || enrollMutation.isPending}
                >
                  {enrollMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("enroll")}
                </Button>
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
