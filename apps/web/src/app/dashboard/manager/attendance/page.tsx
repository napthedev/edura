import { redirect } from "next/navigation";
import ManagerAttendanceClient from "./manager-attendance-client";
import { getSession } from "@/lib/server-auth";

export default async function ManagerAttendancePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role!;

  if (role !== "manager") {
    redirect("/dashboard");
  }

  return <ManagerAttendanceClient />;
}
