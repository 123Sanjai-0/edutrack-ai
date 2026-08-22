"use client";

import React, { useState, useEffect } from "react";
import { Grid, Layers } from "lucide-react";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { api } from "@/lib/api";

export default function AdminHeatmapPage() {
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeatmap();
  }, []);

  const loadHeatmap = async () => {
    setLoading(true);
    try {
      const data = await api.analytics.getHeatmap();
      setHeatmapData(data);
    } catch (err) {
      console.error("Failed to load heatmap", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !heatmapData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Grid className="w-7 h-7 text-indigo-500" />
          Cross-Subject Performance Heatmap
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Color-coded matrix analyzing individual student strengths and subject bottlenecks
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-300 mr-2">Color Scale:</span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-3 h-3 rounded-md bg-emerald-500"></span> 85%+ (Distinction)
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-3 h-3 rounded-md bg-emerald-200 dark:bg-emerald-900"></span> 70-84% (Good)
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-3 h-3 rounded-md bg-amber-200 dark:bg-amber-900"></span> 60-69% (Average)
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-3 h-3 rounded-md bg-orange-200 dark:bg-orange-900"></span> 50-59% (Weak)
        </span>
        <span className="flex items-center gap-1.5 font-bold text-rose-500">
          <span className="w-3 h-3 rounded-md bg-rose-500 animate-pulse"></span> &lt;50% (At Risk)
        </span>
      </div>

      {/* Heatmap Grid */}
      <HeatmapGrid
        subjects={heatmapData.subjects || []}
        students={heatmapData.students || []}
      />
    </div>
  );
}
