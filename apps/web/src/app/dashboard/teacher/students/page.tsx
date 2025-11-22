import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import TeacherStudentsClient from "./teacher-students-client";
import { getSession } from "@/lib/server-auth";

export default async function TeacherStudentsPage() {
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
      <TeacherStudentsClient />
    </DashboardShell>
  );
}
