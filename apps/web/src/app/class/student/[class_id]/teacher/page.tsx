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
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { Mail, Calendar, MapPin, School } from "lucide-react";

export default function TeacherPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("StudentClassPage");

  const teacherQuery = useQuery({
    queryKey: ["class-teacher", classId],
    queryFn: () => trpcClient.education.getClassTeacher.query({ classId }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("teacher")}</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("teacherInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          {teacherQuery.isLoading ? (
            <Loader />
          ) : teacherQuery.data ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">
                      {t("teacherName")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("email")}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      {teacherQuery.data.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground/60" />
                        {teacherQuery.data.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {teacherQuery.data.schoolName ? (
                        <div className="flex items-center gap-1">
                          <School className="h-4 w-4 text-muted-foreground/60" />
                          {teacherQuery.data.schoolName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {teacherQuery.data.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground/60" />
                          {teacherQuery.data.address}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {teacherQuery.data.dateOfBirth ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground/60" />
                          {new Date(
                            teacherQuery.data.dateOfBirth
                          ).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {t("teacherInfoNotAvailable")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
