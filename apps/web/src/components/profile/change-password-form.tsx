"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Loader2 } from "lucide-react";

export default function ChangePasswordForm() {
  const t = useTranslations("Profile");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changePasswordSchema = z
    .object({
      currentPassword: z
        .string()
        .min(1, t("changePassword.errors.currentPasswordRequired")),
      newPassword: z
        .string()
        .min(8, t("changePassword.errors.passwordMin"))
        .regex(/[A-Z]/, t("changePassword.errors.passwordUppercase"))
        .regex(/[0-9]/, t("changePassword.errors.passwordNumber"))
        .regex(/[^A-Za-z0-9]/, t("changePassword.errors.passwordSpecial")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("changePassword.errors.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

  type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    try {
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (result.error) {
        if (result.error.code === "INVALID_PASSWORD") {
          toast.error(t("changePassword.errors.incorrectPassword"));
        } else {
          toast.error(result.error.message || t("changePassword.errorMessage"));
        }
        return;
      }

      toast.success(t("changePassword.successMessage"));
      form.reset();
    } catch {
      toast.error(t("changePassword.errorMessage"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          {t("changePassword.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              {t("changePassword.currentPassword")}
            </Label>
            <PasswordInput
              id="currentPassword"
              {...form.register("currentPassword")}
              placeholder={t("changePassword.currentPasswordPlaceholder")}
              showPasswordLabel={t("common.showPassword")}
              hidePasswordLabel={t("common.hidePassword")}
              aria-invalid={!!form.formState.errors.currentPassword}
            />
            {form.formState.errors.currentPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">
              {t("changePassword.newPassword")}
            </Label>
            <PasswordInput
              id="newPassword"
              {...form.register("newPassword")}
              placeholder={t("changePassword.newPasswordPlaceholder")}
              showPasswordLabel={t("common.showPassword")}
              hidePasswordLabel={t("common.hidePassword")}
              aria-invalid={!!form.formState.errors.newPassword}
            />
            {form.formState.errors.newPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("changePassword.confirmPassword")}
            </Label>
            <PasswordInput
              id="confirmPassword"
              {...form.register("confirmPassword")}
              placeholder={t("changePassword.confirmPasswordPlaceholder")}
              showPasswordLabel={t("common.showPassword")}
              hidePasswordLabel={t("common.hidePassword")}
              aria-invalid={!!form.formState.errors.confirmPassword}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("changePassword.submitting")}
              </>
            ) : (
              <>
                <KeyRound className="size-4" />
                {t("changePassword.submit")}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
