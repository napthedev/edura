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
import { Pencil, Loader2, UserCog } from "lucide-react";

interface EditParentContactDialogProps {
  studentId: string;
  studentName: string;
  currentParentEmail: string | null;
  currentParentPhone: string | null;
  trigger?: React.ReactNode;
}

export function EditParentContactDialog({
  studentId,
  studentName,
  currentParentEmail,
  currentParentPhone,
  trigger,
}: EditParentContactDialogProps) {
  const t = useTranslations("EditParentContact");
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: {
      studentId: string;
      parentEmail?: string | null;
      parentPhone?: string | null;
    }) => trpcClient.education.updateStudentParentContact.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-students"] });
      toast.success(t("success"));
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("error"));
    },
  });

  const form = useForm({
    defaultValues: {
      parentEmail: currentParentEmail || "",
      parentPhone: currentParentPhone || "",
    },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync({
        studentId,
        parentEmail: value.parentEmail || null,
        parentPhone: value.parentPhone || null,
      });
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset form to current values when opening
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description", { name: studentName })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="parentEmail">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="parentEmail">{t("parentEmail")}</Label>
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
                <Label htmlFor="parentPhone">{t("parentPhone")}</Label>
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
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
