"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { toast } from "sonner";
import {
  Users,
  Clock,
  MapPin,
  CheckCircle,
  UserCheck,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Color mapping for schedule items
const colorClasses: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  blue: {
    bg: "bg-primary/10 dark:bg-blue-950",
    border: "border-l-blue-500",
    text: "text-blue-700 dark:text-blue-300",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950",
    border: "border-l-green-500",
    text: "text-green-700 dark:text-green-300",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950",
    border: "border-l-purple-500",
    text: "text-purple-700 dark:text-purple-300",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950",
    border: "border-l-orange-500",
    text: "text-orange-700 dark:text-orange-300",
  },
  pink: {
    bg: "bg-pink-50 dark:bg-pink-950",
    border: "border-l-pink-500",
    text: "text-pink-700 dark:text-pink-300",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-950",
    border: "border-l-teal-500",
    text: "text-teal-700 dark:text-teal-300",
  },
};

interface ActiveSchedule {
  scheduleId: string;
  classId: string;
  className: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string | null;
  color: string;
  isActive: boolean;
}

interface StudentAttendance {
  userId: string;
  name: string;
  email: string;
  isPresent: boolean;
  attendanceLogId: string | null;
}

export default function StudentCheckIn() {
  const t = useTranslations("StudentCheckIn");
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] =
    useState<ActiveSchedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Update current time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeSchedulesQuery = useQuery({
    queryKey: ["active-schedules-for-student-checkin"],
    queryFn: () =>
      trpcClient.education.getActiveSchedulesForStudentCheckIn.query(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const studentsQuery = useQuery({
    queryKey: [
      "students-for-checkin",
      selectedSchedule?.scheduleId,
      format(selectedDate, "yyyy-MM-dd"),
    ],
    queryFn: () =>
      trpcClient.education.getStudentsForCheckIn.query({
        scheduleId: selectedSchedule!.scheduleId,
        sessionDate: format(selectedDate, "yyyy-MM-dd"),
      }),
    enabled: !!selectedSchedule && isDialogOpen,
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: (data: {
      scheduleId: string;
      sessionDate: string;
      students: { studentId: string; isPresent: boolean }[];
    }) => trpcClient.education.saveStudentAttendance.mutate(data),
    onSuccess: () => {
      toast.success(t("saveSuccess"));
      queryClient.invalidateQueries({
        queryKey: ["students-for-checkin"],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-attendance-history"],
      });
      setIsDialogOpen(false);
      setSelectedSchedule(null);
      setAttendance({});
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Initialize attendance state when students data loads
  useEffect(() => {
    if (studentsQuery.data?.students) {
      const initialAttendance: Record<string, boolean> = {};
      studentsQuery.data.students.forEach((student: StudentAttendance) => {
        initialAttendance[student.userId] = student.isPresent;
      });
      setAttendance(initialAttendance);
    }
  }, [studentsQuery.data]);

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
  };

  const handleOpenDialog = (schedule: ActiveSchedule) => {
    setSelectedSchedule(schedule);
    setSelectedDate(new Date());
    setIsDialogOpen(true);
  };

  const handleToggleAttendance = (studentId: string, checked: boolean) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: checked,
    }));
  };

  const handleMarkAllPresent = () => {
    if (studentsQuery.data?.students) {
      const allPresent: Record<string, boolean> = {};
      studentsQuery.data.students.forEach((student: StudentAttendance) => {
        allPresent[student.userId] = true;
      });
      setAttendance(allPresent);
    }
  };

  const handleMarkAllAbsent = () => {
    if (studentsQuery.data?.students) {
      const allAbsent: Record<string, boolean> = {};
      studentsQuery.data.students.forEach((student: StudentAttendance) => {
        allAbsent[student.userId] = false;
      });
      setAttendance(allAbsent);
    }
  };

  const handleSaveAttendance = () => {
    if (!selectedSchedule) return;

    const students = Object.entries(attendance).map(
      ([studentId, isPresent]) => ({
        studentId,
        isPresent,
      })
    );

    saveAttendanceMutation.mutate({
      scheduleId: selectedSchedule.scheduleId,
      sessionDate: format(selectedDate, "yyyy-MM-dd"),
      students,
    });
  };

  const activeSchedules = activeSchedulesQuery.data || [];
  const presentCount = Object.values(attendance).filter(Boolean).length;
  const totalStudents = studentsQuery.data?.students?.length || 0;

  if (activeSchedulesQuery.isLoading) {
    return (
      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="size-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeSchedules.length === 0) {
    return (
      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="size-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("noActiveSession")}</p>
            <p className="text-xs mt-1">{t("checkInAvailableHint")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="size-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeSchedules.map((schedule: ActiveSchedule) => {
            const colors = colorClasses[schedule.color] || colorClasses.blue;

            return (
              <div
                key={schedule.scheduleId}
                className={cn(
                  "rounded-lg p-4 border-l-4 transition-colors",
                  colors.bg,
                  colors.border
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn("font-medium", colors.text)}>
                        {schedule.title}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {schedule.className}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatTime(schedule.startTime)} -{" "}
                        {formatTime(schedule.endTime)}
                      </span>
                      {schedule.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {schedule.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenDialog(schedule)}
                    className="bg-primary hover:bg-blue-700"
                  >
                    <Users className="size-4 mr-1" />
                    {t("checkInStudents")}
                  </Button>
                </div>
              </div>
            );
          })}

          <p className="text-xs text-muted-foreground text-center pt-2">
            {t("checkInAvailableHint")}
          </p>
        </CardContent>
      </Card>

      {/* Student Check-in Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="size-5" />
              {t("checkInStudents")}
            </DialogTitle>
            <DialogDescription>
              {selectedSchedule?.title} - {selectedSchedule?.className}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t("selectDate")}:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="size-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllPresent}
              >
                <CheckCircle className="size-4 mr-1" />
                {t("allPresent")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleMarkAllAbsent}>
                {t("allAbsent")}
              </Button>
              <div className="ml-auto text-sm text-muted-foreground">
                {presentCount}/{totalStudents} {t("present")}
              </div>
            </div>

            {/* Students Table */}
            {studentsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : studentsQuery.data?.students?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t("noStudents")}</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-12">{t("present")}</TableHead>
                      <TableHead>{t("studentName")}</TableHead>
                      <TableHead>{t("email")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsQuery.data?.students?.map(
                      (student: StudentAttendance) => (
                        <TableRow key={student.userId}>
                          <TableCell>
                            <Checkbox
                              checked={attendance[student.userId] || false}
                              onCheckedChange={(checked) =>
                                handleToggleAttendance(
                                  student.userId,
                                  checked as boolean
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {student.email}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={saveAttendanceMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSaveAttendance}
              disabled={
                saveAttendanceMutation.isPending || studentsQuery.isLoading
              }
            >
              {saveAttendanceMutation.isPending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
