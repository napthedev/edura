"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import Loader from "@/components/loader";
import { ClassShell } from "@/components/class/class-shell";
import { useTranslations } from "next-intl";

type SessionUser = {
  id: string;
  role: string;
  name: string;
  email: string;
  image?: string | null;
};

export default function ClassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const classId = params.class_id as string;
  const router = useRouter();
  const t = useTranslations("ClassPage");

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const result = await authClient.getSession();
      if (result.error) throw result.error;
      return result.data;
    },
    staleTime: Infinity,
  });

  const classQuery = useQuery({
    queryKey: ["class", classId],
    queryFn: () => trpcClient.education.getClassById.query({ classId }),
  });

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!sessionQuery.data?.user) {
    router.push("/login");
    return null;
  }

  if ((sessionQuery.data?.user as unknown as SessionUser).role === "student") {
    router.push("/dashboard");
    return null;
  }

  if (classQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (classQuery.error || !classQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">{t("classNotFound")}</div>
      </div>
    );
  }

  const classData = classQuery.data;

  return (
    <ClassShell classId={classId} className={classData.className}>
      {children}
    </ClassShell>
  );
}
