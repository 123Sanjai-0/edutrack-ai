"use client";

import React, { useState, useEffect } from "react";
import { Lightbulb, CheckCircle2, Clock, Check, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function StudentRecommendationsPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = user?.student_profile_id || 1;

  useEffect(() => {
    loadRecommendations();
  }, [studentId]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const data = await api.recommendations.getForStudent(studentId);
      setRecommendations(data || []);
    } catch (err) {
      console.error("Failed to load recommendations", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.recommendations.updateStatus(id, newStatus);
      setRecommendations(
        recommendations.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update status");
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
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Lightbulb className="w-7 h-7 text-amber-500" />
          Personalized AI Study Recommendations
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Targeted learning tasks generated dynamically from your continuous assessment performance and topic gaps
        </p>
      </div>

      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No active remedial recommendations required. You are performing at or above benchmark standards!
          </div>
        ) : (
          recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rec.priority === "URGENT" || rec.priority === "HIGH"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                          : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400"
                      }`}
                    >
                      {rec.priority} PRIORITY
                    </span>
                    {rec.subject_name && (
                      <span className="text-xs font-semibold text-slate-500">
                        • {rec.subject_name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {rec.title}
                  </h3>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                    rec.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : rec.status === "IN_PROGRESS"
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {rec.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Why was this recommended?</span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">{rec.reason}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Action Plan:</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{rec.action_plan}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {rec.status !== "IN_PROGRESS" && rec.status !== "COMPLETED" && (
                  <button
                    onClick={() => handleUpdateStatus(rec.id, "IN_PROGRESS")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Mark In Progress
                  </button>
                )}
                {rec.status !== "COMPLETED" && (
                  <button
                    onClick={() => handleUpdateStatus(rec.id, "COMPLETED")}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
