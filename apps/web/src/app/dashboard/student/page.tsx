"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { DashboardShell } from "@/components/dashboard/shell";
import Loader from "@/components/loader";
import { JoinClassForm } from "@/components/join-class-form";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

export default function StudentDashboardPage() {
  const t = useTranslations("StudentDashboard");
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const res = await authClient.getSession();
      setSession(res);
      setLoading(false);
    };
    getSession();
  }, []);

  const studentClassesQuery = useQuery({
    queryKey: ["student-classes"],
    queryFn: () => trpcClient.education.getStudentClasses.query(),
    enabled: !!session?.data?.user && session.data.user.role === "student",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!session?.data?.user) {
    redirect("/login");
  }

  const role = (session.data.user as any)?.role;

  if (role !== "student") {
    redirect(`/dashboard/${role}` as any);
  }

  return (
    <DashboardShell role="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("title")}
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Stats Cards - Inspiration from design */}
          <Card className="shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("enrolledClasses")}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentClassesQuery.data?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("activeCourses")}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("pendingAssignments")}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                {t("dueThisWeek")}
              </p>
            </CardContent>
          </Card>

          <div>
            <JoinClassForm
              onClassJoined={() => studentClassesQuery.refetch()}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle>{t("myClasses")}</CardTitle>
              </CardHeader>
              <CardContent>
                {studentClassesQuery.isLoading ? (
                  <Loader />
                ) : studentClassesQuery.data &&
                  studentClassesQuery.data.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {studentClassesQuery.data.map((enrollment) => (
                      <Link
                        href={`/class/student/${enrollment.classId}`}
                        key={enrollment.classId}
                        className="block group"
                      >
                        <div className="border rounded-xl p-5 transition-all hover:shadow-md bg-white h-full flex flex-col justify-between">
                          <div>
                            <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                              {enrollment.className}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                              {t("code")}:{" "}
                              <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">
                                {enrollment.classCode}
                              </span>
                            </p>
                          </div>
                          <p className="text-xs text-slate-400 mt-4 pt-4 border-t">
                            {t("joined")}:{" "}
                            {new Date(
                              enrollment.enrolledAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("noClassesJoined")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
