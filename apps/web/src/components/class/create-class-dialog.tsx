"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpcClient } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTranslations } from "next-intl";
import { Plus, BookOpen, GraduationCap, Calendar } from "lucide-react";

const createClassSchema = z.object({
  className: z.string().min(1, "Class name is required"),
  subject: z.string().optional(),
  schedule: z.string().optional(),
});

type CreateClassFormData = z.infer<typeof createClassSchema>;

interface CreateClassDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateClassDialog({
  onSuccess,
  trigger,
}: CreateClassDialogProps) {
  const t = useTranslations("CreateClassDialog");
  const [open, setOpen] = useState(false);

  const form = useForm<CreateClassFormData>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      className: "",
      subject: "",
      schedule: "",
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async (data: CreateClassFormData) => {
      return await trpcClient.education.createClass.mutate({
        className: data.className,
        subject: data.subject || undefined,
        schedule: data.schedule || undefined,
      });
    },
    onSuccess: () => {
      form.reset();
      setOpen(false);
      onSuccess?.();
    },
  });

  const onSubmit = (data: CreateClassFormData) => {
    createClassMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="size-4" />
            {t("createClass")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="className"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <BookOpen className="size-4" />
                    {t("className")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      placeholder={t("classNamePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <GraduationCap className="size-4" />
                    {t("subject")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      placeholder={t("subjectPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="size-4" />
                    {t("schedule")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      placeholder={t("schedulePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={createClassMutation.isPending}>
                {createClassMutation.isPending ? (
                  t("creating")
                ) : (
                  <>
                    <Plus className="size-4" />
                    {t("createClass")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
