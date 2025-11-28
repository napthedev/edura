"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { CreateModuleDialog } from "@/components/class/modules/create-module-dialog";
import { AddExistingContentDialog } from "@/components/class/modules/add-existing-content-dialog";
import { MoveContentDialog } from "@/components/class/modules/move-content-dialog";
import Loader from "@/components/loader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Video,
  MoreVertical,
  Trash2,
  Edit,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";

export default function TeacherModulesPage() {
  const params = useParams();
  const classId = params.class_id as string;
  const queryClient = useQueryClient();

  // State for MoveContentDialog
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<{
    id: string;
    type: "assignment" | "lecture";
    currentModuleId: string;
  } | null>(null);

  const modulesQuery = useQuery({
    queryKey: [["education", "getClassModules"], { classId }],
    queryFn: async () => {
      return await trpcClient.education.getClassModules.query({ classId });
    },
  });

  // Mutation to remove content directly
  const updateAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await trpcClient.education.updateAssignment.mutate({
        assignmentId,
        moduleId: null,
      });
    },
    onSuccess: () => {
      toast.success("Assignment removed from module");
      queryClient.invalidateQueries({
        queryKey: [["education", "getClassModules"], { classId }],
      });
      queryClient.invalidateQueries({
        queryKey: [["education", "getUnassignedContent"], { classId }],
      });
    },
  });

  const updateLectureMutation = useMutation({
    mutationFn: async (lectureId: string) => {
      return await trpcClient.education.updateLecture.mutate({
        lectureId,
        moduleId: null,
      });
    },
    onSuccess: () => {
      toast.success("Lecture removed from module");
      queryClient.invalidateQueries({
        queryKey: [["education", "getClassModules"], { classId }],
      });
      queryClient.invalidateQueries({
        queryKey: [["education", "getUnassignedContent"], { classId }],
      });
    },
  });

  const handleRemoveContent = (id: string, type: "assignment" | "lecture") => {
    if (
      confirm("Are you sure you want to remove this content from the module?")
    ) {
      if (type === "assignment") {
        updateAssignmentMutation.mutate(id);
      } else {
        updateLectureMutation.mutate(id);
      }
    }
  };

  const openMoveDialog = (
    id: string,
    type: "assignment" | "lecture",
    currentModuleId: string
  ) => {
    setMoveItem({ id, type, currentModuleId });
    setMoveDialogOpen(true);
  };

  if (modulesQuery.isLoading) {
    return <Loader />;
  }

  const modules = modulesQuery.data || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Modules</h1>
        <CreateModuleDialog classId={classId} />
      </div>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <p>No modules created yet.</p>
            <p className="text-sm">
              Create a module to organize your class content.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {modules.map((module: any) => (
            <Card key={module.moduleId}>
              <AccordionItem value={module.moduleId} className="border-none">
                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                  <AccordionTrigger className="hover:no-underline py-0 flex-1">
                    <div className="flex flex-col items-start text-left">
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      {module.description && (
                        <p className="text-sm text-muted-foreground font-normal mt-1">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </AccordionTrigger>
                  <div className="flex items-center gap-2 ml-4">
                    {/* Add Existing Content Dialog */}
                    <AddExistingContentDialog
                      classId={classId}
                      moduleId={module.moduleId}
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Module
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Module
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <AccordionContent className="px-4 pb-4 pt-0">
                  <div className="space-y-2 mt-4">
                    {module.assignments.length === 0 &&
                      module.lectures.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">
                          No content in this module.
                        </p>
                      )}

                    {module.lectures.map((lecture: any) => (
                      <div
                        key={lecture.lectureId}
                        className="flex items-center p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors group"
                      >
                        <Video className="w-5 h-5 mr-3 text-blue-500" />
                        <div className="flex-1">
                          <p className="font-medium">{lecture.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Lecture •{" "}
                            {format(new Date(lecture.lectureDate), "PPP")}
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  openMoveDialog(
                                    lecture.lectureId,
                                    "lecture",
                                    module.moduleId
                                  )
                                }
                              >
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Move to...
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRemoveContent(
                                    lecture.lectureId,
                                    "lecture"
                                  )
                                }
                                className="text-destructive"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Remove from Module
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}

                    {module.assignments.map((assignment: any) => (
                      <div
                        key={assignment.assignmentId}
                        className="flex items-center p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors group"
                      >
                        <FileText className="w-5 h-5 mr-3 text-green-500" />
                        <div className="flex-1">
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Assignment • Due{" "}
                            {assignment.dueDate
                              ? format(new Date(assignment.dueDate), "PPP")
                              : "No due date"}
                          </p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  openMoveDialog(
                                    assignment.assignmentId,
                                    "assignment",
                                    module.moduleId
                                  )
                                }
                              >
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Move to...
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRemoveContent(
                                    assignment.assignmentId,
                                    "assignment"
                                  )
                                }
                                className="text-destructive"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Remove from Module
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>
      )}

      {moveItem && (
        <MoveContentDialog
          classId={classId}
          itemId={moveItem.id}
          itemType={moveItem.type}
          currentModuleId={moveItem.currentModuleId}
          modules={modules}
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
        />
      )}
    </div>
  );
}
