import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-auth";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;

  if (role !== "teacher") {
    redirect(`/dashboard/${role}` as any);
  }

  return <DashboardShell role="teacher">{children}</DashboardShell>;
}
