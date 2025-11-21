"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

interface DashboardShellProps {
  children: React.ReactNode;
  role: "teacher" | "student" | "manager";
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar role={role} open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="pl-0 md:pl-64 transition-all duration-300">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
