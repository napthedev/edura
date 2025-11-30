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
  Legend,
} from "recharts";
import { ClipboardCheck } from "lucide-react";

interface AssignmentCompletionChartProps {
  data: {
    classId: string;
    className: string;
    completionRate: number;
    onTimeRate: number;
  }[];
  isLoading?: boolean;
}

export default function AssignmentCompletionChart({
  data,
  isLoading,
}: AssignmentCompletionChartProps) {
  const t = useTranslations("ManagerOverview");

  // Truncate long class names
  const chartData = data.map((item) => ({
    ...item,
    name:
      item.className.length > 15
        ? item.className.slice(0, 15) + "..."
        : item.className,
  }));

  if (isLoading) {
    return (
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-purple-500" />
            {t("assignmentCompletionByClass")}
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
          <ClipboardCheck className="h-5 w-5 text-purple-500" />
          {t("assignmentCompletionByClass")}
        </CardTitle>
        <CardDescription>
          {t("assignmentCompletionDescription")}
        </CardDescription>
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
                tickFormatter={(value) => `${value}%`}
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
                formatter={(value: number) => [`${value}%`]}
              />
              <Legend />
              <Bar
                dataKey="completionRate"
                name={t("completionPercentage")}
                fill="hsl(var(--chart-1))"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="onTimeRate"
                name={t("onTimePercentage")}
                fill="hsl(var(--chart-4))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
