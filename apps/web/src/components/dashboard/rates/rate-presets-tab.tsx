"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PresetCard } from "./preset-card";
import { CreatePresetDialog } from "./create-preset-dialog";
import { EditPresetDialog } from "./edit-preset-dialog";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, LayoutGrid } from "lucide-react";
import Loader from "@/components/loader";

export function RatePresetsTab() {
  const t = useTranslations("TeacherRates");
  const queryClient = useQueryClient();

  // State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Query
  const presetsQuery = useQuery({
    queryKey: ["teacher-rate-presets"],
    queryFn: () =>
      trpcClient.education.getTeacherRatePresets.query({ isActive: true }),
  });

  // Mutations
  const createPresetMutation = useMutation({
    mutationFn: (data: {
      presetName: string;
      teacherType?: "NATIVE" | "FOREIGN" | "TEACHING_ASSISTANT";
      customTypeName?: string;
      rateType: "HOURLY" | "PER_STUDENT" | "MONTHLY_FIXED" | "PER_MINUTE";
      amount: number;
      description?: string;
    }) => trpcClient.education.createTeacherRatePreset.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-rate-presets"] });
      toast.success(t("presetCreated"));
      setCreateDialogOpen(false);
    },
  });

  const updatePresetMutation = useMutation({
    mutationFn: ({
      presetId,
      data,
    }: {
      presetId: string;
      data: { presetName?: string; amount?: number; description?: string };
    }) =>
      trpcClient.education.updateTeacherRatePreset.mutate({
        presetId,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-rate-presets"] });
      toast.success(t("presetUpdated"));
      setEditDialogOpen(false);
    },
  });

  const applyUpdateMutation = useMutation({
    mutationFn: (presetId: string) =>
      trpcClient.education.applyPresetUpdateToTeachers.mutate({ presetId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-rate-presets"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-rates"] });
      toast.success(t("presetUpdatesApplied", { count: data.updatedCount }));
      setEditDialogOpen(false);
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: (presetId: string) =>
      trpcClient.education.deleteTeacherRatePreset.mutate({ presetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-rate-presets"] });
      toast.success(t("presetDeleted"));
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      if (error.message.includes("used by")) {
        const match = error.message.match(/\d+/);
        const count = match ? parseInt(match[0]) : 0;
        toast.error(t("cannotDeleteUsedPreset", { count }));
      }
    },
  });

  // Handlers
  const handleEditPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setEditDialogOpen(true);
  };

  const handleDeletePreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setDeleteDialogOpen(true);
  };

  const handleUpdatePreset = (
    presetId: string,
    data: { presetName?: string; amount?: number; description?: string }
  ) => {
    updatePresetMutation.mutate({ presetId, data });
  };

  const handleApplyUpdate = (presetId: string) => {
    applyUpdateMutation.mutate(presetId);
  };

  const confirmDelete = () => {
    if (selectedPresetId) {
      deletePresetMutation.mutate(selectedPresetId);
    }
  };

  const selectedPreset = presetsQuery.data?.find(
    (p) => p.presetId === selectedPresetId
  );

  // Group presets by teacher type
  const groupedPresets = presetsQuery.data?.reduce((acc, preset) => {
    const key = preset.customTypeName
      ? "custom"
      : preset.teacherType?.toLowerCase() || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(preset);
    return acc;
  }, {} as Record<string, typeof presetsQuery.data>);

  if (presetsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="size-6" />
            {t("ratePresets")}
          </h2>
          <p className="text-slate-600 mt-1">{t("noPresetsDescription")}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="size-4 mr-2" />
          {t("createPreset")}
        </Button>
      </div>

      {/* Presets Grid */}
      {!presetsQuery.data || presetsQuery.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutGrid className="size-12 text-slate-300 mb-4" />
            <CardTitle className="text-lg mb-2">{t("noPresets")}</CardTitle>
            <CardDescription className="text-center max-w-md mb-4">
              {t("noPresetsDescription")}
            </CardDescription>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="size-4 mr-2" />
              {t("createPreset")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Native Teachers */}
          {groupedPresets?.native && groupedPresets.native.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {t("nativeTeacher")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedPresets.native.map((preset) => (
                  <PresetCard
                    key={preset.presetId}
                    presetId={preset.presetId}
                    presetName={preset.presetName}
                    teacherType={preset.teacherType}
                    customTypeName={preset.customTypeName}
                    rateType={preset.rateType}
                    amount={preset.amount}
                    description={preset.description}
                    usageCount={preset.usageCount}
                    updatedAt={new Date(preset.updatedAt)}
                    onEdit={handleEditPreset}
                    onDelete={handleDeletePreset}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Foreign Teachers */}
          {groupedPresets?.foreign && groupedPresets.foreign.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {t("foreignTeacher")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedPresets.foreign.map((preset) => (
                  <PresetCard
                    key={preset.presetId}
                    presetId={preset.presetId}
                    presetName={preset.presetName}
                    teacherType={preset.teacherType}
                    customTypeName={preset.customTypeName}
                    rateType={preset.rateType}
                    amount={preset.amount}
                    description={preset.description}
                    usageCount={preset.usageCount}
                    updatedAt={new Date(preset.updatedAt)}
                    onEdit={handleEditPreset}
                    onDelete={handleDeletePreset}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Teaching Assistants */}
          {groupedPresets?.teaching_assistant &&
            groupedPresets.teaching_assistant.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  {t("teachingAssistant")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedPresets.teaching_assistant.map((preset) => (
                    <PresetCard
                      key={preset.presetId}
                      presetId={preset.presetId}
                      presetName={preset.presetName}
                      teacherType={preset.teacherType}
                      customTypeName={preset.customTypeName}
                      rateType={preset.rateType}
                      amount={preset.amount}
                      description={preset.description}
                      usageCount={preset.usageCount}
                      updatedAt={new Date(preset.updatedAt)}
                      onEdit={handleEditPreset}
                      onDelete={handleDeletePreset}
                    />
                  ))}
                </div>
              </div>
            )}

          {/* Custom Types */}
          {groupedPresets?.custom && groupedPresets.custom.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">{t("customType")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedPresets.custom.map((preset) => (
                  <PresetCard
                    key={preset.presetId}
                    presetId={preset.presetId}
                    presetName={preset.presetName}
                    teacherType={preset.teacherType}
                    customTypeName={preset.customTypeName}
                    rateType={preset.rateType}
                    amount={preset.amount}
                    description={preset.description}
                    usageCount={preset.usageCount}
                    updatedAt={new Date(preset.updatedAt)}
                    onEdit={handleEditPreset}
                    onDelete={handleDeletePreset}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreatePresetDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(data) => createPresetMutation.mutate(data)}
        isPending={createPresetMutation.isPending}
      />

      <EditPresetDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        preset={
          selectedPreset
            ? {
                presetId: selectedPreset.presetId,
                presetName: selectedPreset.presetName,
                amount: selectedPreset.amount,
                description: selectedPreset.description,
                usageCount: selectedPreset.usageCount,
              }
            : null
        }
        onUpdate={handleUpdatePreset}
        onApplyUpdate={handleApplyUpdate}
        isPending={updatePresetMutation.isPending}
        isApplyingUpdate={applyUpdateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deletePreset")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deletePresetConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("deletePreset")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
