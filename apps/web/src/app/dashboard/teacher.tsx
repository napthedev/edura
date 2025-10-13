"use client";
import Header from "@/components/header";
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
import { authClient } from "@/lib/auth-client";
import { trpc, trpcClient } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createClassSchema = z.object({
  className: z.string().min(1, "Class name is required"),
});

type CreateClassForm = z.infer<typeof createClassSchema>;

export default function TeacherDashboard({ session }: { session: any }) {
  const router = useRouter();
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
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold my-8">Teacher Dashboard</h1>

        <div className="grid items-start gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create New Class</CardTitle>
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
                        <FormLabel>Class Name</FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="off"
                            placeholder="Enter class name"
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
                    {createClassMutation.isPending
                      ? "Creating..."
                      : "Create Class"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Classes</CardTitle>
              </CardHeader>
              <CardContent>
                {classesQuery.isLoading ? (
                  <p>Loading classes...</p>
                ) : classesQuery.data && classesQuery.data.length > 0 ? (
                  <div className="space-y-4">
                    {classesQuery.data.map((cls) => (
                      <div key={cls.classId} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg">
                          {cls.className}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Code: {cls.classCode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created:{" "}
                          {new Date(cls.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No classes yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
