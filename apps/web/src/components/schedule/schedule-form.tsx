"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreateScheduleFormProps {
  classId: string;
  onSuccess?: () => void;
}

interface EditScheduleFormProps extends CreateScheduleFormProps {
  schedule?: {
    scheduleId: string;
    title: string;
    description?: string | null;
    scheduledAt: string;
    meetingLink?: string | null;
  };
}

export default function CreateScheduleForm({
  classId,
  onSuccess,
}: CreateScheduleFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      date: string;
      time: string;
      meetingLink?: string;
    }) =>
      trpcClient.education.createSchedule.mutate({
        classId,
        ...data,
      }),
    onSuccess: () => {
      toast.success("Schedule created successfully");
      setIsOpen(false);
      resetForm();
      // Invalidate schedules query
      queryClient.invalidateQueries({
        queryKey: ["class-schedules", classId],
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create schedule: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setMeetingLink("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!date) {
      toast.error("Date is required");
      return;
    }
    if (!time) {
      toast.error("Time is required");
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      time,
      meetingLink: meetingLink.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create Schedule</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Schedule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter schedule title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter schedule description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="meetingLink">Meeting Link</Label>
            <Input
              id="meetingLink"
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Schedule"}
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
  const [title, setTitle] = useState(schedule?.title || "");
  const [description, setDescription] = useState(schedule?.description || "");
  const [date, setDate] = useState(
    schedule ? new Date(schedule.scheduledAt).toISOString().split("T")[0] : ""
  );
  const [time, setTime] = useState(
    schedule ? new Date(schedule.scheduledAt).toTimeString().slice(0, 5) : ""
  );
  const [meetingLink, setMeetingLink] = useState(schedule?.meetingLink || "");
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: {
      scheduleId: string;
      title?: string;
      description?: string;
      date?: string;
      time?: string;
      meetingLink?: string;
    }) => trpcClient.education.updateSchedule.mutate(data),
    onSuccess: () => {
      toast.success("Schedule updated successfully");
      setIsOpen(false);
      // Invalidate schedules query
      queryClient.invalidateQueries({
        queryKey: ["class-schedules", classId],
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to update schedule: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedule) return;

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    updateMutation.mutate({
      scheduleId: schedule.scheduleId,
      title: title.trim(),
      description: description.trim() || undefined,
      date: date || undefined,
      time: time || undefined,
      meetingLink: meetingLink.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter schedule title"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter schedule description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-time">Time</Label>
              <Input
                id="edit-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-meetingLink">Meeting Link</Label>
            <Input
              id="edit-meetingLink"
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
