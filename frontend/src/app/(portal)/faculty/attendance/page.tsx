"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  UserCheck,
  UserX,
  Clock,
  Check,
  X,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";

export default function FacultyAttendancePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(1);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(1);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [period, setPeriod] = useState(1);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      api.academics.getClasses(),
      api.academics.getSubjects(),
    ]).then(([classList, subjectList]) => {
      setClasses(classList || []);
      setSubjects(subjectList || []);
      if (classList && classList.length > 0) setSelectedClassId(classList[0].id);
      if (subjectList && subjectList.length > 0) setSelectedSubjectId(subjectList[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      loadAttendanceSheet();
    }
  }, [selectedClassId, selectedSubjectId, selectedDate, period]);

  const loadAttendanceSheet = async () => {
    setLoading(true);
    try {
      const data = await api.attendance.getSheet(selectedClassId, selectedSubjectId, selectedDate, period);
      setRecords(data.records || []);
    } catch (err) {
      console.error("Failed to load attendance sheet", err);
    } finally {
      setLoading(false);
    }
  };

  const setAllStatus = (newStatus: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") => {
    setRecords(records.map((r) => ({ ...r, status: newStatus })));
  };

  const handleStatusToggle = (studentId: number, newStatus: string) => {
    setRecords(
      records.map((r) => (r.student_id === studentId ? { ...r, status: newStatus } : r))
    );
  };

  const handleRemarksChange = (studentId: number, remarks: string) => {
    setRecords(
      records.map((r) => (r.student_id === studentId ? { ...r, remarks } : r))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await api.attendance.saveBulk({
        class_section_id: Number(selectedClassId),
        subject_id: Number(selectedSubjectId),
        date: selectedDate,
        period: Number(period),
        records: records.map((r) => ({
          student_id: r.student_id,
          status: r.status,
          remarks: r.remarks,
        })),
      });

      setStatusMsg({
        type: "success",
        text: `Attendance saved successfully for ${records.length} students on ${selectedDate} (Period ${period})! Risks recalculated.`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to save attendance",
      });
    } finally {
      setSaving(false);
    }
  };

  const presentCount = records.filter((r) => r.status === "PRESENT" || r.status === "EXCUSED").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const lateCount = records.filter((r) => r.status === "LATE").length;
  const attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentSub = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-emerald-500" />
            Class Attendance Marker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Section: <b>{currentClass?.name || "CSE-4A"}</b> • Subject: <b>{currentSub?.name || "Database Management"}</b>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSave}
            disabled={saving || records.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Sheet..." : "Save Attendance Batch"}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            statusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
              : "bg-rose-500/10 border-rose-500/30 text-rose-500"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Bar: Class, Subject, Date, Period Selection */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Class Section:
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

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Attendance Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Lecture Period:
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                <option key={p} value={p}>
                  Period {p} ({8 + p}:00 AM - {9 + p}:00 AM)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Attendance Stats Counter */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Present: {presentCount}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Absent: {absentCount}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Late: {lateCount}
            </span>
            <span className="font-bold text-slate-900 dark:text-white ml-2">
              Rate: {attendanceRate}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Batch Mark:</span>
            <button
              onClick={() => setAllStatus("PRESENT")}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 font-bold hover:bg-emerald-100 text-[11px]"
            >
              All Present
            </button>
            <button
              onClick={() => setAllStatus("ABSENT")}
              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 font-bold hover:bg-rose-100 text-[11px]"
            >
              All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="overflow-x-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Student ID & Name</th>
              <th className="py-3 px-4 text-center">Status Action</th>
              <th className="py-3 px-4">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={3} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading student attendance sheet...</span>
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-12 text-center text-slate-400">
                  No students enrolled in this section.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.student_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold text-xs">
                        {r.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{r.full_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{r.roll_no}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(r.student_id, "PRESENT")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                          r.status === "PRESENT"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "text-slate-500 hover:text-emerald-500"
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(r.student_id, "ABSENT")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                          r.status === "ABSENT"
                            ? "bg-rose-500 text-white shadow-sm"
                            : "text-slate-500 hover:text-rose-500"
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(r.student_id, "LATE")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                          r.status === "LATE"
                            ? "bg-amber-500 text-white shadow-sm"
                            : "text-slate-500 hover:text-amber-500"
                        }`}
                      >
                        Late
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(r.student_id, "EXCUSED")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                          r.status === "EXCUSED"
                            ? "bg-indigo-500 text-white shadow-sm"
                            : "text-slate-500 hover:text-indigo-500"
                        }`}
                      >
                        Excused
                      </button>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="e.g. Medical leave slip provided..."
                      value={r.remarks || ""}
                      onChange={(e) => handleRemarksChange(r.student_id, e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
