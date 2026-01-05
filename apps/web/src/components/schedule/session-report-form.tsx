"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface SessionReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  sessionDate: string;
  title: string;
  existingReport?: {
    reportId: string;
    reportContent: string;
    recordingLink: string;
  } | null;
}

export default function SessionReportForm({
  open,
  onOpenChange,
  scheduleId,
  sessionDate,
  title,
  existingReport,
}: SessionReportFormProps) {
  const t = useTranslations("SessionReports");
  const queryClient = useQueryClient();
  const [reportContent, setReportContent] = useState(
    existingReport?.reportContent || ""
  );
  const [recordingLink, setRecordingLink] = useState(
    existingReport?.recordingLink || ""
  );

  const createMutation = useMutation({
    mutationFn: (data: {
      scheduleId: string;
      sessionDate: string;
      reportContent: string;
      recordingLink: string;
    }) => trpcClient.education.createSessionReport.mutate(data),
    onSuccess: () => {
      toast.success(t("reportSubmitted"));
      queryClient.invalidateQueries({ queryKey: ["schedules-with-reports"] });
      queryClient.invalidateQueries({ queryKey: ["session-reports"] });
      onOpenChange(false);
      setReportContent("");
      setRecordingLink("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      reportId: string;
      reportContent?: string;
      recordingLink?: string;
    }) => trpcClient.education.updateSessionReport.mutate(data),
    onSuccess: () => {
      toast.success(t("reportUpdated"));
      queryClient.invalidateQueries({ queryKey: ["schedules-with-reports"] });
      queryClient.invalidateQueries({ queryKey: ["session-reports"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (existingReport) {
      updateMutation.mutate({
        reportId: existingReport.reportId,
        reportContent,
        recordingLink,
      });
    } else {
      createMutation.mutate({
        scheduleId,
        sessionDate,
        reportContent,
        recordingLink,
      });
    }
  };

  const characterCount = reportContent.length;
  const isValid = characterCount >= 200 && recordingLink.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {existingReport ? t("editReport") : t("createReport")}
          </DialogTitle>
          <DialogDescription>
            {title} - {sessionDate}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          <Label htmlFor="report-content">{t("reportContent")}</Label>
          <Textarea
            id="report-content"
            placeholder={t("reportContentPlaceholder")}
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
            rows={8}
            className="resize-none"
          />
          <p
            className={`text-sm ${
              characterCount < 200
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {characterCount} / 200 {t("characterCountMin")}
          </p>
        </div>

        <div className="space-y-4">
          <Label htmlFor="recording-link">{t("recordingLink")}</Label>
          <Input
            id="recording-link"
            type="url"
            placeholder={t("recordingLinkPlaceholder")}
            value={recordingLink}
            onChange={(e) => setRecordingLink(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !isValid || createMutation.isPending || updateMutation.isPending
            }
          >
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {existingReport ? "Update Report" : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
