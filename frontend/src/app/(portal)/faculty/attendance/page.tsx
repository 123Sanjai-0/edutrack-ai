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
} from "lucide-react";
import { api } from "@/lib/api";

export default function FacultyAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [period, setPeriod] = useState(1);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadAttendanceSheet();
  }, [selectedDate, period]);

  const loadAttendanceSheet = async () => {
    setLoading(true);
    try {
      // Load Section CSE-4A (id=1), Subject DBMS (id=1)
      const data = await api.attendance.getSheet(1, 1, selectedDate, period);
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

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await api.attendance.saveBulk({
        class_section_id: 1,
        subject_id: 1,
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
        text: `Attendance saved successfully for ${records.length} students on ${selectedDate} (Period ${period})!`,
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
            Section: <b>CSE-4A</b> • Subject: <b>Database Management Systems (CS401)</b>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAllStatus("PRESENT")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 shadow-sm transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            Mark All Present
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? "Submitting..." : "Save Attendance"}
          </button>
        </div>
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

      {/* Date & Period Controls Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Lecture Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Class Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="1">Period 1 (09:00 AM - 10:00 AM)</option>
              <option value="2">Period 2 (10:00 AM - 11:00 AM)</option>
              <option value="3">Period 3 (11:15 AM - 12:15 PM)</option>
              <option value="4">Period 4 (01:30 PM - 02:30 PM)</option>
            </select>
          </div>
        </div>

        {/* Live Attendance Stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-400 font-bold">
            Present: {presentCount}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-400 font-bold">
            Absent: {absentCount}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-indigo-700 dark:text-indigo-400 font-bold">
            Attendance Rate: {records.length > 0 ? ((presentCount / records.length) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {/* Attendance Grid Table */}
      <div className="overflow-x-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Student ID & Name</th>
              <th className="py-3 px-4 text-center">Attendance Status</th>
              <th className="py-3 px-4">Remarks / Excuse Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {records.map((stu) => (
              <tr key={stu.student_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900 dark:text-white">{stu.full_name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{stu.roll_no}</p>
                </td>

                <td className="py-3 px-4 text-center">
                  <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 gap-1">
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(stu.student_id, "PRESENT")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        stu.status === "PRESENT"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(stu.student_id, "ABSENT")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        stu.status === "ABSENT"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(stu.student_id, "LATE")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        stu.status === "LATE"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Late
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(stu.student_id, "EXCUSED")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        stu.status === "EXCUSED"
                          ? "bg-sky-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Excused
                    </button>
                  </div>
                </td>

                <td className="py-3 px-4">
                  <input
                    type="text"
                    placeholder="Optional medical / leave reason..."
                    value={stu.remarks || ""}
                    onChange={(e) =>
                      setRecords(
                        records.map((r) =>
                          r.student_id === stu.student_id ? { ...r, remarks: e.target.value } : r
                        )
                      )
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
