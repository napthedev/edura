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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { Bell, Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ParentNotificationSettingsDialogProps {
  studentId: string;
  studentName: string;
}

export function ParentNotificationSettingsDialog({
  studentId,
  studentName,
}: ParentNotificationSettingsDialogProps) {
  const t = useTranslations("ParentNotification");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    enableWeekly: true,
    enableMonthly: true,
    enableUrgentAlerts: true,
  });

  const consentQuery = useQuery({
    queryKey: ["parent-consent", studentId],
    queryFn: () => trpcClient.education.getParentConsent.query({ studentId }),
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      trpcClient.education.updateParentConsent.mutate({
        studentId,
        ...data,
      }),
    onSuccess: () => {
      toast.success(t("settingsSavedSuccessfully"));
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("failedToSend"));
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && consentQuery.data) {
      setFormData({
        enableWeekly: consentQuery.data.enableWeekly,
        enableMonthly: consentQuery.data.enableMonthly,
        enableUrgentAlerts: consentQuery.data.enableUrgentAlerts,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleCopyEmail = (email: string) => {
    if (email) {
      navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">{t("settings")}</span>
          <span className="sm:hidden">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("settings")}
          </DialogTitle>
        </DialogHeader>

        {consentQuery.isLoading ? (
          <Loader />
        ) : consentQuery.data ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Parent Email Display */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                {t("parentEmail")}
              </Label>
              {consentQuery.data.parentEmail ? (
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-md border">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono flex-1">
                    {consentQuery.data.parentEmail}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      if (consentQuery.data.parentEmail) {
                        handleCopyEmail(consentQuery.data.parentEmail);
                      }
                    }}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground bg-amber-50 p-3 rounded-md border border-amber-200">
                  {t("parentNotNotified")}
                </div>
              )}
            </div>

            {/* Notification Preferences */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-base font-semibold">
                {t("notificationPreferences")}
              </Label>

              <div className="space-y-3">
                {/* Weekly Reports */}
                <div className="flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:bg-slate-50">
                  <Checkbox
                    id="enableWeekly"
                    checked={formData.enableWeekly}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        enableWeekly: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor="enableWeekly"
                    className="flex-1 cursor-pointer font-medium text-sm"
                  >
                    {t("enableWeekly")}
                  </Label>
                </div>

                {/* Monthly Billing */}
                <div className="flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:bg-slate-50">
                  <Checkbox
                    id="enableMonthly"
                    checked={formData.enableMonthly}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        enableMonthly: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor="enableMonthly"
                    className="flex-1 cursor-pointer font-medium text-sm"
                  >
                    {t("enableMonthly")}
                  </Label>
                </div>

                {/* Urgent Alerts */}
                <div className="flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:bg-slate-50">
                  <Checkbox
                    id="enableUrgentAlerts"
                    checked={formData.enableUrgentAlerts}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        enableUrgentAlerts: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor="enableUrgentAlerts"
                    className="flex-1 cursor-pointer font-medium text-sm"
                  >
                    {t("enableUrgent")}
                  </Label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? t("loading") : t("saveSettings")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Error loading settings
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
