"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { DashboardShell } from "@/components/dashboard/shell";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";

export default function ManagerDashboardPage() {
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

  if (role !== "manager") {
    redirect(`/dashboard/${role}` as any);
  }

  return (
    <DashboardShell role="manager">
      <div className="p-8">
        <h1 className="text-2xl font-bold">{t("managerTitle")}</h1>
        <p>{t("welcomeManager")}</p>
      </div>
    </DashboardShell>
  );
}
