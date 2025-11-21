import { redirect } from "next/navigation";
import TeacherDashboard from "./teacher";
import StudentDashboard from "./student";
import { headers } from "next/headers";
import { auth } from "@edura/auth";

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
        <TeacherDashboard />
      ) : role === "student" ? (
        <StudentDashboard />
      ) : role === "manager" ? (
        <div className="p-8">
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          <p>Welcome, Manager!</p>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
