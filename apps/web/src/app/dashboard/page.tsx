import { redirect } from "next/navigation";
import Dashboard from "./dashboard";
import TeacherDashboard from "./teacher";
import StudentDashboard from "./student";
import { headers } from "next/headers";
import { auth } from "@edura/auth";
import { authClient } from "@/lib/auth-client";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role!;

  return (
    <>
      {role === "teacher" ? (
        <TeacherDashboard session={session} />
      ) : role === "student" ? (
        <StudentDashboard session={session} />
      ) : (
        <></>
      )}
    </>
  );
}
