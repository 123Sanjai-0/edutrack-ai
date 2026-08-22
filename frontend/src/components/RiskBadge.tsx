import React from "react";
import { AlertTriangle, CheckCircle2, AlertOctagon, Info } from "lucide-react";

interface RiskBadgeProps {
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  score?: number;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showIcon = true,
  size = "md",
}) => {
  const normLevel = (level || "LOW").toUpperCase();

  const config = {
    LOW: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60",
      glow: "shadow-sm",
      icon: CheckCircle2,
      label: "Low Risk",
    },
    MEDIUM: {
      bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
      glow: "shadow-sm",
      icon: Info,
      label: "Medium Risk",
    },
    HIGH: {
      bg: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/60",
      glow: "shadow-glow-danger",
      icon: AlertTriangle,
      label: "High Risk",
    },
    CRITICAL: {
      bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/80 animate-pulse",
      glow: "shadow-glow-danger",
      icon: AlertOctagon,
      label: "Critical Risk",
    },
  }[normLevel] || {
    bg: "bg-slate-50 text-slate-700 border-slate-200",
    glow: "",
    icon: Info,
    label: normLevel,
  };

  const IconComponent = config.icon;
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3.5 py-1.5 text-sm font-bold",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.glow} ${sizeClasses} transition-all duration-200`}
    >
      {showIcon && <IconComponent className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="opacity-75 font-normal ml-0.5">({score.toFixed(0)})</span>
      )}
    </span>
  );
};
