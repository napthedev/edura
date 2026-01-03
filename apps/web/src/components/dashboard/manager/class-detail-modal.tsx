"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, BookOpen, User, Users } from "lucide-react";
import Loader from "@/components/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClassDetailModalProps {
  classId: string;
  trigger?: React.ReactNode;
}

export function ClassDetailModal({ classId, trigger }: ClassDetailModalProps) {
  const t = useTranslations("ClassDetailModal");
  const [open, setOpen] = useState(false);

  const classDetailQuery = useQuery({
    queryKey: ["class-detail", classId],
    queryFn: () => trpcClient.education.getClassDetailById.query({ classId }),
    enabled: open,
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        {classDetailQuery.isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader />
          </div>
        ) : classDetailQuery.error ? (
          <div className="text-center py-8 text-red-600">
            {classDetailQuery.error.message}
          </div>
        ) : classDetailQuery.data ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {t("classInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Class Name:</dt>
                    <dd className="font-medium">
                      {classDetailQuery.data.className}
                    </dd>
                    <dt className="text-muted-foreground">Subject:</dt>
                    <dd className="font-medium">
                      {classDetailQuery.data.subject || "-"}
                    </dd>
                    <dt className="text-muted-foreground">Code:</dt>
                    <dd className="font-medium font-mono">
                      {classDetailQuery.data.classCode}
                    </dd>
                    <dt className="text-muted-foreground">Schedule:</dt>
                    <dd className="font-medium">
                      {classDetailQuery.data.schedule || "-"}
                    </dd>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("teacherInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Name:</dt>
                    <dd className="font-medium">
                      {classDetailQuery.data.teacherName}
                    </dd>
                    <dt className="text-muted-foreground">Email:</dt>
                    <dd className="font-medium truncate">
                      {classDetailQuery.data.teacherEmail}
                    </dd>
                  </dl>
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("students")}
                </h3>
                <span className="text-sm text-muted-foreground bg-slate-100 px-2 py-1 rounded-full">
                  {t("studentCount")}: {classDetailQuery.data.studentCount}
                </span>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("studentName")}</TableHead>
                      <TableHead>{t("email")}</TableHead>
                      <TableHead>{t("enrolledDate")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classDetailQuery.data.students.length > 0 ? (
                      classDetailQuery.data.students.map((student) => (
                        <TableRow key={student.userId}>
                          <TableCell className="font-medium">
                            {student.name}
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            {new Date(student.enrolledAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-6 text-muted-foreground"
                        >
                          {t("noStudents")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
