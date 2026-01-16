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
  type TooltipProps,
} from "recharts";
import { ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AssignmentCompletionChartProps {
  data: { className: string; completed: number; pending: number }[];
  isLoading?: boolean;
}

// Custom tooltip component to avoid color inheritance issues
function CustomTooltip({
  active,
  payload,
  label,
  t,
}: TooltipProps<number, string> & { t: (key: string) => string }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-foreground">
            {entry.name === "completed" ? t("completed") : t("pending")}:{" "}
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AssignmentCompletionChart({
  data,
  isLoading,
}: AssignmentCompletionChartProps) {
  const t = useTranslations("StudentDashboard");

  // Calculate totals
  const totalCompleted = data.reduce((acc, item) => acc + item.completed, 0);
  const totalPending = data.reduce((acc, item) => acc + item.pending, 0);
  const completionRate =
    totalCompleted + totalPending > 0
      ? Math.round((totalCompleted / (totalCompleted + totalPending)) * 100)
      : 0;

  if (isLoading) {
    return (
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-green-500" />
            {t("assignmentCompletionTitle")}
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
            <ClipboardCheck className="h-5 w-5 text-green-500" />
            {t("assignmentCompletionTitle")}
          </CardTitle>
          {/* <Badge variant="outline" className="text-xs font-normal">
            {t("sampleData")}
          </Badge> */}
        </div>
        <CardDescription className="text-sm">
          {t("assignmentCompletionDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t("noDataAvailable")}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-4">
              <div>
                <span className="text-3xl font-bold">{completionRate}%</span>
                <p className="text-sm text-muted-foreground">
                  {t("completionRate")}
                </p>
              </div>
              <div className="flex gap-4 ml-auto text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[hsl(var(--chart-2))]" />
                  <span>
                    {totalCompleted} {t("completed")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[hsl(var(--chart-4))]" />
                  <span>
                    {totalPending} {t("pending")}
                  </span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={data}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  vertical={false}
                />
                <XAxis
                  dataKey="className"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    value.length > 8 ? `${value.slice(0, 8)}...` : value
                  }
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<CustomTooltip t={t} />}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                />
                <Bar
                  dataKey="completed"
                  fill="hsl(var(--chart-2))"
                  radius={[4, 4, 0, 0]}
                  name="completed"
                />
                <Bar
                  dataKey="pending"
                  fill="hsl(var(--chart-4))"
                  radius={[4, 4, 0, 0]}
                  name="pending"
                />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
