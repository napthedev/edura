"use client";
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
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Mail,
  Calendar,
  BookOpen,
  MapPin,
  GraduationCap,
  School,
} from "lucide-react";

export default function TeacherStudentsClient() {
  const t = useTranslations("TeacherStudents");

  const studentsQuery = useQuery({
    queryKey: ["teacher-students"],
    queryFn: () => trpcClient.education.getTeacherStudents.query(),
  });

  // Group students by userId to handle multiple class enrollments
  const studentsMap = new Map<
    string,
    {
      userId: string;
      name: string;
      email: string;
      dateOfBirth: string | null;
      address: string | null;
      grade: string | null;
      schoolName: string | null;
      classes: Array<{
        classId: string;
        className: string;
        classCode: string;
        enrolledAt: string;
      }>;
      firstEnrolledAt: string;
    }
  >();

  if (studentsQuery.data) {
    studentsQuery.data.forEach((enrollment: any) => {
      if (!studentsMap.has(enrollment.userId)) {
        studentsMap.set(enrollment.userId, {
          userId: enrollment.userId,
          name: enrollment.name,
          email: enrollment.email,
          dateOfBirth: enrollment.dateOfBirth,
          address: enrollment.address,
          grade: enrollment.grade,
          schoolName: enrollment.schoolName,
          classes: [],
          firstEnrolledAt: enrollment.enrolledAt,
        });
      }

      const student = studentsMap.get(enrollment.userId)!;
      student.classes.push({
        classId: enrollment.classId,
        className: enrollment.className,
        classCode: enrollment.classCode,
        enrolledAt: enrollment.enrolledAt,
      });

      // Update firstEnrolledAt if this enrollment is earlier
      if (new Date(enrollment.enrolledAt) < new Date(student.firstEnrolledAt)) {
        student.firstEnrolledAt = enrollment.enrolledAt;
      }
    });
  }

  const uniqueStudents = Array.from(studentsMap.values());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalStudents")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueStudents.length}</div>
            <p className="text-xs text-muted-foreground">
              {t("uniqueStudents")}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalEnrollments")}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentsQuery.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("enrollmentsAcrossClasses")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle>{t("studentsList")}</CardTitle>
        </CardHeader>
        <CardContent>
          {studentsQuery.isLoading ? (
            <Loader />
          ) : uniqueStudents.length > 0 ? (
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">{t("name")}</TableHead>
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
                      {t("classes")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("joinedDate")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueStudents.map((student) => (
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
                            {new Date(student.dateOfBirth).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {student.classes.map((cls) => (
                            <Badge
                              key={cls.classId}
                              variant="secondary"
                              className="text-xs"
                            >
                              {cls.className}
                              <span className="ml-1 font-mono text-xs opacity-70">
                                ({cls.classCode})
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground/60" />
                          {new Date(
                            student.firstEnrolledAt
                          ).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noStudents")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
