"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import CreateScheduleForm from "@/components/schedule/schedule-form";
import ScheduleCalendar from "@/components/schedule/schedule-calendar";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";

export default function SchedulePage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("ClassPage");

  const schedulesQuery = useQuery({
    queryKey: ["class-schedules", classId],
    queryFn: () => trpcClient.education.getClassSchedules.query({ classId }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          {t("weeklySchedule")}
        </h2>
        <CreateScheduleForm
          classId={classId}
          onSuccess={() => schedulesQuery.refetch()}
        />
      </div>
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
    </div>
  );
}
