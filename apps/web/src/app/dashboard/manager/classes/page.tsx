"use client";

import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useTranslations } from "next-intl";
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
import { BookOpen, Users } from "lucide-react";
import { ClassDetailModal } from "@/components/dashboard/manager/class-detail-modal";

export default function ManagerClassesPage() {
  const t = useTranslations("ManagerClasses");

  const classesQuery = useQuery({
    queryKey: ["all-classes-manager"],
    queryFn: () => trpcClient.education.getAllClasses.query(),
  });

  const totalClasses = classesQuery.data?.length || 0;
  const totalStudents =
    classesQuery.data?.reduce(
      (acc, curr) => acc + (curr.studentCount || 0),
      0
    ) || 0;
  const activeClasses = totalClasses; // Assuming all returned are active for now, or filter if needed

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalClasses")}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              {t("activeClasses")}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalStudents")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {t("enrolledStudents")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Classes List */}
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("classesList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classesQuery.isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader />
            </div>
          ) : classesQuery.data && classesQuery.data.length > 0 ? (
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[100px]">
                      {t("viewDetail")}
                    </TableHead>
                    <TableHead>{t("className")}</TableHead>
                    <TableHead>{t("code")}</TableHead>
                    <TableHead>{t("subject")}</TableHead>
                    <TableHead>{t("teacher")}</TableHead>
                    <TableHead>{t("studentCount")}</TableHead>
                    <TableHead>{t("createdDate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classesQuery.data.map((cls) => (
                    <TableRow key={cls.classId}>
                      <TableCell>
                        <ClassDetailModal classId={cls.classId} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {cls.className}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {cls.classCode}
                      </TableCell>
                      <TableCell>{cls.subject || "-"}</TableCell>
                      <TableCell>{cls.teacherName}</TableCell>
                      <TableCell>{cls.studentCount}</TableCell>
                      <TableCell>
                        {new Date(cls.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noClasses")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
