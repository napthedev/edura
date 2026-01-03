"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  Users,
  Calendar,
  Timer,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";

type TeacherType = "NATIVE" | "FOREIGN" | "TEACHING_ASSISTANT" | null;
type RateType = "HOURLY" | "PER_STUDENT" | "MONTHLY_FIXED" | "PER_MINUTE";

interface PresetCardProps {
  presetId: string;
  presetName: string;
  teacherType: TeacherType;
  customTypeName: string | null;
  rateType: RateType;
  amount: number;
  description: string | null;
  usageCount: number;
  updatedAt: Date;
  onEdit: (presetId: string) => void;
  onDelete: (presetId: string) => void;
}

export function PresetCard({
  presetId,
  presetName,
  teacherType,
  customTypeName,
  rateType,
  amount,
  description,
  usageCount,
  updatedAt,
  onEdit,
  onDelete,
}: PresetCardProps) {
  const t = useTranslations("TeacherRates");

  // Get teacher type badge color and text
  const getTeacherTypeBadge = () => {
    if (customTypeName) {
      return (
        <Badge variant="outline" className="bg-gray-100">
          {customTypeName}
        </Badge>
      );
    }

    switch (teacherType) {
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

  // Get rate type icon and label
  const getRateTypeDisplay = () => {
    switch (rateType) {
      case "HOURLY":
        return (
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-slate-500" />
            <span>{t("hourly")}</span>
          </div>
        );
      case "PER_STUDENT":
        return (
          <div className="flex items-center gap-2">
            <Users className="size-4 text-slate-500" />
            <span>{t("perStudent")}</span>
          </div>
        );
      case "MONTHLY_FIXED":
        return (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-slate-500" />
            <span>{t("monthlyFixed")}</span>
          </div>
        );
      case "PER_MINUTE":
        return (
          <div className="flex items-center gap-2">
            <Timer className="size-4 text-slate-500" />
            <span>{t("perMinute")}</span>
          </div>
        );
    }
  };

  // Format amount to VND
  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(cents / 100);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getTeacherTypeBadge()}
              {usageCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {t("usedBy", { count: usageCount })}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg">{presetName}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(presetId)}>
                <Pencil className="size-4 mr-2" />
                {t("editPreset")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(presetId)}
                disabled={usageCount > 0}
                className="text-red-600"
              >
                <Trash2 className="size-4 mr-2" />
                {t("deletePreset")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">{getRateTypeDisplay()}</div>
            <div className="text-lg font-semibold">{formatAmount(amount)}</div>
          </div>
          {description && (
            <p className="text-sm text-slate-600 line-clamp-2">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
