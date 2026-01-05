"use client";

import { useTranslations } from "next-intl";
import { ReportList } from "@/components/dashboard/manager/reports/report-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SessionReportsPage() {
  const t = useTranslations("SessionReportsPage");

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <ReportList />
    </div>
  );
}
