"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpcClient } from "@/utils/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/loader";
import { ReportDetailModal } from "./report-detail-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useQuery } from "@tanstack/react-query";

export function ReportList() {
  const t = useTranslations("ReportList");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const reportsQuery = useQuery({
    queryKey: ["all-session-reports"],
    queryFn: () => trpcClient.education.getAllSessionReports.query(),
  });

  const filteredReports = reportsQuery.data?.filter((report) => {
    const matchesSearch =
      (report.teacher.name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (report.teacher.email?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (report.class.name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (report.class.code?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      );

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "valid"
        ? report.isValid
        : !report.isValid;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder={t("filterStatus")} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            <SelectItem value="valid">{t("valid")}</SelectItem>
            <SelectItem value="invalid">{t("invalid")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">{t("reports")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("class")}</TableHead>
                  <TableHead>{t("teacher")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : reportsQuery.error ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-red-500"
                    >
                      {reportsQuery.error.message}
                    </TableCell>
                  </TableRow>
                ) : filteredReports && filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <TableRow key={report.reportId}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {report.sessionDate}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {report.class.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {report.class.code}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {report.teacher.name || t("unnamed")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {report.teacher.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.isValid ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {t("valid")}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            {t("invalid")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <ReportDetailModal
                          report={report}
                          trigger={
                            <Button variant="ghost" size="sm">
                              {t("details")}
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {t("noResults")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
