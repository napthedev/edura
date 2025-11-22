"use client";

import { useState } from "react";
import { ClassSidebar } from "./class-sidebar";
import { TopNav } from "@/components/dashboard/top-nav";

interface ClassShellProps {
  children: React.ReactNode;
  classId: string;
  className?: string;
  isTeacher?: boolean;
}

export function ClassShell({
  children,
  classId,
  className,
  isTeacher = true,
}: ClassShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <ClassSidebar
        classId={classId}
        className={className}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        isTeacher={isTeacher}
      />
      <div className="pl-0 md:pl-64 transition-all duration-300">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
