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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Wallet,
  Calculator,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Users,
  Calendar,
  Filter,
  X,
  Download,
} from "lucide-react";
import { exportToCsv } from "@/lib/utils";

type BillingStatus = "pending" | "paid" | "overdue" | "cancelled";
type PaymentMethod = "cash" | "bank_transfer" | "momo" | "vnpay";
type RateType = "HOURLY" | "PER_STUDENT" | "MONTHLY_FIXED";

export default function TutorPaymentsPage() {
  const t = useTranslations("TutorPayments");
  const queryClient = useQueryClient();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<BillingStatus | "all">(
    "all"
  );
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");

  // Dialog states
  const [calculateDialogOpen, setCalculateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null
  );

  // Form states
  const [paymentMonth, setPaymentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("bank_transfer");

  // Queries
  const paymentsQuery = useQuery({
    queryKey: [
      "tutor-payments",
      statusFilter === "all" ? undefined : statusFilter,
      monthFilter === "all" ? undefined : monthFilter,
      teacherFilter === "all" ? undefined : teacherFilter,
    ],
    queryFn: () =>
      trpcClient.education.getTutorPayments.query({
        status: statusFilter === "all" ? undefined : statusFilter,
        paymentMonth: monthFilter === "all" ? undefined : monthFilter,
        teacherId: teacherFilter === "all" ? undefined : teacherFilter,
      }),
  });

  const teachersQuery = useQuery({
    queryKey: ["all-teachers"],
    queryFn: () => trpcClient.education.getAllTeachers.query(),
  });

  // Mutations
  const calculatePaymentsMutation = useMutation({
    mutationFn: (data: { paymentMonth: string }) =>
      trpcClient.education.calculateMonthlyTutorPay.mutate(data),
    onSuccess: (result) => {
      toast.success(t("paymentsGenerated", { count: result.created }));
      if (result.skipped > 0) {
        toast.info(t("paymentsSkipped", { count: result.skipped }));
      }
      queryClient.invalidateQueries({ queryKey: ["tutor-payments"] });
      setCalculateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("noTeachersWithRates"));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: {
      paymentId: string;
      status: BillingStatus;
      paymentMethod?: PaymentMethod;
    }) => trpcClient.education.updateTutorPaymentStatus.mutate(data),
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      queryClient.invalidateQueries({ queryKey: ["tutor-payments"] });
      setPaymentDialogOpen(false);
      setSelectedPaymentId(null);
    },
  });

  // Helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    return new Date(parseInt(year!), parseInt(month!) - 1).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
      }
    );
  };

  const getStatusBadge = (status: BillingStatus) => {
    const variants: Record<
      BillingStatus,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: React.ReactNode;
      }
    > = {
      pending: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      paid: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      overdue: {
        variant: "destructive",
        icon: <AlertCircle className="h-3 w-3" />,
      },
      cancelled: { variant: "outline", icon: <XCircle className="h-3 w-3" /> },
    };
    const { variant, icon } = variants[status];
    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {t(`status${status.charAt(0).toUpperCase() + status.slice(1)}` as any)}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: PaymentMethod | null) => {
    if (!method) return "-";
    const labels: Record<PaymentMethod, string> = {
      cash: t("cash"),
      bank_transfer: t("bankTransfer"),
      momo: t("momo"),
      vnpay: t("vnpay"),
    };
    return labels[method];
  };

  const getRateTypeLabel = (rateType: RateType | null) => {
    if (!rateType) return "-";
    const labels: Record<RateType, string> = {
      HOURLY: t("hourly"),
      PER_STUDENT: t("perStudent"),
      MONTHLY_FIXED: t("monthlyFixed"),
    };
    return labels[rateType];
  };

  // Get unique months from payments for filter
  const uniqueMonths = Array.from(
    new Set(paymentsQuery.data?.map((p) => p.paymentMonth) || [])
  )
    .sort()
    .reverse();

  // Stats
  const stats = {
    total: paymentsQuery.data?.length || 0,
    pending:
      paymentsQuery.data?.filter((p) => p.status === "pending").length || 0,
    paid: paymentsQuery.data?.filter((p) => p.status === "paid").length || 0,
    totalAmount: paymentsQuery.data?.reduce((sum, p) => sum + p.amount, 0) || 0,
  };

  const handleMarkAsPaid = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setPaymentDialogOpen(true);
  };

  const confirmPayment = () => {
    if (selectedPaymentId) {
      updateStatusMutation.mutate({
        paymentId: selectedPaymentId,
        status: "paid",
        paymentMethod: selectedPaymentMethod,
      });
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setMonthFilter("all");
    setTeacherFilter("all");
  };

  const hasActiveFilters =
    statusFilter !== "all" || monthFilter !== "all" || teacherFilter !== "all";

  const handleExportCsv = () => {
    if (!paymentsQuery.data || paymentsQuery.data.length === 0) {
      toast.error(t("noDataToExport"));
      return;
    }

    const exportData = paymentsQuery.data.map((payment) => ({
      teacherName: payment.teacherName || "-",
      teacherEmail: payment.teacherEmail || "-",
      paymentMonth: payment.paymentMonth,
      amount: payment.amount,
      sessionsCount: payment.sessionsCount || 0,
      studentsCount: payment.studentsCount || 0,
      rateType: payment.rateType || "-",
      status: payment.status,
      paidAt: payment.paidAt
        ? new Date(payment.paidAt).toLocaleDateString()
        : "-",
      paymentMethod: payment.paymentMethod || "-",
    }));

    const columns = [
      { key: "teacherName" as const, header: t("teacher") },
      { key: "teacherEmail" as const, header: t("email") },
      { key: "paymentMonth" as const, header: t("month") },
      { key: "amount" as const, header: t("amount") },
      { key: "sessionsCount" as const, header: t("sessions") },
      { key: "studentsCount" as const, header: t("students") },
      { key: "rateType" as const, header: t("rateType") },
      { key: "status" as const, header: t("status") },
      { key: "paidAt" as const, header: t("paidAt") },
      { key: "paymentMethod" as const, header: t("paymentMethod") },
    ];

    const filename = `tutor-payments-${
      monthFilter !== "all" ? monthFilter : "all"
    }-${new Date().toISOString().split("T")[0]}`;
    exportToCsv(exportData, filename, columns);
    toast.success(t("exportSuccess"));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="h-4 w-4 mr-2" />
            {t("exportCsv")}
          </Button>
          <Dialog
            open={calculateDialogOpen}
            onOpenChange={setCalculateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Calculator className="h-4 w-4 mr-2" />
                {t("calculatePayments")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("calculatePayments")}</DialogTitle>
                <DialogDescription>
                  Calculate monthly payments for all teachers based on their
                  rates and activity.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t("selectMonth")}</Label>
                  <Input
                    type="month"
                    value={paymentMonth}
                    onChange={(e) => setPaymentMonth(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCalculateDialogOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={() =>
                    calculatePaymentsMutation.mutate({ paymentMonth })
                  }
                  disabled={calculatePaymentsMutation.isPending}
                >
                  {calculatePaymentsMutation.isPending
                    ? t("calculating")
                    : t("calculate")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalPayments")}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("pendingPayments")}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("paidPayments")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.paid}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Teachers
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

      {/* Filters */}
      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Label className="text-xs text-muted-foreground">
                {t("filterByStatus")}
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as any)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("statusPending")}</SelectItem>
                  <SelectItem value="paid">{t("statusPaid")}</SelectItem>
                  <SelectItem value="overdue">{t("statusOverdue")}</SelectItem>
                  <SelectItem value="cancelled">
                    {t("statusCancelled")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label className="text-xs text-muted-foreground">
                {t("filterByMonth")}
              </Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allMonths")}</SelectItem>
                  {uniqueMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {formatMonth(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label className="text-xs text-muted-foreground">
                {t("filterByTeacher")}
              </Label>
              <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allTeachers")}</SelectItem>
                  {teachersQuery.data?.map((teacher) => (
                    <SelectItem key={teacher.userId} value={teacher.userId}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t("paymentsList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsQuery.isLoading ? (
            <Loader />
          ) : paymentsQuery.data && paymentsQuery.data.length > 0 ? (
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">
                      {t("teacher")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("amount")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("paymentMonth")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("sessions")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("students")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("status")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("paymentMethod")}
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      {t("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsQuery.data.map((payment) => (
                    <TableRow
                      key={payment.paymentId}
                      className="hover:bg-slate-50"
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.teacherName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payment.teacherEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>{formatMonth(payment.paymentMonth)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {payment.sessionsCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {payment.studentsCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status as BillingStatus)}
                      </TableCell>
                      <TableCell>
                        {getPaymentMethodLabel(
                          payment.paymentMethod as PaymentMethod | null
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {payment.status === "pending" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleMarkAsPaid(payment.paymentId)
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                {t("markAsPaid")}
                              </DropdownMenuItem>
                            )}
                            {payment.status !== "cancelled" &&
                              payment.status !== "paid" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      paymentId: payment.paymentId,
                                      status: "cancelled",
                                    })
                                  }
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noPayments")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("markAsPaid")}</DialogTitle>
            <DialogDescription>{t("selectPaymentMethod")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedPaymentMethod}
              onValueChange={(v) =>
                setSelectedPaymentMethod(v as PaymentMethod)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t("cash")}</SelectItem>
                <SelectItem value="bank_transfer">
                  {t("bankTransfer")}
                </SelectItem>
                <SelectItem value="momo">{t("momo")}</SelectItem>
                <SelectItem value="vnpay">{t("vnpay")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={confirmPayment}
              disabled={updateStatusMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {t("markAsPaid")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
