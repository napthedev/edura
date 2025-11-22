import SignInForm from "@/app/login/sign-in-form";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-auth";

export default async function LoginPage() {
  // Server-side check: if session exists, redirect to dashboard
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <SignInForm />;
}
