"use client";

import { redirect } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import OverviewStats from "@/components/dashboard/manager/overview-stats";
import DateRangeFilter from "@/components/dashboard/manager/date-range-filter";
import {
  EnrollmentTrendChart,
  RetentionRateChart,
  AssignmentCompletionChart,
  ClassPerformanceChart,
} from "@/components/dashboard/manager/charts";
import { SendBillingReportDialog } from "@/components/dashboard/manager/send-billing-report-dialog";
import { SendUrgentAlertDialog } from "@/components/class/send-urgent-alert-dialog";

// 5 minute cache for analytics queries
const STALE_TIME = 5 * 60 * 1000;

export default function ManagerDashboardPage() {
  const t = useTranslations("ManagerOverview");
  const dashboardT = useTranslations("Dashboard");
  const { data: session, isPending: loading } = useSession();
  const [monthsFilter, setMonthsFilter] = useState(6);

  // Overview stats query
  const overviewStatsQuery = useQuery({
    queryKey: ["manager-overview-stats"],
    queryFn: () => trpcClient.education.getManagerOverviewStats.query(),
    staleTime: STALE_TIME,
    enabled: !!session?.user && (session.user as any)?.role === "manager",
  });

  // Retention metrics query
  const retentionQuery = useQuery({
    queryKey: ["manager-retention-metrics", monthsFilter],
    queryFn: () =>
      trpcClient.education.getRetentionMetrics.query({ months: monthsFilter }),
    staleTime: STALE_TIME,
    enabled: !!session?.user && (session.user as any)?.role === "manager",
  });

  // Assignment completion metrics query
  const completionQuery = useQuery({
    queryKey: ["manager-assignment-completion", monthsFilter],
    queryFn: () =>
      trpcClient.education.getAssignmentCompletionMetrics.query({
        months: monthsFilter,
      }),
    staleTime: STALE_TIME,
    enabled: !!session?.user && (session.user as any)?.role === "manager",
  });

  // Enrollment trends query
  const enrollmentQuery = useQuery({
    queryKey: ["manager-enrollment-trends", monthsFilter],
    queryFn: () =>
      trpcClient.education.getEnrollmentTrends.query({ months: monthsFilter }),
    staleTime: STALE_TIME,
    enabled: !!session?.user && (session.user as any)?.role === "manager",
  });

  // Class performance query
  const performanceQuery = useQuery({
    queryKey: ["manager-class-performance", monthsFilter],
    queryFn: () =>
      trpcClient.education.getClassPerformanceMetrics.query({
        months: monthsFilter,
      }),
    staleTime: STALE_TIME,
    enabled: !!session?.user && (session.user as any)?.role === "manager",
  });

  const handleRefresh = () => {
    overviewStatsQuery.refetch();
    retentionQuery.refetch();
    completionQuery.refetch();
    enrollmentQuery.refetch();
    performanceQuery.refetch();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;

  if (role !== "manager") {
    redirect(`/dashboard/${role}` as any);
  }

  const isAnyLoading =
    overviewStatsQuery.isLoading ||
    retentionQuery.isLoading ||
    completionQuery.isLoading ||
    enrollmentQuery.isLoading ||
    performanceQuery.isLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            {dashboardT("managerTitle")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>
        <div className="flex items-center gap-3">
          <SendBillingReportDialog />
          <SendUrgentAlertDialog isManager={true} />
          <DateRangeFilter value={monthsFilter} onChange={setMonthsFilter} />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isAnyLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isAnyLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <OverviewStats
        stats={overviewStatsQuery.data ?? null}
        retentionRate={retentionQuery.data?.currentRetentionRate ?? 0}
        completionRate={completionQuery.data?.overallCompletionRate ?? 0}
        isLoading={
          overviewStatsQuery.isLoading ||
          retentionQuery.isLoading ||
          completionQuery.isLoading
        }
      />

      {/* Charts Row 1: Enrollment Trends + Retention */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EnrollmentTrendChart
          data={enrollmentQuery.data?.trends ?? []}
          isLoading={enrollmentQuery.isLoading}
        />
        <RetentionRateChart
          data={retentionQuery.data?.monthlyRetention ?? []}
          isLoading={retentionQuery.isLoading}
        />
      </div>

      {/* Charts Row 2: Assignment Completion + Class Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AssignmentCompletionChart
          data={completionQuery.data?.byClass ?? []}
          isLoading={completionQuery.isLoading}
        />
        <ClassPerformanceChart
          data={performanceQuery.data?.classPerformance ?? []}
          isLoading={performanceQuery.isLoading}
        />
      </div>
    </div>
  );
}
