"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpcClient } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.date().nullable().optional(),
  address: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  schoolName: z.string().nullable().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  profile: {
    name: string;
    dateOfBirth: Date | null;
    address: string | null;
    grade: string | null;
    schoolName: string | null;
    role: string;
  };
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const t = useTranslations("Profile");
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile.name,
      dateOfBirth: profile.dateOfBirth,
      address: profile.address,
      grade: profile.grade,
      schoolName: profile.schoolName,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await trpcClient.profile.updateProfile.mutate(data);
    },
    onSuccess: () => {
      toast.success(t("successMessage"));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("errorMessage"));
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const isStudent = profile.role === "student";

  return (
    <Card className="shadow-sm border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t("personalInfo")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder={t("namePlaceholder")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label>{t("dateOfBirth")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("dateOfBirth") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("dateOfBirth") ? (
                    format(form.watch("dateOfBirth")!, "PPP")
                  ) : (
                    <span>{t("dateOfBirthPlaceholder")}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("dateOfBirth") ?? undefined}
                  onSelect={(date) =>
                    form.setValue("dateOfBirth", date ?? null)
                  }
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  captionLayout="dropdown"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">{t("address")}</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder={t("addressPlaceholder")}
            />
          </div>

          {/* Student-specific fields */}
          {isStudent && (
            <>
              {/* Grade */}
              <div className="space-y-2">
                <Label htmlFor="grade">{t("grade")}</Label>
                <Input
                  id="grade"
                  {...form.register("grade")}
                  placeholder={t("gradePlaceholder")}
                />
              </div>

              {/* School Name */}
              <div className="space-y-2">
                <Label htmlFor="schoolName">{t("schoolName")}</Label>
                <Input
                  id="schoolName"
                  {...form.register("schoolName")}
                  placeholder={t("schoolNamePlaceholder")}
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full"
          >
            {updateProfileMutation.isPending ? t("saving") : t("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
