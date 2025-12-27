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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Plus,
  Pencil,
  Trash2,
  History,
  FileText,
  Eye,
  CheckSquare,
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [batchPayDialogOpen, setBatchPayDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null
  );
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);

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

  // Manual payment form states
  const [manualTeacherId, setManualTeacherId] = useState<string>("");
  const [manualAmount, setManualAmount] = useState<string>("");
  const [manualMonth, setManualMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [manualSessions, setManualSessions] = useState<string>("");
  const [manualStudents, setManualStudents] = useState<string>("");
  const [manualNotes, setManualNotes] = useState<string>("");

  // Edit payment form states
  const [editAmount, setEditAmount] = useState<string>("");
  const [editSessions, setEditSessions] = useState<string>("");
  const [editStudents, setEditStudents] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  // Batch operation notes
  const [batchNotes, setBatchNotes] = useState<string>("");

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

  // Create manual payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (data: {
      teacherId: string;
      amount: number;
      paymentMonth: string;
      sessionsCount?: number;
      studentsCount?: number;
      notes?: string;
    }) => trpcClient.education.createManualTutorPayment.mutate(data),
    onSuccess: () => {
      toast.success(t("paymentCreated"));
      queryClient.invalidateQueries({ queryKey: ["tutor-payments"] });
      setCreateDialogOpen(false);
      resetManualForm();
    },
    onError: (error: any) => {
      toast.error(error.message || t("paymentAlreadyExists"));
    },
  });

  // Update payment details mutation
  const updatePaymentMutation = useMutation({
    mutationFn: (data: {
      paymentId: string;
      amount?: number;
      sessionsCount?: number;
      studentsCount?: number;
      notes?: string;
    }) => trpcClient.education.updateTutorPaymentDetails.mutate(data),
    onSuccess: () => {
      toast.success(t("paymentUpdated"));
      queryClient.invalidateQueries({ queryKey: ["tutor-payments"] });
      setEditDialogOpen(false);
      setSelectedPaymentId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("onlyPendingCanBeEdited"));
    },
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) =>
      trpcClient.education.deleteTutorPayment.mutate({ paymentId }),
    onSuccess: () => {
      toast.success(t("paymentDeleted"));
      queryClient.invalidateQueries({ queryKey: ["tutor-payments"] });
      setDeleteDialogOpen(false);
      setSelectedPaymentId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("onlyPendingCanBeDeleted"));
    },
  });

  // Batch mark as paid mutation
  const batchMarkAsPaidMutation = useMutation({
    mutationFn: (data: {
      paymentIds: string[];
      paymentMethod: PaymentMethod;
      notes?: string;
    }) => trpcClient.education.markMultipleTutorPaymentsAsPaid.mutate(data),
    onSuccess: (result) => {
      toast.success(
        t("batchOperationSuccess", { count: result.processedCount })
      );
      if (result.errors && result.errors.length > 0) {
        toast.warning(t("batchOperationErrors"));
      }
      queryClient.invalidateQueries({ queryKey: ["tutor-payments"] });
      setBatchPayDialogOpen(false);
      setSelectedPaymentIds([]);
      setBatchNotes("");
    },
  });

  // Bulk update status mutation
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: (data: {
      paymentIds: string[];
      status: "pending" | "overdue" | "cancelled";
      notes?: string;
    }) => trpcClient.education.bulkUpdateTutorPaymentStatus.mutate(data),
    onSuccess: (result) => {
      toast.success(
        t("batchOperationSuccess", { count: result.processedCount })
      );
      if (result.errors && result.errors.length > 0) {
        toast.warning(t("batchOperationErrors"));
      }
      queryClient.invalidateQueries({ queryKey: ["tutor-payments"] });
      setSelectedPaymentIds([]);
    },
  });

  // Payment history query (lazy)
  const historyQuery = useQuery({
    queryKey: ["payment-history", selectedPaymentId],
    queryFn: () =>
      selectedPaymentId
        ? trpcClient.education.getTutorPaymentHistory.query({
            paymentId: selectedPaymentId,
          })
        : Promise.resolve([]),
    enabled: historyDialogOpen && !!selectedPaymentId,
  });

  // Payment details query (lazy)
  const detailsQuery = useQuery({
    queryKey: ["payment-details", selectedPaymentId],
    queryFn: () =>
      selectedPaymentId
        ? trpcClient.education.getTutorPaymentInvoice.query({
            paymentId: selectedPaymentId,
          })
        : Promise.resolve(null),
    enabled: detailsDialogOpen && !!selectedPaymentId,
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

  // Reset manual payment form
  const resetManualForm = () => {
    setManualTeacherId("");
    setManualAmount("");
    setManualMonth(() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    });
    setManualSessions("");
    setManualStudents("");
    setManualNotes("");
  };

  // Handle create manual payment
  const handleCreatePayment = () => {
    if (!manualTeacherId || !manualAmount) {
      toast.error("Please fill in required fields");
      return;
    }
    createPaymentMutation.mutate({
      teacherId: manualTeacherId,
      amount: parseInt(manualAmount),
      paymentMonth: manualMonth,
      sessionsCount: manualSessions ? parseInt(manualSessions) : undefined,
      studentsCount: manualStudents ? parseInt(manualStudents) : undefined,
      notes: manualNotes || undefined,
    });
  };

  // Handle edit payment
  const handleEditPayment = (paymentId: string) => {
    const payment = paymentsQuery.data?.find((p) => p.paymentId === paymentId);
    if (payment) {
      setSelectedPaymentId(paymentId);
      setEditAmount(payment.amount.toString());
      setEditSessions((payment.sessionsCount || 0).toString());
      setEditStudents((payment.studentsCount || 0).toString());
      setEditNotes(payment.notes || "");
      setEditDialogOpen(true);
    }
  };

  // Confirm edit payment
  const confirmEditPayment = () => {
    if (selectedPaymentId) {
      updatePaymentMutation.mutate({
        paymentId: selectedPaymentId,
        amount: editAmount ? parseInt(editAmount) : undefined,
        sessionsCount: editSessions ? parseInt(editSessions) : undefined,
        studentsCount: editStudents ? parseInt(editStudents) : undefined,
        notes: editNotes || undefined,
      });
    }
  };

  // Handle delete payment
  const handleDeletePayment = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setDeleteDialogOpen(true);
  };

  // Handle view details
  const handleViewDetails = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setDetailsDialogOpen(true);
  };

  // Handle view history
  const handleViewHistory = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setHistoryDialogOpen(true);
  };

  // Selection helpers
  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPaymentIds((prev) =>
      prev.includes(paymentId)
        ? prev.filter((id) => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const selectAllPending = () => {
    const pendingIds =
      paymentsQuery.data
        ?.filter((p) => p.status === "pending")
        .map((p) => p.paymentId) || [];
    setSelectedPaymentIds(pendingIds);
  };

  const deselectAll = () => {
    setSelectedPaymentIds([]);
  };

  // Batch operations
  const handleBatchMarkAsPaid = () => {
    if (selectedPaymentIds.length === 0) return;
    setBatchPayDialogOpen(true);
  };

  const confirmBatchMarkAsPaid = () => {
    batchMarkAsPaidMutation.mutate({
      paymentIds: selectedPaymentIds,
      paymentMethod: selectedPaymentMethod,
      notes: batchNotes || undefined,
    });
  };

  const handleBatchMarkAsOverdue = () => {
    if (selectedPaymentIds.length === 0) return;
    bulkUpdateStatusMutation.mutate({
      paymentIds: selectedPaymentIds,
      status: "overdue",
    });
  };

  const handleBatchCancel = () => {
    if (selectedPaymentIds.length === 0) return;
    bulkUpdateStatusMutation.mutate({
      paymentIds: selectedPaymentIds,
      status: "cancelled",
    });
  };

  // Format audit action
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: t("actionCreated"),
      updated: t("actionUpdated"),
      status_changed: t("actionStatusChanged"),
      deleted: t("actionDeleted"),
    };
    return labels[action] || action;
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
          {/* Create Manual Payment Button */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {t("createManualPayment")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("createManualPayment")}</DialogTitle>
                <DialogDescription>
                  {t("createManualPaymentDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t("teacher")} *</Label>
                  <Select
                    value={manualTeacherId}
                    onValueChange={setManualTeacherId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("filterByTeacher")} />
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
                  <Label>{t("amount")} (VND) *</Label>
                  <Input
                    type="number"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder={t("enterAmount")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("paymentMonth")}</Label>
                  <Input
                    type="month"
                    value={manualMonth}
                    onChange={(e) => setManualMonth(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("sessions")}</Label>
                    <Input
                      type="number"
                      value={manualSessions}
                      onChange={(e) => setManualSessions(e.target.value)}
                      placeholder={t("enterSessionsCount")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("students")}</Label>
                    <Input
                      type="number"
                      value={manualStudents}
                      onChange={(e) => setManualStudents(e.target.value)}
                      placeholder={t("enterStudentsCount")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("notes")}</Label>
                  <Textarea
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder={t("enterNotes")}
                    rows={3}
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
                  onClick={handleCreatePayment}
                  disabled={createPaymentMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("createManualPayment")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  {t("calculatePaymentsDescription")}
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

      {/* Filters */}
      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("filters")}
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {t("paymentsList")}
            </CardTitle>
            {/* Batch Operations */}
            {selectedPaymentIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("selectedCount", { count: selectedPaymentIds.length })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchMarkAsPaid}
                >
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  {t("batchMarkAsPaid")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchMarkAsOverdue}
                >
                  <AlertCircle className="h-4 w-4 mr-1 text-orange-500" />
                  {t("batchMarkAsOverdue")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchCancel}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {t("batchCancel")}
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {/* Quick selection buttons */}
          {paymentsQuery.data &&
            paymentsQuery.data.some((p) => p.status === "pending") && (
              <div className="flex items-center gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={selectAllPending}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  {t("selectAll")} ({t("statusPending")})
                </Button>
              </div>
            )}
        </CardHeader>
        <CardContent>
          {paymentsQuery.isLoading ? (
            <Loader />
          ) : paymentsQuery.data && paymentsQuery.data.length > 0 ? (
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedPaymentIds.length > 0 &&
                          selectedPaymentIds.length ===
                            paymentsQuery.data.filter(
                              (p) => p.status === "pending"
                            ).length
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectAllPending();
                          } else {
                            deselectAll();
                          }
                        }}
                      />
                    </TableHead>
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
                      className={`hover:bg-slate-50 ${
                        selectedPaymentIds.includes(payment.paymentId)
                          ? "bg-primary/10"
                          : ""
                      }`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedPaymentIds.includes(
                            payment.paymentId
                          )}
                          onCheckedChange={() =>
                            togglePaymentSelection(payment.paymentId)
                          }
                          disabled={payment.status === "paid"}
                        />
                      </TableCell>
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
                            <DropdownMenuItem
                              onClick={() =>
                                handleViewDetails(payment.paymentId)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {t("viewDetails")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleViewHistory(payment.paymentId)
                              }
                            >
                              <History className="h-4 w-4 mr-2" />
                              {t("viewHistory")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {payment.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleMarkAsPaid(payment.paymentId)
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                  {t("markAsPaid")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleEditPayment(payment.paymentId)
                                  }
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  {t("editPayment")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeletePayment(payment.paymentId)
                                  }
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t("deletePayment")}
                                </DropdownMenuItem>
                              </>
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
                                  {t("cancel")}
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

      {/* Payment Method Dialog (Single) */}
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

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editPayment")}</DialogTitle>
            <DialogDescription>{t("editPaymentDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("amount")} (VND)</Label>
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder={t("enterAmount")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("sessions")}</Label>
                <Input
                  type="number"
                  value={editSessions}
                  onChange={(e) => setEditSessions(e.target.value)}
                  placeholder={t("enterSessionsCount")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("students")}</Label>
                <Input
                  type="number"
                  value={editStudents}
                  onChange={(e) => setEditStudents(e.target.value)}
                  placeholder={t("enterStudentsCount")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={t("enterNotes")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={confirmEditPayment}
              disabled={updatePaymentMutation.isPending}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t("editPayment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deletePayment")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deletePaymentConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                selectedPaymentId &&
                deletePaymentMutation.mutate(selectedPaymentId)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("deletePayment")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Mark as Paid Dialog */}
      <Dialog open={batchPayDialogOpen} onOpenChange={setBatchPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("batchMarkAsPaid")}</DialogTitle>
            <DialogDescription>
              {t("selectedCount", { count: selectedPaymentIds.length })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("selectPaymentMethod")}</Label>
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
            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Textarea
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                placeholder={t("enterNotes")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBatchPayDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={confirmBatchMarkAsPaid}
              disabled={batchMarkAsPaidMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {t("batchMarkAsPaid")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("paymentDetails")}
            </DialogTitle>
          </DialogHeader>
          {detailsQuery.isLoading ? (
            <div className="py-8">
              <Loader />
            </div>
          ) : detailsQuery.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">
                    {t("invoiceNumber")}
                  </Label>
                  <p className="font-medium">
                    {detailsQuery.data.invoiceNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("status")}</Label>
                  <div className="mt-1">
                    {getStatusBadge(detailsQuery.data.status as BillingStatus)}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">
                    {t("teacher")}
                  </Label>
                  <p className="font-medium">{detailsQuery.data.teacherName}</p>
                  <p className="text-sm text-muted-foreground">
                    {detailsQuery.data.teacherEmail}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {t("paymentMonth")}
                  </Label>
                  <p className="font-medium">
                    {formatMonth(detailsQuery.data.paymentMonth)}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-muted-foreground">
                  {t("calculationBreakdown")}
                </Label>
                <div className="mt-2 space-y-2 bg-slate-50 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span>{t("rateType")}</span>
                    <span className="font-medium">
                      {getRateTypeLabel(
                        detailsQuery.data.rateType as RateType | null
                      )}
                    </span>
                  </div>
                  {detailsQuery.data.rateAmount && (
                    <div className="flex justify-between">
                      <span>{t("baseRate")}</span>
                      <span className="font-medium">
                        {formatCurrency(detailsQuery.data.rateAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{t("sessions")}</span>
                    <span className="font-medium">
                      {detailsQuery.data.sessionsCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("students")}</span>
                    <span className="font-medium">
                      {detailsQuery.data.studentsCount}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>{t("amount")}</span>
                    <span>{formatCurrency(detailsQuery.data.amount)}</span>
                  </div>
                </div>
              </div>
              {detailsQuery.data.status === "paid" && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        {t("paidAt")}
                      </Label>
                      <p className="font-medium">
                        {detailsQuery.data.paidAt
                          ? new Date(
                              detailsQuery.data.paidAt
                            ).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        {t("paymentMethod")}
                      </Label>
                      <p className="font-medium">
                        {getPaymentMethodLabel(
                          detailsQuery.data
                            .paymentMethod as PaymentMethod | null
                        )}
                      </p>
                    </div>
                  </div>
                </>
              )}
              {detailsQuery.data.notes && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">
                      {t("notes")}
                    </Label>
                    <p className="mt-1">{detailsQuery.data.notes}</p>
                  </div>
                </>
              )}
              {detailsQuery.data.classes &&
                detailsQuery.data.classes.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-muted-foreground">
                        {t("teacherClasses")}
                      </Label>
                      <div className="mt-2 space-y-1">
                        {detailsQuery.data.classes.map((cls) => (
                          <div
                            key={cls.classId}
                            className="text-sm flex items-center gap-2"
                          >
                            <Badge variant="outline">{cls.classCode}</Badge>
                            <span>{cls.className}</span>
                            {cls.subject && (
                              <span className="text-muted-foreground">
                                ({cls.subject})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("paymentHistory")}
            </DialogTitle>
          </DialogHeader>
          {historyQuery.isLoading ? (
            <div className="py-8">
              <Loader />
            </div>
          ) : historyQuery.data && historyQuery.data.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {historyQuery.data.map((log) => (
                  <div
                    key={log.logId}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {getActionLabel(log.action)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {t("historyChangedBy")}:
                      </span>{" "}
                      <span className="font-medium">{log.changedByName}</span>
                    </div>
                    {log.notes && (
                      <div className="text-sm text-muted-foreground">
                        {log.notes}
                      </div>
                    )}
                    {log.transactionId && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          {t("transactionId")}:
                        </span>{" "}
                        <code className="bg-slate-100 px-1 rounded">
                          {log.transactionId}
                        </code>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {log.oldValues && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            {t("historyOldValues")}
                          </Label>
                          <pre className="mt-1 bg-red-50 rounded p-2 text-xs overflow-x-auto">
                            {JSON.stringify(log.oldValues, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.newValues && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            {t("historyNewValues")}
                          </Label>
                          <pre className="mt-1 bg-green-50 rounded p-2 text-xs overflow-x-auto">
                            {JSON.stringify(log.newValues, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noHistory")}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setHistoryDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
