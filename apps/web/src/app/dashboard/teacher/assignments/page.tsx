import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import TeacherAssignmentsClient from "./teacher-assignments-client";
import { getSession } from "@/lib/server-auth";

export default async function TeacherAssignmentsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role!;

  if (role !== "teacher") {
    redirect("/dashboard");
  }

  return (
    <DashboardShell role={role}>
      <TeacherAssignmentsClient />
    </DashboardShell>
  );
}
