import { redirect } from "next/navigation";
import StudentScheduleClient from "./student-schedule-client";
import { getSession } from "@/lib/server-auth";

export default async function StudentSchedulePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role!;

  if (role !== "student") {
    redirect("/dashboard");
  }

  return <StudentScheduleClient />;
}
