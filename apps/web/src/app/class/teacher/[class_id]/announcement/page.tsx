"use client";

import { useParams } from "next/navigation";
import CreateAnnouncementForm from "@/components/announcement/create-announcement-form";
import AnnouncementList from "@/components/announcement/announcement-list";
import { useTranslations } from "next-intl";

export default function AnnouncementPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("ClassPage");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {t("announcements")}
        </h2>
        <CreateAnnouncementForm
          classId={classId}
          onSuccess={() => {
            // Refetch announcements after creating one
            // We'll need to add a query invalidation here
            // The AnnouncementList component likely handles its own data fetching
            // or we can invalidate the query if we had access to queryClient
          }}
        />
      </div>
      <AnnouncementList classId={classId} isTeacher={true} />
    </div>
  );
}
