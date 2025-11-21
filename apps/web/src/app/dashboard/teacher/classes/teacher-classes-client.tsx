"use client";
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
import { trpcClient } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

const createClassSchema = z.object({
  className: z.string().min(1, "Class name is required"),
});

type CreateClassForm = z.infer<typeof createClassSchema>;

export default function TeacherClassesClient() {
  const t = useTranslations("TeacherDashboard");
  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: () => trpcClient.education.getClasses.query(),
  });
  const createClassMutation = useMutation({
    mutationFn: async (data: CreateClassForm) => {
      return await trpcClient.education.createClass.mutate(data);
    },
    onSuccess: () => {
      form.reset();
      classesQuery.refetch();
    },
  });

  const form = useForm<CreateClassForm>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      className: "",
    },
  });

  const onSubmit = (data: CreateClassForm) => {
    createClassMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("yourClasses")}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle>{t("createNewClass")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="className"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("className")}</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          placeholder={t("enterClassName")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createClassMutation.isPending}
                >
                  {createClassMutation.isPending ? (
                    t("creating")
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("createClass")}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {classesQuery.isLoading ? (
          <div className="md:col-span-2 lg:col-span-2">
            <Loader />
          </div>
        ) : classesQuery.data && classesQuery.data.length > 0 ? (
          classesQuery.data.map((cls) => (
            <Link
              className="block group"
              href={`/class/teacher/${cls.classId}`}
              key={cls.classId}
            >
              <Card className="shadow-sm border-none h-full">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                      {cls.className}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {t("code")}:{" "}
                      <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">
                        {cls.classCode}
                      </span>
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 pt-4 border-t">
                    {t("created")}:{" "}
                    {new Date(cls.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-2 text-center py-8 text-muted-foreground">
            {t("noClassesYet")}
          </div>
        )}
      </div>
    </div>
  );
}
