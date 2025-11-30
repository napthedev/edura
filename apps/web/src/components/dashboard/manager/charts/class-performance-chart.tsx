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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Award } from "lucide-react";

interface ClassPerformanceChartProps {
  data: {
    classId: string;
    className: string;
    averageGrade: number;
    submissionCount: number;
  }[];
  isLoading?: boolean;
}

export default function ClassPerformanceChart({
  data,
  isLoading,
}: ClassPerformanceChartProps) {
  const t = useTranslations("ManagerOverview");

  // Sort by average grade and take top 10
  const sortedData = [...data]
    .sort((a, b) => b.averageGrade - a.averageGrade)
    .slice(0, 10);

  // Truncate long class names
  const chartData = sortedData.map((item) => ({
    ...item,
    name:
      item.className.length > 15
        ? item.className.slice(0, 15) + "..."
        : item.className,
  }));

  // Color scale based on grade
  const getBarColor = (grade: number) => {
    if (grade >= 80) return "hsl(142, 76%, 36%)"; // Green
    if (grade >= 60) return "hsl(47, 100%, 45%)"; // Yellow
    return "hsl(0, 84%, 60%)"; // Red
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            {t("classPerformance")}
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          {t("classPerformance")}
        </CardTitle>
        <CardDescription>{t("classPerformanceDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t("noDataAvailable")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value}${name === t("averageGrade") ? "" : ""}`,
                  name,
                ]}
                labelFormatter={(label) =>
                  chartData.find((c) => c.name === label)?.className || label
                }
              />
              <Bar
                dataKey="averageGrade"
                name={t("averageGrade")}
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.averageGrade)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
