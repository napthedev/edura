"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useTranslations } from "next-intl";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  ClipboardCheck,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  Filter,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/loader";

interface AttendanceLog {
  logId: string;
  sessionDate: string;
  isPresent: boolean;
  checkedInAt: string | null;
  studentId: string;
  studentName: string;
  studentEmail: string;
  classId: string;
  className: string;
  scheduleTitle: string;
  teacherId: string;
  teacherName: string;
}

interface Teacher {
  userId: string;
  name: string;
  email: string;
}

export default function ManagerAttendanceClient() {
  const t = useTranslations("AttendanceHistory");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Get managed teachers for filter
  const teachersQuery = useQuery({
    queryKey: ["managed-teachers"],
    queryFn: () => trpcClient.education.getAllTeachers.query(),
  });

  // Get attendance history
  const attendanceQuery = useQuery({
    queryKey: [
      "all-student-attendance-logs",
      selectedTeacherId,
      selectedClassId,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    queryFn: () =>
      trpcClient.education.getAllStudentAttendanceLogs.query({
        teacherId: selectedTeacherId === "all" ? undefined : selectedTeacherId,
        classId: selectedClassId === "all" ? undefined : selectedClassId,
        startDate: dateRange.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined,
        endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      }),
  });

  const handleExportCsv = () => {
    const logs = attendanceQuery.data || [];
    if (logs.length === 0) return;

    const headers = [
      t("date"),
      t("teacher"),
      t("class"),
      t("session"),
      t("student"),
      t("email"),
      t("status"),
    ];

    const rows = logs.map((log: AttendanceLog) => [
      log.sessionDate,
      log.teacherName,
      log.className,
      log.scheduleTitle,
      log.studentName,
      log.studentEmail,
      log.isPresent ? t("present") : t("absent"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `student-attendance-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const logs = attendanceQuery.data || [];
  const presentCount = logs.filter(
    (log: AttendanceLog) => log.isPresent
  ).length;
  const absentCount = logs.filter(
    (log: AttendanceLog) => !log.isPresent
  ).length;
  const attendanceRate =
    logs.length > 0 ? Math.round((presentCount / logs.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ClipboardCheck className="size-6" />
          {t("title")}
        </h1>
        <Button
          variant="outline"
          onClick={handleExportCsv}
          disabled={logs.length === 0}
        >
          <Download className="size-4 mr-2" />
          {t("exportCsv")}
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="size-5" />
            {t("filters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Teacher Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                {t("filterByTeacher")}
              </label>
              <Select
                value={selectedTeacherId}
                onValueChange={setSelectedTeacherId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t("allTeachers")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allTeachers")}</SelectItem>
                  {teachersQuery.data?.map((teacher: Teacher) => (
                    <SelectItem key={teacher.userId} value={teacher.userId}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t("filterByDate")}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start">
                    <Calendar className="size-4 mr-2" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} -{" "}
                          {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      t("selectDateRange")
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) =>
                      setDateRange({ from: range?.from, to: range?.to })
                    }
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-none">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-sm text-muted-foreground">{t("totalRecords")}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {presentCount}
            </div>
            <p className="text-sm text-muted-foreground">{t("presentCount")}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            <p className="text-sm text-muted-foreground">{t("absentCount")}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {attendanceRate}%
            </div>
            <p className="text-sm text-muted-foreground">
              {t("attendanceRate")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle>{t("attendanceRecords")}</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceQuery.isLoading ? (
            <Loader />
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{t("noRecords")}</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("teacher")}</TableHead>
                    <TableHead>{t("class")}</TableHead>
                    <TableHead>{t("session")}</TableHead>
                    <TableHead>{t("student")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: AttendanceLog) => (
                    <TableRow key={log.logId}>
                      <TableCell>{log.sessionDate}</TableCell>
                      <TableCell>{log.teacherName}</TableCell>
                      <TableCell>{log.className}</TableCell>
                      <TableCell>{log.scheduleTitle}</TableCell>
                      <TableCell className="font-medium">
                        {log.studentName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.studentEmail}
                      </TableCell>
                      <TableCell>
                        {log.isPresent ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="size-3 mr-1" />
                            {t("present")}
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="bg-red-100 text-red-800 hover:bg-red-100"
                          >
                            <XCircle className="size-3 mr-1" />
                            {t("absent")}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
