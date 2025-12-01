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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/loader";

export function SendBillingReportDialog() {
  const t = useTranslations("ParentNotification");
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  const studentsQuery = useQuery({
    queryKey: ["all-students"],
    queryFn: () => trpcClient.education.getAllStudents.query(),
    enabled: open,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      trpcClient.education.sendMonthlyBillingReportToParent.mutate({
        studentId: selectedStudent,
      }),
    onSuccess: () => {
      toast.success(t("reportSentSuccessfully"));
      setOpen(false);
      setSelectedStudent("");
    },
    onError: (error: any) => {
      toast.error(error.message || t("failedToSend"));
    },
  });

  const handleSend = () => {
    if (!selectedStudent) {
      toast.error(t("selectStudent"));
      return;
    }
    sendMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          <span className="hidden sm:inline">{t("sendBilling")}</span>
          <span className="sm:hidden">Billing</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t("sendBilling")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              Send the latest billing report to the student and parent email
              addresses.
            </p>
          </div>

          {studentsQuery.isLoading ? (
            <Loader />
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="student-select">{t("selectStudent")}</Label>
                <Select
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
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
                  disabled={sendMutation.isPending || !selectedStudent}
                  className="flex-1"
                >
                  {sendMutation.isPending ? "Sending..." : t("sendBilling")}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
