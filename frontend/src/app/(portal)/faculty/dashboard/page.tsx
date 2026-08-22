"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  CalendarCheck,
  Award,
  ArrowUpRight,
  FileSpreadsheet,
  Grid,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { RiskBadge } from "@/components/RiskBadge";
import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function FacultyDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.analytics.getFacultyStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load faculty analytics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Faculty Academic Portal & Gradebook
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assigned Section: <b>CSE-4A</b> (Database Management Systems & Algorithms)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/faculty/attendance"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
            Mark Attendance
          </Link>
          <Link
            href="/faculty/marks"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Gradebook & Marks
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Assigned Students"
          value={stats.total_assigned_students}
          subtitle="Section CSE-4A"
          icon={Users}
          accentColor="indigo"
        />
        <MetricCard
          title="Class Average Score"
          value={`${stats.class_average_score}%`}
          subtitle="All continuous tests"
          icon={TrendingUp}
          accentColor="sky"
          trend={{ value: "+3.2%", isPositive: true }}
        />
        <MetricCard
          title="Class Attendance"
          value={`${stats.class_average_attendance}%`}
          subtitle="Mandatory minimum: 75%"
          icon={CalendarCheck}
          accentColor="emerald"
        />
        <MetricCard
          title="At-Risk Students"
          value={stats.at_risk_students_count}
          subtitle="Immediate attention"
          icon={AlertTriangle}
          accentColor="rose"
          badge="High Alert"
        />
      </div>

      {/* Early Warning Roster & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* At-Risk Warning Cards */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Early Warning Diagnostic Roster
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Students flagged with severe attendance shortages or declining scores
              </p>
            </div>
            <Link
              href="/faculty/at-risk"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View Full Analysis
            </Link>
          </div>

          <div className="space-y-3">
            {stats.at_risk_students?.map((stu: any) => (
              <div
                key={stu.id}
                className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{stu.full_name}</span>
                    <span className="text-[11px] font-mono text-slate-400">({stu.student_id})</span>
                    <RiskBadge level={stu.risk_level} size="sm" />
                  </div>
                  <ul className="mt-1.5 space-y-0.5 text-xs text-rose-700 dark:text-rose-400">
                    {stu.risk_reasons?.map((reason: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{stu.score.toFixed(1)}%</p>
                    <p className="text-[10px] text-slate-400">Att: {stu.attendance.toFixed(1)}%</p>
                  </div>
                  <a
                    href={api.reports.getStudentPdfUrl(stu.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm"
                  >
                    Scorecard
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Top Performing Achievers
              </h2>
            </div>

            <div className="space-y-3">
              {stats.top_performers?.map((stu: any, idx: number) => (
                <div
                  key={stu.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold flex items-center justify-center text-[11px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{stu.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{stu.student_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {stu.score.toFixed(1)}%
                    </span>
                    <p className="text-[10px] text-slate-400">Att: {stu.attendance.toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subject Comparisons & Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Comparison Chart */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Subject Score & Pass Rate Comparisons
            </h2>
            <Link href="/faculty/heatmap" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline">
              <Grid className="w-3.5 h-3.5" /> Heatmap View
            </Link>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.subject_comparisons}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="subject_code" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="average_score" name="Avg Score (%)" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pass_rate" name="Pass Rate (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Pending Academic Actions
            </h2>
            <div className="space-y-3">
              {stats.pending_actions?.map((action: any, idx: number) => (
                <Link
                  key={idx}
                  href={action.link}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {action.title}
                    </p>
                    <span className="text-[10px] text-slate-400">Due: {action.due_in}</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
