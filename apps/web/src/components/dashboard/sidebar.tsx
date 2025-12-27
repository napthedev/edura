"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  Settings,
  Clock,
  CalendarClock,
  Receipt,
  Wallet,
  ClipboardCheck,
  Banknote,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTranslations } from "next-intl";

interface SidebarProps {
  role: "teacher" | "student" | "manager";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function SidebarContent({ role }: { role: "teacher" | "student" | "manager" }) {
  const pathname = usePathname();
  const t = useTranslations("DashboardSidebar");

  const teacherLinks = [
    {
      href: "/dashboard/teacher",
      label: t("dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/teacher/classes",
      label: t("classes"),
      icon: BookOpen,
    },
    {
      href: "/dashboard/teacher/students",
      label: t("students"),
      icon: Users,
    },
    {
      href: "/dashboard/teacher/assignments",
      label: t("assignments"),
      icon: FileText,
    },
    {
      href: "/dashboard/teacher/schedule",
      label: t("schedule"),
      icon: Calendar,
    },
    {
      href: "/dashboard/teacher/attendance",
      label: t("attendance"),
      icon: ClipboardCheck,
    },
  ];

  const studentLinks = [
    {
      href: "/dashboard/student",
      label: t("dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/student/classes",
      label: t("myClasses"),
      icon: BookOpen,
    },
    {
      href: "/dashboard/student/requests",
      label: t("requests"),
      icon: Clock,
    },
    {
      href: "/dashboard/student/assignments",
      label: t("assignments"),
      icon: FileText,
    },
    {
      href: "/dashboard/student/deadlines",
      label: t("deadlines"),
      icon: CalendarClock,
    },
    {
      href: "/dashboard/student/schedule",
      label: t("schedule"),
      icon: Calendar,
    },
  ];

  // Links matching the design image more closely for "manager" or general view if needed
  const designLinks = [
    {
      href: "/dashboard/manager",
      label: t("dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/manager/finance",
      label: t("finance"),
      icon: TrendingUp,
    },
    {
      href: "/dashboard/manager/tuition",
      label: t("tuition"),
      icon: Receipt,
    },
    {
      href: "/dashboard/manager/expenses",
      label: t("expenses"),
      icon: Banknote,
    },
    {
      href: "/dashboard/manager/payments",
      label: t("tutorPayments"),
      icon: Wallet,
    },
    {
      href: "/dashboard/manager/rates",
      label: t("teacherRates"),
      icon: DollarSign,
    },
    {
      href: "/dashboard/manager/teachers",
      label: t("teachers"),
      icon: Users,
    },
    {
      href: "/dashboard/manager/students",
      label: t("students"),
      icon: GraduationCap,
    },
    {
      href: "/dashboard/manager/attendance",
      label: t("attendance"),
      icon: ClipboardCheck,
    },
  ];

  const links =
    role === "teacher"
      ? teacherLinks
      : role === "student"
      ? studentLinks
      : designLinks;

  return (
    <>
      <div className="flex h-16 items-center px-6 border-b">
        <Link
          href={`/dashboard/${role}` as any}
          className="flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">Edura</span>
        </Link>
      </div>
      <div className="flex flex-col gap-2 p-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href as any}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-50 text-primary"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function Sidebar({ role, open = false, onOpenChange }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar - Always visible on md and above */}
      <div className="hidden border-r bg-white md:block w-64 min-h-screen fixed left-0 top-0 bottom-0 z-30">
        <SidebarContent role={role} />
      </div>

      {/* Mobile Sidebar - Drawer */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0 border-0">
          <div className="bg-white h-full border-r">
            <SidebarContent role={role} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
