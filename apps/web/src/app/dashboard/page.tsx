"use client";

import { redirect } from "next/navigation";
import TeacherDashboard from "./teacher";
import StudentDashboard from "./student";
import { authClient } from "@/lib/auth-client";
import { DashboardShell } from "@/components/dashboard/shell";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session?.data?.user) {
    redirect("/login");
  }

  const role = (session.data.user as any)?.role!;

  return (
    <DashboardShell role={role}>
      {role === "teacher" ? (
        <TeacherDashboard />
      ) : role === "student" ? (
        <StudentDashboard />
      ) : role === "manager" ? (
        <div className="p-8">
          <h1 className="text-2xl font-bold">{t("managerTitle")}</h1>
          <p>{t("welcomeManager")}</p>
        </div>
      ) : (
        <></>
      )}
    </DashboardShell>
  );
}
