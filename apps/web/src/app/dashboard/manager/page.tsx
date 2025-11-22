"use client";

import { redirect } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { DashboardShell } from "@/components/dashboard/shell";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";

export default function ManagerDashboardPage() {
  const t = useTranslations("Dashboard");
  const { data: session, isPending: loading } = useSession();

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
