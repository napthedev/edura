import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-auth";
import SignUpForm from "@/app/register/sign-up-form";

export default async function RegisterPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return <SignUpForm />;
}
