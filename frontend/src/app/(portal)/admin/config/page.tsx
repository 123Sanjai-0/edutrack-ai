"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldAlert,
  Percent,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminConfigPage() {
  const [config, setConfig] = useState<any>({
    institution_name: "Global Institute of Technology",
    weight_internal_assessment: 20,
    weight_assignments: 10,
    weight_quizzes: 10,
    weight_attendance: 10,
    weight_midterm: 20,
    weight_final: 30,
    attendance_minimum_pct: 75,
    attendance_warning_pct: 80,
    passing_grade_pct: 40,
    risk_low_max: 30,
    risk_medium_max: 60,
    risk_high_max: 80,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await api.config.get();
      setConfig(data);
    } catch (err) {
      console.error("Failed to load config", err);
    } finally {
      setLoading(false);
    }
  };

  const totalWeight =
    Number(config.weight_internal_assessment) +
    Number(config.weight_assignments) +
    Number(config.weight_quizzes) +
    Number(config.weight_attendance) +
    Number(config.weight_midterm) +
    Number(config.weight_final);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.round(totalWeight) !== 100) {
      setStatusMsg({
        type: "error",
        text: `Weights must equal exactly 100%. Current sum: ${totalWeight}%`,
      });
      return;
    }

    setSaving(true);
    setStatusMsg(null);
    try {
      await api.config.update(config);
      setStatusMsg({
        type: "success",
        text: "Institutional scoring weights and risk thresholds updated successfully. Logged in audit trail.",
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to save configuration",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Academic Calculation & Threshold Engine
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure transparent composite weighting and early warning risk boundaries
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
            statusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/10 border-rose-500/30 text-rose-500"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Assessment Weights Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Percent className="w-5 h-5 text-indigo-500" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Assessment Weight Distribution
                </h2>
                <p className="text-xs text-slate-400">
                  Dynamic weight components for final composite score
                </p>
              </div>
            </div>

            <div
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                Math.round(totalWeight) === 100
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 animate-bounce"
              }`}
            >
              Total Sum: {totalWeight}% / 100%
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Internal Assessment Weight (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.weight_internal_assessment}
                onChange={(e) => setConfig({ ...config, weight_internal_assessment: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assignments & Homework (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.weight_assignments}
                onChange={(e) => setConfig({ ...config, weight_assignments: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quizzes & Unit Tests (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.weight_quizzes}
                onChange={(e) => setConfig({ ...config, weight_quizzes: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attendance Contribution (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.weight_attendance}
                onChange={(e) => setConfig({ ...config, weight_attendance: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Midterm Examination (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.weight_midterm}
                onChange={(e) => setConfig({ ...config, weight_midterm: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Final Semester Examination (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.weight_final}
                onChange={(e) => setConfig({ ...config, weight_final: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Risk & Attendance Thresholds Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Early Warning & Risk Boundaries
              </h2>
              <p className="text-xs text-slate-400">
                Institutional criteria for triggering automated high risk alerts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Mandatory Attendance (%)
              </label>
              <input
                type="number"
                value={config.attendance_minimum_pct}
                onChange={(e) => setConfig({ ...config, attendance_minimum_pct: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attendance Warning Threshold (%)
              </label>
              <input
                type="number"
                value={config.attendance_warning_pct}
                onChange={(e) => setConfig({ ...config, attendance_warning_pct: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Passing Grade (%)
              </label>
              <input
                type="number"
                value={config.passing_grade_pct}
                onChange={(e) => setConfig({ ...config, passing_grade_pct: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || Math.round(totalWeight) !== 100}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving Configuration..." : "Save Institutional Configurations"}
        </button>
      </form>
    </div>
  );
}
