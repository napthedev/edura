"use client";

import { useParams } from "next/navigation";
import AnnouncementList from "@/components/announcement/announcement-list";
import { useTranslations } from "next-intl";

export default function AnnouncementPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("StudentClassPage");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {t("announcements")}
        </h2>
      </div>
      <AnnouncementList classId={classId} />
    </div>
  );
}
