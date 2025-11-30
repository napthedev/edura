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
import {
  Copy,
  Edit,
  Trash2,
  Settings,
  GraduationCap,
  Calendar,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const ts = useTranslations("ClassPageSettings");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    className: "",
    subject: "",
    schedule: "",
  });

  const classQuery = useQuery({
    queryKey: ["class", classId],
    queryFn: () => trpcClient.education.getClassById.query({ classId }),
  });

  // Update form data when class data is loaded
  useEffect(() => {
    if (classQuery.data) {
      setEditFormData({
        className: classQuery.data.className || "",
        subject: classQuery.data.subject || "",
        schedule: classQuery.data.schedule || "",
      });
    }
  }, [classQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (data: {
      className?: string;
      subject?: string;
      schedule?: string;
    }) => trpcClient.education.updateClass.mutate({ classId, ...data }),
    onSuccess: () => {
      toast.success(ts("classUpdatedSuccess"));
      setEditDialogOpen(false);
      classQuery.refetch();
    },
    onError: (error) => {
      toast.error(`${ts("failedToUpdate")}: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => trpcClient.education.deleteClass.mutate({ classId }),
    onSuccess: () => {
      toast.success(ts("classDeletedSuccess"));
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(`${ts("failedToDelete")}: ${error.message}`);
    },
  });

  const copyClassCode = () => {
    if (classQuery.data?.classCode) {
      navigator.clipboard.writeText(classQuery.data.classCode);
      toast.success(ts("classCodeCopied"));
    }
  };

  const handleUpdate = () => {
    if (editFormData.className.trim()) {
      updateMutation.mutate({
        className: editFormData.className.trim(),
        subject: editFormData.subject.trim() || undefined,
        schedule: editFormData.schedule.trim() || undefined,
      });
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
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          {t("settings")}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{ts("classInformation")}</CardTitle>
          <CardDescription>{ts("manageClassDetails")}</CardDescription>
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
            <div className="flex-1 mr-4">
              <p className="font-medium flex items-center gap-2">
                <BookOpen className="size-4" />
                {t("renameClass")}
              </p>
              <p className="text-sm text-muted-foreground">
                {classData.className}
              </p>
            </div>
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  {t("renameClassButton")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{ts("updateClass")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="className"
                      className="flex items-center gap-2"
                    >
                      <BookOpen className="size-4" />
                      {t("renameClass")}
                    </Label>
                    <Input
                      id="className"
                      value={editFormData.className}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          className: e.target.value,
                        }))
                      }
                      placeholder={t("enterNewClassName")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="subject"
                      className="flex items-center gap-2"
                    >
                      <GraduationCap className="size-4" />
                      {ts("subject")}
                    </Label>
                    <Input
                      id="subject"
                      value={editFormData.subject}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          subject: e.target.value,
                        }))
                      }
                      placeholder={ts("subjectPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="schedule"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="size-4" />
                      {ts("schedule")}
                    </Label>
                    <Input
                      id="schedule"
                      value={editFormData.schedule}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          schedule: e.target.value,
                        }))
                      }
                      placeholder={ts("schedulePlaceholder")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    disabled={
                      updateMutation.isPending || !editFormData.className.trim()
                    }
                  >
                    {updateMutation.isPending
                      ? ts("updating")
                      : ts("updateClass")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1 mr-4">
              <p className="font-medium flex items-center gap-2">
                <GraduationCap className="size-4" />
                {ts("subject")}
              </p>
              <p className="text-sm text-muted-foreground">
                {classData.subject || ts("noSubject")}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1 mr-4">
              <p className="font-medium flex items-center gap-2">
                <Calendar className="size-4" />
                {ts("schedule")}
              </p>
              <p className="text-sm text-muted-foreground">
                {classData.schedule || ts("noSchedule")}
              </p>
            </div>
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
