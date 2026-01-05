"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import SessionReportForm from "./session-report-form";

interface SessionReportsCalendarProps {
  classId: string;
}

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

export default function SessionReportsCalendar({
  classId,
}: SessionReportsCalendarProps) {
  const t = useTranslations("SessionReports");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [selectedSession, setSelectedSession] = useState<{
    scheduleId: string;
    sessionDate: string;
    title: string;
    report: any;
  } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["schedules-with-reports", classId, currentMonth],
    queryFn: () =>
      trpcClient.education.getSchedulesWithReports.query({
        classId,
        month: currentMonth,
      }),
  });

  const handlePreviousMonth = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    const prevDate = new Date(year!, month! - 2, 1);
    setCurrentMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(
        2,
        "0"
      )}`
    );
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    const nextDate = new Date(year!, month!, 1);
    setCurrentMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(
        2,
        "0"
      )}`
    );
  };

  const handleSessionClick = (session: any) => {
    setSelectedSession(session);
    setIsFormOpen(true);
  };

  const formatMonthYear = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    const date = new Date(year!, month! - 1, 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  const isPastSession = (dateStr: string, endTime: string) => {
    // Parse session date and end time
    const sessionDate = new Date(dateStr);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    // Get current time in Vietnam timezone (UTC+7)
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    // Set session end time in Vietnam timezone
    const sessionEndTime = new Date(sessionDate);
    sessionEndTime.setUTCHours(endHours!, endMinutes!, 0, 0);

    // Session is "past" if the end time has already occurred in Vietnam timezone
    return sessionEndTime < vietnamTime;
  };

  return (
    <>
      <Card className="shadow-sm border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="size-5" />
              {t("title")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {formatMonthYear(currentMonth)}
              </span>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{t("noReportYet")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session: any) => {
                const colors = colorClasses[session.color] || colorClasses.blue;
                const isPast = isPastSession(
                  session.sessionDate,
                  session.endTime
                );

                return (
                  <div
                    key={`${session.scheduleId}-${session.sessionDate}`}
                    className={cn(
                      "rounded-lg p-4 border-l-4 transition-all cursor-pointer hover:shadow-md",
                      colors.bg,
                      colors.border,
                      !isPast && "opacity-50"
                    )}
                    onClick={() => isPast && handleSessionClick(session)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={cn("font-medium", colors.text)}>
                            {session.title}
                          </h4>
                          {session.hasReport ? (
                            <Badge variant="default" className="bg-green-600">
                              <FileText className="size-3 mr-1" />
                              {t("hasReport")}
                            </Badge>
                          ) : isPast ? (
                            <Badge variant="destructive">{t("noReport")}</Badge>
                          ) : (
                            <Badge variant="secondary">
                              {t("upcomingSessions")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {new Date(session.sessionDate).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          <span>
                            {session.startTime} - {session.endTime}
                          </span>
                          {session.location && (
                            <span className="flex items-center gap-1">
                              📍 {session.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {isPast && (
                        <Button
                          variant={session.hasReport ? "outline" : "default"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSessionClick(session);
                          }}
                        >
                          {session.hasReport
                            ? t("viewReport")
                            : t("createReport")}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSession && (
        <SessionReportForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          scheduleId={selectedSession.scheduleId}
          sessionDate={selectedSession.sessionDate}
          title={selectedSession.title}
          existingReport={selectedSession.report}
        />
      )}
    </>
  );
}
