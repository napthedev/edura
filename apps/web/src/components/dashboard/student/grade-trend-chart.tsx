"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GradeTrendChartProps {
  data: { month: string; avgScore: number }[];
  isLoading?: boolean;
}

export default function GradeTrendChart({
  data,
  isLoading,
}: GradeTrendChartProps) {
  const t = useTranslations("StudentDashboard");

  // Calculate trend
  const trend =
    data.length >= 2 ? data[data.length - 1].avgScore - data[0].avgScore : 0;
  const trendDirection = trend > 0 ? "up" : trend < 0 ? "down" : "stable";

  if (isLoading) {
    return (
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            {t("gradeTrendTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              {t("loading")}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            {t("gradeTrendTitle")}
          </CardTitle>
          {/* <Badge variant="outline" className="text-xs font-normal">
            {t("sampleData")}
          </Badge> */}
        </div>
        <CardDescription className="text-sm">
          {t("gradeTrendDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t("noDataAvailable")}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-3xl font-bold">
                {data[data.length - 1].avgScore}%
              </span>
              <span
                className={`text-sm font-medium ${
                  trendDirection === "up"
                    ? "text-green-600"
                    : trendDirection === "down"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {trendDirection === "up" && "+"}
                {trend.toFixed(0)}% {t("fromStart")}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={data}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.split(" ")[0]}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`${value}%`, t("avgScore")]}
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(var(--chart-1))" }}
                  activeDot={{ r: 6, fill: "hsl(var(--chart-1))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
