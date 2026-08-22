"use client";

import React, { useState, useEffect } from "react";
import { CalendarCheck, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const studentId = user?.student_profile_id || 1;

  useEffect(() => {
    loadAttendance();
  }, [studentId]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const [sumData, anaData] = await Promise.all([
        api.attendance.getStudentSummary(studentId),
        api.students.getAnalytics(studentId),
      ]);
      setSummary(sumData);
      setAnalytics(anaData);
    } catch (err) {
      console.error("Failed to load attendance", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isShortage = summary.attendance_percentage < 75.0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <CalendarCheck className="w-7 h-7 text-emerald-500" />
          Attendance Health & Compliance Center
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Track lecture attendance, shortage deficits, and semester exam eligibility
        </p>
      </div>

      {isShortage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-500 text-xs">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Mandatory Attendance Shortage Warning</p>
            <p className="mt-0.5 opacity-90">
              Your attendance is currently <b>{summary.attendance_percentage}%</b>, which is <b>{summary.shortage}% below the 75% threshold</b>. You risk debarment from semester final examinations if attendance is not improved immediately.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard
          title="Overall Attendance"
          value={`${summary.attendance_percentage}%`}
          subtitle="All registered subjects"
          icon={CalendarCheck}
          accentColor={isShortage ? "rose" : "emerald"}
          badge={isShortage ? "Critical Shortage" : "Compliant"}
        />
        <MetricCard
          title="Lectures Attended"
          value={`${summary.present_count} / ${summary.total_classes}`}
          subtitle="Present or authorized leave"
          icon={CheckCircle2}
          accentColor="sky"
        />
        <MetricCard
          title="Shortage Deficit"
          value={`${summary.shortage}%`}
          subtitle="Required to reach 75%"
          icon={AlertTriangle}
          accentColor={summary.shortage > 0 ? "rose" : "emerald"}
        />
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Subject-Wise Lecture Attendance Breakdown
          </h2>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Subject Code & Name</th>
              <th className="py-3 px-4 text-center">Attendance %</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {analytics?.subject_performances?.map((sp: any) => (
              <tr key={sp.subject_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{sp.subject_code}</span> — {sp.subject_name}
                </td>
                <td className="py-3.5 px-4 text-center font-bold">
                  <span className={sp.attendance_pct < 75 ? "text-rose-500 font-extrabold" : "text-slate-800 dark:text-slate-200"}>
                    {sp.attendance_pct.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`font-semibold px-2.5 py-1 rounded-full text-[10px] ${
                      sp.attendance_pct >= 85
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : sp.attendance_pct >= 75
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 font-bold"
                    }`}
                  >
                    {sp.attendance_pct >= 75 ? "Eligible" : "Shortage Flag"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
