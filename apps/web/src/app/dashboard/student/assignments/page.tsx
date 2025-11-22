import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import StudentAssignmentsClient from "./student-assignments-client";
import { getSession } from "@/lib/server-auth";

export default async function StudentAssignmentsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role!;

  if (role !== "student") {
    redirect("/dashboard");
  }

  return (
    <DashboardShell role={role}>
      <StudentAssignmentsClient />
    </DashboardShell>
  );
}
