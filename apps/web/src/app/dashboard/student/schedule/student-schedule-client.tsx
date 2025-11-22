"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpcClient } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import ScheduleCalendar from "@/components/schedule/schedule-calendar";
import { BookOpen } from "lucide-react";

export default function StudentScheduleClient() {
  const t = useTranslations("StudentDashboard");
  const schedulesQuery = useQuery({
    queryKey: ["all-student-schedules"],
    queryFn: () => trpcClient.education.getStudentSchedules.query(),
  });

  // Flatten the data structure and group by class
  const allSchedules =
    schedulesQuery.data?.map((item: any) => ({
      scheduleId: item.schedules.scheduleId,
      classId: item.schedules.classId,
      className: item.classes.className,
      title: item.schedules.title,
      description: item.schedules.description,
      scheduledAt: item.schedules.scheduledAt,
      meetingLink: item.schedules.meetingLink,
    })) || [];

  // Group schedules by class
  const schedulesByClass = allSchedules.reduce((acc: any, schedule: any) => {
    if (!acc[schedule.classId]) {
      acc[schedule.classId] = {
        className: schedule.className,
        classId: schedule.classId,
        schedules: [],
      };
    }
    acc[schedule.classId].schedules.push({
      scheduleId: schedule.scheduleId,
      title: schedule.title,
      description: schedule.description,
      scheduledAt: schedule.scheduledAt,
      meetingLink: schedule.meetingLink,
    });
    return acc;
  }, {});

  const schedulesList = Object.values(schedulesByClass);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("schedule")}
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
          {schedulesList.map((classSchedule: any) => (
            <Card key={classSchedule.classId} className="shadow-sm border-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{classSchedule.className}</CardTitle>
                  <Link href={`/class/student/${classSchedule.classId}`}>
                    <Button variant="outline" size="sm">
                      View Class
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
