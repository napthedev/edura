import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@edura/auth";
import SignUpForm from "@/app/register/sign-up-form";

export default async function RegisterPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect("/dashboard");
  }

  return <SignUpForm />;
}
