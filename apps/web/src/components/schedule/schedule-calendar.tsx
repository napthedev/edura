"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { toast } from "sonner";
import {
  Trash2,
  MapPin,
  Video,
  Clock,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";
import { EditScheduleForm } from "./schedule-form";
import { cn } from "@/lib/utils";

// Color mapping for schedule items
const colorClasses: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950",
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

interface ScheduleCalendarProps {
  schedules: Schedule[];
  classId: string;
  onScheduleUpdate?: () => void;
  isTeacher?: boolean;
}

export default function ScheduleCalendar({
  schedules,
  classId,
  onScheduleUpdate,
  isTeacher = false,
}: ScheduleCalendarProps) {
  const t = useTranslations("ScheduleCalendar");
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (scheduleId: string) =>
      trpcClient.education.deleteSchedule.mutate({ scheduleId }),
    onSuccess: () => {
      toast.success(t("scheduleDeletedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["class-schedules", classId] });
      queryClient.invalidateQueries({ queryKey: ["all-teacher-schedules"] });
      onScheduleUpdate?.();
    },
    onError: (error) => {
      toast.error(`${t("failedToDeleteSchedule")}: ${error.message}`);
    },
  });

  // Days of the week starting from Monday (1) to Sunday (0)
  // We'll display Mon-Sun, so order: 1,2,3,4,5,6,0
  const daysOrder = [1, 2, 3, 4, 5, 6, 0];
  const dayNames = [
    t("sunday"),
    t("monday"),
    t("tuesday"),
    t("wednesday"),
    t("thursday"),
    t("friday"),
    t("saturday"),
  ];

  // Group schedules by day of week
  const schedulesByDay: Record<number, Schedule[]> = {};
  for (const day of daysOrder) {
    schedulesByDay[day] = schedules
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
      {daysOrder.map((day) => {
        const daySchedules = schedulesByDay[day] || [];
        const isWeekend = day === 0 || day === 6;

        return (
          <Card
            key={day}
            className={cn(
              "min-h-[200px] flex flex-col",
              isWeekend && "bg-muted/30"
            )}
          >
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle
                className={cn(
                  "text-sm font-semibold flex items-center gap-2",
                  isWeekend && "text-muted-foreground"
                )}
              >
                <Calendar className="size-4" />
                {dayNames[day]}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 flex-1">
              {daySchedules.length > 0 ? (
                <div className="space-y-2">
                  {daySchedules.map((schedule) => {
                    const colors =
                      colorClasses[schedule.color] || colorClasses.blue;
                    return (
                      <div
                        key={schedule.scheduleId}
                        className={cn(
                          "rounded-md p-2 border-l-4 transition-colors",
                          colors.bg,
                          colors.border
                        )}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4
                            className={cn(
                              "font-medium text-sm leading-tight",
                              colors.text
                            )}
                          >
                            {schedule.title}
                          </h4>
                          {isTeacher && (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <EditScheduleForm
                                classId={classId}
                                schedule={schedule}
                                onSuccess={onScheduleUpdate}
                              />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t("deleteSchedule")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("deleteScheduleDescription")}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t("cancel")}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteMutation.mutate(
                                          schedule.scheduleId
                                        )
                                      }
                                      className="bg-destructive text-white hover:bg-destructive/90"
                                    >
                                      {deleteMutation.isPending
                                        ? "..."
                                        : t("delete")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          <span>
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>
                        {schedule.location && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            <span className="truncate">
                              {schedule.location}
                            </span>
                          </div>
                        )}
                        {schedule.meetingLink && (
                          <div className="flex items-center gap-1 mt-1">
                            <Video className="size-3 text-muted-foreground" />
                            <a
                              href={schedule.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-0.5"
                            >
                              {t("joinMeeting")}
                              <ExternalLink className="size-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  {t("noSchedules")}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
