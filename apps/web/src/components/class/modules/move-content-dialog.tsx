"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface MoveContentDialogProps {
  classId: string;
  itemId: string;
  itemType: "assignment" | "lecture";
  currentModuleId: string | null;
  modules: { moduleId: string; title: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveContentDialog({
  classId,
  itemId,
  itemType,
  currentModuleId,
  modules,
  open,
  onOpenChange,
}: MoveContentDialogProps) {
  const [targetModuleId, setTargetModuleId] = useState<string | "unassigned">(
    currentModuleId || "unassigned"
  );
  const queryClient = useQueryClient();
  const t = useTranslations("MoveContent");

  // Reset state when dialog opens/changes item
  useEffect(() => {
    if (open) {
      setTargetModuleId(currentModuleId || "unassigned");
    }
  }, [open, currentModuleId]);

  const updateAssignmentMutation = useMutation({
    mutationFn: async (moduleId: string | null) => {
      return await trpcClient.education.updateAssignment.mutate({
        assignmentId: itemId,
        moduleId,
      });
    },
  });

  const updateLectureMutation = useMutation({
    mutationFn: async (moduleId: string | null) => {
      return await trpcClient.education.updateLecture.mutate({
        lectureId: itemId,
        moduleId,
      });
    },
  });

  const handleMove = async () => {
    try {
      const moduleId = targetModuleId === "unassigned" ? null : targetModuleId;

      if (itemType === "assignment") {
        await updateAssignmentMutation.mutateAsync(moduleId);
      } else {
        await updateLectureMutation.mutateAsync(moduleId);
      }

      toast.success(t("contentMovedSuccess"));
      onOpenChange(false);
      queryClient.invalidateQueries({
        queryKey: [["education", "getClassModules"], { classId }],
      });
      queryClient.invalidateQueries({
        queryKey: [["education", "getUnassignedContent"], { classId }],
      });
    } catch (error) {
      toast.error(t("failedToMoveContent"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("moveContent")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("selectModule")}</Label>
            <Select
              value={targetModuleId}
              onValueChange={(value) => setTargetModuleId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectModule")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  {t("removeFromModule")}
                </SelectItem>
                {modules.map((module) => (
                  <SelectItem key={module.moduleId} value={module.moduleId}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleMove}>{t("move")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
