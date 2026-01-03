"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Users, Calendar, Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import Loader from "@/components/loader";

type RateType = "HOURLY" | "PER_STUDENT" | "MONTHLY_FIXED" | "PER_MINUTE";

interface ApplyPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (presetId: string, teacherIds: string[]) => void;
  isPending: boolean;
}

export function ApplyPresetDialog({
  open,
  onOpenChange,
  onApply,
  isPending,
}: ApplyPresetDialogProps) {
  const t = useTranslations("TeacherRates");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  // Queries
  const presetsQuery = useQuery({
    queryKey: ["teacher-rate-presets"],
    queryFn: () =>
      trpcClient.education.getTeacherRatePresets.query({ isActive: true }),
    enabled: open,
  });

  const teachersQuery = useQuery({
    queryKey: ["teachers-for-manager"],
    queryFn: () => trpcClient.education.getAllTeachers.query(),
    enabled: open,
  });

  // Handlers
  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
  };

  const handleTeacherToggle = (teacherId: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTeacherIds.length === teachersQuery.data?.length) {
      setSelectedTeacherIds([]);
    } else {
      setSelectedTeacherIds(teachersQuery.data?.map((t) => t.userId) || []);
    }
  };

  const handleApply = () => {
    if (selectedPresetId && selectedTeacherIds.length > 0) {
      onApply(selectedPresetId, selectedTeacherIds);
      // Reset
      setSelectedPresetId("");
      setSelectedTeacherIds([]);
    }
  };

  const selectedPreset = presetsQuery.data?.find(
    (p) => p.presetId === selectedPresetId
  );

  // Get rate type icon
  const getRateTypeIcon = (rateType: RateType) => {
    switch (rateType) {
      case "HOURLY":
        return <Clock className="size-4" />;
      case "PER_STUDENT":
        return <Users className="size-4" />;
      case "MONTHLY_FIXED":
        return <Calendar className="size-4" />;
      case "PER_MINUTE":
        return <Timer className="size-4" />;
    }
  };

  // Format amount
  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(cents / 100);
  };

  // Get teacher type badge
  const getTeacherTypeBadge = (preset: any) => {
    if (preset.customTypeName) {
      return (
        <Badge variant="outline" className="bg-gray-100">
          {preset.customTypeName}
        </Badge>
      );
    }

    switch (preset.teacherType) {
      case "NATIVE":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            {t("nativeTeacher")}
          </Badge>
        );
      case "FOREIGN":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
            {t("foreignTeacher")}
          </Badge>
        );
      case "TEACHING_ASSISTANT":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
            {t("teachingAssistant")}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t("applyPreset")}</DialogTitle>
          <DialogDescription>{t("applyPresetDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Preset Selector */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {t("selectPreset")}
            </Label>
            <ScrollArea className="h-[400px] pr-4">
              {presetsQuery.isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader />
                </div>
              ) : !presetsQuery.data || presetsQuery.data.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  {t("noPresets")}
                </p>
              ) : (
                <div className="space-y-2">
                  {presetsQuery.data.map((preset) => (
                    <button
                      key={preset.presetId}
                      onClick={() => handlePresetSelect(preset.presetId)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedPresetId === preset.presetId
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getTeacherTypeBadge(preset)}
                        </div>
                        <div className="font-semibold">{preset.presetName}</div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-slate-600">
                            {getRateTypeIcon(preset.rateType)}
                            <span className="capitalize">
                              {preset.rateType.toLowerCase().replace("_", " ")}
                            </span>
                          </div>
                          <span className="font-semibold">
                            {formatAmount(preset.amount)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right: Teacher Multi-select */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {t("selectTeachers")}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={
                  !teachersQuery.data || teachersQuery.data.length === 0
                }
              >
                {selectedTeacherIds.length === teachersQuery.data?.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              {teachersQuery.isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader />
                </div>
              ) : !teachersQuery.data || teachersQuery.data.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  No teachers found
                </p>
              ) : (
                <div className="space-y-2">
                  {teachersQuery.data.map((teacher) => (
                    <div
                      key={teacher.userId}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      <Checkbox
                        id={teacher.userId}
                        checked={selectedTeacherIds.includes(teacher.userId)}
                        onCheckedChange={() =>
                          handleTeacherToggle(teacher.userId)
                        }
                      />
                      <Label
                        htmlFor={teacher.userId}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{teacher.name}</div>
                        <div className="text-sm text-slate-500">
                          {teacher.email}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Preview */}
        {selectedPreset && selectedTeacherIds.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              Applying{" "}
              <span className="font-semibold">{selectedPreset.presetName}</span>{" "}
              to{" "}
              <span className="font-semibold">{selectedTeacherIds.length}</span>{" "}
              teacher(s)
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleApply}
            disabled={
              isPending || !selectedPresetId || selectedTeacherIds.length === 0
            }
          >
            {t("applyPreset")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
