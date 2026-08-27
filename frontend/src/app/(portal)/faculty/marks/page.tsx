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
  Edit2,
  Trash2,
  Download,
  Filter,
  Users,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";

export default function FacultyMarksPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(1);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(1);

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marksMap, setMarksMap] = useState<Record<number, { marks: number; is_absent: boolean; remarks: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [showNewExamModal, setShowNewExamModal] = useState(false);
  const [showEditExamModal, setShowEditExamModal] = useState(false);

  // Exam Form
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamType, setNewExamType] = useState("MIDTERM");
  const [newExamMaxMarks, setNewExamMaxMarks] = useState(100);
  const [newExamWeight, setNewExamWeight] = useState(20);
  const [newExamDate, setNewExamDate] = useState(new Date().toISOString().split("T")[0]);

  // Edit Form
  const [editExamId, setEditExamId] = useState<number | null>(null);
  const [editExamTitle, setEditExamTitle] = useState("");
  const [editExamMaxMarks, setEditExamMaxMarks] = useState(100);
  const [editExamWeight, setEditExamWeight] = useState(20);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [classList, subjectList] = await Promise.all([
        api.academics.getClasses(),
        api.academics.getSubjects(),
      ]);
      setClasses(classList || []);
      setSubjects(subjectList || []);

      const defaultClass = classList?.[0]?.id || 1;
      const defaultSub = subjectList?.[0]?.id || 1;
      setSelectedClassId(defaultClass);
      setSelectedSubjectId(defaultSub);

      await loadExamsAndStudents(defaultClass, defaultSub);
    } catch (err) {
      console.error("Failed to load initial marks data", err);
    } finally {
      setLoading(false);
    }
  };

  const loadExamsAndStudents = async (classId: number, subjectId: number) => {
    try {
      const [examList, stuList] = await Promise.all([
        api.marks.getExams(subjectId, classId),
        api.students.list({ class_section_id: classId, page_size: 100 }),
      ]);
      setExams(examList || []);
      const stuItems = stuList.items || [];
      setStudents(stuItems);

      if (examList && examList.length > 0) {
        setSelectedExamId(examList[0].id);
      } else {
        setSelectedExamId(null);
        setMarksMap({});
      }
    } catch (err) {
      console.error("Failed to load exams", err);
    }
  };

  const handleClassSubjectChange = async (newClassId: number, newSubjectId: number) => {
    setSelectedClassId(newClassId);
    setSelectedSubjectId(newSubjectId);
    setLoading(true);
    await loadExamsAndStudents(newClassId, newSubjectId);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedExamId) {
      loadExamResults(selectedExamId);
    }
  }, [selectedExamId, students]);

  const loadExamResults = async (examId: number) => {
    try {
      const data = await api.marks.getExamResults(examId);
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
    const selectedExam = exams.find((e) => e.id === selectedExamId);
    const maxVal = selectedExam ? selectedExam.max_marks : 100;
    const clamped = Math.max(0, Math.min(maxVal, value));

    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: clamped,
      },
    }));
  };

  const handleAbsentToggle = (studentId: number) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        is_absent: !prev[studentId]?.is_absent,
      },
    }));
  };

  const handleRemarksChange = (studentId: number, remarks: string) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleBatchFill = (mode: "PASS" | "MAX" | "ZERO") => {
    const selectedExam = exams.find((e) => e.id === selectedExamId);
    const max = selectedExam ? selectedExam.max_marks : 100;
    const pass = Math.round(max * 0.4);

    const map: Record<number, any> = { ...marksMap };
    students.forEach((s) => {
      let targetMark = 0;
      if (mode === "MAX") targetMark = max;
      else if (mode === "PASS") targetMark = pass;
      map[s.id] = {
        ...(map[s.id] || {}),
        marks: targetMark,
        is_absent: false,
      };
    });
    setMarksMap(map);
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
        text: `Marks successfully saved for ${marksPayload.length} students! Risk predictions and CGPA recalculated in real time.`,
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
      const res = await api.marks.uploadCsv(selectedExamId, file);
      setStatusMsg({
        type: "success",
        text: res.message || `CSV grades imported successfully from ${file.name}!`,
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
        subject_id: Number(selectedSubjectId),
        class_section_id: Number(selectedClassId),
        max_marks: Number(newExamMaxMarks),
        weight_percentage: Number(newExamWeight),
        exam_date: newExamDate,
        is_published: true,
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

  const handleOpenEditExam = (exam: any) => {
    setEditExamId(exam.id);
    setEditExamTitle(exam.title);
    setEditExamMaxMarks(exam.max_marks);
    setEditExamWeight(exam.weight_percentage);
    setShowEditExamModal(true);
  };

  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExamId) return;
    try {
      const updated = await api.marks.updateExam(editExamId, {
        title: editExamTitle,
        max_marks: Number(editExamMaxMarks),
        weight_percentage: Number(editExamWeight),
      });
      setShowEditExamModal(false);
      setExams(exams.map((ex) => (ex.id === editExamId ? updated : ex)));
      setStatusMsg({
        type: "success",
        text: `Assessment "${editExamTitle}" updated.`,
      });
    } catch (err: any) {
      alert(err.message || "Update failed");
    }
  };

  const handleDeleteExam = async (examId: number, examTitle: string) => {
    if (confirm(`Are you sure you want to delete assessment "${examTitle}" and all recorded grades?`)) {
      try {
        await api.marks.deleteExam(examId);
        const rem = exams.filter((e) => e.id !== examId);
        setExams(rem);
        setSelectedExamId(rem[0]?.id || null);
        setStatusMsg({
          type: "success",
          text: `Assessment "${examTitle}" deleted.`,
        });
      } catch (err: any) {
        alert(err.message || "Delete failed");
      }
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  // Live Stats
  const marksValues = Object.values(marksMap)
    .filter((m) => !m.is_absent)
    .map((m) => m.marks);
  const avgMarks = marksValues.length > 0 ? (marksValues.reduce((a, b) => a + b, 0) / marksValues.length).toFixed(1) : "0.0";
  const passMarks = selectedExam ? selectedExam.max_marks * 0.4 : 40;
  const passCount = marksValues.filter((m) => m >= passMarks).length;
  const passRate = marksValues.length > 0 ? Math.round((passCount / marksValues.length) * 100) : 0;
  const highestMark = marksValues.length > 0 ? Math.max(...marksValues) : 0;
  const lowestMark = marksValues.length > 0 ? Math.min(...marksValues) : 0;

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

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedExamId && (
            <a
              href={api.marks.getExamTemplateUrl(selectedExamId)}
              download
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Template CSV
            </a>
          )}

          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-indigo-500" />
            <span>Upload Grades CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              setNewExamTitle("");
              setNewExamType("MIDTERM");
              setNewExamMaxMarks(100);
              setNewExamWeight(20);
              setShowNewExamModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Assessment
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

      {/* Class, Subject, and Assessment Selectors */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Class Section:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassSubjectChange(Number(e.target.value), selectedSubjectId)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-semibold"
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
              Select Subject:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => handleClassSubjectChange(selectedClassId, Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-semibold"
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
              Active Assessment:
            </label>
            <div className="flex gap-2">
              <select
                value={selectedExamId || ""}
                onChange={(e) => setSelectedExamId(Number(e.target.value))}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-semibold"
              >
                {exams.length === 0 ? (
                  <option value="">No assessments created yet</option>
                ) : (
                  exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.exam_type}) • Max {ex.max_marks}
                    </option>
                  ))
                )}
              </select>
              {selectedExam && (
                <>
                  <button
                    onClick={() => handleOpenEditExam(selectedExam)}
                    title="Edit Assessment"
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExam(selectedExam.id, selectedExam.title)}
                    title="Delete Assessment"
                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Class Exam Metrics */}
        {selectedExam && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Average</span>
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{avgMarks} / {selectedExam.max_marks}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Pass Rate</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{passRate}% ({passCount} Passed)</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Highest Score</span>
              <span className="text-base font-black text-slate-900 dark:text-white">{highestMark}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lowest Score</span>
              <span className="text-base font-black text-rose-500">{lowestMark}</span>
            </div>
          </div>
        )}
      </div>

      {/* Grade Entry Table */}
      {selectedExam ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Gradebook Matrix ({students.length} Enrolled Students)
              </span>
            </div>

            {/* Quick Fill Shortcuts */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Quick Fill:</span>
              <button
                onClick={() => handleBatchFill("MAX")}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-50 text-[11px]"
              >
                All Max ({selectedExam.max_marks})
              </button>
              <button
                onClick={() => handleBatchFill("PASS")}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-50 text-[11px]"
              >
                All Pass ({Math.round(selectedExam.max_marks * 0.4)})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student ID & Name</th>
                  <th className="py-3 px-4 text-center">Marks Obtained (Max {selectedExam.max_marks})</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                  <th className="py-3 px-4">Instructor Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {students.map((stu) => {
                  const entry = marksMap[stu.id] || { marks: 0, is_absent: false, remarks: "" };
                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold text-xs">
                            {stu.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{stu.full_name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{stu.student_id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max={selectedExam.max_marks}
                          disabled={entry.is_absent}
                          value={entry.marks}
                          onChange={(e) => handleScoreChange(stu.id, Number(e.target.value))}
                          className="w-24 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 font-mono font-bold text-sm text-slate-900 dark:text-white disabled:opacity-40"
                        />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleAbsentToggle(stu.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            entry.is_absent
                              ? "bg-rose-500 text-white shadow-sm"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50"
                          }`}
                        >
                          {entry.is_absent ? "Marked Absent" : "Present"}
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="e.g. Needs revision on graph trees..."
                          value={entry.remarks}
                          onChange={(e) => handleRemarksChange(stu.id, e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleSaveBulk}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Updating Marks & Calculating Risks..." : "Save Assessment Marks to Database"}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          No assessments found for this subject and class. Click "New Assessment" to create your first exam.
        </div>
      )}

      {/* New Assessment Modal */}
      {showNewExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-500" />
                Create New Assessment
              </h3>
              <button onClick={() => setShowNewExamModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assessment Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Assessment II"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assessment Type
                  </label>
                  <select
                    value={newExamType}
                    onChange={(e) => setNewExamType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="INTERNAL">Internal Test</option>
                    <option value="MIDTERM">Midterm Exam</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="QUIZ">Quiz / Unit Test</option>
                    <option value="FINAL">Final Semester Exam</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={newExamMaxMarks}
                    onChange={(e) => setNewExamMaxMarks(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weightage (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newExamWeight}
                    onChange={(e) => setNewExamWeight(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
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
                  Create Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assessment Modal */}
      {showEditExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-500" />
                Edit Assessment Parameters
              </h3>
              <button onClick={() => setShowEditExamModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateExam} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assessment Title
                </label>
                <input
                  type="text"
                  required
                  value={editExamTitle}
                  onChange={(e) => setEditExamTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={editExamMaxMarks}
                    onChange={(e) => setEditExamMaxMarks(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weightage (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editExamWeight}
                    onChange={(e) => setEditExamWeight(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditExamModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
