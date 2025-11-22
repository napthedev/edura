"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";

export default function TeacherPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("StudentClassPage");

  const teacherQuery = useQuery({
    queryKey: ["class-teacher", classId],
    queryFn: () => trpcClient.education.getClassTeacher.query({ classId }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("teacher")}</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("teacher")}</CardTitle>
        </CardHeader>
        <CardContent>
          {teacherQuery.isLoading ? (
            <Loader />
          ) : teacherQuery.data ? (
            <div className="flex items-center space-x-4">
              <div>
                <p className="font-medium">{teacherQuery.data.name}</p>
                <p className="text-sm text-muted-foreground">
                  {teacherQuery.data.email}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {t("teacherInfoNotAvailable")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
