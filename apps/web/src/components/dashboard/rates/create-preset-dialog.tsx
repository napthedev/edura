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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

type RateType = "HOURLY" | "PER_STUDENT" | "MONTHLY_FIXED" | "PER_MINUTE";
type TeacherType = "NATIVE" | "FOREIGN" | "TEACHING_ASSISTANT" | "CUSTOM";

interface CreatePresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    presetName: string;
    teacherType?: "NATIVE" | "FOREIGN" | "TEACHING_ASSISTANT";
    customTypeName?: string;
    rateType: RateType;
    amount: number;
    description?: string;
  }) => void;
  isPending: boolean;
}

export function CreatePresetDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: CreatePresetDialogProps) {
  const t = useTranslations("TeacherRates");
  const [presetName, setPresetName] = useState("");
  const [teacherType, setTeacherType] = useState<TeacherType>("NATIVE");
  const [customTypeName, setCustomTypeName] = useState("");
  const [rateType, setRateType] = useState<RateType>("HOURLY");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!presetName || !amount) {
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);

    onSubmit({
      presetName,
      teacherType: teacherType === "CUSTOM" ? undefined : teacherType,
      customTypeName: teacherType === "CUSTOM" ? customTypeName : undefined,
      rateType,
      amount: amountInCents,
      description: description || undefined,
    });

    // Reset form
    setPresetName("");
    setTeacherType("NATIVE");
    setCustomTypeName("");
    setRateType("HOURLY");
    setAmount("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("createPreset")}</DialogTitle>
          <DialogDescription>{t("createPresetDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preset Name */}
          <div>
            <Label htmlFor="presetName">{t("presetName")}</Label>
            <Input
              id="presetName"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={t("presetName")}
            />
          </div>

          {/* Teacher Type */}
          <div>
            <Label>{t("teacherType")}</Label>
            <RadioGroup
              value={teacherType}
              onValueChange={(value) => setTeacherType(value as TeacherType)}
              className="grid grid-cols-2 gap-4 mt-2"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                <RadioGroupItem value="NATIVE" id="native" />
                <Label htmlFor="native" className="cursor-pointer flex-1">
                  {t("nativeTeacher")}
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                <RadioGroupItem value="FOREIGN" id="foreign" />
                <Label htmlFor="foreign" className="cursor-pointer flex-1">
                  {t("foreignTeacher")}
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                <RadioGroupItem value="TEACHING_ASSISTANT" id="assistant" />
                <Label htmlFor="assistant" className="cursor-pointer flex-1">
                  {t("teachingAssistant")}
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                <RadioGroupItem value="CUSTOM" id="custom" />
                <Label htmlFor="custom" className="cursor-pointer flex-1">
                  {t("customType")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Type Name (shown when CUSTOM is selected) */}
          {teacherType === "CUSTOM" && (
            <div>
              <Label htmlFor="customTypeName">{t("customTypeName")}</Label>
              <Input
                id="customTypeName"
                value={customTypeName}
                onChange={(e) => setCustomTypeName(e.target.value)}
                placeholder={t("customTypeName")}
              />
            </div>
          )}

          {/* Rate Type */}
          <div>
            <Label htmlFor="rateType">{t("rateType")}</Label>
            <Select
              value={rateType}
              onValueChange={(value) => setRateType(value as RateType)}
            >
              <SelectTrigger id="rateType">
                <SelectValue placeholder={t("selectRateType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOURLY">{t("hourly")}</SelectItem>
                <SelectItem value="PER_STUDENT">{t("perStudent")}</SelectItem>
                <SelectItem value="MONTHLY_FIXED">
                  {t("monthlyFixed")}
                </SelectItem>
                <SelectItem value="PER_MINUTE">{t("perMinute")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">{t("amount")}</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">{t("presetDescription")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("presetDescription")}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !presetName || !amount}
          >
            <Plus className="size-4 mr-2" />
            {t("createPreset")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
