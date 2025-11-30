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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  GraduationCap,
  Percent,
  PiggyBank,
  BarChart3,
} from "lucide-react";

export default function ProfitabilityView() {
  const t = useTranslations("FinanceDashboard");

  const metricsQuery = useQuery({
    queryKey: ["profitability-metrics"],
    queryFn: () => trpcClient.education.getProfitabilityMetrics.query({}),
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

  const isProfit = (data?.netProfit || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Net Profit Margin */}
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("netProfitMargin")}
            </CardTitle>
            <Percent className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                (data?.netProfitMargin || 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {data?.netProfitMargin || 0}%
            </div>
            <div className="flex items-center gap-1 mt-1">
              {isProfit ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {isProfit ? t("profitable") : t("loss")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Per Student */}
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("revenuePerStudent")}
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.revenuePerStudent || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.activeStudentCount || 0} {t("activeStudents")}
            </p>
          </CardContent>
        </Card>

        {/* Revenue Per Class */}
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("revenuePerClass")}
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.avgRevenuePerClass || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.classCount || 0} {t("activeClasses")}
            </p>
          </CardContent>
        </Card>

        {/* Teacher Cost Ratio */}
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("teacherCostRatio")}
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                (data?.teacherCostRatio || 0) <= 50
                  ? "text-green-600"
                  : "text-amber-600"
              }`}
            >
              {data?.teacherCostRatio || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("ofRevenue")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* P&L Summary */}
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("profitLossSummary")}
            </CardTitle>
            <CardDescription>{t("thisYear")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Revenue */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{t("totalRevenue")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("paidTuition")}
                  </p>
                </div>
              </div>
              <p className="font-bold text-green-600 text-lg">
                {formatCurrencyFull(data?.totalRevenue || 0)}
              </p>
            </div>

            {/* Teacher Costs */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">{t("teacherCosts")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("tutorPayments")}
                  </p>
                </div>
              </div>
              <p className="font-bold text-orange-600 text-lg">
                -{formatCurrencyFull(data?.totalTeacherCost || 0)}
              </p>
            </div>

            {/* Other Expenses */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">{t("otherExpenses")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("facilityMarketingOperational")}
                  </p>
                </div>
              </div>
              <p className="font-bold text-red-600 text-lg">
                -{formatCurrencyFull(data?.totalExpenses || 0)}
              </p>
            </div>

            {/* Net Profit */}
            <div className="border-t pt-4">
              <div
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isProfit ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <p className="font-semibold text-lg">{t("netProfit")}</p>
                <p
                  className={`font-bold text-xl ${
                    isProfit ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {isProfit ? "" : "-"}
                  {formatCurrencyFull(Math.abs(data?.netProfit || 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Class */}
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {t("revenueByClass")}
            </CardTitle>
            <CardDescription>{t("revenueByClassDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.revenueByClass && data.revenueByClass.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="font-semibold">
                        {t("class")}
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        {t("revenue")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.revenueByClass
                      .sort((a, b) => b.revenue - a.revenue)
                      .slice(0, 10)
                      .map((cls, index) => (
                        <TableRow
                          key={cls.classId || index}
                          className="hover:bg-slate-50"
                        >
                          <TableCell className="font-medium">
                            {cls.className}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatCurrency(cls.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>{t("noClassRevenueData")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
