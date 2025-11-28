"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Copy, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";
import Loader from "@/components/loader";

export default function SettingsPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const router = useRouter();
  const t = useTranslations("StudentClassPage");
  const ts = useTranslations("ClassPageSettings");

  const classQuery = useQuery({
    queryKey: ["class", classId],
    queryFn: () => trpcClient.education.getClassById.query({ classId }),
  });

  const leaveClassMutation = useMutation({
    mutationFn: () => trpcClient.education.leaveClass.mutate({ classId }),
    onSuccess: () => {
      toast.success(t("leftClassSuccess"));
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(`${t("failedToLeaveClass")}: ${error.message}`);
    },
  });

  const copyClassCode = () => {
    if (classQuery.data?.classCode) {
      navigator.clipboard.writeText(classQuery.data.classCode);
      toast.success(t("classCodeCopied"));
    }
  };

  const handleLeaveClass = () => {
    leaveClassMutation.mutate();
  };

  if (classQuery.isLoading) {
    return <Loader />;
  }

  if (!classQuery.data) {
    return <div>{ts("classInformation")}</div>;
  }

  const classData = classQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          {t("settings")}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{ts("classInformation")}</CardTitle>
          <CardDescription>{ts("viewClassDetails")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">{t("classCode")}</p>
              <p className="text-sm text-muted-foreground">
                {classData.classCode}
              </p>
            </div>
            <Button variant="outline" onClick={copyClassCode}>
              <Copy className="w-4 h-4 mr-2" />
              {t("copyCode")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">{ts("dangerZone")}</CardTitle>
          <CardDescription>{ts("irreversibleActions")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <p className="font-medium text-red-900">{t("leaveClass")}</p>
              <p className="text-sm text-red-700">
                {t("leaveClassDescription")}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("leaveClass")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("leaveClassTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("leaveClassDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLeaveClass}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {leaveClassMutation.isPending
                      ? t("leaving")
                      : t("leaveClassConfirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
