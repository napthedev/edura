"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import CreateScheduleForm from "@/components/schedule/schedule-form";
import ScheduleCalendar from "@/components/schedule/schedule-calendar";
import SessionReportsCalendar from "@/components/schedule/session-reports-calendar";
import StudentCheckIn from "@/components/schedule/student-check-in";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { Calendar, FileText, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SchedulePage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("ClassPage");
  const tReports = useTranslations("SessionReports");
  const tStudentCheckIn = useTranslations("StudentCheckIn");

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

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Weekly Schedule
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            {tReports("title")}
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Users className="h-4 w-4 mr-2" />
            {tStudentCheckIn("title")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <SessionReportsCalendar classId={classId} />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <StudentCheckIn />
        </TabsContent>
      </Tabs>
    </div>
  );
}
