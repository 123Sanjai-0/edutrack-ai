"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Download,
  BookOpen,
  Award,
  CalendarCheck,
  TrendingUp,
} from "lucide-react";
import { SubjectBarChart } from "@/components/SubjectBarChart";
import { SkillRadarChart } from "@/components/SkillRadarChart";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function StudentPerformancePage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const studentId = user?.student_profile_id || 1;

  useEffect(() => {
    loadPerformance();
  }, [studentId]);

  const loadPerformance = async () => {
    setLoading(true);
    try {
      const data = await api.students.getAnalytics(studentId);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load student performance", err);
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

  const subjectData = (analytics.subject_performances || []).map((sp: any) => ({
    subject: sp.subject_code,
    student_score: sp.total_weighted_score,
    class_average: sp.class_average,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-indigo-500" />
            Subject-Wise Academic Performance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detailed continuous assessment components, grades, and class averages
          </p>
        </div>

        <a
          href={api.reports.getStudentPdfUrl(studentId)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          Download PDF Transcript
        </a>
      </div>

      {/* Comparative Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Score Benchmark vs Class Average
          </h2>
          <SubjectBarChart data={subjectData} />
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Multi-Subject Competency Radar
          </h2>
          <SkillRadarChart data={subjectData} />
        </div>
      </div>

      {/* Subject Scorecards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {analytics.subject_performances?.map((sp: any) => (
          <div
            key={sp.subject_id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {sp.subject_code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{sp.subject_name}</h3>
                </div>
                <span className="text-base font-black px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  {sp.grade}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Continuous Assessment:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{sp.internal_score.toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-slate-400">Midterm Exam:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{sp.midterm_score.toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-slate-400">Attendance:</span>
                  <p className={`font-bold ${sp.attendance_pct < 75 ? "text-rose-500 font-black" : "text-slate-800 dark:text-slate-200"}`}>
                    {sp.attendance_pct.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Class Average:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{sp.class_average.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Weighted Score:</span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                {sp.total_weighted_score.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
