"use client";

import { trpcClient } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function StudentRequestsPage() {
  const {
    data: requests,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["myJoinRequests"],
    queryFn: async () => {
      return await trpcClient.education.getMyJoinRequests.query();
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await trpcClient.education.withdrawJoinRequest.mutate({
        requestId,
      });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Class Join Requests</h1>

      {requests?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No requests found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests?.map((req) => (
            <Card key={req.requestId}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-semibold text-lg">{req.class.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Code: {req.class.code}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested on {format(new Date(req.createdAt), "PPP")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      req.status === "approved"
                        ? "default"
                        : req.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </Badge>

                  {req.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => withdrawMutation.mutate(req.requestId)}
                      disabled={withdrawMutation.isPending}
                    >
                      {withdrawMutation.isPending
                        ? "Withdrawing..."
                        : "Withdraw"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
