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

const joinClassSchema = z.object({
  classCode: z.string().length(5, "Class code must be exactly 5 characters"),
});

type JoinClassFormData = z.infer<typeof joinClassSchema>;

interface JoinClassFormProps {
  onClassJoined?: () => void;
}

export function JoinClassForm({ onClassJoined }: JoinClassFormProps = {}) {
  const form = useForm<JoinClassFormData>({
    resolver: zodResolver(joinClassSchema),
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
        <CardTitle>Join a Class</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="classCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter 5-character class code"
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
              {joinClassMutation.isPending ? "Joining..." : "Join Class"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
