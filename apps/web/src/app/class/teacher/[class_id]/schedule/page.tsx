"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CreateScheduleForm from "@/components/schedule/schedule-form";
import ScheduleCalendar from "@/components/schedule/schedule-calendar";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";

export default function SchedulePage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("ClassPage");

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
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{t("classSchedule")}</CardTitle>
          <CreateScheduleForm
            classId={classId}
            onSuccess={() => schedulesQuery.refetch()}
          />
        </CardHeader>
        <CardContent>
          {schedulesQuery.isLoading ? (
            <Loader />
          ) : (
            <ScheduleCalendar
              schedules={schedulesQuery.data || []}
              classId={classId}
              onScheduleUpdate={() => schedulesQuery.refetch()}
              isTeacher={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
