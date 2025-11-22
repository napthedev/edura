"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";

export default function StudentsPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("ClassPage");

  const studentsQuery = useQuery({
    queryKey: ["class-students", classId],
    queryFn: () => trpcClient.education.getClassStudents.query({ classId }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("students")}</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {t("studentsCount")} ({studentsQuery.data?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentsQuery.isLoading ? (
            <Loader />
          ) : studentsQuery.data && studentsQuery.data.length > 0 ? (
            <div className="space-y-2">
              {studentsQuery.data.map(
                (student: {
                  userId: string;
                  name: string;
                  email: string;
                  enrolledAt: string;
                }) => (
                  <div
                    key={student.userId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {t("enrolled")}{" "}
                      {new Date(student.enrolledAt).toLocaleDateString()}
                    </Badge>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">{t("noStudentsEnrolled")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
