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
import { useRouter } from "next/navigation";

export default function ClassPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const router = useRouter();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");

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
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading class...</div>
        </div>
      </div>
    );
  }

  if (classQuery.error || !classQuery.data) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-500">Class not found</div>
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
              <Dialog
                open={renameDialogOpen}
                onOpenChange={setRenameDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Rename
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rename Class</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Input
                        id="className"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Enter new class name"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setRenameDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRename}
                        disabled={
                          renameMutation.isPending || !newClassName.trim()
                        }
                      >
                        {renameMutation.isPending ? "Renaming..." : "Rename"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Class</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this class? This action
                      cannot be undone and will remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Separator />

          {/* Students Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                Students ({studentsQuery.data?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentsQuery.isLoading ? (
                <p>Loading students...</p>
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
                          Enrolled{" "}
                          {new Date(student.enrolledAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No students enrolled yet.
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
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No assignments created yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
