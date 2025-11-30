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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Wallet,
  DollarSign,
  Target,
} from "lucide-react";

export default function CashFlowChart() {
  const t = useTranslations("FinanceDashboard");

  const cashFlowQuery = useQuery({
    queryKey: ["cash-flow-summary"],
    queryFn: () => trpcClient.education.getCashFlowSummary.query({}),
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

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    return new Date(parseInt(year!), parseInt(month!) - 1).toLocaleDateString(
      "en-US",
      { month: "short" }
    );
  };

  if (cashFlowQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader />
      </div>
    );
  }

  const data = cashFlowQuery.data;

  // Transform data for chart
  const chartData =
    data?.monthlyData.map((item) => ({
      name: formatMonth(item.month),
      inflow: item.inflow,
      tutorWages: item.tutorWages,
      expenses: item.expenses,
      netCashFlow: item.netCashFlow,
    })) || [];

  const isPositiveCashFlow = (data?.totalNetCashFlow || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Inflow */}
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalInflow")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data?.totalInflow || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("tuitionCollected")}
            </p>
          </CardContent>
        </Card>

        {/* Total Outflow */}
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalOutflow")}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data?.totalOutflow || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("wagesAndExpenses")}
            </p>
          </CardContent>
        </Card>

        {/* Net Cash Flow */}
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("netCashFlow")}
            </CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                isPositiveCashFlow ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositiveCashFlow ? "+" : ""}
              {formatCurrency(data?.totalNetCashFlow || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("thisYear")}
            </p>
          </CardContent>
        </Card>

        {/* Projected Revenue */}
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("projectedRevenue")}
            </CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(data?.projectedMonthlyRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("perMonthFromEnrollments")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t("monthlyCashFlow")}
          </CardTitle>
          <CardDescription>{t("cashFlowDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        inflow: t("inflow"),
                        tutorWages: t("tutorWages"),
                        expenses: t("expenses"),
                        netCashFlow: t("netCashFlow"),
                      };
                      return [formatCurrencyFull(value), labels[name] || name];
                    }}
                  />
                  <Legend
                    formatter={(value: string) => {
                      const labels: Record<string, string> = {
                        inflow: t("inflow"),
                        tutorWages: t("tutorWages"),
                        expenses: t("expenses"),
                        netCashFlow: t("netCashFlow"),
                      };
                      return labels[value] || value;
                    }}
                  />
                  <Bar
                    dataKey="inflow"
                    fill="#22c55e"
                    name="inflow"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="tutorWages"
                    fill="#f97316"
                    name="tutorWages"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="#ef4444"
                    name="expenses"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="netCashFlow"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#3b82f6",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 6 }}
                    name="netCashFlow"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noCashFlowData")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projected Annual Revenue */}
      <Card className="shadow-sm border-none bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            {t("projectedAnnualRevenue")}
          </CardTitle>
          <CardDescription>{t("projectedRevenueDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("basedOnEnrollments")}
              </p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {formatCurrencyFull(data?.projectedAnnualRevenue || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {t("monthlyProjection")}
              </p>
              <p className="text-xl font-semibold text-purple-600 mt-2">
                {formatCurrencyFull(data?.projectedMonthlyRevenue || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
