"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpcClient } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

const joinClassSchema = (t: (key: string) => string) =>
  z.object({
    classCode: z.string().length(5, "Class code length"),
  });

type JoinClassFormData = z.infer<ReturnType<typeof joinClassSchema>>;

interface JoinClassFormProps {
  onClassJoined?: () => void;
}

export function JoinClassForm({ onClassJoined }: JoinClassFormProps = {}) {
  const t = useTranslations("JoinClass");
  const form = useForm<JoinClassFormData>({
    resolver: zodResolver(joinClassSchema(t)),
    defaultValues: {
      classCode: "",
    },
  });

  const joinClassMutation = useMutation({
    mutationFn: async (data: JoinClassFormData) => {
      return await trpcClient.education.joinClass.mutate({
        classCode: data.classCode.toUpperCase(),
      });
    },
    onSuccess: () => {
      form.reset();
      onClassJoined?.();
    },
    onError: (error: Error) => {
      form.setError("classCode", {
        type: "manual",
        message: error.message,
      });
    },
  });

  const onSubmit = (data: JoinClassFormData) => {
    joinClassMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="classCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("classCode")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("enterClassCode")}
                      maxLength={5}
                      className="uppercase"
                      autoComplete="off"
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={joinClassMutation.isPending}
              className="w-full"
            >
              {joinClassMutation.isPending ? t("joining") : t("joinClass")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
