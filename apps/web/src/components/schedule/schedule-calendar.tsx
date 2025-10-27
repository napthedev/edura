"use client";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditScheduleForm } from "./schedule-form";
import { format, isSameDay } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Schedule {
  scheduleId: string;
  title: string;
  description?: string | null;
  scheduledAt: string;
  meetingLink?: string | null;
}

interface ScheduleCalendarProps {
  schedules: Schedule[];
  classId: string;
  onScheduleUpdate?: () => void;
  isTeacher?: boolean;
}

export default function ScheduleCalendar({
  schedules,
  classId,
  onScheduleUpdate,
  isTeacher = false,
}: ScheduleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );

  const deleteMutation = useMutation({
    mutationFn: (scheduleId: string) =>
      trpcClient.education.deleteSchedule.mutate({ scheduleId }),
    onSuccess: () => {
      toast.success("Schedule deleted successfully");
      onScheduleUpdate?.();
    },
    onError: (error) => {
      toast.error(`Failed to delete schedule: ${error.message}`);
    },
  });

  // Get schedules for the selected date
  const schedulesForSelectedDate = selectedDate
    ? schedules.filter((schedule) =>
        isSameDay(new Date(schedule.scheduledAt), selectedDate)
      )
    : [];

  // Get all dates that have schedules
  const scheduledDates = schedules.map(
    (schedule) => new Date(schedule.scheduledAt)
  );

  // Custom day content to highlight days with schedules
  const modifiers = {
    hasSchedule: scheduledDates,
  };

  const modifiersStyles = {
    hasSchedule: {
      backgroundColor: "#3b82f6",
      color: "white",
      fontWeight: "bold",
      borderRadius: "12px",
    },
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Class Schedule Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground mt-4">
            Days with scheduled classes are highlighted in blue.
          </p>
        </CardContent>
      </Card>

      {/* Schedule Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate
              ? `Schedules for ${format(selectedDate, "MMMM d, yyyy")}`
              : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            schedulesForSelectedDate.length > 0 ? (
              <div className="space-y-4">
                {schedulesForSelectedDate.map((schedule) => (
                  <div
                    key={schedule.scheduleId}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{schedule.title}</h3>
                      <Badge variant="secondary">
                        {format(new Date(schedule.scheduledAt), "HH:mm")}
                      </Badge>
                    </div>
                    {schedule.description && (
                      <p className="text-sm text-muted-foreground">
                        {schedule.description}
                      </p>
                    )}
                    {schedule.meetingLink && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Meeting:</span>
                        <a
                          href={schedule.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      {isTeacher && (
                        <>
                          <EditScheduleForm
                            classId={classId}
                            schedule={schedule}
                            onSuccess={onScheduleUpdate}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Schedule
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this schedule?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteMutation.mutate(schedule.scheduleId)
                                  }
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                  {deleteMutation.isPending
                                    ? "Deleting..."
                                    : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No schedules for this date.
              </p>
            )
          ) : (
            <p className="text-muted-foreground">
              Please select a date to view schedules.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
