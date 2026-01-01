"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import {
  Receipt,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Filter,
  Wallet,
} from "lucide-react";

type BillingStatus = "pending" | "paid" | "overdue" | "cancelled";

export default function StudentBillingsPage() {
  const t = useTranslations("StudentBilling");
  const [statusFilter, setStatusFilter] = useState<BillingStatus | "all">(
    "all"
  );

  // Queries
  const billingsQuery = useQuery({
    queryKey: [
      "student-billings",
      statusFilter === "all" ? undefined : statusFilter,
    ],
    queryFn: () =>
      trpcClient.education.getStudentBillings.query({
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
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
      "vi-VN",
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

  // Stats
  const stats = {
    total: billingsQuery.data?.length || 0,
    pending:
      billingsQuery.data?.filter((b) => b.status === "pending").length || 0,
    paid: billingsQuery.data?.filter((b) => b.status === "paid").length || 0,
    overdue:
      billingsQuery.data?.filter((b) => b.status === "overdue").length || 0,
    totalDue:
      billingsQuery.data
        ?.filter((b) => b.status === "pending" || b.status === "overdue")
        .reduce((acc, b) => acc + b.amount, 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("description")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalBills")}
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
              {t("totalDue")}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalDue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t("filters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                            {billing.className || "-"}
                          </div>
                          {billing.subject && (
                            <div className="text-xs text-muted-foreground">
                              {billing.subject}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(billing.amount)}
                      </TableCell>
                      <TableCell>{formatMonth(billing.billingMonth)}</TableCell>
                      <TableCell>
                        {billing.dueDate
                          ? new Date(billing.dueDate).toLocaleDateString(
                              "vi-VN"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(billing.status as BillingStatus)}
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
    </div>
  );
}
