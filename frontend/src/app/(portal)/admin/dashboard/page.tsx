"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  BrainCircuit,
  ShieldCheck,
  Building,
  CheckCircle2,
  CalendarCheck,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { RiskBadge } from "@/components/RiskBadge";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.analytics.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load admin analytics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Aggregating Institutional Data...</span>
        </div>
      </div>
    );
  }

  const riskPieData = [
    { name: "Low Risk", value: stats.risk_distribution?.LOW || 0, color: "#10b981" },
    { name: "Medium Risk", value: stats.risk_distribution?.MEDIUM || 0, color: "#f59e0b" },
    { name: "High Risk", value: stats.risk_distribution?.HIGH || 0, color: "#f97316" },
    { name: "Critical Risk", value: stats.risk_distribution?.CRITICAL || 0, color: "#ef4444" },
  ];

  const gradeBarData = Object.entries(stats.grade_distribution || {}).map(([grade, count]) => ({
    grade,
    students: count,
  }));

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Institutional Analytics & Oversight
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time monitoring across 3 Academic Departments & 114 Registered Students
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={api.reports.getStudentsCsvUrl()}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Export Master CSV
          </a>
          <Link
            href="/admin/config"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            Scoring Weights
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Enrollment"
          value={stats.total_students}
          subtitle="Across 3 departments"
          icon={Users}
          accentColor="indigo"
          trend={{ value: "+8.4%", isPositive: true }}
        />
        <MetricCard
          title="Institution Avg Score"
          value={`${stats.average_institution_score}%`}
          subtitle="Continuous assessment"
          icon={TrendingUp}
          accentColor="sky"
          trend={{ value: "+2.1%", isPositive: true }}
        />
        <MetricCard
          title="Attendance Health"
          value={`${stats.average_attendance}%`}
          subtitle="Target threshold: 75%"
          icon={CalendarCheck}
          accentColor="emerald"
          badge="Healthy"
        />
        <MetricCard
          title="At-Risk Cohort"
          value={`${stats.at_risk_count} (${stats.at_risk_percentage}%)`}
          subtitle="High & Critical flags"
          icon={AlertTriangle}
          accentColor="rose"
          badge="Action Req."
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Performance */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Departmental Performance & Risk Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Average score vs count of at-risk students per department
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
              Spring 2026
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.department_performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="department_code" tick={{ fontSize: 11, fill: "#64748b" }} />
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
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="average_score" name="Avg Score (%)" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="at_risk_count" name="At-Risk Count" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Institutional Risk Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Early warning distribution calculated by ML classifier
            </p>
          </div>

          <div className="h-56 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {riskPieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-slate-600 dark:text-slate-300">{item.name}:</span>
                <span className="font-bold text-slate-900 dark:text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grade Distribution & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Grade Distribution (Institution-wide)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Total students in each letter grade tier
          </p>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="grade" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="students" name="Students" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Logs Stream */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Audit Trail & Governance Stream
                </h2>
              </div>
              <Link href="/admin/audit" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {stats.recent_audit_logs?.slice(0, 5).map((log: any) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      By <span className="font-medium text-slate-700 dark:text-slate-300">{log.user_email}</span> on {log.entity_type} ({log.entity_id || "N/A"})
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
