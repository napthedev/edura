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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Banknote,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Megaphone,
  Settings,
  Filter,
  X,
  Download,
  RefreshCw,
  FolderPlus,
  Tag,
} from "lucide-react";
import { exportToCsv } from "@/lib/utils";

type ExpenseCategoryType = "facility" | "marketing" | "operational";
type RecurringInterval = "monthly" | "quarterly" | "yearly";

export default function ExpensesPage() {
  const t = useTranslations("Expenses");
  const queryClient = useQueryClient();

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<ExpenseCategoryType | "all">(
    "all"
  );
  const [recurringFilter, setRecurringFilter] = useState<
    "all" | "recurring" | "one-time"
  >("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Dialog states
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<{
    expenseId: string;
    categoryId: string;
    amount: number;
    description: string | null;
    expenseDate: Date | string;
    isRecurring: boolean;
    recurringInterval: RecurringInterval | null;
  } | null>(null);

  // Form states - Expense
  const [expenseCategoryId, setExpenseCategoryId] = useState<string>("");
  const [expenseAmount, setExpenseAmount] = useState<string>("");
  const [expenseDescription, setExpenseDescription] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]!;
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] =
    useState<RecurringInterval>("monthly");

  // Form states - Category (within expense modal)
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] =
    useState<ExpenseCategoryType>("operational");

  // Queries
  const expensesQuery = useQuery({
    queryKey: [
      "expenses",
      categoryFilter === "all" ? undefined : categoryFilter,
      typeFilter === "all" ? undefined : typeFilter,
      startDate || undefined,
      endDate || undefined,
      recurringFilter === "all" ? undefined : recurringFilter === "recurring",
    ],
    queryFn: () =>
      trpcClient.education.getExpenses.query({
        categoryId: categoryFilter === "all" ? undefined : categoryFilter,
        categoryType: typeFilter === "all" ? undefined : typeFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isRecurring:
          recurringFilter === "all"
            ? undefined
            : recurringFilter === "recurring",
      }),
  });

  const categoriesQuery = useQuery({
    queryKey: ["expense-categories"],
    queryFn: () => trpcClient.education.getExpenseCategories.query(),
  });

  const summaryQuery = useQuery({
    queryKey: ["expense-summary"],
    queryFn: () => trpcClient.education.getExpenseSummary.query({}),
  });

  // Mutations
  const createExpenseMutation = useMutation({
    mutationFn: (data: {
      categoryId: string;
      amount: number;
      description?: string;
      expenseDate: string;
      isRecurring: boolean;
      recurringInterval?: RecurringInterval;
    }) => trpcClient.education.createExpense.mutate(data),
    onSuccess: () => {
      toast.success(t("expenseCreated"));
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
      resetExpenseForm();
      setExpenseDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("errorCreatingExpense"));
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: (data: {
      expenseId: string;
      categoryId?: string;
      amount?: number;
      description?: string;
      expenseDate?: string;
      isRecurring?: boolean;
      recurringInterval?: RecurringInterval;
    }) => trpcClient.education.updateExpense.mutate(data),
    onSuccess: () => {
      toast.success(t("expenseUpdated"));
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
      resetExpenseForm();
      setExpenseDialogOpen(false);
      setEditingExpense(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("errorUpdatingExpense"));
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: string) =>
      trpcClient.education.deleteExpense.mutate({ expenseId }),
    onSuccess: () => {
      toast.success(t("expenseDeleted"));
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
    },
    onError: (error: any) => {
      toast.error(error.message || t("errorDeletingExpense"));
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; type: ExpenseCategoryType }) =>
      trpcClient.education.createExpenseCategory.mutate(data),
    onSuccess: (data) => {
      toast.success(t("categoryCreated"));
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      // Auto-select the newly created category
      setExpenseCategoryId(data.categoryId);
      setNewCategoryName("");
      setShowNewCategoryForm(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("errorCreatingCategory"));
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) =>
      trpcClient.education.deleteExpenseCategory.mutate({ categoryId }),
    onSuccess: () => {
      toast.success(t("categoryDeleted"));
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: any) => {
      toast.error(error.message || t("errorDeletingCategory"));
    },
  });

  // Helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryTypeBadge = (type: ExpenseCategoryType) => {
    const config = {
      facility: {
        label: t("typeFacility"),
        variant: "default" as const,
        icon: Building2,
      },
      marketing: {
        label: t("typeMarketing"),
        variant: "secondary" as const,
        icon: Megaphone,
      },
      operational: {
        label: t("typeOperational"),
        variant: "outline" as const,
        icon: Settings,
      },
    };
    const { label, variant, icon: Icon } = config[type];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getRecurringBadge = (
    isRecurring: boolean,
    interval: RecurringInterval | null
  ) => {
    if (!isRecurring) return null;
    const labels: Record<RecurringInterval, string> = {
      monthly: t("monthly"),
      quarterly: t("quarterly"),
      yearly: t("yearly"),
    };
    return (
      <Badge variant="outline" className="gap-1 text-primary border-blue-200">
        <RefreshCw className="h-3 w-3" />
        {labels[interval || "monthly"]}
      </Badge>
    );
  };

  const resetExpenseForm = () => {
    setExpenseCategoryId("");
    setExpenseAmount("");
    setExpenseDescription("");
    setExpenseDate(new Date().toISOString().split("T")[0]!);
    setIsRecurring(false);
    setRecurringInterval("monthly");
    setEditingExpense(null);
    setShowNewCategoryForm(false);
    setNewCategoryName("");
    setNewCategoryType("operational");
  };

  const handleEditExpense = (expense: typeof editingExpense) => {
    if (!expense) return;
    setEditingExpense(expense);
    setExpenseCategoryId(expense.categoryId);
    setExpenseAmount(String(expense.amount));
    setExpenseDescription(expense.description || "");
    setExpenseDate(new Date(expense.expenseDate).toISOString().split("T")[0]!);
    setIsRecurring(expense.isRecurring);
    setRecurringInterval(expense.recurringInterval || "monthly");
    setExpenseDialogOpen(true);
  };

  const handleSaveExpense = () => {
    const amount = parseInt(expenseAmount);
    if (!expenseCategoryId || isNaN(amount) || amount <= 0) {
      toast.error(t("invalidExpenseData"));
      return;
    }

    if (editingExpense) {
      updateExpenseMutation.mutate({
        expenseId: editingExpense.expenseId,
        categoryId: expenseCategoryId,
        amount,
        description: expenseDescription || undefined,
        expenseDate,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
      });
    } else {
      createExpenseMutation.mutate({
        categoryId: expenseCategoryId,
        amount,
        description: expenseDescription || undefined,
        expenseDate,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
      });
    }
  };

  const handleExportCsv = () => {
    if (!expensesQuery.data || expensesQuery.data.length === 0) {
      toast.error(t("noDataToExport"));
      return;
    }

    const exportData = expensesQuery.data.map((expense) => ({
      date: formatDate(expense.expenseDate),
      category: expense.categoryName,
      type: expense.categoryType,
      amount: expense.amount,
      description: expense.description || "-",
      recurring: expense.isRecurring
        ? expense.recurringInterval || "yes"
        : "no",
    }));

    const columns = [
      { key: "date" as const, header: t("date") },
      { key: "category" as const, header: t("category") },
      { key: "type" as const, header: t("type") },
      { key: "amount" as const, header: t("amount") },
      { key: "description" as const, header: t("description") },
      { key: "recurring" as const, header: t("recurring") },
    ];

    const filename = `expenses-${new Date().toISOString().split("T")[0]}`;
    exportToCsv(exportData, filename, columns);
    toast.success(t("exportSuccess"));
  };

  const clearFilters = () => {
    setCategoryFilter("all");
    setTypeFilter("all");
    setRecurringFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    categoryFilter !== "all" ||
    typeFilter !== "all" ||
    recurringFilter !== "all" ||
    startDate ||
    endDate;

  // Stats from summary
  const facilityTotal =
    summaryQuery.data?.byType.find((t) => t.type === "facility")?.total || 0;
  const marketingTotal =
    summaryQuery.data?.byType.find((t) => t.type === "marketing")?.total || 0;
  const operationalTotal =
    summaryQuery.data?.byType.find((t) => t.type === "operational")?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Banknote className="h-6 w-6" />
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
            open={expenseDialogOpen}
            onOpenChange={(open) => {
              setExpenseDialogOpen(open);
              if (!open) resetExpenseForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("addExpense")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? t("editExpense") : t("addExpense")}
                </DialogTitle>
                <DialogDescription>
                  {editingExpense
                    ? t("editExpenseDescription")
                    : t("addExpenseDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!showNewCategoryForm ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t("category")}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewCategoryForm(true)}
                        className="text-xs h-auto py-1"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {t("addCategory")}
                      </Button>
                    </div>
                    <Select
                      value={expenseCategoryId}
                      onValueChange={setExpenseCategoryId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesQuery.data?.map((cat) => (
                          <SelectItem
                            key={cat.categoryId}
                            value={cat.categoryId}
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-4 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-blue-900 font-semibold flex items-center gap-2">
                        <FolderPlus className="h-4 w-4" />
                        {t("createNewCategory")}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowNewCategoryForm(false);
                          setNewCategoryName("");
                        }}
                        className="text-xs h-auto py-1"
                      >
                        <X className="h-3 w-3 mr-1" />
                        {t("cancel")}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("categoryName")}</Label>
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder={t("categoryNamePlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("categoryType")}</Label>
                      <Select
                        value={newCategoryType}
                        onValueChange={(v) =>
                          setNewCategoryType(v as ExpenseCategoryType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facility">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {t("typeFacility")}
                            </div>
                          </SelectItem>
                          <SelectItem value="marketing">
                            <div className="flex items-center gap-2">
                              <Megaphone className="h-4 w-4" />
                              {t("typeMarketing")}
                            </div>
                          </SelectItem>
                          <SelectItem value="operational">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              {t("typeOperational")}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!newCategoryName) {
                          toast.error(t("categoryNameRequired"));
                          return;
                        }
                        createCategoryMutation.mutate({
                          name: newCategoryName,
                          type: newCategoryType,
                        });
                      }}
                      disabled={
                        !newCategoryName || createCategoryMutation.isPending
                      }
                      className="w-full"
                    >
                      {createCategoryMutation.isPending
                        ? t("creating")
                        : t("createCategory")}
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>{t("amount")} (VND)</Label>
                  <Input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("date")}</Label>
                  <Input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("description")}</Label>
                  <Textarea
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    placeholder={t("descriptionPlaceholder")}
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("recurringExpense")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("recurringExpenseHint")}
                    </p>
                  </div>
                  <Switch
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>
                {isRecurring && (
                  <div className="space-y-2">
                    <Label>{t("recurringInterval")}</Label>
                    <Select
                      value={recurringInterval}
                      onValueChange={(v) =>
                        setRecurringInterval(v as RecurringInterval)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">{t("monthly")}</SelectItem>
                        <SelectItem value="quarterly">
                          {t("quarterly")}
                        </SelectItem>
                        <SelectItem value="yearly">{t("yearly")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setExpenseDialogOpen(false);
                    resetExpenseForm();
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleSaveExpense}
                  disabled={
                    createExpenseMutation.isPending ||
                    updateExpenseMutation.isPending
                  }
                >
                  {createExpenseMutation.isPending ||
                  updateExpenseMutation.isPending
                    ? t("saving")
                    : t("save")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalExpenses")}
            </CardTitle>
            <Banknote className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summaryQuery.data?.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">{t("thisYear")}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("typeFacility")}
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(facilityTotal)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("typeMarketing")}
            </CardTitle>
            <Megaphone className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(marketingTotal)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("typeOperational")}
            </CardTitle>
            <Settings className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(operationalTotal)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">{t("expensesList")}</TabsTrigger>
          <TabsTrigger value="categories">{t("categories")}</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          {/* Filters */}
          <Card className="shadow-sm border-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {t("filters")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-xs">{t("category")}</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allCategories")}</SelectItem>
                      {categoriesQuery.data?.map((cat) => (
                        <SelectItem key={cat.categoryId} value={cat.categoryId}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t("type")}</Label>
                  <Select
                    value={typeFilter}
                    onValueChange={(v) =>
                      setTypeFilter(v as ExpenseCategoryType | "all")
                    }
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allTypes")}</SelectItem>
                      <SelectItem value="facility">
                        {t("typeFacility")}
                      </SelectItem>
                      <SelectItem value="marketing">
                        {t("typeMarketing")}
                      </SelectItem>
                      <SelectItem value="operational">
                        {t("typeOperational")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t("recurring")}</Label>
                  <Select
                    value={recurringFilter}
                    onValueChange={(v) =>
                      setRecurringFilter(v as typeof recurringFilter)
                    }
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all")}</SelectItem>
                      <SelectItem value="recurring">
                        {t("recurringOnly")}
                      </SelectItem>
                      <SelectItem value="one-time">
                        {t("oneTimeOnly")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t("startDate")}</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t("endDate")}</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    {t("clearFilters")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expenses Table */}
          <Card className="shadow-sm border-none">
            <CardContent className="pt-6">
              {expensesQuery.isLoading ? (
                <Loader />
              ) : expensesQuery.data && expensesQuery.data.length > 0 ? (
                <div className="rounded-lg border overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-semibold">
                          {t("date")}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t("category")}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t("type")}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t("amount")}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t("description")}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t("recurring")}
                        </TableHead>
                        <TableHead className="font-semibold text-right">
                          {t("actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expensesQuery.data.map((expense) => (
                        <TableRow
                          key={expense.expenseId}
                          className="hover:bg-slate-50"
                        >
                          <TableCell>
                            {formatDate(expense.expenseDate)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {expense.categoryName}
                          </TableCell>
                          <TableCell>
                            {getCategoryTypeBadge(
                              expense.categoryType as ExpenseCategoryType
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {expense.description || "-"}
                          </TableCell>
                          <TableCell>
                            {getRecurringBadge(
                              expense.isRecurring,
                              expense.recurringInterval as RecurringInterval | null
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
                                    handleEditExpense({
                                      expenseId: expense.expenseId,
                                      categoryId: expense.categoryId,
                                      amount: expense.amount,
                                      description: expense.description,
                                      expenseDate: expense.expenseDate,
                                      isRecurring: expense.isRecurring,
                                      recurringInterval:
                                        expense.recurringInterval as RecurringInterval | null,
                                    })
                                  }
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  {t("edit")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() =>
                                    deleteExpenseMutation.mutate(
                                      expense.expenseId
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t("delete")}
                                </DropdownMenuItem>
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
                  <Banknote className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>{t("noExpenses")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {/* Categories List */}
          <Card className="shadow-sm border-none">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {t("categoriesManagement")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoriesQuery.isLoading ? (
                <Loader />
              ) : categoriesQuery.data && categoriesQuery.data.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-semibold">
                          {t("categoryName")}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t("type")}
                        </TableHead>
                        <TableHead className="font-semibold text-right">
                          {t("actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoriesQuery.data.map((category) => (
                        <TableRow
                          key={category.categoryId}
                          className="hover:bg-slate-50"
                        >
                          <TableCell className="font-medium">
                            {category.name}
                          </TableCell>
                          <TableCell>
                            {getCategoryTypeBadge(
                              category.type as ExpenseCategoryType
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() =>
                                deleteCategoryMutation.mutate(
                                  category.categoryId
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderPlus className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>{t("noCategories")}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setCategoryDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("addCategory")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
