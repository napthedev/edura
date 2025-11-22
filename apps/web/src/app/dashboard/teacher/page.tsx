"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { DashboardShell } from "@/components/dashboard/shell";
import Loader from "@/components/loader";
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
import { useTranslations } from "next-intl";
import { Users, BookOpen, Plus } from "lucide-react";

const createClassSchema = z.object({
  className: z.string().min(1, "Class name is required"),
});

type CreateClassForm = z.infer<typeof createClassSchema>;

export default function TeacherDashboardPage() {
  const t = useTranslations("TeacherDashboard");
  const { data: session, isPending: loading } = useSession();

  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: () => trpcClient.education.getClasses.query(),
    enabled: !!session?.user && (session.user as any).role === "teacher",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;

  if (role !== "teacher") {
    redirect(`/dashboard/${role}` as any);
  }

  return (
    <DashboardShell role="teacher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("title")}
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Classes
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {classesQuery.data?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Across all classes
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none sticky top-24">
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
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-sm border-none">
              <CardHeader>
                <CardTitle>{t("yourClasses")}</CardTitle>
              </CardHeader>
              <CardContent>
                {classesQuery.isLoading ? (
                  <Loader />
                ) : classesQuery.data && classesQuery.data.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {classesQuery.data.map((cls) => (
                      <Link
                        className="block group"
                        href={`/class/teacher/${cls.classId}`}
                        key={cls.classId}
                      >
                        <div className="border rounded-xl p-5 transition-all hover:shadow-md bg-white h-full flex flex-col justify-between">
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
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("noClassesYet")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
