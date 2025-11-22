import { redirect } from "next/navigation";
import TeacherClassesClient from "./teacher-classes-client";
import { getSession } from "@/lib/server-auth";

export default async function TeacherClassesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role!;

  if (role !== "teacher") {
    redirect("/dashboard");
  }

  return <TeacherClassesClient />;
}
