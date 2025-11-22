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
import { Copy, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const router = useRouter();
  const t = useTranslations("ClassPage");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");

  const classQuery = useQuery({
    queryKey: ["class", classId],
    queryFn: () => trpcClient.education.getClassById.query({ classId }),
  });

  const renameMutation = useMutation({
    mutationFn: (newName: string) =>
      trpcClient.education.renameClass.mutate({ classId, newName }),
    onSuccess: () => {
      toast.success("Class renamed successfully");
      setRenameDialogOpen(false);
      classQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to rename class: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => trpcClient.education.deleteClass.mutate({ classId }),
    onSuccess: () => {
      toast.success("Class deleted successfully");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(`Failed to delete class: ${error.message}`);
    },
  });

  const copyClassCode = () => {
    if (classQuery.data?.classCode) {
      navigator.clipboard.writeText(classQuery.data.classCode);
      toast.success("Class code copied to clipboard");
    }
  };

  const handleRename = () => {
    if (newClassName.trim()) {
      renameMutation.mutate(newClassName.trim());
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (classQuery.isLoading) {
    return <Loader />;
  }

  if (classQuery.error || !classQuery.data) {
    return <div className="text-center text-red-500">{t("classNotFound")}</div>;
  }

  const classData = classQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("settings")}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Information</CardTitle>
          <CardDescription>
            Manage your class details and settings.
          </CardDescription>
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

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">{t("renameClass")}</p>
              <p className="text-sm text-muted-foreground">
                Change the name of your class.
              </p>
            </div>
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  {t("renameClassButton")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("renameClass")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Input
                      id="className"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder={t("enterNewClassName")}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setRenameDialogOpen(false)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      onClick={handleRename}
                      disabled={
                        renameMutation.isPending || !newClassName.trim()
                      }
                    >
                      {renameMutation.isPending
                        ? t("renaming")
                        : t("renameButton")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for this class.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <p className="font-medium text-red-900">{t("deleteClass")}</p>
              <p className="text-sm text-red-700">
                {t("deleteClassDescription")}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("deleteClassButton")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteClass")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("deleteClassDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending
                      ? t("deleting")
                      : t("deleteButton")}
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
