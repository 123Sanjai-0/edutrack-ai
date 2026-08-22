"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  TrendingUp,
  BrainCircuit,
  CalendarCheck,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Target,
  ArrowRight,
  Download,
  Percent,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { RiskBadge } from "@/components/RiskBadge";
import { PerformanceChart } from "@/components/PerformanceChart";
import { SkillRadarChart } from "@/components/SkillRadarChart";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = user?.student_profile_id || 1;

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const [analyticsData, recsData, goalsData] = await Promise.all([
        api.students.getAnalytics(studentId),
        api.recommendations.getForStudent(studentId),
        api.goals.getForStudent(studentId),
      ]);
      setAnalytics(analyticsData);
      setRecommendations(recsData || []);
      setGoals(goalsData || []);
    } catch (err) {
      console.error("Failed to load student dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stu = analytics.student;

  return (
    <div className="space-y-8">
      {/* Header Profile Bar */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-400 to-sky-400 p-0.5 flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-indigo-950 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl">
              {stu.full_name?.charAt(0)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">{stu.full_name}</h1>
              <RiskBadge level={analytics.risk_level} score={analytics.risk_score} size="sm" />
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              Roll No: <span className="font-mono font-bold text-white">{stu.student_id}</span> • {stu.department_name} (Sem {stu.semester_number})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <a
            href={api.reports.getStudentPdfUrl(stu.id)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold backdrop-blur-md transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download Scorecard PDF
          </a>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Overall Performance"
          value={`${analytics.overall_percentage}%`}
          subtitle="Cumulative score"
          icon={TrendingUp}
          accentColor="indigo"
          badge={`CGPA ${analytics.cgpa}`}
        />
        <MetricCard
          title="Attendance Health"
          value={`${analytics.attendance_percentage}%`}
          subtitle="Mandatory minimum: 75%"
          icon={CalendarCheck}
          accentColor={analytics.attendance_percentage < 75 ? "rose" : "emerald"}
          badge={analytics.attendance_percentage < 75 ? "Shortage" : "Compliant"}
        />
        <MetricCard
          title="Predicted Final Score"
          value={`${analytics.predicted_final_score}%`}
          subtitle={`Expected Grade: ${analytics.predicted_grade}`}
          icon={BrainCircuit}
          accentColor="purple"
          badge={`${Math.round((analytics.prediction_confidence || 0.85) * 100)}% Conf.`}
        />
        <MetricCard
          title="Academic Risk Index"
          value={`${analytics.risk_score.toFixed(0)}/100`}
          subtitle={`Risk tier: ${analytics.risk_level}`}
          icon={AlertCircle}
          accentColor={analytics.risk_level === "LOW" ? "emerald" : (analytics.risk_level === "MEDIUM" ? "amber" : "rose")}
        />
      </div>

      {/* AI Performance Prediction & Explainability Hub */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/60 shadow-lg shadow-indigo-600/5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Machine Learning Final Score Forecast & Diagnostic Factors
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transparent Explainable AI (XAI) breakdown showing positive drivers and risk dampeners
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Predicted Score:</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {analytics.predicted_final_score}% ({analytics.predicted_grade})
            </span>
          </div>
        </div>

        {/* Explainability Grid: Positive vs Negative Factors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Positive Factors */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-3">
            <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Positive Performance Drivers
            </h3>
            <ul className="space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
              {analytics.positive_factors?.map((factor: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Negative / Risk Factors */}
          <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-3">
            <h3 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Improvement Opportunities & Bottlenecks
            </h3>
            <ul className="space-y-2 text-xs text-amber-900 dark:text-amber-200">
              {analytics.negative_factors?.length > 0 ? (
                analytics.negative_factors.map((factor: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                    <span>{factor}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-center gap-2 text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  No negative performance bottlenecks detected!
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Performance Trends & Multi-Subject Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trend Chart */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Continuous Evaluation Trajectory
              </h2>
              <p className="text-xs text-slate-400">Your score vs class average across consecutive tests</p>
            </div>
            <Link
              href="/student/performance"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Detailed Breakdown
            </Link>
          </div>

          <PerformanceChart data={analytics.performance_trends || []} />
        </div>

        {/* Competency Radar Chart */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Curriculum Competency Radar
            </h2>
            <p className="text-xs text-slate-400 mb-2">Multi-subject benchmark vs cohort</p>
          </div>

          <SkillRadarChart data={analytics.radar_data || []} height={240} />
        </div>
      </div>

      {/* Personalized Recommendations & Academic Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendations */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Personalized AI Study Recommendations
              </h2>
            </div>
            <Link href="/student/recommendations" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              View All ({recommendations.length})
            </Link>
          </div>

          <div className="space-y-3">
            {recommendations.slice(0, 2).map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{rec.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {rec.priority} PRIORITY
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">{rec.reason}</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium pt-1">
                  <b>Action:</b> {rec.action_plan}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Goals */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Academic Target Goals
              </h2>
            </div>
            <Link href="/student/goals" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Manage Goals
            </Link>
          </div>

          <div className="space-y-3">
            {goals.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active goals created yet.</p>
            ) : (
              goals.slice(0, 2).map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{g.title}</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {g.current_score} → {g.target_score}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, g.progress_percentage)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Progress: {g.progress_percentage}%</span>
                    <span>Deadline: {new Date(g.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
