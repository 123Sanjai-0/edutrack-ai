"use client";

import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Download, Printer, Award, Sparkles } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function StudentReportCardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const studentId = user?.student_profile_id || 1;

  useEffect(() => {
    api.students.getAnalytics(studentId).then((data) => {
      setAnalytics(data);
      setLoading(false);
    });
  }, [studentId]);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stu = analytics.student;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-indigo-500" />
            Official Academic Scorecard & Transcript
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Certified institutional evaluation record
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <a
            href={api.reports.getStudentPdfUrl(studentId)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </a>
        </div>
      </div>

      {/* Transcript Document Container */}
      <div className="p-8 md:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
        {/* Document Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
              <span className="font-extrabold text-sm tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
                Apex Institute of Technology
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              Continuous Evaluation & Performance Transcript
            </h2>
            <p className="text-xs text-slate-400">Academic Term: Spring 2026 (Semester 4)</p>
          </div>
          <RiskBadge level={analytics.risk_level} size="sm" />
        </div>

        {/* Student Info Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs">
          <div>
            <span className="text-slate-400 block">Student Name:</span>
            <span className="font-bold text-slate-900 dark:text-white">{stu.full_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Roll / Student ID:</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white">{stu.student_id}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Department:</span>
            <span className="font-bold text-slate-900 dark:text-white">{stu.department_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Section / Class:</span>
            <span className="font-bold text-slate-900 dark:text-white">{stu.class_section_name || "CSE-4A"}</span>
          </div>
        </div>

        {/* Subjects Table */}
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Subject Title</th>
              <th className="py-3 px-4 text-center">Credits</th>
              <th className="py-3 px-4 text-center">Attendance</th>
              <th className="py-3 px-4 text-center">Continuous</th>
              <th className="py-3 px-4 text-center">Midterm</th>
              <th className="py-3 px-4 text-center">Composite Score</th>
              <th className="py-3 px-4 text-center">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {analytics.subject_performances?.map((sp: any) => (
              <tr key={sp.subject_id}>
                <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{sp.subject_code}</td>
                <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{sp.subject_name}</td>
                <td className="py-3 px-4 text-center">{sp.credits}</td>
                <td className="py-3 px-4 text-center">{sp.attendance_pct.toFixed(1)}%</td>
                <td className="py-3 px-4 text-center">{sp.internal_score.toFixed(1)}%</td>
                <td className="py-3 px-4 text-center">{sp.midterm_score.toFixed(1)}%</td>
                <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">{sp.total_weighted_score.toFixed(1)}%</td>
                <td className="py-3 px-4 text-center font-black text-indigo-600 dark:text-indigo-400">{sp.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Footer */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <div>
            <span className="text-slate-400">Predicted Final Exam Score: </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {analytics.predicted_final_score}% ({analytics.predicted_grade})
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400">Overall Attendance: </span>
              <span className="font-bold text-slate-900 dark:text-white">{analytics.attendance_percentage}%</span>
            </div>
            <div>
              <span className="text-slate-400">Current CGPA: </span>
              <span className="font-black text-base text-slate-900 dark:text-white">{analytics.cgpa}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
