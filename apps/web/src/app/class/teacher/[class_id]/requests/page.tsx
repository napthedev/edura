"use client";

import { trpcClient } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ClassRequestsPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const t = useTranslations("JoinRequests");

  const {
    data: requests,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["joinRequests", classId],
    queryFn: async () => {
      if (!classId) return [];
      return await trpcClient.education.getJoinRequests.query({ classId });
    },
    enabled: !!classId,
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await trpcClient.education.approveJoinRequest.mutate({
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

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await trpcClient.education.rejectJoinRequest.mutate({ requestId });
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
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {requests?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {t("noPendingRequests")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests?.map((req) => (
            <Card key={req.requestId}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={req.student.image || ""} />
                    <AvatarFallback>
                      {req.student.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {req.student.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {req.student.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("requestedOn")}{" "}
                      {format(new Date(req.createdAt), "PPP")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => rejectMutation.mutate(req.requestId)}
                    disabled={
                      rejectMutation.isPending || approveMutation.isPending
                    }
                  >
                    {rejectMutation.isPending &&
                    rejectMutation.variables === req.requestId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 mr-1" />
                    )}
                    {t("reject")}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => approveMutation.mutate(req.requestId)}
                    disabled={
                      rejectMutation.isPending || approveMutation.isPending
                    }
                  >
                    {approveMutation.isPending &&
                    approveMutation.variables === req.requestId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    {t("approve")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
