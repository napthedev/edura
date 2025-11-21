"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  HeadphonesIcon,
  BookOpen,
  Calendar,
  FileText,
  Settings,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface SidebarProps {
  role: "teacher" | "student" | "manager";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function SidebarContent({ role }: { role: "teacher" | "student" | "manager" }) {
  const pathname = usePathname();

  const teacherLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/teacher/classes",
      label: "Classes",
      icon: BookOpen,
    },
    {
      href: "/dashboard/teacher/students",
      label: "Students",
      icon: Users,
    },
    {
      href: "/dashboard/teacher/assignments",
      label: "Assignments",
      icon: FileText,
    },
    {
      href: "/dashboard/teacher/schedule",
      label: "Schedule",
      icon: Calendar,
    },
  ];

  const studentLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/student/classes",
      label: "My Classes",
      icon: BookOpen,
    },
    {
      href: "/dashboard/student/assignments",
      label: "Assignments",
      icon: FileText,
    },
    {
      href: "/dashboard/student/schedule",
      label: "Schedule",
      icon: Calendar,
    },
  ];

  // Links matching the design image more closely for "manager" or general view if needed
  const designLinks = [
    {
      href: "/dashboard/finance",
      label: "Finance",
      icon: LayoutDashboard, // Placeholder
    },
    {
      href: "/dashboard/teachers",
      label: "Teachers",
      icon: Users,
    },
    {
      href: "/dashboard/students",
      label: "Students",
      icon: GraduationCap,
    },
    {
      href: "/dashboard/customer-service",
      label: "Customer Service",
      icon: HeadphonesIcon,
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
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">edura</span>
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
