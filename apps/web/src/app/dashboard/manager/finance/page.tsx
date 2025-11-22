"use client";

import { useSession } from "@/lib/auth-client";
import { DashboardShell } from "@/components/dashboard/shell";
import Loader from "@/components/loader";
import { redirect } from "next/navigation";
import FinanceView from "@/components/dashboard/manager/finance-view";

export default function FinancePage() {
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

  // Force "manager" role for this page to show the correct sidebar links
  const role = "manager";

  return (
    <DashboardShell role={role}>
      <FinanceView />
    </DashboardShell>
  );
}
