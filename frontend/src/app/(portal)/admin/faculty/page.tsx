"use client";

import React, { useState, useEffect } from "react";
import { GraduationCap, Mail, Phone, BookOpen, Plus, X, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminFacultyPage() {
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFaculty();
  }, []);

  const loadFaculty = async () => {
    setLoading(true);
    try {
      const data = await api.faculty.list();
      setFacultyList(data || []);
    } catch (err) {
      console.error("Failed to load faculty", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-indigo-500" />
            Faculty Members & Teaching Staff
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Departmental professors, course instructors, and class academic advisors
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {facultyList.map((fac) => (
          <div
            key={fac.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                    {fac.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{fac.full_name}</h3>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{fac.designation}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{fac.faculty_id} • {fac.department_name}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {fac.qualification}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{fac.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{fac.phone || "+1 (555) 018-4491"}</span>
                </div>
                {fac.specialization && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Specialization: <b>{fac.specialization}</b></span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Assigned Classes:</span>
              <div className="flex gap-1.5">
                {fac.assigned_classes?.length > 0 ? (
                  fac.assigned_classes.map((cls: string) => (
                    <span key={cls} className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">
                      {cls}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 font-mono">CSE-4A</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
