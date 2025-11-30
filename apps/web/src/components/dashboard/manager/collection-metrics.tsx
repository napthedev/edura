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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  CircleDollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
} from "lucide-react";

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

  // Payment method colors and icons
  const paymentMethodConfig: Record<
    string,
    {
      color: string;
      label: string;
      icon: React.ComponentType<{ className?: string; color?: string }>;
    }
  > = {
    cash: { color: "#22c55e", label: t("cash"), icon: Banknote },
    bank_transfer: {
      color: "#3b82f6",
      label: t("bankTransfer"),
      icon: Building2,
    },
    momo: { color: "#ec4899", label: "MoMo", icon: Smartphone },
    vnpay: { color: "#f97316", label: "VNPay", icon: CreditCard },
    unknown: { color: "#94a3b8", label: t("unknown"), icon: CircleDollarSign },
  };

  const pieData =
    data?.paymentMethodDistribution.map((item) => ({
      name: paymentMethodConfig[item.method]?.label || item.method,
      value: item.amount,
      count: item.count,
      color: paymentMethodConfig[item.method]?.color || "#94a3b8",
    })) || [];

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

      {/* Payment Method Distribution */}
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("paymentMethodDistribution")}
          </CardTitle>
          <CardDescription>{t("paymentMethodDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrencyFull(value)}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Method Breakdown List */}
              <div className="space-y-3">
                {data?.paymentMethodDistribution.map((item) => {
                  const config =
                    paymentMethodConfig[item.method] ||
                    paymentMethodConfig.unknown;
                  const Icon = config.icon;
                  const percentage =
                    data.totalCollected > 0
                      ? Math.round((item.amount / data.totalCollected) * 100)
                      : 0;

                  return (
                    <div
                      key={item.method}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <Icon className="h-5 w-5" color={config.color} />
                        </div>
                        <div>
                          <p className="font-medium">{config.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.count} {t("transactions")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(item.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {percentage}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noPaymentData")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
