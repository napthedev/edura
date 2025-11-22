import { redirect } from "next/navigation";
import StudentClassesClient from "./student-classes-client";
import { getSession } from "@/lib/server-auth";

export default async function StudentClassesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role!;

  if (role !== "student") {
    redirect("/dashboard");
  }

  return <StudentClassesClient />;
}
