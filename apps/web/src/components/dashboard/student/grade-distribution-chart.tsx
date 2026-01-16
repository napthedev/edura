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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GradeDistributionChartProps {
  data: { grade: string; range: string; count: number; color: string }[];
  isLoading?: boolean;
}

const GRADE_COLORS = {
  A: "hsl(142, 76%, 36%)", // Green
  B: "hsl(199, 89%, 48%)", // Blue
  C: "hsl(45, 93%, 47%)", // Yellow
  D: "hsl(25, 95%, 53%)", // Orange
  F: "hsl(0, 84%, 60%)", // Red
};

export default function GradeDistributionChart({
  data,
  isLoading,
}: GradeDistributionChartProps) {
  const t = useTranslations("StudentDashboard");

  // Calculate totals and average
  const totalAssignments = data.reduce((acc, item) => acc + item.count, 0);
  const aAndBCount =
    (data.find((d) => d.grade === "A")?.count || 0) +
    (data.find((d) => d.grade === "B")?.count || 0);
  const excellentRate =
    totalAssignments > 0
      ? Math.round((aAndBCount / totalAssignments) * 100)
      : 0;

  if (isLoading) {
    return (
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            {t("gradeDistributionTitle")}
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
            <Award className="h-5 w-5 text-amber-500" />
            {t("gradeDistributionTitle")}
          </CardTitle>
          {/* <Badge variant="outline" className="text-xs font-normal">
            {t("sampleData")}
          </Badge> */}
        </div>
        <CardDescription className="text-sm">
          {t("gradeDistributionDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t("noDataAvailable")}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="grade"
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          GRADE_COLORS[
                            entry.grade as keyof typeof GRADE_COLORS
                          ] || entry.color
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} ${t("assignments")}`,
                      `${t("grade")} ${name}`,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mb-2">
              <span className="text-3xl font-bold">{excellentRate}%</span>
              <p className="text-sm text-muted-foreground">
                {t("aAndBGrades")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {data.map((item) => (
                <div
                  key={item.grade}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          GRADE_COLORS[
                            item.grade as keyof typeof GRADE_COLORS
                          ] || item.color,
                      }}
                    />
                    <span className="font-medium">{item.grade}</span>
                    <span className="text-muted-foreground text-xs">
                      ({item.range})
                    </span>
                  </div>
                  <span className="font-medium ml-2">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
