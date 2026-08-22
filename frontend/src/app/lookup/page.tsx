"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  Mail,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  BookOpen,
  TrendingUp,
  ShieldAlert,
  Brain,
  Target,
  BarChart3,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  User,
  CalendarDays,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  ArrowLeft,
  Zap,
  Activity,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Cell,
} from "recharts";

/* ─── Risk Badge (inline for standalone page) ─── */
function RiskBadge({ level, score }: { level: string; score?: number }) {
  const normLevel = (level || "LOW").toUpperCase();
  const cfg: Record<string, { bg: string; icon: typeof CheckCircle2; label: string }> = {
    LOW: { bg: "bg-emerald-950/40 text-emerald-400 border-emerald-800/60", icon: CheckCircle2, label: "Low Risk" },
    MEDIUM: { bg: "bg-amber-950/40 text-amber-400 border-amber-800/60", icon: Info, label: "Medium Risk" },
    HIGH: { bg: "bg-orange-950/40 text-orange-400 border-orange-800/60", icon: AlertTriangle, label: "High Risk" },
    CRITICAL: { bg: "bg-rose-950/50 text-rose-400 border-rose-800/80 animate-pulse", icon: AlertOctagon, label: "Critical" },
  };
  const c = cfg[normLevel] || cfg["LOW"];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${c.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {c.label}
      {score !== undefined && <span className="opacity-70 font-normal">({score.toFixed(0)})</span>}
    </span>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  const colors: Record<string, string> = {
    EXCELLENT: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    GOOD: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    AVERAGE: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    WEAK: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    AT_RISK: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colors[s] || colors["AVERAGE"]}`}>
      {status}
    </span>
  );
}

/* ─── Grade Color ─── */
function gradeColor(grade: string) {
  if (grade === "A+" || grade === "A") return "text-emerald-400";
  if (grade === "B+" || grade === "B") return "text-sky-400";
  if (grade === "C") return "text-amber-400";
  if (grade === "D") return "text-orange-400";
  return "text-rose-400";
}

/* ─── Circular Progress ─── */
function CircularProgress({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - value) / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-800/60" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
            className={color}
            style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-extrabold text-white">{value.toFixed(1)}%</span>
        </div>
      </div>
      <span className="mt-2 text-xs font-semibold text-slate-400">{label}</span>
    </div>
  );
}

/* ─── Main Page ─── */
export default function LookupPage() {
  const [email, setEmail] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }
    setError("");
    setData(null);
    setLoading(true);
    try {
      const result = await api.lookup.studentByEmail(email.trim());
      setData(result);
    } catch (err: any) {
      setError(err.message || "Student not found");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setEmail("");
    setError("");
  };

  /* ─── Color helpers ─── */
  const barColors = ["#6366f1", "#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981"];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/login" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-glow-primary">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-white tracking-tight">
                EduTrack <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">AI</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-500 -mt-0.5">Public Student Lookup</span>
            </div>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Section */}
        {!data && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center mb-6 shadow-glow-primary animate-pulse-subtle">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white text-center tracking-tight mb-3">
              Student <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-purple-400 bg-clip-text text-transparent">Scorecard</span> Lookup
            </h1>
            <p className="text-sm text-slate-400 text-center max-w-lg mb-10">
              Enter a student's registered email to instantly view their complete academic scorecard — marks, attendance, AI risk assessment, and predictive analytics.
            </p>

            <form onSubmit={handleLookup} className="w-full max-w-xl">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center bg-slate-900/90 border border-slate-700/60 rounded-2xl shadow-2xl focus-within:border-indigo-500/60 transition-all duration-300">
                  <Mail className="w-5 h-5 text-slate-500 ml-5 flex-shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter student email (e.g. john.doe@edutrack.ai)"
                    className="flex-1 bg-transparent border-none py-4 px-4 text-sm text-white placeholder-slate-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="mr-2 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Search
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div className="mt-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium max-w-xl w-full">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Helper chips */}
            <div className="mt-8 flex flex-wrap items-center gap-2 justify-center">
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mr-2">Try:</span>
              {["john.doe@edutrack.ai", "aarav.williams4@edutrack.ai", "aditi.brown5@edutrack.ai"].map((demo) => (
                <button
                  key={demo}
                  onClick={() => setEmail(demo)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-[11px] text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 transition-all font-mono"
                >
                  {demo}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Results Scorecard ─── */}
        {data && (
          <div className="space-y-6 animate-in">
            {/* Back / Search Again */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Search Another Student
            </button>

            {/* ── Student Profile Header ── */}
            <div className="bg-slate-900/80 border border-slate-800/60 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-glow-primary flex-shrink-0">
                  {data.student.avatar_url ? (
                    <img src={data.student.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                  ) : (
                    data.student.full_name?.charAt(0) || "S"
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">{data.student.full_name}</h2>
                    <RiskBadge level={data.risk_level} score={data.risk_score} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {data.student.email}</span>
                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {data.student.student_id}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {data.student.department_code} — Sem {data.student.semester_number}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Admitted {data.student.admission_year}</span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-500">
                    {data.student.course_name} · {data.student.department_name} · Section {data.student.class_section_name}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Key Metrics Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Overall Score", value: `${data.overall_percentage}%`, icon: BarChart3, color: "from-indigo-600 to-indigo-500", sub: `CGPA: ${data.cgpa}` },
                { label: "Attendance", value: `${data.attendance_percentage}%`, icon: Clock, color: data.attendance_percentage >= 75 ? "from-emerald-600 to-emerald-500" : "from-rose-600 to-rose-500", sub: data.attendance_percentage >= 75 ? "Above minimum" : "Below 75% threshold" },
                { label: "AI Predicted", value: `${data.predicted_final_score?.toFixed(1)}%`, icon: Brain, color: "from-purple-600 to-purple-500", sub: `Grade: ${data.predicted_grade} (${(data.prediction_confidence * 100).toFixed(0)}% conf.)` },
                { label: "Risk Score", value: data.risk_score.toFixed(0), icon: ShieldAlert, color: data.risk_score <= 30 ? "from-emerald-600 to-emerald-500" : data.risk_score <= 60 ? "from-amber-600 to-amber-500" : "from-rose-600 to-rose-500", sub: data.risk_level },
              ].map((m, i) => (
                <div key={i} className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-xl group hover:border-slate-700/80 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{m.label}</span>
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${m.color} flex items-center justify-center shadow-md`}>
                      <m.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-white tracking-tight">{m.value}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{m.sub}</div>
                </div>
              ))}
            </div>

            {/* ── Circular Progress + AI Factors ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Circular Gauges */}
              <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Performance Overview
                </h3>
                <div className="flex items-center justify-around">
                  <CircularProgress value={data.overall_percentage} label="Score" color="text-indigo-500" />
                  <CircularProgress value={data.attendance_percentage} label="Attendance" color={data.attendance_percentage >= 75 ? "text-emerald-500" : "text-rose-500"} />
                  <CircularProgress value={data.predicted_final_score || 0} label="AI Predicted" color="text-purple-500" />
                </div>
              </div>

              {/* AI Factors */}
              <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  AI Analysis Factors
                </h3>
                <div className="space-y-3">
                  {data.positive_factors?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5 block">✦ Positive</span>
                      <div className="space-y-1">
                        {data.positive_factors.map((f: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.negative_factors?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1.5 block">✦ Areas of Concern</span>
                      <div className="space-y-1">
                        {data.negative_factors.map((f: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-rose-500/5 border border-rose-500/10 rounded-lg px-3 py-1.5">
                            <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.risk_reasons?.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1.5 block">✦ Risk Reasons</span>
                      <div className="space-y-1">
                        {data.risk_reasons.map((r: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-1.5">
                            <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Subject Scores Bar Chart */}
              <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  Subject-wise Scores
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.subject_performances} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="subject_code" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "#334155" }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "#334155" }} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, fontSize: 11 }}
                      labelStyle={{ color: "#e2e8f0", fontWeight: 700 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="total_weighted_score" name="Your Score" radius={[6, 6, 0, 0]}>
                      {data.subject_performances.map((_: any, idx: number) => (
                        <Cell key={idx} fill={barColors[idx % barColors.length]} />
                      ))}
                    </Bar>
                    <Bar dataKey="class_average" name="Class Average" fill="#475569" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Radar Chart */}
              <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Performance Radar
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={data.radar_data}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
                    <Radar name="You" dataKey="student_score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                    <Radar name="Class Avg" dataKey="class_average" stroke="#475569" fill="#475569" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 4" />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Performance Trends ── */}
            <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Performance Trends Over Assessments
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.performance_trends} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="assessment" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "#334155" }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "#334155" }} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="score" name="Your Score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1" }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="class_average" name="Class Avg" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3, fill: "#475569" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ── Subject Breakdown Table ── */}
            <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                Detailed Subject Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {["Subject", "Credits", "Attendance", "Internal", "Assignment", "Midterm", "Weighted Score", "Grade", "Status"].map((h) => (
                        <th key={h} className="text-left py-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.subject_performances.map((sp: any, i: number) => (
                      <tr
                        key={sp.subject_id}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{sp.subject_code}</div>
                          <div className="text-[10px] text-slate-500">{sp.subject_name}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono">{sp.credits}</td>
                        <td className="py-3 px-3">
                          <span className={`font-bold ${sp.attendance_pct >= 75 ? "text-emerald-400" : "text-rose-400"}`}>
                            {sp.attendance_pct}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono">{sp.internal_score}%</td>
                        <td className="py-3 px-3 text-slate-300 font-mono">{sp.assignment_score}%</td>
                        <td className="py-3 px-3 text-slate-300 font-mono">{sp.midterm_score}%</td>
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-white">{sp.total_weighted_score}%</span>
                          <span className="text-[10px] text-slate-500 ml-1">(avg {sp.class_average}%)</span>
                        </td>
                        <td className={`py-3 px-3 font-extrabold text-lg ${gradeColor(sp.grade)}`}>{sp.grade}</td>
                        <td className="py-3 px-3"><StatusBadge status={sp.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Weak Subjects Warning ── */}
            {data.weak_subjects?.length > 0 && (
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Weak Subjects Requiring Attention</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.weak_subjects.map((s: string) => (
                    <span key={s} className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center py-8 border-t border-slate-800/60">
              <p className="text-[11px] text-slate-500">
                Scorecard generated by <span className="font-bold text-indigo-400">EduTrack AI</span> · Data reflects latest assessment records
              </p>
              <p className="text-[10px] text-slate-600 mt-1">
                AI predictions are based on Random Forest ML models and are for advisory purposes only.
              </p>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: animate-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
