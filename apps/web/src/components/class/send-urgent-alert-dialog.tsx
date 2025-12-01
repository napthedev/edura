"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/loader";

interface SendUrgentAlertDialogProps {
  isManager?: boolean;
}

export function SendUrgentAlertDialog({
  isManager = true,
}: SendUrgentAlertDialogProps) {
  const t = useTranslations("ParentNotification");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    title: "",
    message: "",
  });

  const studentsQuery = useQuery({
    queryKey: ["all-students"],
    queryFn: () => trpcClient.education.getAllStudents.query(),
    enabled: open && isManager,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      trpcClient.education.sendUrgentAlertToParent.mutate({
        studentId: formData.studentId,
        title: formData.title,
        message: formData.message,
      }),
    onSuccess: () => {
      toast.success(t("alertSentSuccessfully"));
      setOpen(false);
      setFormData({ studentId: "", title: "", message: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || t("failedToSend"));
    },
  });

  const handleSend = () => {
    if (!formData.studentId || !formData.title || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }
    sendMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="hidden sm:inline">{t("sendAlert")}</span>
          <span className="sm:hidden">Alert</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {t("sendAlert")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              Send an urgent alert to the student and parent email addresses.
            </p>
          </div>

          {isManager && studentsQuery.isLoading ? (
            <Loader />
          ) : (
            <>
              {/* Student Selection (Manager Only) */}
              {isManager && (
                <div className="space-y-2">
                  <Label htmlFor="student-select">{t("selectStudent")}</Label>
                  <Select
                    value={formData.studentId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, studentId: value })
                    }
                  >
                    <SelectTrigger id="student-select">
                      <SelectValue placeholder={t("selectStudent")} />
                    </SelectTrigger>
                    <SelectContent>
                      {studentsQuery.data?.map((student) => (
                        <SelectItem key={student.userId} value={student.userId}>
                          {student.name} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Alert Title */}
              <div className="space-y-2">
                <Label htmlFor="alert-title">{t("alertTitle")}</Label>
                <Input
                  id="alert-title"
                  placeholder="e.g., Missed Assignment Deadline"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              {/* Alert Message */}
              <div className="space-y-2">
                <Label htmlFor="alert-message">{t("alertMessage")}</Label>
                <Textarea
                  id="alert-message"
                  placeholder="Enter your alert message here..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={sendMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={
                    sendMutation.isPending ||
                    !formData.title ||
                    !formData.message ||
                    (isManager && !formData.studentId)
                  }
                  className="flex-1"
                >
                  {sendMutation.isPending ? "Sending..." : t("sendAlert")}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
