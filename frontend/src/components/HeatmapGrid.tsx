"use client";

import React from "react";

interface HeatmapGridProps {
  subjects: Array<{ code: string; name: string }>;
  students: Array<{
    student_id: number;
    roll_no: string;
    name: string;
    subjects: Record<
      string,
      {
        score: number;
        status: string;
        attendance: number;
      }
    >;
  }>;
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({
  subjects,
  students,
}) => {
  const getCellColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500 text-white";
    if (score >= 70) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
    if (score >= 60) return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
    if (score >= 50) return "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300";
    return "bg-rose-500 text-white font-bold animate-pulse";
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
          <tr>
            <th className="py-3 px-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">
              Student
            </th>
            {subjects.map((sub) => (
              <th key={sub.code} className="py-3 px-4 text-center">
                <span title={sub.name} className="cursor-help">
                  {sub.code}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {students.map((stu) => (
            <tr
              key={stu.student_id}
              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 z-10 whitespace-nowrap">
                <p className="font-bold">{stu.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">{stu.roll_no}</p>
              </td>
              {subjects.map((sub) => {
                const perf = stu.subjects[sub.code] || { score: 70, status: "GOOD", attendance: 85 };
                return (
                  <td key={sub.code} className="py-2.5 px-3 text-center">
                    <div
                      title={`${sub.name}: ${perf.score}% (Att: ${perf.attendance}%)`}
                      className={`inline-flex flex-col items-center justify-center w-14 py-1.5 rounded-lg text-xs font-semibold ${getCellColor(
                        perf.score
                      )} shadow-sm transition-transform hover:scale-105 cursor-default`}
                    >
                      <span>{perf.score.toFixed(0)}%</span>
                      <span className="text-[9px] opacity-80 font-normal">
                        {perf.attendance.toFixed(0)}% att
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
