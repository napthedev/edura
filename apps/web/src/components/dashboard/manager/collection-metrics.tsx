"use client";

import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { CircleDollarSign, TrendingUp } from "lucide-react";

export default function CollectionMetrics() {
  const t = useTranslations("FinanceDashboard");

  const metricsQuery = useQuery({
    queryKey: ["collection-metrics"],
    queryFn: () => trpcClient.education.getCollectionMetrics.query({}),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatCurrencyFull = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (metricsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader />
      </div>
    );
  }

  const data = metricsQuery.data;

  // Collection rate ring calculation
  const collectionRate = data?.collectionRate || 0;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset =
    circumference - (collectionRate / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Collection Rate and Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Collection Rate Ring */}
        <Card className="shadow-sm border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("collectionRate")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={
                    collectionRate >= 80
                      ? "#22c55e"
                      : collectionRate >= 50
                      ? "#f59e0b"
                      : "#ef4444"
                  }
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold">{collectionRate}%</span>
                <span className="text-xs text-muted-foreground">
                  {t("collected")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Billed */}
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalBilled")}
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.totalBilled || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("allInvoicesGenerated")}
            </p>
          </CardContent>
        </Card>

        {/* Total Collected */}
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalCollected")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data?.totalCollected || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("paidInvoices")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
