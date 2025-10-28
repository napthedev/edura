"use client";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Copy, LogOut } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import ScheduleCalendar from "@/components/schedule/schedule-calendar";
import Loader from "@/components/loader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AnnouncementList from "@/components/announcement/announcement-list";

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
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "announcements";

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const result = await authClient.getSession();
      if (result.error) throw result.error;
      return result.data;
    },
    staleTime: Infinity,
  });

  const isAuthenticated = !!sessionQuery.data?.user;
  const isStudent =
    (sessionQuery.data?.user as unknown as SessionUser)?.role === "student";

  const classQuery = useQuery({
    queryKey: ["class", classId],
    queryFn: () => trpcClient.education.getClassById.query({ classId }),
    enabled: isAuthenticated && isStudent,
  });

  const teacherQuery = useQuery({
    queryKey: ["class-teacher", classId],
    queryFn: () => trpcClient.education.getClassTeacher.query({ classId }),
    enabled: isAuthenticated && isStudent,
  });

  const assignmentsQuery = useQuery({
    queryKey: ["class-assignments", classId],
    queryFn: () => trpcClient.education.getClassAssignments.query({ classId }),
    enabled: isAuthenticated && isStudent,
  });

  const lecturesQuery = useQuery({
    queryKey: ["class-lectures", classId],
    queryFn: () => trpcClient.education.getClassLectures.query({ classId }),
    enabled: isAuthenticated && isStudent,
  });

  const schedulesQuery = useQuery({
    queryKey: ["class-schedules", classId],
    queryFn: () => trpcClient.education.getClassSchedules.query({ classId }),
    enabled: isAuthenticated && isStudent,
  });

  const announcementsQuery = useQuery({
    queryKey: ["class-announcements", classId],
    queryFn: () =>
      trpcClient.education.getClassAnnouncements.query({ classId }),
    enabled: isAuthenticated && isStudent,
  });

  const leaveClassMutation = useMutation({
    mutationFn: () => trpcClient.education.leaveClass.mutate({ classId }),
    onSuccess: () => {
      toast.success("Left class successfully");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(`Failed to leave class: ${error.message}`);
    },
  });

  const copyClassCode = () => {
    if (classQuery.data?.classCode) {
      navigator.clipboard.writeText(classQuery.data.classCode);
      toast.success("Class code copied to clipboard");
    }
  };

  const handleLeaveClass = () => {
    leaveClassMutation.mutate();
  };

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

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  if (!isStudent) {
    router.push("/dashboard");
    return null;
  }

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

  const classData = classQuery.data!;

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
                Class Code: {classData.classCode}
              </p>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(classData.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyClassCode}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Class
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave Class</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to leave this class? You will no
                      longer have access to class materials and assignments.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLeaveClass}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {leaveClassMutation.isPending
                        ? "Leaving..."
                        : "Leave Class"}
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
              const newSearchParams = new URLSearchParams(searchParams);
              newSearchParams.set("tab", value);
              router.push(`?${newSearchParams.toString()}`);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="teacher">Teacher</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="lectures">Lectures</TabsTrigger>
            </TabsList>

            <TabsContent value="announcements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Announcements</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnnouncementList classId={classId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teacher" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Teacher</CardTitle>
                </CardHeader>
                <CardContent>
                  {teacherQuery.isLoading ? (
                    <Loader />
                  ) : teacherQuery.data ? (
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{teacherQuery.data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {teacherQuery.data.email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Teacher information not available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Class Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {schedulesQuery.isLoading ? (
                    <Loader />
                  ) : schedulesQuery.data && schedulesQuery.data.length > 0 ? (
                    <ScheduleCalendar
                      schedules={schedulesQuery.data}
                      classId={classId}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      No class schedules available yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Assignments ({assignmentsQuery.data?.length || 0})
                  </CardTitle>
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
                            className="p-3 border rounded-lg"
                          >
                            <h3 className="font-medium">{assignment.title}</h3>
                            {assignment.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {assignment.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>
                                Created:{" "}
                                {new Date(
                                  assignment.createdAt
                                ).toLocaleDateString()}
                              </span>
                              {assignment.dueDate && (
                                <span>
                                  Due:{" "}
                                  {new Date(
                                    assignment.dueDate
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div className="mt-3">
                              <Button
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/do-assignment/${assignment.assignmentId}`
                                  )
                                }
                              >
                                Take Assignment
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No assignments available yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lectures" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Lectures & Materials ({lecturesQuery.data?.length || 0})
                  </CardTitle>
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
                            <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                              <h3 className="font-medium">{lecture.title}</h3>
                              {lecture.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {lecture.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                  {lecture.type === "file"
                                    ? "📄 File"
                                    : "🎥 Video"}
                                </span>
                                <span>
                                  Date:{" "}
                                  {new Date(
                                    lecture.lectureDate
                                  ).toLocaleDateString()}
                                </span>
                                <span>
                                  Uploaded:{" "}
                                  {new Date(
                                    lecture.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </Link>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No lectures available yet.
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
