"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/loader";
import ScheduleCalendar from "@/components/schedule/schedule-calendar";
import { useTranslations } from "next-intl";

export default function SchedulePage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("StudentClassPage");

  const schedulesQuery = useQuery({
    queryKey: ["class-schedules", classId],
    queryFn: () => trpcClient.education.getClassSchedules.query({ classId }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("schedule")}</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("classSchedule")}</CardTitle>
        </CardHeader>
        <CardContent>
          {schedulesQuery.isLoading ? (
            <Loader />
          ) : schedulesQuery.data && schedulesQuery.data.length > 0 ? (
            <ScheduleCalendar
              schedules={schedulesQuery.data}
              classId={classId}
            />
          ) : (
            <p className="text-muted-foreground">{t("noSchedulesAvailable")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
