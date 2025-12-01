"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  DollarSign,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";

type RateType = "HOURLY" | "PER_STUDENT" | "MONTHLY_FIXED";

export default function TeacherRatesPage() {
  const t = useTranslations("TeacherRates");
  const queryClient = useQueryClient();

  // State
  const [showInactive, setShowInactive] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);

  // Create form state
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedRateType, setSelectedRateType] = useState<RateType>("HOURLY");
  const [amount, setAmount] = useState<string>("");
  const [effectiveDate, setEffectiveDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]!;
  });

  // Edit form state
  const [editAmount, setEditAmount] = useState<string>("");
  const [editEffectiveDate, setEditEffectiveDate] = useState<string>("");

  // Queries
  const ratesQuery = useQuery({
    queryKey: ["teacher-rates", showInactive],
    queryFn: () =>
      trpcClient.education.getTeacherRates.query({
        activeOnly: !showInactive,
      }),
  });

  const teachersQuery = useQuery({
    queryKey: ["all-teachers"],
    queryFn: () => trpcClient.education.getAllTeachers.query(),
  });

  // Mutations
  const createRateMutation = useMutation({
    mutationFn: (data: {
      teacherId: string;
      rateType: RateType;
      amount: number;
      effectiveDate?: string;
    }) => trpcClient.education.createTeacherRate.mutate(data),
    onSuccess: () => {
      toast.success(t("rateCreated"));
      queryClient.invalidateQueries({ queryKey: ["teacher-rates"] });
      setCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: (data: {
      rateId: string;
      amount?: number;
      effectiveDate?: string;
    }) => trpcClient.education.updateTeacherRate.mutate(data),
    onSuccess: () => {
      toast.success(t("rateUpdated"));
      queryClient.invalidateQueries({ queryKey: ["teacher-rates"] });
      setEditDialogOpen(false);
      setSelectedRateId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("cannotEditUsedRate"));
    },
  });

  const deactivateRateMutation = useMutation({
    mutationFn: (rateId: string) =>
      trpcClient.education.deactivateTeacherRate.mutate({ rateId }),
    onSuccess: () => {
      toast.success(t("rateDeactivated"));
      queryClient.invalidateQueries({ queryKey: ["teacher-rates"] });
      setDeactivateDialogOpen(false);
      setSelectedRateId(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const resetCreateForm = () => {
    setSelectedTeacherId("");
    setSelectedRateType("HOURLY");
    setAmount("");
    setEffectiveDate(new Date().toISOString().split("T")[0]!);
  };

  const getRateTypeLabel = (rateType: RateType) => {
    const labels: Record<RateType, string> = {
      HOURLY: t("hourly"),
      PER_STUDENT: t("perStudent"),
      MONTHLY_FIXED: t("monthlyFixed"),
    };
    return labels[rateType];
  };

  const getRateTypeDescription = (rateType: RateType) => {
    const descriptions: Record<RateType, string> = {
      HOURLY: t("hourlyDescription"),
      PER_STUDENT: t("perStudentDescription"),
      MONTHLY_FIXED: t("monthlyFixedDescription"),
    };
    return descriptions[rateType];
  };

  const getRateTypeIcon = (rateType: RateType) => {
    const icons: Record<RateType, React.ReactNode> = {
      HOURLY: <Clock className="h-4 w-4" />,
      PER_STUDENT: <Users className="h-4 w-4" />,
      MONTHLY_FIXED: <Calendar className="h-4 w-4" />,
    };
    return icons[rateType];
  };

  const getAmountLabel = () => {
    switch (selectedRateType) {
      case "HOURLY":
        return t("amountPerHour");
      case "PER_STUDENT":
        return t("amountPerStudent");
      case "MONTHLY_FIXED":
        return t("monthlyAmount");
      default:
        return t("amount");
    }
  };

  const handleCreateRate = () => {
    if (!selectedTeacherId || !amount) {
      toast.error(t("requiredFieldError"));
      return;
    }
    createRateMutation.mutate({
      teacherId: selectedTeacherId,
      rateType: selectedRateType,
      amount: parseInt(amount),
      effectiveDate: effectiveDate || undefined,
    });
  };

  const handleEditRate = (rateId: string) => {
    const rate = ratesQuery.data?.find((r) => r.rateId === rateId);
    if (rate) {
      setSelectedRateId(rateId);
      setEditAmount(rate.amount.toString());
      setEditEffectiveDate(
        new Date(rate.effectiveDate).toISOString().split("T")[0]!
      );
      setEditDialogOpen(true);
    }
  };

  const confirmEditRate = () => {
    if (selectedRateId) {
      updateRateMutation.mutate({
        rateId: selectedRateId,
        amount: editAmount ? parseInt(editAmount) : undefined,
        effectiveDate: editEffectiveDate || undefined,
      });
    }
  };

  const handleDeactivateRate = (rateId: string) => {
    setSelectedRateId(rateId);
    setDeactivateDialogOpen(true);
  };

  // Stats
  const activeRatesCount =
    ratesQuery.data?.filter((r) => r.isActive).length || 0;
  const teachersWithRatesCount = new Set(
    ratesQuery.data?.filter((r) => r.isActive).map((r) => r.teacherId)
  ).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("createRate")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("createRate")}</DialogTitle>
              <DialogDescription>
                {t("createRateDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("teacher")} *</Label>
                <Select
                  value={selectedTeacherId}
                  onValueChange={setSelectedTeacherId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectTeacher")} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachersQuery.data?.map((teacher) => (
                      <SelectItem key={teacher.userId} value={teacher.userId}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("rateType")} *</Label>
                <Select
                  value={selectedRateType}
                  onValueChange={(v) => setSelectedRateType(v as RateType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectRateType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOURLY">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{t("hourly")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="PER_STUDENT">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{t("perStudent")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MONTHLY_FIXED">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{t("monthlyFixed")}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getRateTypeDescription(selectedRateType)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{getAmountLabel()} *</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("effectiveDate")}</Label>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleCreateRate}
                disabled={createRateMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("createRate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("active")} {t("ratesList")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRatesCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("teachersWithRates")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachersWithRatesCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalTeachers")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teachersQuery.data?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rates Table */}
      <Card className="shadow-sm border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t("ratesList")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="show-inactive" className="text-sm">
                {showInactive ? t("hideInactive") : t("showInactive")}
              </Label>
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {ratesQuery.isLoading ? (
            <Loader />
          ) : ratesQuery.data && ratesQuery.data.length > 0 ? (
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">
                      {t("teacher")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("rateType")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("amount")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("effectiveDate")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("status")}
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      {t("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratesQuery.data.map((rate) => (
                    <TableRow
                      key={rate.rateId}
                      className={`hover:bg-slate-50 ${
                        !rate.isActive ? "opacity-50" : ""
                      }`}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{rate.teacherName}</div>
                          <div className="text-xs text-muted-foreground">
                            {rate.teacherEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRateTypeIcon(rate.rateType as RateType)}
                          <span>
                            {getRateTypeLabel(rate.rateType as RateType)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(rate.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(rate.effectiveDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {rate.isActive ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-700 hover:bg-green-100"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t("active")}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <XCircle className="h-3 w-3 mr-1" />
                            {t("inactive")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {rate.isActive && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditRate(rate.rateId)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                {t("editRate")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeactivateRate(rate.rateId)
                                }
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("deactivateRate")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noRates")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Rate Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editRate")}</DialogTitle>
            <DialogDescription>{t("editRateDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                {t("amount")} {t("vndCurrency")}
              </Label>
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("effectiveDate")}</Label>
              <Input
                type="date"
                value={editEffectiveDate}
                onChange={(e) => setEditEffectiveDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={confirmEditRate}
              disabled={updateRateMutation.isPending}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t("editRate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Rate Confirmation */}
      <AlertDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deactivateRate")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deactivateRateConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                selectedRateId && deactivateRateMutation.mutate(selectedRateId)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("deactivateRate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
