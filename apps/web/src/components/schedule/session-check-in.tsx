"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { toast } from "sonner";
import {
  LogIn,
  LogOut,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

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
  canCheckIn: boolean;
  canCheckOut: boolean;
  existingLog: {
    logId: string;
    status: string;
    checkInTime: string | null;
    checkOutTime: string | null;
  } | null;
}

export default function SessionCheckIn() {
  const t = useTranslations("SessionCheckIn");
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeSchedulesQuery = useQuery({
    queryKey: ["active-schedules-for-checkin"],
    queryFn: () => trpcClient.education.getActiveScheduleForCheckIn.query(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const checkInMutation = useMutation({
    mutationFn: (scheduleId: string) =>
      trpcClient.education.checkInSession.mutate({ scheduleId }),
    onSuccess: () => {
      toast.success(t("checkInSuccess"));
      queryClient.invalidateQueries({
        queryKey: ["active-schedules-for-checkin"],
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-attendance-logs"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: (logId: string) =>
      trpcClient.education.checkOutSession.mutate({ logId }),
    onSuccess: (data) => {
      toast.success(
        t("checkOutSuccess", { duration: data.actualDurationMinutes })
      );
      queryClient.invalidateQueries({
        queryKey: ["active-schedules-for-checkin"],
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-attendance-logs"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeSchedules = activeSchedulesQuery.data || [];

  if (activeSchedulesQuery.isLoading) {
    return (
      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="size-5" />
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
            <Timer className="size-5" />
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
    <Card className="shadow-sm border-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer className="size-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeSchedules.map((schedule: ActiveSchedule) => {
          const colors = colorClasses[schedule.color] || colorClasses.blue;
          const isCheckedIn = schedule.existingLog?.status === "checked_in";
          const isCompleted = schedule.existingLog?.status === "completed";

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
                    {isCheckedIn && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="size-3 mr-1" />
                        {t("checkedIn")}
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="secondary">
                        <CheckCircle className="size-3 mr-1" />
                        {t("completed")}
                      </Badge>
                    )}
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
                  {schedule.existingLog?.checkInTime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("checkedInAt")}:{" "}
                      {formatDateTime(schedule.existingLog.checkInTime)}
                      {schedule.existingLog.checkOutTime && (
                        <>
                          {" "}
                          • {t("checkedOutAt")}:{" "}
                          {formatDateTime(schedule.existingLog.checkOutTime)}
                        </>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {schedule.canCheckIn && (
                    <Button
                      size="sm"
                      onClick={() =>
                        checkInMutation.mutate(schedule.scheduleId)
                      }
                      disabled={checkInMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <LogIn className="size-4 mr-1" />
                      {checkInMutation.isPending
                        ? t("checkingIn")
                        : t("checkIn")}
                    </Button>
                  )}
                  {schedule.canCheckOut && schedule.existingLog && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        checkOutMutation.mutate(schedule.existingLog!.logId)
                      }
                      disabled={checkOutMutation.isPending}
                    >
                      <LogOut className="size-4 mr-1" />
                      {checkOutMutation.isPending
                        ? t("checkingOut")
                        : t("checkOut")}
                    </Button>
                  )}
                  {!schedule.canCheckIn &&
                    !schedule.canCheckOut &&
                    isCheckedIn && (
                      <div className="text-xs text-muted-foreground text-center">
                        <AlertCircle className="size-4 mx-auto mb-1" />
                        {t("waitForEndTime")}
                      </div>
                    )}
                </div>
              </div>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground text-center pt-2">
          {t("timeWindowHint")}
        </p>
      </CardContent>
    </Card>
  );
}
