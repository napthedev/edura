"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpcClient } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Report {
  reportId: string;
  sessionDate: string;
  reportContent: string;
  recordingLink: string;
  isValid: boolean;
  createdAt: string | Date;
  teacher: {
    id: string;
    name: string | null;
    email: string | null;
  };
  class: {
    id: string;
    name: string;
    code: string;
  };
}

interface ReportDetailModalProps {
  report: Report;
  trigger?: React.ReactNode;
  onUpdate?: () => void;
}

export function ReportDetailModal({
  report,
  trigger,
  onUpdate,
}: ReportDetailModalProps) {
  const t = useTranslations("ReportDetailModal");
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const toggleValidityMutation = useMutation({
    mutationFn: (data: { reportId: string; isValid: boolean }) =>
      trpcClient.education.toggleSessionReportValidity.mutate(data),
    onSuccess: () => {
      toast.success(t("statusUpdatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["all-session-reports"] });
      if (onUpdate) onUpdate();
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleToggleValidity = () => {
    toggleValidityMutation.mutate({
      reportId: report.reportId,
      isValid: !report.isValid,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description", {
              date: report.sessionDate,
              teacher: report.teacher.name || report.teacher.email || "",
            })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("classInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    {report.class.name}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {report.class.code}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("status")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {report.isValid ? (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 flex w-fit items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      {t("valid")}
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className="flex w-fit items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {t("invalid")}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("content")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-md text-sm whitespace-pre-wrap">
                  {report.reportContent}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("recording")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.recordingLink ? (
                  <a
                    href={report.recordingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {report.recordingLink}
                  </a>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    {t("noRecording")}
                  </span>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant={report.isValid ? "destructive" : "default"}
            onClick={handleToggleValidity}
            disabled={toggleValidityMutation.isPending}
          >
            {toggleValidityMutation.isPending
              ? t("processing")
              : report.isValid
              ? t("markAsInvalid")
              : t("markAsValid")}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
