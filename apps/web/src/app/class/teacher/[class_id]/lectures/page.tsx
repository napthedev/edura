"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { Video, Upload } from "lucide-react";
import { RichTextDisplay } from "@/components/assignment/rich-text-editor";

export default function LecturesPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const router = useRouter();
  const t = useTranslations("ClassPage");

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
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>
            {t("lecturesAndMaterials")} ({lecturesQuery.data?.length || 0})
          </CardTitle>
          <Button
            onClick={() =>
              router.push(`/class/teacher/${classId}/upload-lecture`)
            }
          >
            <Upload className="h-4 w-4 mr-2" />
            {t("uploadLecture")}
          </Button>
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
                          <div className="text-sm text-muted-foreground mt-1">
                            <RichTextDisplay content={lecture.description} />
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <Badge variant="outline">
                            {lecture.type === "file" ? t("file") : t("youtube")}
                          </Badge>
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
              <p>{t("noLecturesUploaded")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
