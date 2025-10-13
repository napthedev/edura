"use client";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function TeacherDashboard({ session }: { session: any }) {
  const router = useRouter();
  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <div className="min-h-screen">
      <Header />
    </div>
  );
}
