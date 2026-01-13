"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardCheck,
  Upload,
  Layers,
  Timer,
  CheckCircle2,
  XCircle,
  FileUp,
  Eye,
  Star,
  RotateCcw,
  BookOpen,
  Brain,
  Percent,
  MessageSquare,
  Zap,
  Target,
  Users,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function AssignmentTypeGuide() {
  const t = useTranslations("AssignmentTypeGuide");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          {t("title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Quiz Assignment */}
          <div className="space-y-4 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  {t("quiz.title")}
                </h3>
                <Badge
                  variant="secondary"
                  className="mt-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                >
                  <Zap className="mr-1 h-3 w-3" />
                  {t("quiz.badge")}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {t("quiz.description")}
            </p>

            <Separator className="bg-blue-200 dark:bg-blue-800" />

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
                {t("features")}
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-blue-500" />
                  <span>{t("quiz.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{t("quiz.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-purple-500" />
                  <span>{t("quiz.feature3")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-pink-500" />
                  <span>{t("quiz.feature4")}</span>
                </li>
              </ul>
            </div>

            <Separator className="bg-blue-200 dark:bg-blue-800" />

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
                {t("bestFor")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  <Target className="mr-1 h-3 w-3" />
                  {t("quiz.use1")}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <BookOpen className="mr-1 h-3 w-3" />
                  {t("quiz.use2")}
                </Badge>
              </div>
            </div>
          </div>

          {/* Written Assignment */}
          <div className="space-y-4 rounded-lg border bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:from-emerald-950/20 dark:to-teal-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                <Upload className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
                  {t("written.title")}
                </h3>
                <Badge
                  variant="secondary"
                  className="mt-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                >
                  <FileUp className="mr-1 h-3 w-3" />
                  {t("written.badge")}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {t("written.description")}
            </p>

            <Separator className="bg-emerald-200 dark:bg-emerald-800" />

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                {t("features")}
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-emerald-500" />
                  <span>{t("written.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-teal-500" />
                  <span>{t("written.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>{t("written.feature3")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span>{t("written.feature4")}</span>
                </li>
              </ul>
            </div>

            <Separator className="bg-emerald-200 dark:bg-emerald-800" />

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                {t("bestFor")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  <BookOpen className="mr-1 h-3 w-3" />
                  {t("written.use1")}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Users className="mr-1 h-3 w-3" />
                  {t("written.use2")}
                </Badge>
              </div>
            </div>
          </div>

          {/* Flashcard Assignment */}
          <div className="space-y-4 rounded-lg border bg-gradient-to-br from-violet-50 to-purple-50 p-4 dark:from-violet-950/20 dark:to-purple-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900">
                <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-violet-900 dark:text-violet-100">
                  {t("flashcard.title")}
                </h3>
                <Badge
                  variant="secondary"
                  className="mt-1 bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  {t("flashcard.badge")}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {t("flashcard.description")}
            </p>

            <Separator className="bg-violet-200 dark:bg-violet-800" />

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
                {t("features")}
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-violet-500" />
                  <span>{t("flashcard.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-500" />
                  <span>{t("flashcard.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{t("flashcard.feature3")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-pink-500" />
                  <span>{t("flashcard.feature4")}</span>
                </li>
              </ul>
            </div>

            <Separator className="bg-violet-200 dark:bg-violet-800" />

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
                {t("bestFor")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  <BookOpen className="mr-1 h-3 w-3" />
                  {t("flashcard.use1")}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Brain className="mr-1 h-3 w-3" />
                  {t("flashcard.use2")}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Row */}
        <div className="mt-6 rounded-lg border bg-muted/50 p-4">
          <div className="grid gap-4 text-center text-sm md:grid-cols-3">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium">{t("grading.title")}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {t("grading.quiz")}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="font-medium">{t("grading.title")}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {t("grading.written")}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{t("grading.title")}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {t("grading.flashcard")}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
