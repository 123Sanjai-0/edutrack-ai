"use client";

import React, { useState, useEffect } from "react";
import { Grid } from "lucide-react";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { api } from "@/lib/api";

export default function FacultyHeatmapPage() {
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeatmap();
  }, []);

  const loadHeatmap = async () => {
    setLoading(true);
    try {
      const data = await api.analytics.getHeatmap(1);
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
          Section CSE-4A Performance Heatmap
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Color matrix showing individual student test grades across curriculum subjects
        </p>
      </div>

      <HeatmapGrid
        subjects={heatmapData.subjects || []}
        students={heatmapData.students || []}
      />
    </div>
  );
}
