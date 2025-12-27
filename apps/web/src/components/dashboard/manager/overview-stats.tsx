"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewStatsProps {
  stats: {
    totalTeachers: number;
    totalStudents: number;
    activeClasses: number;
    monthlyRevenue: number;
  } | null;
  retentionRate: number;
  completionRate: number;
  isLoading?: boolean;
}

export default function OverviewStats({
  stats,
  retentionRate,
  completionRate,
  isLoading,
}: OverviewStatsProps) {
  const t = useTranslations("ManagerOverview");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const statCards = [
    {
      title: t("totalTeachers"),
      value: stats?.totalTeachers ?? 0,
      subtitle: t("teachersInOrganization"),
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-primary/10 dark:bg-blue-950",
    },
    {
      title: t("totalStudents"),
      value: stats?.totalStudents ?? 0,
      subtitle: t("studentsEnrolled"),
      icon: GraduationCap,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: t("activeClasses"),
      value: stats?.activeClasses ?? 0,
      subtitle: t("classesRunning"),
      icon: BookOpen,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: t("monthlyRevenue"),
      value: formatCurrency(stats?.monthlyRevenue ?? 0),
      subtitle: t("revenueThisMonth"),
      icon: DollarSign,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
      isFormatted: true,
    },
    {
      title: t("retentionRate"),
      value: `${retentionRate}%`,
      subtitle: t("activeStudents"),
      icon: TrendingUp,
      color: "text-teal-500",
      bgColor: "bg-teal-50 dark:bg-teal-950",
      isFormatted: true,
    },
    {
      title: t("assignmentCompletion"),
      value: `${completionRate}%`,
      subtitle: t("completionRate"),
      icon: CheckCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      isFormatted: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((card, index) => (
        <Card key={index} className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.isFormatted ? card.value : card.value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
