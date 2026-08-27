"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Shield,
  GraduationCap,
  UserCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, switchDemoRole } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please provide username/email and password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      // Determine where to route
      const stored = localStorage.getItem("edutrack_user");
      if (stored && stored !== "undefined" && stored !== "null") {
        try {
          const u = JSON.parse(stored);
          if (u && u.role === "ADMIN") router.push("/admin/dashboard");
          else if (u && u.role === "FACULTY") router.push("/faculty/dashboard");
          else router.push("/student/dashboard");
        } catch {
          router.push("/student/dashboard");
        }
      } else {
        router.push("/student/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (role: "ADMIN" | "FACULTY" | "STUDENT") => {
    switchDemoRole(role);
  };

  const fillCredentials = (user: string, pass: string) => {
    setIdentifier(user);
    setPassword(pass);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-glow-primary mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          EduTrack <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">AI</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          Academic Performance Monitoring & Early Warning Predictive Intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg z-10">
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          {/* Quick Demo Selector */}
          <div className="mb-6 pb-6 border-b border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4" />
              1-Click Demo Personas (Instant Login)
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoClick("ADMIN")}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/50 text-slate-200 hover:text-indigo-300 transition-all duration-200 group text-center cursor-pointer"
              >
                <Shield className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold">Dean / Admin</span>
                <span className="text-[10px] text-slate-400">Institutional</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick("FACULTY")}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/80 hover:bg-sky-600/20 border border-slate-700/60 hover:border-sky-500/50 text-slate-200 hover:text-sky-300 transition-all duration-200 group text-center cursor-pointer"
              >
                <GraduationCap className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold">Faculty Head</span>
                <span className="text-[10px] text-slate-400">Class Marks</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick("STUDENT")}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/80 hover:bg-emerald-600/20 border border-slate-700/60 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 transition-all duration-200 group text-center cursor-pointer"
              >
                <UserCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold">Student</span>
                <span className="text-[10px] text-slate-400">AI Scorecard</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Standard Credentials Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username or Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@edutrack.ai or admin"
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Authenticating..." : "Sign In to Portal"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Cheat-Sheet */}
          <div className="mt-5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-slate-300">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Demo Login Accounts (Click to Autofill):</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div
                onClick={() => fillCredentials("admin", "Admin@123")}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors border border-transparent hover:border-slate-700/50"
              >
                <span className="text-slate-300 font-medium">👑 Admin / Dean:</span>
                <span className="font-mono text-indigo-300">admin <span className="text-slate-500">/</span> Admin@123</span>
              </div>
              <div
                onClick={() => fillCredentials("profsmith", "Faculty@123")}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors border border-transparent hover:border-slate-700/50"
              >
                <span className="text-slate-300 font-medium">🎓 Faculty HOD:</span>
                <span className="font-mono text-sky-300">profsmith <span className="text-slate-500">/</span> Faculty@123</span>
              </div>
              <div
                onClick={() => fillCredentials("johndoe", "Student@123")}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors border border-transparent hover:border-slate-700/50"
              >
                <span className="text-slate-300 font-medium">👤 Student:</span>
                <span className="font-mono text-emerald-300">johndoe <span className="text-slate-500">/</span> Student@123</span>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-5 pt-5 border-t border-slate-800/80 grid grid-cols-2 gap-2.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Random Forest ML Pipeline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Explainable AI Risk Engine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Configurable Weight Scoring</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Role-Based Permissions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
