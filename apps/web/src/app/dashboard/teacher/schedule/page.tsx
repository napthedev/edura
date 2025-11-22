import { redirect } from "next/navigation";
import TeacherScheduleClient from "./teacher-schedule-client";
import { getSession } from "@/lib/server-auth";

export default async function TeacherSchedulePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role!;

  if (role !== "teacher") {
    redirect("/dashboard");
  }

  return <TeacherScheduleClient />;
}
