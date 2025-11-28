"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Video } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/loader";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface AddExistingContentDialogProps {
  classId: string;
  moduleId: string;
}

export function AddExistingContentDialog({
  classId,
  moduleId,
}: AddExistingContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [selectedLectures, setSelectedLectures] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const t = useTranslations("AddExistingContent");

  const unassignedQuery = useQuery({
    queryKey: [["education", "getUnassignedContent"], { classId }],
    queryFn: async () => {
      return await trpcClient.education.getUnassignedContent.query({ classId });
    },
    enabled: open,
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await trpcClient.education.updateAssignment.mutate({
        assignmentId,
        moduleId,
      });
    },
  });

  const updateLectureMutation = useMutation({
    mutationFn: async (lectureId: string) => {
      return await trpcClient.education.updateLecture.mutate({
        lectureId,
        moduleId,
      });
    },
  });

  const handleAddContent = async () => {
    try {
      const promises = [
        ...selectedAssignments.map((id) =>
          updateAssignmentMutation.mutateAsync(id)
        ),
        ...selectedLectures.map((id) => updateLectureMutation.mutateAsync(id)),
      ];

      await Promise.all(promises);

      toast.success(t("contentAddedSuccess"));
      setOpen(false);
      setSelectedAssignments([]);
      setSelectedLectures([]);
      queryClient.invalidateQueries({
        queryKey: [["education", "getClassModules"], { classId }],
      });
      queryClient.invalidateQueries({
        queryKey: [["education", "getUnassignedContent"], { classId }],
      });
    } catch (error) {
      toast.error(t("failedToAddContent"));
    }
  };

  const toggleAssignment = (id: string) => {
    setSelectedAssignments((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleLecture = (id: string) => {
    setSelectedLectures((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isLoading = unassignedQuery.isLoading;
  const data = unassignedQuery.data;
  const hasContent =
    data && (data.assignments.length > 0 || data.lectures.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {t("addContent")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("addExistingContentToModule")}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <Loader />
        ) : !hasContent ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>{t("noUnassignedContent")}</p>
            <p className="text-sm">{t("noUnassignedContentHint")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {data.assignments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  {t("assignments")}
                </h3>
                <div className="space-y-2">
                  {data.assignments.map((assignment: any) => (
                    <div
                      key={assignment.assignmentId}
                      className="flex items-start space-x-3 p-3 border rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={`assignment-${assignment.assignmentId}`}
                        checked={selectedAssignments.includes(
                          assignment.assignmentId
                        )}
                        onCheckedChange={() =>
                          toggleAssignment(assignment.assignmentId)
                        }
                      />
                      <div className="grid gap-1.5 leading-none flex-1">
                        <Label
                          htmlFor={`assignment-${assignment.assignmentId}`}
                          className="font-medium cursor-pointer flex items-center"
                        >
                          <FileText className="w-4 h-4 mr-2 text-green-500" />
                          {assignment.title}
                        </Label>
                        <p className="text-xs text-muted-foreground pl-6">
                          {t("due")}:{" "}
                          {assignment.dueDate
                            ? format(new Date(assignment.dueDate), "PPP")
                            : t("noDueDate")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.lectures.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  {t("lectures")}
                </h3>
                <div className="space-y-2">
                  {data.lectures.map((lecture: any) => (
                    <div
                      key={lecture.lectureId}
                      className="flex items-start space-x-3 p-3 border rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={`lecture-${lecture.lectureId}`}
                        checked={selectedLectures.includes(lecture.lectureId)}
                        onCheckedChange={() => toggleLecture(lecture.lectureId)}
                      />
                      <div className="grid gap-1.5 leading-none flex-1">
                        <Label
                          htmlFor={`lecture-${lecture.lectureId}`}
                          className="font-medium cursor-pointer flex items-center"
                        >
                          <Video className="w-4 h-4 mr-2 text-blue-500" />
                          {lecture.title}
                        </Label>
                        <p className="text-xs text-muted-foreground pl-6">
                          {format(new Date(lecture.lectureDate), "PPP")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleAddContent}
                disabled={
                  selectedAssignments.length === 0 &&
                  selectedLectures.length === 0
                }
              >
                {t("addSelected")} (
                {selectedAssignments.length + selectedLectures.length})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
