import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-auth";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function ManagerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;

  // Assuming 'manager' is the role string. If it's 'admin', I might need to adjust.
  // Based on sidebar.tsx, it uses 'manager'.
  if (role !== "manager") {
    redirect(`/dashboard/${role}` as any);
  }

  return <DashboardShell role="manager">{children}</DashboardShell>;
}
