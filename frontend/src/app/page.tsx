"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sparkles } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (user.role === "FACULTY") {
        router.push("/faculty/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-glow-primary animate-pulse mb-4">
        <Sparkles className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
        EduTrack AI
      </h2>
      <p className="text-xs text-slate-400 mt-1">Routing to your academic portal...</p>
    </div>
  );
}
