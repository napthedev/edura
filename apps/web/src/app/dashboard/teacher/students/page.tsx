import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@edura/auth";
import { DashboardShell } from "@/components/dashboard/shell";
import TeacherStudentsClient from "./teacher-students-client";

export default async function TeacherStudentsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
