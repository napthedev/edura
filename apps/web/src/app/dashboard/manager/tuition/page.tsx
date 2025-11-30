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
  DropdownMenuSeparator,
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
  Receipt,
  Plus,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Filter,
  X,
  Download,
} from "lucide-react";
import Link from "next/link";
import { exportToCsv } from "@/lib/utils";

type BillingStatus = "pending" | "paid" | "overdue" | "cancelled";
type PaymentMethod = "cash" | "bank_transfer" | "momo" | "vnpay";

export default function TuitionBillingPage() {
  const t = useTranslations("TuitionBilling");
  const queryClient = useQueryClient();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<BillingStatus | "all">(
    "all"
  );
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  // Dialog states
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBillingId, setSelectedBillingId] = useState<string | null>(
    null
  );

  // Form states
  const [billingMonth, setBillingMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [dueDate, setDueDate] = useState(() => {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    now.setDate(15);
    return now.toISOString().split("T")[0];
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("cash");

  // Queries
  const billingsQuery = useQuery({
    queryKey: [
      "tuition-billings",
      statusFilter === "all" ? undefined : statusFilter,
      monthFilter === "all" ? undefined : monthFilter,
      classFilter === "all" ? undefined : classFilter,
    ],
    queryFn: () =>
      trpcClient.education.getTuitionBillings.query({
        status: statusFilter === "all" ? undefined : statusFilter,
        billingMonth: monthFilter === "all" ? undefined : monthFilter,
        classId: classFilter === "all" ? undefined : classFilter,
      }),
  });

  const classesQuery = useQuery({
    queryKey: ["all-classes-manager"],
    queryFn: () => trpcClient.education.getAllClasses.query(),
  });

  // Mutations
  const generateBillingMutation = useMutation({
    mutationFn: (data: {
      billingMonth: string;
      dueDate: string;
      classIds?: string[];
    }) => trpcClient.education.createMonthlyBilling.mutate(data),
    onSuccess: (result) => {
      toast.success(t("billsGenerated", { count: result.created }));
      if (result.skipped > 0) {
        toast.info(t("billsSkipped", { count: result.skipped }));
      }
      queryClient.invalidateQueries({ queryKey: ["tuition-billings"] });
      setGenerateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("noBillsToGenerate"));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: {
      billingId: string;
      status: BillingStatus;
      paymentMethod?: PaymentMethod;
    }) => trpcClient.education.updateBillingStatus.mutate(data),
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      queryClient.invalidateQueries({ queryKey: ["tuition-billings"] });
      setPaymentDialogOpen(false);
      setSelectedBillingId(null);
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

  // Get unique months from billings for filter
  const uniqueMonths = Array.from(
    new Set(billingsQuery.data?.map((b) => b.billingMonth) || [])
  )
    .sort()
    .reverse();

  // Stats
  const stats = {
    total: billingsQuery.data?.length || 0,
    pending:
      billingsQuery.data?.filter((b) => b.status === "pending").length || 0,
    paid: billingsQuery.data?.filter((b) => b.status === "paid").length || 0,
    overdue:
      billingsQuery.data?.filter((b) => b.status === "overdue").length || 0,
  };

  const handleMarkAsPaid = (billingId: string) => {
    setSelectedBillingId(billingId);
    setPaymentDialogOpen(true);
  };

  const confirmPayment = () => {
    if (selectedBillingId) {
      updateStatusMutation.mutate({
        billingId: selectedBillingId,
        status: "paid",
        paymentMethod: selectedPaymentMethod,
      });
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setMonthFilter("all");
    setClassFilter("all");
  };

  const hasActiveFilters =
    statusFilter !== "all" || monthFilter !== "all" || classFilter !== "all";

  const handleExportCsv = () => {
    if (!billingsQuery.data || billingsQuery.data.length === 0) {
      toast.error(t("noDataToExport"));
      return;
    }

    const exportData = billingsQuery.data.map((billing) => ({
      invoiceNumber: billing.invoiceNumber || "-",
      studentName: billing.studentName || "-",
      studentEmail: billing.studentEmail || "-",
      className: billing.className || "-",
      billingMonth: billing.billingMonth,
      amount: billing.amount,
      status: billing.status,
      dueDate: billing.dueDate
        ? new Date(billing.dueDate).toLocaleDateString()
        : "-",
      paidAt: billing.paidAt
        ? new Date(billing.paidAt).toLocaleDateString()
        : "-",
      paymentMethod: billing.paymentMethod || "-",
    }));

    const columns = [
      { key: "invoiceNumber" as const, header: t("invoiceNumber") },
      { key: "studentName" as const, header: t("student") },
      { key: "studentEmail" as const, header: t("email") },
      { key: "className" as const, header: t("class") },
      { key: "billingMonth" as const, header: t("month") },
      { key: "amount" as const, header: t("amount") },
      { key: "status" as const, header: t("status") },
      { key: "dueDate" as const, header: t("dueDate") },
      { key: "paidAt" as const, header: t("paidAt") },
      { key: "paymentMethod" as const, header: t("paymentMethod") },
    ];

    const filename = `tuition-billings-${
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
            <Receipt className="h-6 w-6" />
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
            open={generateDialogOpen}
            onOpenChange={setGenerateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("generateBills")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("generateBills")}</DialogTitle>
                <DialogDescription>
                  Generate monthly tuition bills for all enrolled students.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t("selectMonth")}</Label>
                  <Input
                    type="month"
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("selectDueDate")}</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setGenerateDialogOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={() =>
                    generateBillingMutation.mutate({
                      billingMonth,
                      dueDate,
                    })
                  }
                  disabled={generateBillingMutation.isPending}
                >
                  {generateBillingMutation.isPending
                    ? t("generating")
                    : t("generate")}
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
              {t("totalBillings")}
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("pendingBills")}
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
              {t("paidBills")}
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
              {t("overdueBills")}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
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
                {t("clearFilters")}
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
                {t("filterByClass")}
              </Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allClasses")}</SelectItem>
                  {classesQuery.data?.map((cls) => (
                    <SelectItem key={cls.classId} value={cls.classId}>
                      {cls.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billings Table */}
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("billingsList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingsQuery.isLoading ? (
            <Loader />
          ) : billingsQuery.data && billingsQuery.data.length > 0 ? (
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">
                      {t("invoiceNumber")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("student")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("class")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("amount")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("billingMonth")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("dueDate")}
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
                  {billingsQuery.data.map((billing) => (
                    <TableRow
                      key={billing.billingId}
                      className="hover:bg-slate-50"
                    >
                      <TableCell className="font-mono text-sm">
                        {billing.invoiceNumber || "-"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {billing.studentName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {billing.studentEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{billing.className || "-"}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(billing.amount)}
                      </TableCell>
                      <TableCell>{formatMonth(billing.billingMonth)}</TableCell>
                      <TableCell>
                        {billing.dueDate
                          ? new Date(billing.dueDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(billing.status as BillingStatus)}
                      </TableCell>
                      <TableCell>
                        {getPaymentMethodLabel(
                          billing.paymentMethod as PaymentMethod | null
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
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/manager/tuition/${billing.billingId}`}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                {t("viewInvoice")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {billing.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleMarkAsPaid(billing.billingId)
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                  {t("markAsPaid")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      billingId: billing.billingId,
                                      status: "overdue",
                                    })
                                  }
                                >
                                  <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                  {t("markAsOverdue")}
                                </DropdownMenuItem>
                              </>
                            )}
                            {billing.status !== "cancelled" &&
                              billing.status !== "paid" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      billingId: billing.billingId,
                                      status: "cancelled",
                                    })
                                  }
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {t("markAsCancelled")}
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
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noBillings")}</p>
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
