"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { LayoutGrid, Clock, CheckCircle2 } from "lucide-react";

interface SetupPresetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInitialize: () => void;
  isPending: boolean;
}

export function SetupPresetsDialog({
  open,
  onOpenChange,
  onInitialize,
  isPending,
}: SetupPresetsDialogProps) {
  const t = useTranslations("TeacherRates");

  const defaultPresets = [
    {
      name: "Native Teacher - Hourly",
      type: t("nativeTeacher"),
      typeColor: "bg-blue-100 text-blue-700",
      amount: "200,000",
      description: t("hourlyDescription"),
    },
    {
      name: "Foreign Teacher - Hourly",
      type: t("foreignTeacher"),
      typeColor: "bg-purple-100 text-purple-700",
      amount: "350,000",
      description: t("hourlyDescription"),
    },
    {
      name: "Teaching Assistant - Hourly",
      type: t("teachingAssistant"),
      typeColor: "bg-green-100 text-green-700",
      amount: "100,000",
      description: t("hourlyDescription"),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <LayoutGrid className="size-6" />
            {t("setupPresets")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t("setupPresetsDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            {defaultPresets.map((preset, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={preset.typeColor}>
                          {preset.type}
                        </Badge>
                        <CheckCircle2 className="size-4 text-green-500" />
                      </div>
                      <h4 className="font-semibold">{preset.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="size-4" />
                        <span>{preset.description}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{preset.amount}</div>
                      <div className="text-sm text-slate-500">VND/hour</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              💡 <strong>Tip:</strong> You can customize these presets or create
              your own after setup.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:flex-1"
          >
            {t("skipSetup")}
          </Button>
          <Button
            onClick={onInitialize}
            disabled={isPending}
            className="sm:flex-1"
          >
            <LayoutGrid className="size-4 mr-2" />
            {t("createPreset")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
