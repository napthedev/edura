"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import {
  Users,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  School,
} from "lucide-react";
import { SendWeeklyReportDialog } from "@/components/class/send-weekly-report-dialog";

export default function StudentsPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("ClassPage");

  const studentsQuery = useQuery({
    queryKey: ["class-students", classId],
    queryFn: () => trpcClient.education.getClassStudents.query({ classId }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6" />
          {t("students")}
        </h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {t("studentsCount")} ({studentsQuery.data?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentsQuery.isLoading ? (
            <Loader />
          ) : studentsQuery.data && studentsQuery.data.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">
                      {t("studentName")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("email")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("gradeLevel")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("schoolName")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("address")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("dateOfBirth")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("enrolledDate")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsQuery.data.map(
                    (student: {
                      userId: string;
                      name: string;
                      email: string;
                      enrolledAt: string;
                      dateOfBirth: string | null;
                      address: string | null;
                      grade: string | null;
                      schoolName: string | null;
                    }) => (
                      <TableRow
                        key={student.userId}
                        className="hover:bg-slate-50"
                      >
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-muted-foreground/60" />
                            {student.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {student.grade ? (
                            <div className="flex items-center gap-1">
                              <GraduationCap className="h-4 w-4 text-muted-foreground/60" />
                              {student.grade}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.schoolName ? (
                            <div className="flex items-center gap-1">
                              <School className="h-4 w-4 text-muted-foreground/60" />
                              {student.schoolName}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.address ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-muted-foreground/60" />
                              {student.address}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.dateOfBirth ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground/60" />
                              {new Date(
                                student.dateOfBirth
                              ).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {t("enrolled")}{" "}
                            {new Date(student.enrolledAt).toLocaleDateString()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <SendWeeklyReportDialog
                            studentId={student.userId}
                            studentName={student.name}
                            classId={classId}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noStudentsEnrolled")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
