"use client";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Dashboard() {
  const t = useTranslations("Dashboard");

  const stats = [
    {
      id: "overview",
      title: t("overview"),
      value: "156",
      description: "Tổng số người dùng",
    },
    {
      id: "analytics",
      title: t("analytics"),
      value: "89%",
      description: "Tỷ lệ hoàn thành",
    },
    {
      id: "settings",
      title: t("settings"),
      value: "12",
      description: "Cài đặt được cập nhật",
    },
  ];

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-6">
        <h1 className="mb-2 font-bold text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("welcome")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{stat.value}</div>
              <p className="text-muted-foreground text-xs">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("recentActivity")}</CardTitle>
            <CardDescription>
              Những hoạt động mới nhất trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-100" />
                <div>
                  <p className="font-medium text-sm">
                    {t("newUserRegistered")}
                  </p>
                  <p className="text-muted-foreground text-xs">2 phút trước</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-green-100" />
                <div>
                  <p className="font-medium text-sm">{t("taskCompleted")}</p>
                  <p className="text-muted-foreground text-xs">5 phút trước</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-orange-100" />
                <div>
                  <p className="font-medium text-sm">{t("settingsUpdated")}</p>
                  <p className="text-muted-foreground text-xs">10 phút trước</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("quickStats")}</CardTitle>
            <CardDescription>{t("systemPerformance")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">{t("cpuUsage")}</span>
                <span className="font-medium text-sm">45%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200">
                <div className="h-2 w-[45%] rounded-full bg-blue-500" />
              </div>
              <div className="flex justify-between">
                <span className="text-sm">{t("memoryUsage")}</span>
                <span className="font-medium text-sm">67%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200">
                <div className="h-2 w-[67%] rounded-full bg-green-500" />
              </div>
              <div className="flex justify-between">
                <span className="text-sm">{t("diskUsage")}</span>
                <span className="font-medium text-sm">23%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200">
                <div className="h-2 w-[23%] rounded-full bg-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
