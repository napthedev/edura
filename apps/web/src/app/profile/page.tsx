"use client";

import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import Loader from "@/components/loader";
import ProfileForm from "@/components/profile/profile-form";
import EmailManager from "@/components/profile/email-manager";
import PhoneManager from "@/components/profile/phone-manager";
import Header from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const tUserMenu = useTranslations("UserMenu");
  const { data: session, isPending: sessionLoading } = useSession();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => trpcClient.profile.getProfile.query(),
    enabled: !!session?.user,
  });

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!session?.user) {
    redirect("/login");
  }

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const profile = profileQuery.data;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t("profileNotFound")}</p>
      </div>
    );
  }

  const role = profile.role;
  const roleLabel =
    role === "teacher"
      ? tUserMenu("teacher")
      : role === "manager"
      ? tUserMenu("manager")
      : tUserMenu("student");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">
          {t("title")}
        </h1>

        <div className="space-y-6">
          {/* Profile Header Card */}
          <Card className="shadow-sm border-none">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {profile.image ? (
                    <AvatarImage src={profile.image} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {profile.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">{profile.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {profile.email}
                  </p>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">{roleLabel}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information Form */}
          <ProfileForm
            profile={{
              name: profile.name,
              dateOfBirth: profile.dateOfBirth
                ? new Date(profile.dateOfBirth)
                : null,
              address: profile.address,
              grade: profile.grade,
              schoolName: profile.schoolName,
              role: profile.role,
            }}
          />

          {/* Email Manager */}
          <EmailManager emails={profile.emails} />

          {/* Phone Manager */}
          <PhoneManager phones={profile.phones} />
        </div>
      </main>
    </div>
  );
}
