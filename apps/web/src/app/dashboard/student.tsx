"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function StudentDashboard({ session }: { session: any }) {
  const router = useRouter();
  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <div>
      <h2 className="text-lg font-semibold">Student Dashboard</h2>
      <p className="mt-2">Welcome, {(session?.user as any)?.name}</p>
      <p className="mt-2">API: {privateData.data?.message}</p>

      <div className="mt-4">
        <Button
          variant="destructive"
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/");
                },
              },
            })
          }
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
