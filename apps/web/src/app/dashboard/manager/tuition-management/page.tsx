"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { DollarSign, Edit, BookOpen, GraduationCap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ClassTuitionManagementPage() {
  const t = useTranslations("ClassTuitionManagement");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [tuitionRate, setTuitionRate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const classesQuery = useQuery({
    queryKey: ["all-classes-manager"],
    queryFn: () => trpcClient.education.getAllClasses.query(),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      classId,
      tuitionRate,
    }: {
      classId: string;
      tuitionRate: number;
    }) =>
      trpcClient.education.updateClass.mutate({
        classId,
        tuitionRate,
      }),
    onSuccess: () => {
      toast.success(t("rateUpdated"));
      classesQuery.refetch();
      setDialogOpen(false);
      setTuitionRate("");
      setSelectedClass(null);
    },
    onError: (error) => {
      toast.error(`${t("updateFailed")}: ${error.message}`);
    },
  });

  const handleEdit = (classId: string, currentRate: number | null) => {
    setSelectedClass(classId);
    setTuitionRate(currentRate?.toString() || "");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (selectedClass) {
      const rate = parseFloat(tuitionRate);
      if (!isNaN(rate) && rate >= 0) {
        updateMutation.mutate({ classId: selectedClass, tuitionRate: rate });
      } else if (tuitionRate === "") {
        updateMutation.mutate({ classId: selectedClass, tuitionRate: 0 });
      }
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return t("notSet");
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const selectedClassData = classesQuery.data?.find(
    (c) => c.classId === selectedClass
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("description")}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalClasses")}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classesQuery.data?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("classesWithRates")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {classesQuery.data?.filter((c) => c.tuitionRate).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("classesWithoutRates")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {classesQuery.data?.filter((c) => !c.tuitionRate).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Table */}
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("classList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classesQuery.isLoading ? (
            <Loader />
          ) : classesQuery.data && classesQuery.data.length > 0 ? (
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">
                      {t("className")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("classCode")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("subject")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("teacher")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("tuitionRate")}
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      {t("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classesQuery.data.map((classData) => (
                    <TableRow
                      key={classData.classId}
                      className="hover:bg-slate-50"
                    >
                      <TableCell className="font-medium">
                        {classData.className}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {classData.classCode}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {classData.subject || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {classData.teacherName || "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            classData.tuitionRate
                              ? "text-green-600 font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {formatCurrency(classData.tuitionRate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleEdit(classData.classId, classData.tuitionRate)
                          }
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {t("edit")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noClasses")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editTuitionRate")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("class")}: {selectedClassData?.className}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("classCode")}: {selectedClassData?.classCode}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tuitionRate" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t("monthlyTuitionRate")}
              </Label>
              <Input
                id="tuitionRate"
                type="number"
                min="0"
                step="1000"
                value={tuitionRate}
                onChange={(e) => setTuitionRate(e.target.value)}
                placeholder={t("enterAmount")}
              />
              <p className="text-xs text-muted-foreground">{t("hint")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={updateMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
