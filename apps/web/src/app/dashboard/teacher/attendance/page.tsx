import { redirect } from "next/navigation";
import TeacherAttendanceClient from "./teacher-attendance-client";
import { getSession } from "@/lib/server-auth";

export default async function TeacherAttendancePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role!;

  if (role !== "teacher") {
    redirect("/dashboard");
  }

  return <TeacherAttendanceClient />;
}
