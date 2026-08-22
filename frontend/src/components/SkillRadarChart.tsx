"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SkillRadarChartProps {
  data: Array<{
    subject: string;
    student_score: number;
    class_average: number;
  }>;
  height?: number;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  data,
  height = 280,
}) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e2e8f0" strokeOpacity={0.5} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
          <Radar
            name="Your Performance"
            dataKey="student_score"
            stroke="#4f46e5"
            fill="#4f46e5"
            fillOpacity={0.5}
          />
          <Radar
            name="Class Benchmark"
            dataKey="class_average"
            stroke="#0ea5e9"
            fill="#0ea5e9"
            fillOpacity={0.2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#1e293b",
              borderRadius: "12px",
              color: "#f8fafc",
              fontSize: "12px",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
