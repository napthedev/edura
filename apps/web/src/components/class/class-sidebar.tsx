"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Megaphone,
  Users,
  Calendar,
  FileText,
  Video,
  Settings,
  ArrowLeft,
  GraduationCap,
  UserPlus,
  Layout,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTranslations } from "next-intl";

interface ClassSidebarProps {
  classId: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isTeacher?: boolean;
}

function ClassSidebarContent({
  classId,
  className,
  isTeacher = true,
}: {
  classId: string;
  className?: string;
  isTeacher?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("ClassSidebar");

  // Fallback for legacy query param support or default
  const currentTab = searchParams.get("tab");

  // Extract the last segment of the path to determine the active tab
  const pathSegments = pathname.split("/");
  const lastSegment = pathSegments[pathSegments.length - 1];

  // If we are at the root of the class page, default to announcement
  const activeTab =
    currentTab || (lastSegment === classId ? "announcement" : lastSegment);

  const teacherLinks = [
    {
      value: "announcement",
      label: t("announcements"),
      icon: Megaphone,
    },
    {
      value: "modules",
      label: t("modules"),
      icon: Layout,
    },
    {
      value: "students",
      label: t("students"),
      icon: Users,
    },
    {
      value: "requests",
      label: t("requests"),
      icon: UserPlus,
    },
    {
      value: "schedule",
      label: t("schedule"),
      icon: Calendar,
    },
    {
      value: "assignments",
      label: t("assignments"),
      icon: FileText,
    },
    {
      value: "lectures",
      label: t("lectures"),
      icon: Video,
    },
    {
      value: "settings",
      label: t("settings"),
      icon: Settings,
    },
  ];

  const studentLinks = [
    {
      value: "announcement",
      label: t("announcements"),
      icon: Megaphone,
    },
    {
      value: "modules",
      label: t("modules"),
      icon: Layout,
    },
    {
      value: "teacher",
      label: t("teacher"),
      icon: GraduationCap,
    },
    {
      value: "schedule",
      label: t("schedule"),
      icon: Calendar,
    },
    {
      value: "assignments",
      label: t("assignments"),
      icon: FileText,
    },
    {
      value: "lectures",
      label: t("lectures"),
      icon: Video,
    },
    {
      value: "settings",
      label: t("settings"),
      icon: Settings,
    },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  return (
    <>
      <div className="flex h-16 items-center px-6 border-b">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">{t("backToDashboard")}</span>
        </Link>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="px-3 py-2">
          <h2
            className="mb-2 px-4 text-lg font-semibold tracking-tight truncate"
            title={className}
          >
            {className || "Class"}
          </h2>
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.value;
          return (
            <Link
              key={link.value}
              // @ts-ignore
              href={
                isTeacher
                  ? `/class/teacher/${classId}/${link.value}`
                  : `/class/student/${classId}/${link.value}`
              }
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-50 text-blue-600"
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

export function ClassSidebar({
  classId,
  className,
  open = false,
  onOpenChange,
  isTeacher = true,
}: ClassSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar - Always visible on md and above */}
      <div className="hidden border-r bg-white md:block w-64 min-h-screen fixed left-0 top-0 bottom-0 z-30">
        <ClassSidebarContent
          classId={classId}
          className={className}
          isTeacher={isTeacher}
        />
      </div>

      {/* Mobile Sidebar - Drawer */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0 border-0">
          <div className="bg-white h-full border-r">
            <ClassSidebarContent
              classId={classId}
              className={className}
              isTeacher={isTeacher}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
