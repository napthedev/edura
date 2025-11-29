"use client";
import { Card, CardContent } from "@/components/ui/card";
import { trpcClient } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { Plus, Users, GraduationCap, Calendar } from "lucide-react";
import { CreateClassDialog } from "@/components/class/create-class-dialog";

export default function TeacherClassesClient() {
  const t = useTranslations("TeacherDashboard");
  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: () => trpcClient.education.getClasses.query(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("yourClasses")}
        </h1>
        <CreateClassDialog
          onSuccess={() => classesQuery.refetch()}
          trigger={
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              <Plus className="size-4" />
              {t("createNewClass")}
            </button>
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classesQuery.isLoading ? (
          <div className="md:col-span-2 lg:col-span-3">
            <Loader />
          </div>
        ) : classesQuery.data && classesQuery.data.length > 0 ? (
          classesQuery.data.map((cls) => (
            <Link
              className="block group"
              href={`/class/teacher/${cls.classId}`}
              key={cls.classId}
            >
              <Card className="shadow-sm border-none h-full hover:shadow-md transition-all">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                      {cls.className}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {t("code")}:{" "}
                      <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">
                        {cls.classCode}
                      </span>
                    </p>
                    {cls.subject && (
                      <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                        <GraduationCap className="size-4" />
                        {cls.subject}
                      </p>
                    )}
                    {cls.schedule && (
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                        <Calendar className="size-4" />
                        {cls.schedule}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-xs text-slate-400">
                      {t("created")}:{" "}
                      {new Date(cls.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="size-3" />
                      {cls.studentCount || 0}{" "}
                      {cls.studentCount === 1 ? t("student") : t("students")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-3 text-center py-8 text-muted-foreground">
            {t("noClassesYet")}
          </div>
        )}
      </div>
    </div>
  );
}
