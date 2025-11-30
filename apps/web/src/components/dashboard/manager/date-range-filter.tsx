"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";

interface DateRangeFilterProps {
  value: number;
  onChange: (value: number) => void;
}

export default function DateRangeFilter({
  value,
  onChange,
}: DateRangeFilterProps) {
  const t = useTranslations("ManagerOverview");

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select
        value={value.toString()}
        onValueChange={(v) => onChange(parseInt(v))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("dateRange")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="3">{t("last3Months")}</SelectItem>
          <SelectItem value="6">{t("last6Months")}</SelectItem>
          <SelectItem value="12">{t("last12Months")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
