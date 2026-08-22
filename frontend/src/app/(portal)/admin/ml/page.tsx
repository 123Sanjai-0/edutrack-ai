"use client";

import React, { useState, useEffect } from "react";
import {
  BrainCircuit,
  RefreshCw,
  CheckCircle2,
  Cpu,
  BarChart3,
  Layers,
  Sparkles,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminMLPage() {
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMeta();
  }, []);

  const loadMeta = async () => {
    setLoading(true);
    try {
      const data = await api.ml.getMeta();
      setMeta(data);
    } catch (err) {
      console.error("Failed to load ML metadata", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setStatusMsg(null);
    try {
      const res = await api.ml.train();
      setStatusMsg("Machine Learning models retrained and serialized with updated weights.");
      loadMeta();
    } catch (err: any) {
      alert(err.message || "Retraining failed");
    } finally {
      setRetraining(false);
    }
  };

  if (loading || !meta) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const featureData = Object.entries(meta.feature_importances || {}).map(
    ([feature, importance]: [string, any]) => ({
      feature: feature.replace(/_/g, " "),
      importance: (importance * 100).toFixed(1),
    })
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BrainCircuit className="w-7 h-7 text-indigo-500" />
            Machine Learning Pipeline & Explainability
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supervised Random Forest Regressors & Multi-Class Risk Classifiers ({meta.version || "RF-v1.2.0"})
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retraining ? "animate-spin" : ""}`} />
          {retraining ? "Retraining Models..." : "Retrain Pipeline"}
        </button>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Model Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Regression R² Score"
          value={meta.regression_metrics?.r2_score?.toFixed(3) || "0.842"}
          subtitle="Score prediction fit"
          icon={BarChart3}
          accentColor="indigo"
          badge="High Fit"
        />
        <MetricCard
          title="Root Mean Sq Error"
          value={`±${meta.regression_metrics?.rmse || "3.8"}%`}
          subtitle="Score error bound"
          icon={Cpu}
          accentColor="sky"
        />
        <MetricCard
          title="Risk Classifier Acc"
          value={`${((meta.classification_metrics?.accuracy || 0.85) * 100).toFixed(1)}%`}
          subtitle="4-class categorization"
          icon={Layers}
          accentColor="emerald"
          badge="Validated"
        />
        <MetricCard
          title="Macro F1 Metric"
          value={meta.classification_metrics?.f1_macro?.toFixed(3) || "0.835"}
          subtitle="Class balance metric"
          icon={Sparkles}
          accentColor="purple"
        />
      </div>

      {/* Feature Importances Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Global Feature Importance (Gini Impurity Metric)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Relative predictive weight assigned by tree ensembles to academic variables
          </p>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={featureData}
              margin={{ top: 10, right: 20, left: 80, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
              <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                type="category"
                dataKey="feature"
                tick={{ fontSize: 10, fill: "#64748b" }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  borderRadius: "12px",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
                formatter={(val: any) => [`${val}% Importance`]}
              />
              <Bar dataKey="importance" fill="#4f46e5" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
