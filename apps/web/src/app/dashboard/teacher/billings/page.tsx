"use client";

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
import { Label } from "@/components/ui/label";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";

export default function TeacherBillingsPage() {
  const t = useTranslations("TeacherBilling");
  const [classFilter, setClassFilter] = useState<string>("all");

  // Queries
  const billingOverviewQuery = useQuery({
    queryKey: ["teacher-billing-overview"],
    queryFn: () => trpcClient.education.getTeacherBillingOverview.query(),
  });

  const studentPaymentQuery = useQuery({
    queryKey: [
      "teacher-student-payment-status",
      classFilter === "all" ? undefined : classFilter,
    ],
    queryFn: () =>
      trpcClient.education.getTeacherStudentPaymentStatus.query({
        classId: classFilter === "all" ? undefined : classFilter,
      }),
  });

  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: () => trpcClient.education.getClasses.query(),
  });

  // Helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const overview = billingOverviewQuery.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("description")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalRevenue")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("allClasses")}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("pendingRevenue")}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(overview?.pendingRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("awaitingPayment")}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("paidRevenue")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(overview?.paidRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("collected")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Class */}
      <Card className="shadow-sm border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {t("revenueByClass")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingOverviewQuery.isLoading ? (
            <Loader />
          ) : overview && overview.classBillings.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">
                      {t("className")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("tuitionRate")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("pending")}
                    </TableHead>
                    <TableHead className="font-semibold">{t("paid")}</TableHead>
                    <TableHead className="font-semibold">
                      {t("total")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.classBillings.map((classData) => (
                    <TableRow
                      key={classData.classId}
                      className="hover:bg-slate-50"
                    >
                      <TableCell className="font-medium">
                        {classData.className}
                      </TableCell>
                      <TableCell>
                        {classData.tuitionRate
                          ? formatCurrency(classData.tuitionRate)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-yellow-600">
                        {formatCurrency(classData.pendingAmount)}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({classData.pendingCount} {t("bills")})
                        </span>
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(classData.paidAmount)}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({classData.paidCount} {t("bills")})
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(
                          classData.pendingAmount + classData.paidAmount
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noRevenueData")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Payment Status */}
      <Card className="shadow-sm border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("studentPaymentStatus")}
            </CardTitle>
            <div className="w-64">
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
        </CardHeader>
        <CardContent>
          {studentPaymentQuery.isLoading ? (
            <Loader />
          ) : studentPaymentQuery.data &&
            studentPaymentQuery.data.length > 0 ? (
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
                      {t("pendingBills")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("paidBills")}
                    </TableHead>
                    <TableHead className="font-semibold">
                      {t("totalDue")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentPaymentQuery.data.map((student, idx) => (
                    <TableRow
                      key={`${student.studentId}-${student.classId}-${idx}`}
                      className="hover:bg-slate-50"
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {student.studentName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {student.studentEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.className}</TableCell>
                      <TableCell className="text-yellow-600">
                        {student.pendingBills}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {student.paidBills}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(student.totalDue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("noStudentData")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
