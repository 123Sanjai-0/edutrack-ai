"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  Bell,
  Target,
  FileText,
  X,
  Send,
  Plus,
} from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { api } from "@/lib/api";

export default function FacultyAtRiskPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(1);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Intervention Modals
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any>(null);

  // Goal Form
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetScore, setGoalTargetScore] = useState(75);
  const [goalDeadline, setGoalDeadline] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Alert Form
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  useEffect(() => {
    api.academics.getClasses().then((classList) => {
      setClasses(classList || []);
      if (classList && classList.length > 0) {
        setSelectedClassId(classList[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadAtRisk();
    }
  }, [selectedClassId]);

  const loadAtRisk = async () => {
    setLoading(true);
    try {
      const data = await api.analytics.getFacultyStats(selectedClassId);
      setStats(data);
    } catch (err) {
      console.error("Failed to load at risk data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGoal = (stu: any) => {
    setActiveStudent(stu);
    setGoalTitle(`Score Improvement: Target 75%+ in upcoming assessments`);
    setGoalTargetScore(75);
    setShowGoalModal(true);
  };

  const handleOpenAlert = (stu: any) => {
    setActiveStudent(stu);
    setAlertTitle("Academic Performance Alert & Counseling Notice");
    setAlertMessage(
      `Dear ${stu.full_name}, your recent score (${stu.score?.toFixed(1)}%) or attendance (${stu.attendance?.toFixed(1)}%) requires immediate attention. Please meet your course faculty advisor during office hours.`
    );
    setShowAlertModal(true);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    setSubmitting(true);
    try {
      await api.goals.create({
        student_id: activeStudent.id,
        title: goalTitle,
        target_score: Number(goalTargetScore),
        current_score: Number(activeStudent.score || 0),
        deadline: new Date(goalDeadline).toISOString(),
      });
      setShowGoalModal(false);
      setNotificationMsg(`Remedial Goal successfully assigned to ${activeStudent.full_name}!`);
    } catch (err: any) {
      alert(err.message || "Failed to assign goal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    setSubmitting(true);
    try {
      await api.notifications.create({
        student_id: activeStudent.id,
        title: alertTitle,
        message: alertMessage,
        notification_type: "ALERT",
      });
      setShowAlertModal(false);
      setNotificationMsg(`Urgent alert notification dispatched to ${activeStudent.full_name}!`);
    } catch (err: any) {
      alert(err.message || "Failed to send notification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
            Early Warning & Academically At-Risk Roster
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Algorithmic detection of score deterioration, assessment gaps, and attendance shortages
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white shadow-sm"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Class: {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-500 text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg("")}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* At-Risk Cards Grid */}
      {loading || !stats ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : stats.at_risk_students?.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No At-Risk Students Detected</h3>
          <p className="text-xs text-slate-400 mt-1">All enrolled students in this class section maintain healthy performance and attendance metrics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.at_risk_students.map((stu: any) => (
            <div
              key={stu.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 shadow-sm flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {stu.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{stu.full_name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{stu.student_id}</p>
                    </div>
                  </div>
                  <RiskBadge level={stu.risk_level} size="md" />
                </div>

                {/* Contributing Risk Drivers */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Contributing Risk Drivers:
                  </p>
                  <ul className="space-y-1.5 text-xs text-rose-700 dark:text-rose-400">
                    {stu.risk_reasons?.map((reason: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 bg-rose-50/60 dark:bg-rose-950/40 p-2.5 rounded-2xl">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs font-semibold">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex-1 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Overall Score</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{stu.score.toFixed(1)}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 flex-1 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Attendance</span>
                    <span className={`font-bold text-sm ${stu.attendance < 75 ? "text-rose-500" : "text-amber-500"}`}>
                      {stu.attendance.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Actionable Intervention Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAlert(stu)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    Send Alert
                  </button>
                  <button
                    onClick={() => handleOpenGoal(stu)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                  >
                    <Target className="w-3.5 h-3.5" />
                    Assign Goal
                  </button>
                </div>

                <a
                  href={api.reports.getStudentPdfUrl(stu.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
                >
                  Scorecard PDF
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Remedial Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" />
                Assign Goal for: {activeStudent?.full_name}
              </h3>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Title & Objective
                </label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Score (%)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="100"
                    value={goalTargetScore}
                    onChange={(e) => setGoalTargetScore(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    required
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? "Assigning..." : "Confirm Remedial Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-500" />
                Dispatch Alert to: {activeStudent?.full_name}
              </h3>
              <button onClick={() => setShowAlertModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendAlert} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Title
                </label>
                <input
                  type="text"
                  required
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Body
                </label>
                <textarea
                  rows={4}
                  required
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Sending..." : "Dispatch Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
