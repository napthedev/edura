"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { DashboardShell } from "@/components/dashboard/shell";
import Loader from "@/components/loader";
import { redirect } from "next/navigation";
import FinanceView from "@/components/dashboard/manager/finance-view";

export default function FinancePage() {
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

  // Force "manager" role for this page to show the correct sidebar links
  const role = "manager";

  return (
    <DashboardShell role={role}>
      <FinanceView />
    </DashboardShell>
  );
}
