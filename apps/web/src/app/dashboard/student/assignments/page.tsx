import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@edura/auth";
import { DashboardShell } from "@/components/dashboard/shell";
import StudentAssignmentsClient from "./student-assignments-client";

export default async function StudentAssignmentsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
