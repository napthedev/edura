"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { Pencil, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: {
    presetId: string;
    presetName: string;
    amount: number;
    description: string | null;
    usageCount: number;
  } | null;
  onUpdate: (
    presetId: string,
    data: {
      presetName?: string;
      amount?: number;
      description?: string;
    }
  ) => void;
  onApplyUpdate: (presetId: string) => void;
  isPending: boolean;
  isApplyingUpdate: boolean;
}

export function EditPresetDialog({
  open,
  onOpenChange,
  preset,
  onUpdate,
  onApplyUpdate,
  isPending,
  isApplyingUpdate,
}: EditPresetDialogProps) {
  const t = useTranslations("TeacherRates");
  const [presetName, setPresetName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (preset) {
      setPresetName(preset.presetName);
      setAmount((preset.amount / 100).toString());
      setDescription(preset.description || "");
    }
  }, [preset]);

  const handleUpdate = () => {
    if (!preset || !presetName || !amount) return;

    const amountInCents = Math.round(parseFloat(amount) * 100);

    onUpdate(preset.presetId, {
      presetName,
      amount: amountInCents,
      description: description || undefined,
    });
  };

  const handleApplyUpdate = () => {
    if (!preset) return;
    onApplyUpdate(preset.presetId);
  };

  if (!preset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("editPreset")}</DialogTitle>
          <DialogDescription>{t("editPresetDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {preset.usageCount > 0 && (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertDescription>
                {t("usedBy", { count: preset.usageCount })}
              </AlertDescription>
            </Alert>
          )}

          {/* Preset Name */}
          <div>
            <Label htmlFor="editPresetName">{t("presetName")}</Label>
            <Input
              id="editPresetName"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={t("presetName")}
            />
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="editAmount">{t("amount")}</Label>
            <Input
              id="editAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="editDescription">{t("presetDescription")}</Label>
            <Textarea
              id="editDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("presetDescription")}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:flex-1"
          >
            {t("cancel")}
          </Button>
          {preset.usageCount > 0 && (
            <Button
              variant="secondary"
              onClick={handleApplyUpdate}
              disabled={isApplyingUpdate}
              className="sm:flex-1"
            >
              {t("applyUpdateToTeachers")}
            </Button>
          )}
          <Button
            onClick={handleUpdate}
            disabled={isPending || !presetName || !amount}
            className="sm:flex-1"
          >
            <Pencil className="size-4 mr-2" />
            {t("editPreset")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
