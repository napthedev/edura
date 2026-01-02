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
import {
  Users,
  Mail,
  Calendar,
  GraduationCap,
  Copy,
  Check,
  AlertTriangle,
  Phone,
  Pencil,
} from "lucide-react";
import { AddStudentDialog } from "@/components/dashboard/manager/add-student-dialog";
import { CSVImportDialog } from "@/components/dashboard/manager/csv-import-dialog";
import { EditParentContactDialog } from "@/components/dashboard/manager/edit-parent-contact-dialog";
import { ParentNotificationSettingsDialog } from "@/components/dashboard/manager/parent-notification-settings-dialog";
import { StudentDetailModal } from "@/components/dashboard/manager/student-detail-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

export default function StudentsPage() {
  const t = useTranslations("ManagerStudents");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const studentsQuery = useQuery({
    queryKey: ["all-students"],
    queryFn: () => trpcClient.education.getAllStudents.query(),
  });

  const handleCopyPassword = (userId: string, password: string | null) => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopiedId(userId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <CSVImportDialog type="student" />
          <AddStudentDialog />
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
            <div className="text-2xl font-bold">
              {studentsQuery.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("registeredStudents")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("studentsList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentsQuery.isLoading ? (
            <Loader />
          ) : studentsQuery.data && studentsQuery.data.length > 0 ? (
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold w-[80px]">
                      {t("detail")}
                    </TableHead>
                    <TableHead className="font-semibold">{t("name")}</TableHead>
                    <TableHead className="font-semibold">
                      {t("email")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("password")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("dateOfBirth")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("parentEmail")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("parentPhone")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("joinedDate")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsQuery.data.map((student) => (
                    <TableRow
                      key={student.userId}
                      className="hover:bg-slate-50"
                    >
                      <TableCell>
                        <StudentDetailModal
                          studentId={student.userId}
                          studentName={student.name}
                        />
                      </TableCell>
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
                        {student.generatedPassword ? (
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              {student.generatedPassword}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                handleCopyPassword(
                                  student.userId,
                                  student.generatedPassword
                                )
                              }
                            >
                              {copiedId === student.userId ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                        {!student.hasChangedPassword && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant="outline"
                                  className="text-amber-600 border-amber-300 bg-amber-50 mt-1"
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {t("passwordNotChanged")}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t("passwordNotChangedTooltip")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                        {student.parentEmail ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-muted-foreground/60" />
                            {student.parentEmail}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.parentPhone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-muted-foreground/60" />
                            {student.parentPhone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground/60" />
                          {new Date(student.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ParentNotificationSettingsDialog
                            studentId={student.userId}
                            studentName={student.name}
                          />
                          <EditParentContactDialog
                            studentId={student.userId}
                            studentName={student.name}
                            currentParentEmail={student.parentEmail}
                            currentParentPhone={student.parentPhone}
                          />
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
