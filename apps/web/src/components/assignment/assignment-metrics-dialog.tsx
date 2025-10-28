"use client";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "next-intl";
import Loader from "@/components/loader";
import { useRouter } from "next/navigation";

interface AssignmentMetricsDialogProps {
  assignmentId: string;
  assignmentTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AssignmentMetricsDialog({
  assignmentId,
  assignmentTitle,
  isOpen,
  onClose,
}: AssignmentMetricsDialogProps) {
  const t = useTranslations("AssignmentMetricsDialog");
  const router = useRouter();

  const submissionsQuery = useQuery({
    queryKey: ["assignment-submissions", assignmentId],
    queryFn: () =>
      trpcClient.education.getAssignmentSubmissions.query({ assignmentId }),
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {t("metricsFor")} {assignmentTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {submissionsQuery.isLoading ? (
            <Loader />
          ) : submissionsQuery.data && submissionsQuery.data.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {t("submissions")} ({submissionsQuery.data.length})
                </h3>
              </div>
              <Separator />
              <ScrollArea className="">
                <div className="space-y-3">
                  {submissionsQuery.data.map((submission) => (
                    <div
                      key={submission.submissionId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">
                              {submission.student.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {submission.student.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            {t("submitted")}:{" "}
                            {new Date(submission.submittedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {submission.grade !== null ? (
                          <>
                            <Badge variant="secondary">
                              {t("grade")}: {submission.grade}/100
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/view-submission/${assignmentId}?submissionId=${submission.submissionId}`
                                )
                              }
                            >
                              {t("viewSubmission")}
                            </Button>
                          </>
                        ) : (
                          <Badge variant="outline">{t("notGraded")}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t("noSubmissionsYet")}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>{t("close")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
