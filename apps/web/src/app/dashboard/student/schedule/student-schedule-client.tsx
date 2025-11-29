"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpcClient } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import ScheduleCalendar from "@/components/schedule/schedule-calendar";
import { BookOpen, Calendar } from "lucide-react";

interface Schedule {
  scheduleId: string;
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  title: string;
  color: string;
  location?: string | null;
  meetingLink?: string | null;
}

export default function StudentScheduleClient() {
  const t = useTranslations("StudentDashboard");
  const schedulesQuery = useQuery({
    queryKey: ["all-student-schedules"],
    queryFn: () => trpcClient.education.getStudentSchedules.query(),
  });

  // Flatten the data structure and group by class
  const allSchedules: (Schedule & { className: string })[] =
    schedulesQuery.data?.map((item: any) => ({
      scheduleId: item.class_schedules.scheduleId,
      classId: item.class_schedules.classId,
      className: item.classes.className,
      dayOfWeek: item.class_schedules.dayOfWeek,
      startTime: item.class_schedules.startTime,
      endTime: item.class_schedules.endTime,
      title: item.class_schedules.title,
      color: item.class_schedules.color,
      location: item.class_schedules.location,
      meetingLink: item.class_schedules.meetingLink,
    })) || [];

  // Group schedules by class
  const schedulesByClass = allSchedules.reduce(
    (
      acc: Record<
        string,
        { className: string; classId: string; schedules: Schedule[] }
      >,
      schedule
    ) => {
      if (!acc[schedule.classId]) {
        acc[schedule.classId] = {
          className: schedule.className,
          classId: schedule.classId,
          schedules: [],
        };
      }
      acc[schedule.classId].schedules.push({
        scheduleId: schedule.scheduleId,
        classId: schedule.classId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        title: schedule.title,
        color: schedule.color,
        location: schedule.location,
        meetingLink: schedule.meetingLink,
      });
      return acc;
    },
    {}
  );

  const schedulesList = Object.values(schedulesByClass);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="size-6" />
          {t("weeklySchedule")}
        </h1>
      </div>

      {schedulesQuery.isLoading ? (
        <Loader />
      ) : allSchedules.length === 0 ? (
        <Card className="shadow-sm border-none">
          <CardContent className="p-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {t("noSchedulesYet")}
              </p>
              <p className="text-muted-foreground mb-4">
                {t("schedulesDescription")}
              </p>
              <Link href="/dashboard/student/classes">
                <Button>{t("viewMyClasses")}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {schedulesList.map((classSchedule) => (
            <Card key={classSchedule.classId} className="shadow-sm border-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{classSchedule.className}</CardTitle>
                  <Link
                    href={`/class/student/${classSchedule.classId}/schedule`}
                  >
                    <Button variant="outline" size="sm">
                      {t("viewMyClasses")}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <ScheduleCalendar
                  schedules={classSchedule.schedules}
                  classId={classSchedule.classId}
                  isTeacher={false}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
