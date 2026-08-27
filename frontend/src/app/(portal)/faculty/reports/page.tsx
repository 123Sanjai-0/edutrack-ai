"use client";

import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Download, FileText, CheckCircle2, Users, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";

export default function FacultyReportsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(1);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.academics.getClasses(),
      api.students.list({ page_size: 100 }),
    ]).then(([classList, stuList]) => {
      setClasses(classList || []);
      const stuItems = stuList.items || [];
      setStudents(stuItems);
      if (classList && classList.length > 0) setSelectedClassId(classList[0].id);
      if (stuItems.length > 0) setSelectedStudentId(stuItems[0].id);
      setLoading(false);
    });
  }, []);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <FileSpreadsheet className="w-7 h-7 text-indigo-500" />
          Academic Reports & Diagnostic Transcripts
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Export full class performance matrices, grade sheets, and individual student diagnostic scorecards
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
              Class Roster & Grades Matrix CSV
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Includes student attendance %, continuous scores, CGPA, risk ratings, and primary risk driver explanations.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Class Section:
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.academic_year})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <a
            href={api.reports.getClassCsvUrl(selectedClassId)}
            download
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Download {selectedClass?.name || "Class"} CSV Report
          </a>
        </div>

        {/* Individual Student PDF Scorecard */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Individual Diagnostic PDF Scorecard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Generates an official PDF report card with visual gauges, ML predicted grade, risk assessment, and radar chart.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Student:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.student_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <a
            href={api.reports.getStudentPdfUrl(selectedStudentId)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Generate Student PDF Scorecard
          </a>
        </div>
      </div>
    </div>
  );
}
