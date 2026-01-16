"use client";

import { redirect } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Loader from "@/components/loader";
import { JoinClassForm } from "@/components/join-class-form";
import { BillingOverviewCard } from "@/components/dashboard/billing-overview-card";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  LayoutDashboard,
  FolderOpen,
  GraduationCap,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { mockData } from "@/lib/mock";
import {
  GradeTrendChart,
  AssignmentCompletionChart,
  GradeDistributionChart,
} from "@/components/dashboard/student";

export default function StudentDashboardPage() {
  const t = useTranslations("StudentDashboard");
  const { data: session, isPending: loading } = useSession();

  const studentClassesQuery = useQuery({
    queryKey: ["student-classes"],
    queryFn: () => trpcClient.education.getStudentClasses.query(),
    enabled: !!session?.user && (session.user as any).role === "student",
  });

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

  if (role !== "student") {
    redirect(`/dashboard/${role}` as any);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
        <LayoutDashboard className="h-6 w-6" />
        {t("title")}
      </h1>

      {/* Performance Analytics Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GradeTrendChart data={mockData.studentAnalytics.gradeHistory} />
        <AssignmentCompletionChart
          data={mockData.studentAnalytics.assignmentsByClass}
        />
        <GradeDistributionChart
          data={mockData.studentAnalytics.gradeDistribution}
        />
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
            <p className="text-xs text-muted-foreground">{t("dueThisWeek")}</p>
          </CardContent>
        </Card>

        <BillingOverviewCard />

        <JoinClassForm
          className="shadow-sm border-none sticky top-24"
          onClassJoined={() => studentClassesQuery.refetch()}
        />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
        <BookOpen className="h-6 w-6" />
        {t("myClasses")}
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {studentClassesQuery.isLoading ? (
          <Loader />
        ) : studentClassesQuery.data && studentClassesQuery.data.length > 0 ? (
          <>
            {studentClassesQuery.data.map((enrollment) => (
              <Link
                href={`/class/student/${enrollment.classId}`}
                key={enrollment.classId}
                className="block group"
              >
                <div className="border rounded-xl p-5 transition-all hover:shadow-md bg-white h-full flex flex-col justify-between">
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
                </div>
              </Link>
            ))}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{t("noClassesJoined")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
