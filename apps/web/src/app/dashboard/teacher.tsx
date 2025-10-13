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
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>
        <div className="max-w-md mb-8">
          <h2 className="text-xl font-semibold mb-2">Create New Class</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="className"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter class name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={createClassMutation.isPending}>
                {createClassMutation.isPending ? "Creating..." : "Create Class"}
              </Button>
            </form>
          </Form>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Your Classes</h2>
          {classesQuery.isLoading ? (
            <p>Loading classes...</p>
          ) : classesQuery.data && classesQuery.data.length > 0 ? (
            <ul className="space-y-2">
              {classesQuery.data.map((cls) => (
                <li key={cls.classId} className="border p-4 rounded">
                  <h3 className="font-bold">{cls.className}</h3>
                  <p>Code: {cls.classCode}</p>
                  <p>Created: {new Date(cls.createdAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No classes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
