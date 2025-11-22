"use client";

import { redirect } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Loader from "@/components/loader";

export default function DashboardPage() {
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

  if (role) {
    redirect(`/dashboard/${role}` as any);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader />
    </div>
  );
}
