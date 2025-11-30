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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Loader from "@/components/loader";
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  Receipt,
  Wallet,
  ArrowRight,
  CircleDollarSign,
  AlertTriangle,
  Banknote,
  PieChart,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTranslations } from "next-intl";
import Link from "next/link";
import CollectionMetrics from "./collection-metrics";
import OverdueList from "./overdue-list";
import ProfitabilityView from "./profitability-view";
import CashFlowChart from "./cash-flow-chart";

export default function FinanceView() {
  const t = useTranslations("FinanceDashboard");

  const summaryQuery = useQuery({
    queryKey: ["financial-summary"],
    queryFn: () => trpcClient.education.getFinancialSummary.query({}),
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
      {
        month: "short",
      }
    );
  };

  // Transform monthly trend data for chart
  const chartData =
    summaryQuery.data?.monthlyTrend.map((item) => ({
      name: formatMonth(item.month),
      revenue: item.revenue,
      outstanding: item.outstanding,
    })) || [];

  if (summaryQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  const data = summaryQuery.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("description")}</p>
      </div>

      {/* Tabbed Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t("overview")}</span>
          </TabsTrigger>
          <TabsTrigger value="collection" className="gap-2">
            <CircleDollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">{t("collection")}</span>
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">{t("overdue")}</span>
          </TabsTrigger>
          <TabsTrigger value="profitability" className="gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">{t("profitability")}</span>
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t("cashFlow")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("totalRevenue")}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("allTimePaidBills")}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("outstandingBills")}
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data?.outstandingBills || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data?.outstandingCount || 0} {t("bills")} •{" "}
                  {t("pendingAndOverdue")}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("thisMonthRevenue")}
                </CardTitle>
                <Receipt className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data?.monthRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("paidThisMonth")}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("pendingTutorPayments")}
                </CardTitle>
                <Wallet className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(data?.pendingTutorPayments || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data?.pendingTutorCount || 0} {t("payments")} •{" "}
                  {t("awaitingPayment")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend Chart */}
          <Card className="shadow-sm border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t("revenueTrend")}
              </CardTitle>
              <CardDescription>{t("monthlyRevenueOverview")}</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
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
                        formatter={(value: number) => [
                          formatCurrencyFull(value),
                          "",
                        ]}
                      />
                      <Legend />
                      <Line
                        name={t("revenue")}
                        type="monotone"
                        dataKey="revenue"
                        stroke="#22c55e"
                        strokeWidth={3}
                        dot={{
                          r: 4,
                          fill: "#22c55e",
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        name={t("outstanding")}
                        type="monotone"
                        dataKey="outstanding"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{
                          r: 4,
                          fill: "#ef4444",
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>{t("noBillingData")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm border-none">
            <CardHeader>
              <CardTitle>{t("quickActions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button asChild>
                  <Link href="/dashboard/manager/tuition">
                    <Receipt className="h-4 w-4 mr-2" />
                    {t("manageTuition")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/manager/payments">
                    <Wallet className="h-4 w-4 mr-2" />
                    {t("manageTutorPayments")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    href={
                      "/dashboard/manager/expenses" as unknown as "/dashboard/manager/payments"
                    }
                  >
                    <Banknote className="h-4 w-4 mr-2" />
                    {t("manageExpenses")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collection Tab */}
        <TabsContent value="collection">
          <CollectionMetrics />
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue">
          <OverdueList />
        </TabsContent>

        {/* Profitability Tab */}
        <TabsContent value="profitability">
          <ProfitabilityView />
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow">
          <CashFlowChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}
