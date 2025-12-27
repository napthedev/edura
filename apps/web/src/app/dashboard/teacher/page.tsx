"use client";

import { redirect } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Loader from "@/components/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpcClient } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Users,
  BookOpen,
  Plus,
  LayoutDashboard,
  FolderOpen,
  GraduationCap,
  Calendar,
} from "lucide-react";
import { CreateClassDialog } from "@/components/class/create-class-dialog";
import { TeachingHoursCard } from "@/components/schedule/teaching-hours-card";

export default function TeacherDashboardPage() {
  const t = useTranslations("TeacherDashboard");
  const { data: session, isPending: loading } = useSession();

  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: () => trpcClient.education.getClasses.query(),
    enabled: !!session?.user && (session.user as any).role === "teacher",
  });

  // Calculate total students across all classes
  const totalStudents =
    classesQuery.data?.reduce((acc, cls) => acc + (cls.studentCount || 0), 0) ||
    0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;

  if (role !== "teacher") {
    redirect(`/dashboard/${role}` as any);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          {t("title")}
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
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalClasses")}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classesQuery.data?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("activeCourses")}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalStudents")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {t("acrossAllClasses")}
            </p>
          </CardContent>
        </Card>

        <TeachingHoursCard variant="compact" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
        <BookOpen className="h-6 w-6" />
        {t("yourClasses")}
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classesQuery.isLoading ? (
          <Loader />
        ) : classesQuery.data && classesQuery.data.length > 0 ? (
          <>
            {classesQuery.data.map((cls) => (
              <Link
                className="block group"
                href={`/class/teacher/${cls.classId}`}
                key={cls.classId}
              >
                <div className="border rounded-xl p-5 transition-all hover:shadow-md bg-white h-full flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
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
                </div>
              </Link>
            ))}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{t("noClassesYet")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
