"use client";

import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Printer,
  FileText,
  User,
  BookOpen,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";

type BillingStatus = "pending" | "paid" | "overdue" | "cancelled";
type PaymentMethod = "cash" | "bank_transfer" | "momo" | "vnpay";

export default function InvoicePage({
  params,
}: {
  params: Promise<{ billingId: string }>;
}) {
  const { billingId } = use(params);
  const t = useTranslations("Invoice");
  const tBilling = useTranslations("TuitionBilling");

  const invoiceQuery = useQuery({
    queryKey: ["billing-invoice", billingId],
    queryFn: () => trpcClient.education.getBillingInvoice.query({ billingId }),
  });

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
      <Badge variant={variant} className="gap-1 text-sm px-3 py-1">
        {icon}
        {tBilling(
          `status${status.charAt(0).toUpperCase() + status.slice(1)}` as any
        )}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: PaymentMethod | null) => {
    if (!method) return "-";
    const labels: Record<PaymentMethod, string> = {
      cash: tBilling("cash"),
      bank_transfer: tBilling("bankTransfer"),
      momo: tBilling("momo"),
      vnpay: tBilling("vnpay"),
    };
    return labels[method];
  };

  const handlePrint = () => {
    window.print();
  };

  if (invoiceQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  if (!invoiceQuery.data) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">{t("notFound")}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/manager/tuition">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back")}
          </Link>
        </Button>
      </div>
    );
  }

  const invoice = invoiceQuery.data;

  return (
    <div className="space-y-6">
      {/* Header - Hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <Button asChild variant="ghost" className="mb-2">
            <Link href="/dashboard/manager/tuition">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back")}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {t("title")}
          </h1>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          {t("print")}
        </Button>
      </div>

      {/* Invoice Content */}
      <Card className="shadow-sm border-none max-w-3xl mx-auto print:shadow-none print:border print:max-w-none">
        <CardContent className="p-8">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-white" />
                </div>
                <span className="font-bold text-2xl text-slate-900">Edura</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("platformDescription")}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {t("title")}
              </h2>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">
                    {t("invoiceNumber")}:
                  </span>{" "}
                  <span className="font-mono font-medium">
                    {invoice.invoiceNumber || "-"}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {t("billingDate")}:
                  </span>{" "}
                  {invoice.createdAt
                    ? new Date(invoice.createdAt).toLocaleDateString()
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Status & Due Date */}
          <div className="flex justify-between items-center mb-6 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {t("status")}
              </p>
              {getStatusBadge(invoice.status as BillingStatus)}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">
                {t("dueDate")}
              </p>
              <p className="font-semibold flex items-center gap-2 justify-end">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {invoice.dueDate
                  ? new Date(invoice.dueDate).toLocaleDateString()
                  : "-"}
              </p>
            </div>
          </div>

          {/* Bill To & Class Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Bill To */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-slate-900">
                <User className="h-4 w-4" />
                {t("billTo")}
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("studentName")}
                  </p>
                  <p className="font-medium">{invoice.studentName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("studentEmail")}
                  </p>
                  <p className="text-sm">{invoice.studentEmail || "-"}</p>
                </div>
              </div>
            </div>

            {/* Class Details */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-slate-900">
                <BookOpen className="h-4 w-4" />
                {t("classDetails")}
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("className")}
                  </p>
                  <p className="font-medium">{invoice.className || "-"}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("classCode")}
                    </p>
                    <p className="text-sm font-mono">
                      {invoice.classCode || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t("subject")}
                    </p>
                    <p className="text-sm">{invoice.subject || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("teacher")}
                  </p>
                  <p className="text-sm">{invoice.teacherName || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Billing Details */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4 text-slate-900">
              {t("billingPeriod")}
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">
                      {t("description")}
                    </th>
                    <th className="text-right p-3 text-sm font-semibold">
                      {t("amount")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">
                      <p className="font-medium">{t("monthlyTuitionFee")}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatMonth(invoice.billingMonth)}
                      </p>
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {formatCurrency(invoice.amount)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr className="border-t">
                    <td className="p-3 font-bold">{t("total")}</td>
                    <td className="p-3 text-right font-bold text-lg">
                      {formatCurrency(invoice.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Information (if paid) */}
          {invoice.status === "paid" && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-slate-900">
                  <CreditCard className="h-4 w-4" />
                  {t("paymentInfo")}
                </h3>
                <div className="bg-green-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("paidOn")}
                    </span>
                    <span className="font-medium">
                      {invoice.paidAt
                        ? new Date(invoice.paidAt).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t("paymentMethod")}
                    </span>
                    <span className="font-medium">
                      {getPaymentMethodLabel(
                        invoice.paymentMethod as PaymentMethod | null
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="font-semibold mb-2 text-slate-900">
                  {t("notes")}
                </h3>
                <p className="text-sm text-muted-foreground bg-slate-50 rounded-lg p-4">
                  {invoice.notes}
                </p>
              </div>
            </>
          )}

          {/* Footer */}
          <Separator className="my-6" />
          <div className="text-center text-sm text-muted-foreground">
            <p>{t("thankYou")}</p>
            <p className="mt-1">{t("contactSupport")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          [class*="Card"] {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          [class*="Card"] * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  );
}
