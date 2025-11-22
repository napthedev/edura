"use client";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AnnouncementList from "@/components/announcement/announcement-list";
import { useTranslations } from "next-intl";

export default function AnnouncementPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("StudentClassPage");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {t("announcements")}
        </h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("announcements")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementList classId={classId} />
        </CardContent>
      </Card>
    </div>
  );
}
