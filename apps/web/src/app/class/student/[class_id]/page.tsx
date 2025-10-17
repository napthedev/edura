"use client";
import { useParams } from "next/navigation";
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
          <div className="text-center">Loading...</div>
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
          <div className="text-center">Loading class...</div>
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

          {/* Teacher Info Section */}
          <Card>
            <CardHeader>
              <CardTitle>Teacher</CardTitle>
            </CardHeader>
            <CardContent>
              {teacherQuery.isLoading ? (
                <p>Loading teacher info...</p>
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

          {/* Assignments Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                Assignments ({assignmentsQuery.data?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignmentsQuery.isLoading ? (
                <p>Loading assignments...</p>
              ) : assignmentsQuery.data && assignmentsQuery.data.length > 0 ? (
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
        </div>
      </div>
    </div>
  );
}
