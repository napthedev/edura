import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-auth";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;

  if (role !== "student") {
    redirect(`/dashboard/${role}` as any);
  }

  return <DashboardShell role="student">{children}</DashboardShell>;
}
