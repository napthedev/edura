"use client";

import AuthHeader from "@/components/auth/header";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { PasswordInput } from "../../components/ui/password-input";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import Link from "next/link";

export default function SignInForm() {
  const router = useRouter();
  const t = useTranslations("Auth");

  const getErrorMessage = (error: { code?: string; message?: string }) => {
    switch (error.code) {
      case "INVALID_EMAIL_OR_PASSWORD":
        return t("errors.invalidCredentials");
      case "INVALID_EMAIL":
        return t("validation.invalidEmail");
      default:
        return error.message || t("errors.generic");
    }
  };

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      if (!value.email.trim() || !value.password.trim()) {
        toast.error(t("validation.fieldsRequired"));
        return;
      }

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
            toast.error(getErrorMessage(error.error));
          },
        }
      );
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
                    </div>
                  )}
                </form.Field>
              </div>

              <div>
                <form.Field name="password">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>{t("password")}</Label>
                      <PasswordInput
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        showPasswordLabel={t("showPassword")}
                        hidePasswordLabel={t("hidePassword")}
                      />
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
                    {state.isSubmitting ? (
                      t("submitting")
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        {t("signIn")}
                      </>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                {t("noAccount")}{" "}
                <Link
                  href="/contact"
                  className="text-black font-medium hover:underline"
                >
                  {t("contactAdmin")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
