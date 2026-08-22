"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  X,
} from "lucide-react";
import { api } from "@/lib/api";

export default function FacultyMarksPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [marksMap, setMarksMap] = useState<Record<number, { marks: number; is_absent: boolean; remarks: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Exam Modal
  const [showNewExamModal, setShowNewExamModal] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamType, setNewExamType] = useState("MIDTERM");
  const [newExamMaxMarks, setNewExamMaxMarks] = useState(100);

  useEffect(() => {
    loadExamsAndStudents();
  }, []);

  const loadExamsAndStudents = async () => {
    setLoading(true);
    try {
      const examList = await api.marks.getExams();
      setExams(examList || []);
      
      const stuList = await api.students.list({ page_size: 50 });
      setStudents(stuList.items || []);

      if (examList && examList.length > 0) {
        setSelectedExamId(examList[0].id);
      }
    } catch (err) {
      console.error("Failed to load initial marks data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      loadExamResults(selectedExamId);
    }
  }, [selectedExamId, students]);

  const loadExamResults = async (examId: number) => {
    try {
      const data = await api.marks.getExamResults(examId);
      setResults(data || []);

      // Build marks map for all students
      const map: Record<number, any> = {};
      const resultMap = new Map(data.map((r: any) => [r.student_id, r]));

      students.forEach((s) => {
        const existing = resultMap.get(s.id);
        map[s.id] = {
          marks: existing ? existing.marks_obtained : 0,
          is_absent: existing ? existing.is_absent : false,
          remarks: existing ? existing.remarks || "" : "",
        };
      });
      setMarksMap(map);
    } catch (err) {
      console.error("Failed to load exam results", err);
    }
  };

  const handleScoreChange = (studentId: number, value: number) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: value,
      },
    }));
  };

  const handleSaveBulk = async () => {
    if (!selectedExamId) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      const marksPayload = Object.entries(marksMap).map(([studentId, data]) => ({
        student_id: Number(studentId),
        marks_obtained: Number(data.marks),
        is_absent: data.is_absent,
        remarks: data.remarks,
      }));

      await api.marks.saveBulkMarks({
        exam_id: selectedExamId,
        marks: marksPayload,
      });

      setStatusMsg({
        type: "success",
        text: `Marks successfully saved for ${marksPayload.length} students! Risk predictions auto-updated.`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to save marks",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExamId) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      await api.marks.uploadCsv(selectedExamId, file);
      setStatusMsg({
        type: "success",
        text: `CSV grades imported successfully from ${file.name}!`,
      });
      loadExamResults(selectedExamId);
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "CSV upload failed",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle) return;
    try {
      const newExam = await api.marks.createExam({
        title: newExamTitle,
        exam_type: newExamType,
        subject_id: 1, // DBMS
        class_section_id: 1, // CSE-4A
        max_marks: Number(newExamMaxMarks),
        weight_percentage: 20.0,
        exam_date: new Date().toISOString().split("T")[0],
      });
      setShowNewExamModal(false);
      setExams([newExam, ...exams]);
      setSelectedExamId(newExam.id);
      setStatusMsg({
        type: "success",
        text: `Assessment "${newExamTitle}" created successfully.`,
      });
    } catch (err: any) {
      alert(err.message || "Failed to create assessment");
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-indigo-500" />
            Class Gradebook & Mark Entry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Continuous evaluation, midterm assessments, and batch CSV grading
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-indigo-500" />
            <span>Upload Marks CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowNewExamModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Assessment
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

      {/* Assessment Selector Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {exams.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelectedExamId(ex.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedExamId === ex.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {ex.title} (Max: {ex.max_marks})
          </button>
        ))}
      </div>

      {/* Grade Entry Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedExam?.title || "Assessment Sheet"}
            </h2>
            <p className="text-xs text-slate-400">
              Subject: {selectedExam?.subject_name} • Weight: {selectedExam?.weight_percentage}% • Max Marks: {selectedExam?.max_marks}
            </p>
          </div>

          <button
            onClick={handleSaveBulk}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Gradebook"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Student ID & Name</th>
                <th className="py-3 px-4 text-center">Marks Obtained (Max: {selectedExam?.max_marks || 100})</th>
                <th className="py-3 px-4 text-center">Percentage</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {students.slice(0, 30).map((stu) => {
                const currentData = marksMap[stu.id] || { marks: 0, is_absent: false, remarks: "" };
                const maxMarks = selectedExam?.max_marks || 100;
                const pct = ((currentData.marks / maxMarks) * 100).toFixed(1);

                return (
                  <tr key={stu.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{stu.full_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{stu.student_id}</p>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max={maxMarks}
                        value={currentData.marks}
                        onChange={(e) => handleScoreChange(stu.id, Number(e.target.value))}
                        className="w-24 text-center font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-slate-900 dark:text-white">{pct}%</span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                          Number(pct) >= 75
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : Number(pct) >= 50
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 font-bold"
                        }`}
                      >
                        {Number(pct) >= 40 ? "Passed" : "Failed"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Optional feedback..."
                        value={currentData.remarks}
                        onChange={(e) =>
                          setMarksMap({
                            ...marksMap,
                            [stu.id]: { ...currentData, remarks: e.target.value },
                          })
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Exam Modal */}
      {showNewExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Assessment Event
              </h3>
              <button onClick={() => setShowNewExamModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assessment Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit Test 2 (Normalization & SQL)"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assessment Category
                </label>
                <select
                  value={newExamType}
                  onChange={(e) => setNewExamType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="INTERNAL_ASSESSMENT">Continuous Internal Test</option>
                  <option value="MIDTERM">Midterm Examination</option>
                  <option value="QUIZ">Concept Quiz</option>
                  <option value="FINAL">Semester Final Exam</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Maximum Marks
                </label>
                <input
                  type="number"
                  required
                  value={newExamMaxMarks}
                  onChange={(e) => setNewExamMaxMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewExamModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Publish Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
