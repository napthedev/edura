"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useTranslations } from "next-intl";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TeachingHoursCardProps {
  variant?: "compact" | "detailed";
}

export function TeachingHoursCard({
  variant = "detailed",
}: TeachingHoursCardProps) {
  const t = useTranslations("TeacherDashboard");
  const [isExpanded, setIsExpanded] = useState(false);

  const hoursQuery = useQuery({
    queryKey: ["teaching-hours-stats"],
    queryFn: () => trpcClient.education.getTeachingHoursStats.query(),
  });

  // Format hours to 1 decimal place, remove trailing .0
  const formatHours = (hours: number) => {
    const formatted = hours.toFixed(1);
    return formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted;
  };

  if (hoursQuery.isLoading) {
    return (
      <Card className="shadow-sm border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("weeklyHours")}
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-24 mt-1" />
        </CardContent>
      </Card>
    );
  }

  const data = hoursQuery.data;

  // Compact variant for main dashboard
  if (variant === "compact") {
    return (
      <Card className="shadow-sm border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("weeklyHours")}
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatHours(data?.totalWeeklyHours || 0)}
          </div>
          <p className="text-xs text-muted-foreground">{t("hoursThisWeek")}</p>
        </CardContent>
      </Card>
    );
  }

  // Detailed variant for schedule page
  return (
    <Card className="shadow-sm border-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t("teachingHours")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">{t("weeklyHours")}</p>
            <p className="text-2xl font-bold text-primary dark:text-blue-400">
              {formatHours(data?.totalWeeklyHours || 0)}
            </p>
            <p className="text-xs text-muted-foreground">{t("hours")}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              {t("monthlyHoursEst")}
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatHours(data?.monthlyHoursEstimate || 0)}
            </p>
            <p className="text-xs text-muted-foreground">{t("hours")}</p>
          </div>
        </div>

        {/* Per-class breakdown */}
        {data?.perClass && data.perClass.length > 0 ? (
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {t("hoursPerClass")}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <div
              className={cn(
                "space-y-2 overflow-hidden transition-all duration-200",
                isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              {data.perClass.map(
                (classItem: {
                  classId: string;
                  className: string;
                  hours: number;
                }) => (
                  <div
                    key={classItem.classId}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="text-sm font-medium truncate flex-1">
                      {classItem.className}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {formatHours(classItem.hours)} {t("hours")}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">
              {t("noSchedulesYet")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("createSchedulesHint")}
            </p>
            <Link
              href="/dashboard/teacher/classes"
              className="mt-3 inline-block"
            >
              <Button variant="outline" size="sm">
                {t("goToClasses")}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
