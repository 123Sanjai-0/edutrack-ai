"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Download, FileText, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export default function FacultyReportsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <FileSpreadsheet className="w-7 h-7 text-indigo-500" />
          Academic Reports & Transcripts
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Export full class performance matrices, grade sheets, and student diagnostic PDFs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class CSV Report */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              CSE-4A Full Class Roster & Grades CSV
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Includes individual student attendance %, continuous scores, CGPA, risk rating, and primary risk reasons.
            </p>
          </div>

          <a
            href={api.reports.getClassCsvUrl(1)}
            download
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Download Class CSV
          </a>
        </div>

        {/* Master Student Records CSV */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Institutional Master Student Export
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Master dataset export containing all 114 students with predictive scores and risk flags.
            </p>
          </div>

          <a
            href={api.reports.getStudentsCsvUrl()}
            download
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Master Student CSV
          </a>
        </div>
      </div>
    </div>
  );
}
