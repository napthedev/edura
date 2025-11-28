"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/loader";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Video } from "lucide-react";

export default function LecturesPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("StudentClassPage");

  const lecturesQuery = useQuery({
    queryKey: ["class-lectures", classId],
    queryFn: () => trpcClient.education.getClassLectures.query({ classId }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Video className="h-6 w-6" />
          {t("lectures")}
        </h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {t("lecturesAndMaterials")} ({lecturesQuery.data?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lecturesQuery.isLoading ? (
            <Loader />
          ) : lecturesQuery.data && lecturesQuery.data.length > 0 ? (
            <div className="space-y-2">
              {lecturesQuery.data.map(
                (lecture: {
                  lectureId: string;
                  title: string;
                  description: string | null;
                  type: string;
                  url: string;
                  lectureDate: string;
                  createdAt: string;
                }) => (
                  <Link
                    key={lecture.lectureId}
                    href={`/lecture/${lecture.lectureId}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-medium">{lecture.title}</h3>
                        {lecture.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {lecture.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {lecture.type === "file" ? t("file") : t("video")}
                          </span>
                          <span>
                            {t("date")}:{" "}
                            {new Date(lecture.lectureDate).toLocaleDateString()}
                          </span>
                          <span>
                            {t("uploaded")}:{" "}
                            {new Date(lecture.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noLecturesAvailable")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
