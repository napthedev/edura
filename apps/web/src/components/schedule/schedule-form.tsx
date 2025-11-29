"use client";
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { CalendarPlus, Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

// Predefined colors for schedule items
const SCHEDULE_COLORS = [
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
] as const;

type ScheduleColor = (typeof SCHEDULE_COLORS)[number]["value"];

interface CreateScheduleFormProps {
  classId: string;
  onSuccess?: () => void;
}

interface Schedule {
  scheduleId: string;
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  title: string;
  color: string;
  location?: string | null;
  meetingLink?: string | null;
}

interface EditScheduleFormProps extends CreateScheduleFormProps {
  schedule: Schedule;
}

export default function CreateScheduleForm({
  classId,
  onSuccess,
}: CreateScheduleFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("1"); // Default Monday
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [color, setColor] = useState<ScheduleColor>("blue");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const queryClient = useQueryClient();
  const t = useTranslations("ScheduleForm");

  const dayOptions = [
    { value: "0", label: t("sunday") },
    { value: "1", label: t("monday") },
    { value: "2", label: t("tuesday") },
    { value: "3", label: t("wednesday") },
    { value: "4", label: t("thursday") },
    { value: "5", label: t("friday") },
    { value: "6", label: t("saturday") },
  ];

  const createMutation = useMutation({
    mutationFn: (data: {
      classId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      title: string;
      color: ScheduleColor;
      location?: string;
      meetingLink?: string;
    }) => trpcClient.education.createSchedule.mutate(data),
    onSuccess: (result) => {
      toast.success(t("scheduleCreated"));
      if (result.hasOverlap) {
        toast.warning(t("overlapWarning"));
      }
      setIsOpen(false);
      resetForm();
      queryClient.invalidateQueries({
        queryKey: ["class-schedules", classId],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-teacher-schedules"],
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`${t("failedToCreateSchedule")}: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTitle("");
    setDayOfWeek("1");
    setStartTime("09:00");
    setEndTime("10:00");
    setColor("blue");
    setLocation("");
    setMeetingLink("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }
    if (!startTime) {
      toast.error(t("startTimeRequired"));
      return;
    }
    if (!endTime) {
      toast.error(t("endTimeRequired"));
      return;
    }
    if (startTime >= endTime) {
      toast.error(t("endTimeAfterStartTime"));
      return;
    }

    createMutation.mutate({
      classId,
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
      title: title.trim(),
      color,
      location: location.trim() || undefined,
      meetingLink: meetingLink.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t("createSchedule")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            {t("createSchedule")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("titleLabel")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("enterScheduleTitle")}
              required
            />
          </div>

          <div>
            <Label htmlFor="dayOfWeek">{t("dayOfWeekLabel")}</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectDay")} />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">{t("startTimeLabel")}</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">{t("endTimeLabel")}</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>{t("colorLabel")}</Label>
            <div className="flex gap-2 mt-2">
              {SCHEDULE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "size-8 rounded-full transition-all",
                    c.class,
                    color === c.value
                      ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-100"
                      : "opacity-60 hover:opacity-100"
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="location">{t("locationLabel")}</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("locationPlaceholder")}
            />
          </div>

          <div>
            <Label htmlFor="meetingLink">{t("meetingLink")}</Label>
            <Input
              id="meetingLink"
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder={t("meetingLinkPlaceholder")}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? t("creating")
                : t("createScheduleButton")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditScheduleForm({
  classId,
  schedule,
  onSuccess,
}: EditScheduleFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(schedule.title);
  const [dayOfWeek, setDayOfWeek] = useState(String(schedule.dayOfWeek));
  const [startTime, setStartTime] = useState(schedule.startTime);
  const [endTime, setEndTime] = useState(schedule.endTime);
  const [color, setColor] = useState<ScheduleColor>(
    schedule.color as ScheduleColor
  );
  const [location, setLocation] = useState(schedule.location || "");
  const [meetingLink, setMeetingLink] = useState(schedule.meetingLink || "");
  const queryClient = useQueryClient();
  const t = useTranslations("ScheduleForm");

  const dayOptions = [
    { value: "0", label: t("sunday") },
    { value: "1", label: t("monday") },
    { value: "2", label: t("tuesday") },
    { value: "3", label: t("wednesday") },
    { value: "4", label: t("thursday") },
    { value: "5", label: t("friday") },
    { value: "6", label: t("saturday") },
  ];

  const updateMutation = useMutation({
    mutationFn: (data: {
      scheduleId: string;
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      title?: string;
      color?: ScheduleColor;
      location?: string | null;
      meetingLink?: string | null;
    }) => trpcClient.education.updateSchedule.mutate(data),
    onSuccess: (result) => {
      toast.success(t("scheduleUpdated"));
      if (result.hasOverlap) {
        toast.warning(t("overlapWarning"));
      }
      setIsOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["class-schedules", classId],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-teacher-schedules"],
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`${t("failedToUpdateSchedule")}: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }
    if (startTime >= endTime) {
      toast.error(t("endTimeAfterStartTime"));
      return;
    }

    updateMutation.mutate({
      scheduleId: schedule.scheduleId,
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
      title: title.trim(),
      color,
      location: location.trim() || null,
      meetingLink: meetingLink.trim() || null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editSchedule")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">{t("titleLabel")}</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("enterScheduleTitle")}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-dayOfWeek">{t("dayOfWeekLabel")}</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectDay")} />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-startTime">{t("startTimeLabel")}</Label>
              <Input
                id="edit-startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-endTime">{t("endTimeLabel")}</Label>
              <Input
                id="edit-endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>{t("colorLabel")}</Label>
            <div className="flex gap-2 mt-2">
              {SCHEDULE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "size-8 rounded-full transition-all",
                    c.class,
                    color === c.value
                      ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-100"
                      : "opacity-60 hover:opacity-100"
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="edit-location">{t("locationLabel")}</Label>
            <Input
              id="edit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("locationPlaceholder")}
            />
          </div>

          <div>
            <Label htmlFor="edit-meetingLink">{t("meetingLink")}</Label>
            <Input
              id="edit-meetingLink"
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder={t("meetingLinkPlaceholder")}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("updating") : t("updateSchedule")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
