"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { api } from "@/lib/api";

export default function FacultyAtRiskPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAtRisk();
  }, []);

  const loadAtRisk = async () => {
    setLoading(true);
    try {
      const data = await api.analytics.getFacultyStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load at risk data", err);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <AlertTriangle className="w-7 h-7 text-rose-500" />
          Early Warning & Academically At-Risk Roster
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Algorithmic detection of declining scores, missed assessments, and attendance shortages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.at_risk_students?.map((stu: any) => (
          <div
            key={stu.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{stu.full_name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{stu.student_id} • Section CSE-4A</p>
                </div>
                <RiskBadge level={stu.risk_level} size="md" />
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Contributing Risk Drivers:
                </p>
                <ul className="space-y-1.5 text-xs text-rose-700 dark:text-rose-400">
                  {stu.risk_reasons?.map((reason: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 bg-rose-50/60 dark:bg-rose-950/40 p-2 rounded-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-slate-400">Overall Score: </span>
                <span className="font-bold text-slate-900 dark:text-white">{stu.score.toFixed(1)}%</span>
                <span className="text-slate-400 ml-2">Attendance: </span>
                <span className="font-bold text-slate-900 dark:text-white">{stu.attendance.toFixed(1)}%</span>
              </div>

              <a
                href={api.reports.getStudentPdfUrl(stu.id)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
              >
                Scorecard PDF
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
