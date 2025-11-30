"use client";

import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  AlertCircle,
  AlertOctagon,
  ExternalLink,
  Users,
} from "lucide-react";

type AgingBucket = "1-30" | "31-60" | "61-90" | "90+";

export default function OverdueList() {
  const t = useTranslations("FinanceDashboard");

  const overdueQuery = useQuery({
    queryKey: ["overdue-billings"],
    queryFn: () => trpcClient.education.getOverdueBillings.query(),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getAgingBadge = (bucket: AgingBucket) => {
    const config: Record<
      AgingBucket,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: typeof Clock;
      }
    > = {
      "1-30": { variant: "secondary", icon: Clock },
      "31-60": { variant: "default", icon: AlertCircle },
      "61-90": { variant: "destructive", icon: AlertTriangle },
      "90+": { variant: "destructive", icon: AlertOctagon },
    };
    const { variant, icon: Icon } = config[bucket];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {bucket} {t("days")}
      </Badge>
    );
  };

  if (overdueQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader />
      </div>
    );
  }

  const data = overdueQuery.data || [];

  // Group by aging bucket
  const groupedByBucket = data.reduce((acc, bill) => {
    const bucket = bill.agingBucket as AgingBucket;
    if (!acc[bucket]) {
      acc[bucket] = { items: [], total: 0 };
    }
    acc[bucket].items.push(bill);
    acc[bucket].total += bill.amount;
    return acc;
  }, {} as Record<AgingBucket, { items: typeof data; total: number }>);

  // Summary stats
  const totalOverdue = data.reduce((sum, bill) => sum + bill.amount, 0);
  const bucketOrder: AgingBucket[] = ["1-30", "31-60", "61-90", "90+"];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalOverdue")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalOverdue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.length} {t("overdueInvoices")}
            </p>
          </CardContent>
        </Card>

        {bucketOrder.map((bucket) => {
          const bucketData = groupedByBucket[bucket];
          return (
            <Card key={bucket} className="shadow-sm border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {bucket} {t("days")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {formatCurrency(bucketData?.total || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {bucketData?.items.length || 0} {t("invoices")}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overdue List */}
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {t("overdueInvoicesList")}
          </CardTitle>
          <CardDescription>{t("overdueListDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
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
                      {t("dueDate")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("daysOverdue")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("aging")}
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      {t("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((bill) => (
                    <TableRow
                      key={bill.billingId}
                      className="hover:bg-slate-50"
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{bill.studentName}</div>
                          <div className="text-xs text-muted-foreground">
                            {bill.studentEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{bill.className || "-"}</TableCell>
                      <TableCell className="font-semibold text-red-600">
                        {formatCurrency(bill.amount)}
                      </TableCell>
                      <TableCell>
                        {bill.dueDate
                          ? new Date(bill.dueDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-red-600">
                          {bill.daysOverdue} {t("days")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getAgingBadge(bill.agingBucket as AgingBucket)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/dashboard/manager/tuition/${bill.billingId}`}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            {t("viewInvoice")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-green-600 font-medium">
                {t("noOverdueInvoices")}
              </p>
              <p className="text-sm mt-1">{t("allPaymentsUpToDate")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
