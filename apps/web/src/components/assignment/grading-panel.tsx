"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "./rich-text-editor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Award, MessageSquare, Save, Loader2 } from "lucide-react";

interface GradingPanelProps {
  submissionId: string;
  currentGrade: number | null;
  currentFeedback: string | null;
  assignmentId: string;
}

export function GradingPanel({
  submissionId,
  currentGrade,
  currentFeedback,
  assignmentId,
}: GradingPanelProps) {
  const t = useTranslations("WrittenAssignment");
  const queryClient = useQueryClient();

  const [grade, setGrade] = useState<string>(
    currentGrade !== null ? currentGrade.toString() : ""
  );
  const [feedback, setFeedback] = useState<string>(currentFeedback || "");

  const gradeMutation = useMutation({
    mutationFn: async (data: { grade: number; feedback?: string }) => {
      return await trpcClient.education.gradeWrittenSubmission.mutate({
        submissionId,
        grade: data.grade,
        feedback: data.feedback,
      });
    },
    onSuccess: () => {
      toast.success(t("gradeSaved"));
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["teacher-submission", submissionId],
      });
      queryClient.invalidateQueries({
        queryKey: [["education", "getAssignmentSubmissions"]],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    const gradeNum = parseInt(grade, 10);

    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      toast.error(t("invalidGrade"));
      return;
    }

    gradeMutation.mutate({
      grade: gradeNum,
      feedback: feedback || undefined,
    });
  };

  const hasChanges =
    grade !== (currentGrade?.toString() ?? "") ||
    feedback !== (currentFeedback || "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="size-5" />
          {t("gradeSubmission")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Grade Input */}
        <div className="space-y-2">
          <Label htmlFor="grade" className="flex items-center gap-2">
            <Award className="size-4" />
            {t("grade")} (0-100)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="grade"
              type="number"
              min={0}
              max={100}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="0-100"
              className="w-32"
            />
            <span className="text-muted-foreground">/ 100</span>
          </div>
        </div>

        {/* Feedback Editor */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MessageSquare className="size-4" />
            {t("feedback")}
          </Label>
          <RichTextEditor
            content={feedback}
            onChange={setFeedback}
            placeholder={t("feedbackPlaceholder")}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={gradeMutation.isPending || !hasChanges || !grade}
          >
            {gradeMutation.isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                {t("saving")}
              </>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                {t("saveGrade")}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
