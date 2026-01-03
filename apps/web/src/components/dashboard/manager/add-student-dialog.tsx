"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  UserPlus,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddStudentDialogProps {
  trigger?: React.ReactNode;
}

export function AddStudentDialog({ trigger }: AddStudentDialogProps) {
  const t = useTranslations("AddStudent");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const createStudentMutation = useMutation({
    mutationFn: (data: {
      name: string;
      email?: string;
      dateOfBirth?: string;
      parentEmail?: string;
      parentPhone?: string;
    }) => trpcClient.education.createStudent.mutate(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      if (data.email && data.generatedPassword) {
        setCreatedAccount({
          email: data.email,
          password: data.generatedPassword,
        });
        toast.success(t("success"));
      } else {
        toast.success(t("successNoLogin"));
        handleClose();
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t("error"));
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      dateOfBirth: "",
      parentEmail: "",
      parentPhone: "",
      enableLogin: true,
    },
    onSubmit: async ({ value }) => {
      await createStudentMutation.mutateAsync({
        name: value.name,
        email: value.enableLogin ? value.email : undefined,
        dateOfBirth: value.dateOfBirth || undefined,
        parentEmail: value.parentEmail || undefined,
        parentPhone: value.parentPhone || undefined,
      });
    },
  });

  const handleCopyPassword = () => {
    if (createdAccount) {
      navigator.clipboard.writeText(createdAccount.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedAccount(null);
    form.reset();
  };

  const handleAddAnother = () => {
    setCreatedAccount(null);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            {t("addStudent")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {createdAccount ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {t("accountCreated")}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">
                  {t("email")}
                </Label>
                <p className="font-medium">{createdAccount.email}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">
                  {t("generatedPassword")}
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-sm">
                    {createdAccount.password}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPassword}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {t("passwordWarning")}
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleAddAnother}>
                {t("addAnother")}
              </Button>
              <Button onClick={handleClose}>{t("done")}</Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input
                    id="name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    required
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="enableLogin">
              {(field) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableLogin"
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(!!checked)}
                  />
                  <Label
                    htmlFor="enableLogin"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("enableLogin")}
                  </Label>
                </div>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => state.values.enableLogin}>
              {(enableLogin) =>
                enableLogin ? (
                  <form.Field name="email">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor="email">{t("email")}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={t("emailPlaceholder")}
                          required
                        />
                      </div>
                    )}
                  </form.Field>
                ) : null
              }
            </form.Subscribe>

            <form.Field name="dateOfBirth">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">
                    {t("dateOfBirth")} ({t("optional")})
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="parentEmail">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="parentEmail">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {t("parentEmail")} ({t("optional")})
                    </div>
                  </Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("parentEmailPlaceholder")}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="parentPhone">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="parentPhone">
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {t("parentPhone")} ({t("optional")})
                    </div>
                  </Label>
                  <Input
                    id="parentPhone"
                    type="tel"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("parentPhonePlaceholder")}
                  />
                </div>
              )}
            </form.Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={createStudentMutation.isPending}>
                {createStudentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("creating")}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t("create")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
