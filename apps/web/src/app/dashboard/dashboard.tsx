"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";

export default function Dashboard({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  const router = useRouter();
  const privateData = useQuery(trpc.privateData.queryOptions());

  // runtime-safe access to role which may not be present in the inferred session type
  const role = (session?.user as any)?.role ?? "teacher";

  return (
    <>
      <p>API: {privateData.data?.message}</p>
      <p>Account type: {role}</p>
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
    </>
  );
}
