"use client";

import AuthHeader from "@/components/auth/header";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const router = useRouter();
  const t = useTranslations("Auth");

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            router.push("/dashboard");
            toast.success(t("signInSuccess"));
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email(t("validation.invalidEmail")),
        password: z.string().min(8, t("validation.passwordMin")),
      }),
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader />

      <div className="mt-16">
        <div className="z-40 flex items-center justify-center">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h1 className="mb-6 text-center text-3xl font-bold">
              {t("welcomeBack")}
            </h1>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              <div>
                <form.Field name="email">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>{t("email")}</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {field.state.meta.errors.map((error) => (
                        <p key={error?.message} className="text-red-500">
                          {error?.message}
                        </p>
                      ))}
                    </div>
                  )}
                </form.Field>
              </div>

              <div>
                <form.Field name="password">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>{t("password")}</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {field.state.meta.errors.map((error) => (
                        <p key={error?.message} className="text-red-500">
                          {error?.message}
                        </p>
                      ))}
                    </div>
                  )}
                </form.Field>
              </div>

              <form.Subscribe>
                {(state) => (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!state.canSubmit || state.isSubmitting}
                  >
                    {state.isSubmitting ? t("submitting") : t("signIn")}
                  </Button>
                )}
              </form.Subscribe>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => router.push("/register" as any)}
                className="text-black"
              >
                {t("needAccount")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
