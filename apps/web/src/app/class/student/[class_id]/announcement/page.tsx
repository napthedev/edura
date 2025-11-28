"use client";

import { useParams } from "next/navigation";
import AnnouncementList from "@/components/announcement/announcement-list";
import { useTranslations } from "next-intl";
import { Megaphone } from "lucide-react";

export default function AnnouncementPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("StudentClassPage");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          {t("announcements")}
        </h2>
      </div>
      <AnnouncementList classId={classId} />
    </div>
  );
}
