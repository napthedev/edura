"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/loader";
import ScheduleCalendar from "@/components/schedule/schedule-calendar";
import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";

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
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          {t("schedule")}
        </h2>
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
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noSchedulesAvailable")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
