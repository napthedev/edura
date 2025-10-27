"use client";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CreateAnnouncementForm from "@/components/announcement/create-announcement-form";
import AnnouncementList from "@/components/announcement/announcement-list";
import CreateScheduleForm from "@/components/schedule/schedule-form";
import ScheduleCalendar from "@/components/schedule/schedule-calendar";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";

type SessionUser = {
  id: string;
  role: string;
  name: string;
  email: string;
  image?: string | null;
};

export default function ClassPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState("announcement");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const t = useTranslations("ClassPage");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") || "announcement";
      setCurrentTab(hash);
    };

    // Set initial hash if not present
    if (!window.location.hash) {
      window.location.hash = "announcement";
    } else {
      handleHashChange();
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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

  const studentsQuery = useQuery({
    queryKey: ["class-students", classId],
    queryFn: () => trpcClient.education.getClassStudents.query({ classId }),
  });

  const assignmentsQuery = useQuery({
    queryKey: ["class-assignments", classId],
    queryFn: () => trpcClient.education.getClassAssignments.query({ classId }),
  });

  const lecturesQuery = useQuery({
    queryKey: ["class-lectures", classId],
    queryFn: () => trpcClient.education.getClassLectures.query({ classId }),
  });

  const schedulesQuery = useQuery({
    queryKey: ["class-schedules", classId],
    queryFn: () => trpcClient.education.getClassSchedules.query({ classId }),
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

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      trpcClient.education.deleteAssignment.mutate({ assignmentId }),
    onSuccess: () => {
      toast.success("Assignment deleted successfully");
      assignmentsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete assignment: ${error.message}`);
    },
  });

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Loader />
        </div>
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

  const copyClassCode = () => {
    if (classQuery.data?.classCode) {
      navigator.clipboard.writeText(classQuery.data.classCode);
      toast.success("Class code copied to clipboard");
    }
  };

  const copyAssignmentUrl = (assignmentId: string) => {
    const url = `${window.location.origin}/do-assignment/${assignmentId}`;
    navigator.clipboard.writeText(url);
    toast.success("Assignment URL copied to clipboard");
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
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Loader />
        </div>
      </div>
    );
  }

  if (classQuery.error || !classQuery.data) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500">{t("classNotFound")}</div>
        </div>
      </div>
    );
  }

  const classData = classQuery.data;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Class Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{classData.className}</h1>
              <p className="text-muted-foreground">
                {t("classCode")}: {classData.classCode}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("created")}:{" "}
                {new Date(classData.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyClassCode}>
                <Copy className="w-4 h-4 mr-2" />
                {t("copyCode")}
              </Button>
              <Dialog
                open={renameDialogOpen}
                onOpenChange={setRenameDialogOpen}
              >
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
          </div>

          <Separator />

          <Tabs
            value={currentTab}
            onValueChange={(value) => {
              window.location.hash = value;
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="announcement">
                {t("announcement")}
              </TabsTrigger>
              <TabsTrigger value="students">{t("students")}</TabsTrigger>
              <TabsTrigger value="schedule">{t("schedule")}</TabsTrigger>
              <TabsTrigger value="assignments">{t("assignments")}</TabsTrigger>
              <TabsTrigger value="lectures">{t("lectures")}</TabsTrigger>
            </TabsList>

            <TabsContent value="announcement" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>{t("announcements")}</CardTitle>
                  <CreateAnnouncementForm
                    classId={classId}
                    onSuccess={() => {
                      // Refetch announcements after creating one
                      // We'll need to add a query invalidation here
                    }}
                  />
                </CardHeader>
                <CardContent>
                  <AnnouncementList classId={classId} isTeacher={true} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
              {/* Students Section */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("studentsCount")} ({studentsQuery.data?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {studentsQuery.isLoading ? (
                    <Loader />
                  ) : studentsQuery.data && studentsQuery.data.length > 0 ? (
                    <div className="space-y-2">
                      {studentsQuery.data.map(
                        (student: {
                          userId: string;
                          name: string;
                          email: string;
                          enrolledAt: string;
                        }) => (
                          <div
                            key={student.userId}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {student.email}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {t("enrolled")}{" "}
                              {new Date(
                                student.enrolledAt
                              ).toLocaleDateString()}
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {t("noStudentsEnrolled")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>{t("classSchedule")}</CardTitle>
                  <CreateScheduleForm
                    classId={classId}
                    onSuccess={() => schedulesQuery.refetch()}
                  />
                </CardHeader>
                <CardContent>
                  {schedulesQuery.isLoading ? (
                    <Loader />
                  ) : (
                    <ScheduleCalendar
                      schedules={schedulesQuery.data || []}
                      classId={classId}
                      onScheduleUpdate={() => schedulesQuery.refetch()}
                      isTeacher={true}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              {/* Assignments Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>
                    {t("assignmentsCount")} (
                    {assignmentsQuery.data?.length || 0})
                  </CardTitle>
                  <Button
                    onClick={() =>
                      router.push(`/class/teacher/${classId}/create-assignment`)
                    }
                  >
                    {t("createAssignment")}
                  </Button>
                </CardHeader>
                <CardContent>
                  {assignmentsQuery.isLoading ? (
                    <Loader />
                  ) : assignmentsQuery.data &&
                    assignmentsQuery.data.length > 0 ? (
                    <div className="space-y-2">
                      {assignmentsQuery.data.map(
                        (assignment: {
                          assignmentId: string;
                          title: string;
                          description: string | null;
                          dueDate: string | null;
                          createdAt: string;
                        }) => (
                          <div
                            key={assignment.assignmentId}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <h3 className="font-medium">
                                {assignment.title}
                              </h3>
                              {assignment.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {assignment.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>
                                  {t("created")}:{" "}
                                  {new Date(
                                    assignment.createdAt
                                  ).toLocaleDateString()}
                                </span>
                                {assignment.dueDate && (
                                  <span>
                                    {t("due")}:{" "}
                                    {new Date(
                                      assignment.dueDate
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  copyAssignmentUrl(assignment.assignmentId)
                                }
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                {t("copyUrl")}
                              </Button>
                              <Link
                                href={`/class/teacher/${classId}/edit-assignment/${assignment.assignmentId}`}
                              >
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4 mr-2" />
                                  {t("edit")}
                                </Button>
                              </Link>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t("deleteAssignment")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t("deleteAssignmentDescription")}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t("cancel")}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteAssignmentMutation.mutate(
                                          assignment.assignmentId
                                        )
                                      }
                                      className="bg-destructive text-white hover:bg-destructive/90"
                                    >
                                      {deleteAssignmentMutation.isPending
                                        ? t("deleting")
                                        : t("deleteButton")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {t("noAssignmentsCreated")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lectures" className="space-y-4">
              {/* Lectures Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>
                    {t("lecturesAndMaterials")} (
                    {lecturesQuery.data?.length || 0})
                  </CardTitle>
                  <Button
                    onClick={() =>
                      router.push(`/class/teacher/${classId}/upload-lecture`)
                    }
                  >
                    {t("uploadLecture")}
                  </Button>
                </CardHeader>
                <CardContent>
                  {lecturesQuery.isLoading ? (
                    <Loader />
                  ) : lecturesQuery.data && lecturesQuery.data.length > 0 ? (
                    <div className="space-y-2">
                      {lecturesQuery.data.map(
                        (lecture: {
                          lectureId: string;
                          title: string;
                          description: string | null;
                          type: string;
                          url: string;
                          lectureDate: string;
                          createdAt: string;
                        }) => (
                          <Link
                            key={lecture.lectureId}
                            href={`/lecture/${lecture.lectureId}`}
                            className="block"
                          >
                            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex-1">
                                <h3 className="font-medium">{lecture.title}</h3>
                                {lecture.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {lecture.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <Badge variant="outline">
                                    {lecture.type === "file"
                                      ? t("file")
                                      : t("youtube")}
                                  </Badge>
                                  <span>
                                    {t("date")}:{" "}
                                    {new Date(
                                      lecture.lectureDate
                                    ).toLocaleDateString()}
                                  </span>
                                  <span>
                                    {t("uploaded")}:{" "}
                                    {new Date(
                                      lecture.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {t("noLecturesUploaded")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
