"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const createModuleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type CreateModuleForm = z.infer<typeof createModuleSchema>;

interface CreateModuleDialogProps {
  classId: string;
}

export function CreateModuleDialog({ classId }: CreateModuleDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslations("CreateModule");

  const form = useForm<CreateModuleForm>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: CreateModuleForm) => {
      return await trpcClient.education.createModule.mutate({
        classId,
        ...data,
      });
    },
    onSuccess: () => {
      toast.success(t("moduleCreatedSuccess"));
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({
        queryKey: [["education", "getClassModules"], { classId }],
      });
    },
    onError: (error) => {
      toast.error(`${t("failedToCreateModule")}: ${error.message}`);
    },
  });

  const onSubmit = (data: CreateModuleForm) => {
    createModuleMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          {t("createModule")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            {t("createNewModule")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("moduleTitlePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("descriptionOptional")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("moduleDescriptionPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={createModuleMutation.isPending}>
                {createModuleMutation.isPending ? t("creating") : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
