"use client";

import AuthHeader from "@/components/auth/header";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserPlus, LogIn } from "lucide-react";

export default function SignUpForm() {
  const router = useRouter();
  const t = useTranslations("Auth");

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "teacher",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
          // @ts-ignore
          role: value.role,
        },
        {
          onSuccess: () => {
            router.push("/dashboard");
            toast.success(t("signUpSuccess"));
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, t("validation.nameMin")),
        role: z.enum(["teacher", "student"]),
        email: z.email(t("validation.invalidEmail")),
        password: z.string().min(8, t("validation.passwordMin")),
      }),
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader />

      {/* Centered modal overlay */}
      <div className="mt-16">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h1 className="mb-6 text-center text-3xl font-bold">
              {t("createAccount")}
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
                <form.Field name="role">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>{t("accountType")}</Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={`cursor-pointer rounded-md px-3 py-2 border ${
                            field.state.value === "teacher"
                              ? "bg-black text-white"
                              : "bg-white"
                          }`}
                          onClick={() => {
                            field.handleChange("teacher");
                          }}
                        >
                          {t("teacher")}
                        </button>
                        <button
                          type="button"
                          className={`cursor-pointer rounded-md px-3 py-2 border ${
                            field.state.value === "student"
                              ? "bg-black text-white"
                              : "bg-white"
                          }`}
                          onClick={() => {
                            field.handleChange("student");
                          }}
                        >
                          {t("student")}
                        </button>
                      </div>
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
                <form.Field name="name">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>{t("name")}</Label>
                      <Input
                        id={field.name}
                        name={field.name}
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
                    {state.isSubmitting ? (
                      t("submitting")
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t("signUp")}
                      </>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </form>

            <div className="mt-4 text-center">
              <Link href="/login">
                <Button
                  variant="link"
                  onClick={() => router.push("/login")}
                  className="text-black"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {t("haveAccount")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
