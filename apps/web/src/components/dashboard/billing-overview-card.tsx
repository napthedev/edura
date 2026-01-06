"use client";

import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function BillingOverviewCard() {
  const t = useTranslations("StudentDashboard");

  const billingsQuery = useQuery({
    queryKey: ["student-billings-overview"],
    queryFn: () =>
      trpcClient.education.getStudentBillings.query({
        status: undefined,
      }),
  });

  const pendingBills =
    billingsQuery.data?.filter((b) => b.status === "pending") || [];

  const totalDue = pendingBills.reduce((acc, b) => acc + b.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Card className="shadow-sm border-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t("pendingBills")}
        </CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-orange-600">
          {pendingBills.length}
        </div>
        {totalDue > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(totalDue)} {t("due")}
          </p>
        )}
        <Link href="/dashboard/student/billings">
          <Button variant="ghost" size="sm" className="mt-2 px-0 h-auto">
            {t("viewAllBillings")}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
