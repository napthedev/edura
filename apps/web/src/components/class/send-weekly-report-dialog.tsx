"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface SendWeeklyReportDialogProps {
  studentId: string;
  studentName: string;
  classId: string;
}

export function SendWeeklyReportDialog({
  studentId,
  studentName,
  classId,
}: SendWeeklyReportDialogProps) {
  const t = useTranslations("ParentNotification");
  const [open, setOpen] = useState(false);

  const sendMutation = useMutation({
    mutationFn: () =>
      trpcClient.education.sendWeeklyReportToParent.mutate({
        studentId,
        classId,
      }),
    onSuccess: (data) => {
      toast.success(t("reportSentSuccessfully"));
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("failedToSend"));
    },
  });

  const handleSend = () => {
    sendMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">{t("sendReport")}</span>
          <span className="sm:hidden">Report</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("sendReport")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              <strong>{studentName}</strong>'s weekly performance report will be
              sent to the student and parent email addresses.
            </p>
          </div>

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
              disabled={sendMutation.isPending}
              className="flex-1"
            >
              {sendMutation.isPending ? "Sending..." : t("sendReport")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
