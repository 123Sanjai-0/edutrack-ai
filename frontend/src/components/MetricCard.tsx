import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "purple";
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = "indigo",
  badge,
}) => {
  const colorMap = {
    indigo: "from-indigo-500/10 to-indigo-500/0 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40",
    emerald: "from-emerald-500/10 to-emerald-500/0 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
    amber: "from-amber-500/10 to-amber-500/0 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
    rose: "from-rose-500/10 to-rose-500/0 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40",
    sky: "from-sky-500/10 to-sky-500/0 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40",
    purple: "from-purple-500/10 to-purple-500/0 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {value}
            </span>
            {badge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`p-3 rounded-xl ${colorMap[accentColor]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5 text-xs font-medium">
          {trend.isPositive ? (
            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              {trend.value}
            </span>
          ) : (
            <span className="flex items-center text-rose-600 dark:text-rose-400 font-semibold">
              <TrendingDown className="w-3.5 h-3.5 mr-1" />
              {trend.value}
            </span>
          )}
          <span className="text-slate-400 dark:text-slate-500">vs last semester</span>
        </div>
      )}
    </div>
  );
};
