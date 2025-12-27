"use client";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { JoinClassForm } from "@/components/join-class-form";
import { GraduationCap, Calendar } from "lucide-react";

export default function StudentClassesClient() {
  const t = useTranslations("StudentDashboard");
  const studentClassesQuery = useQuery({
    queryKey: ["student-classes"],
    queryFn: () => trpcClient.education.getStudentClasses.query(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("myClasses")}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <JoinClassForm onClassJoined={() => studentClassesQuery.refetch()} />

        {studentClassesQuery.isLoading ? (
          <div className="md:col-span-2 lg:col-span-2">
            <Loader />
          </div>
        ) : studentClassesQuery.data && studentClassesQuery.data.length > 0 ? (
          studentClassesQuery.data.map((enrollment) => (
            <Link
              href={`/class/student/${enrollment.classId}`}
              key={enrollment.classId}
              className="block group"
            >
              <Card className="shadow-sm border-none h-full hover:shadow-md transition-all">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {enrollment.className}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {t("code")}:{" "}
                      <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">
                        {enrollment.classCode}
                      </span>
                    </p>
                    {enrollment.subject && (
                      <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                        <GraduationCap className="size-4" />
                        {enrollment.subject}
                      </p>
                    )}
                    {enrollment.schedule && (
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                        <Calendar className="size-4" />
                        {enrollment.schedule}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-4 pt-4 border-t">
                    {t("joined")}:{" "}
                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-2 text-center py-8 text-muted-foreground">
            {t("noClassesJoined")}
          </div>
        )}
      </div>
    </div>
  );
}
