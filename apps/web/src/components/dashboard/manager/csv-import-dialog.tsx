"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  Check,
  X,
  Download,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CSVImportDialogProps {
  type: "teacher" | "student";
  trigger?: React.ReactNode;
}

interface ParsedRow {
  name: string;
  email: string;
  dateOfBirth?: string;
}

interface ImportResult {
  success: { email: string; password: string }[];
  failed: { email: string; reason: string }[];
}

export function CSVImportDialog({ type, trigger }: CSVImportDialogProps) {
  const t = useTranslations("CSVImport");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const importTeachersMutation = useMutation({
    mutationFn: (teachers: ParsedRow[]) =>
      trpcClient.education.importTeachers.mutate({ teachers }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["all-teachers"] });
      setImportResult(result);
      toast.success(
        t("importSuccess", {
          count: result.success.length,
        })
      );
    },
    onError: (error: any) => {
      toast.error(error.message || t("error"));
    },
  });

  const importStudentsMutation = useMutation({
    mutationFn: (students: ParsedRow[]) =>
      trpcClient.education.importStudents.mutate({ students }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      setImportResult(result);
      toast.success(
        t("importSuccess", {
          count: result.success.length,
        })
      );
    },
    onError: (error: any) => {
      toast.error(error.message || t("error"));
    },
  });

  const isImporting =
    type === "teacher"
      ? importTeachersMutation.isPending
      : importStudentsMutation.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split("\n").filter((row) => row.trim());

        if (rows.length < 2) {
          setParseError(t("noDataRows"));
          return;
        }

        // Parse header row
        const headerRow = rows[0]!.toLowerCase();
        const headers = headerRow.split(",").map((h) => h.trim());

        const nameIndex = headers.findIndex(
          (h) => h === "name" || h === "tên" || h === "họ tên"
        );
        const emailIndex = headers.findIndex(
          (h) => h === "email" || h === "e-mail"
        );
        const dobIndex = headers.findIndex(
          (h) =>
            h === "dateofbirth" ||
            h === "date_of_birth" ||
            h === "dob" ||
            h === "ngày sinh" ||
            h === "ngaysinh"
        );

        if (nameIndex === -1) {
          setParseError(t("missingNameColumn"));
          return;
        }
        if (emailIndex === -1) {
          setParseError(t("missingEmailColumn"));
          return;
        }

        // Parse data rows
        const data: ParsedRow[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]!;
          const values = row.split(",").map((v) => v.trim());

          const name = values[nameIndex];
          const email = values[emailIndex];
          const dateOfBirth = dobIndex !== -1 ? values[dobIndex] : undefined;

          if (name && email) {
            data.push({ name, email, dateOfBirth });
          }
        }

        if (data.length === 0) {
          setParseError(t("noValidRows"));
          return;
        }

        setParsedData(data);
      } catch (err) {
        setParseError(t("parseError"));
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (type === "teacher") {
      importTeachersMutation.mutate(parsedData);
    } else {
      importStudentsMutation.mutate(parsedData);
    }
  };

  const handleDownloadTemplate = () => {
    const template =
      "name,email,dateOfBirth\nJohn Doe,john@example.com,1990-01-15\nJane Smith,jane@example.com,1985-06-20";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_import_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setOpen(false);
    setParsedData([]);
    setParseError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const titleKey = type === "teacher" ? "importTeachers" : "importStudents";
  const descKey =
    type === "teacher" ? "importTeachersDesc" : "importStudentsDesc";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            {t(titleKey)}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {t(titleKey)}
          </DialogTitle>
          <DialogDescription>{t(descKey)}</DialogDescription>
        </DialogHeader>

        {importResult ? (
          <div className="space-y-4">
            {importResult.success.length > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {t("successCount", { count: importResult.success.length })}
                </AlertDescription>
              </Alert>
            )}

            {importResult.failed.length > 0 && (
              <>
                <Alert className="border-red-200 bg-red-50">
                  <X className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {t("failedCount", { count: importResult.failed.length })}
                  </AlertDescription>
                </Alert>
                <ScrollArea className="h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("email")}</TableHead>
                        <TableHead>{t("reason")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.failed.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{item.email}</TableCell>
                          <TableCell className="text-red-600">
                            {item.reason}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </>
            )}

            {importResult.success.length > 0 && (
              <>
                <Label>{t("createdAccounts")}</Label>
                <ScrollArea className="h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("email")}</TableHead>
                        <TableHead>{t("password")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.success.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{item.email}</TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-sm">
                              {item.password}
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </>
            )}

            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {t("passwordWarning")}
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={handleClose}>{t("done")}</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                {t("downloadTemplate")}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>{t("selectFile")}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">{t("csvFormat")}</p>
            </div>

            {parseError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {parseError}
                </AlertDescription>
              </Alert>
            )}

            {parsedData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("preview")}</Label>
                  <Badge variant="secondary">
                    {t("rowCount", { count: parsedData.length })}
                  </Badge>
                </div>
                <ScrollArea className="h-[200px] border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("name")}</TableHead>
                        <TableHead>{t("email")}</TableHead>
                        <TableHead>{t("dateOfBirth")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 10).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>{row.dateOfBirth || "-"}</TableCell>
                        </TableRow>
                      ))}
                      {parsedData.length > 10 && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center text-muted-foreground"
                          >
                            {t("moreRows", { count: parsedData.length - 10 })}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t("cancel")}
              </Button>
              <Button
                onClick={handleImport}
                disabled={parsedData.length === 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("importing")}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {t("import", { count: parsedData.length })}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
