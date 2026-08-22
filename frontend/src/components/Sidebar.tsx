"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  CalendarCheck,
  BrainCircuit,
  Lightbulb,
  Target,
  FileSpreadsheet,
  Settings,
  Bell,
  Sparkles,
  ShieldCheck,
  Grid,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || "STUDENT";

  const adminNav = [
    { name: "Institution Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Student Directory", href: "/admin/students", icon: Users },
    { name: "Faculty Management", href: "/admin/faculty", icon: GraduationCap },
    { name: "Class Performance Heatmap", href: "/admin/heatmap", icon: Grid },
    { name: "ML Engine & Diagnostics", href: "/admin/ml", icon: BrainCircuit },
    { name: "Academic Weights & Config", href: "/admin/config", icon: Settings },
    { name: "System Audit Logs", href: "/admin/audit", icon: ShieldCheck },
  ];

  const facultyNav = [
    { name: "Faculty Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
    { name: "Mark Entry & Gradebook", href: "/faculty/marks", icon: ClipboardList },
    { name: "Attendance Marker", href: "/faculty/attendance", icon: CalendarCheck },
    { name: "Performance Heatmap", href: "/faculty/heatmap", icon: Grid },
    { name: "Early Warning Roster", href: "/faculty/at-risk", icon: BrainCircuit },
    { name: "Class Reports", href: "/faculty/reports", icon: FileSpreadsheet },
  ];

  const studentNav = [
    { name: "My Scorecard", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "Subject Analytics", href: "/student/performance", icon: GraduationCap },
    { name: "AI Study Recommendations", href: "/student/recommendations", icon: Lightbulb },
    { name: "Academic Goals", href: "/student/goals", icon: Target },
    { name: "Attendance Health", href: "/student/attendance", icon: CalendarCheck },
    { name: "Download Transcript", href: "/student/report-card", icon: FileSpreadsheet },
  ];

  const navItems = role === "ADMIN" ? adminNav : (role === "FACULTY" ? facultyNav : studentNav);

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Logo Branding */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
              EduTrack AI
            </span>
            <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
              Academic Analytics
            </span>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-4 py-3">
          <div className="px-3 py-1.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Portal Mode</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white tracking-wide">
              {role}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {user?.full_name || "Guest User"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {user?.email || "Signed out"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
