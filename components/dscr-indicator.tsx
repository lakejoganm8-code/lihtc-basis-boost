"use client";

import { dscrStatus } from "@/lib/pro-forma";

interface DscrIndicatorProps {
  value: number;
  label?: string;
}

export function DscrIndicator({ value, label = "DSCR" }: DscrIndicatorProps) {
  const status = dscrStatus(value);
  const display = value === Infinity ? "∞" : value.toFixed(2);

  const statusConfig = {
    pass: {
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      label: "Pass",
      threshold: "≥ 1.25x",
    },
    warning: {
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      label: "Marginal",
      threshold: "1.0x – 1.25x",
    },
    fail: {
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      label: "Fail",
      threshold: "< 1.0x",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} p-3 text-center`}>
      <div className={`text-2xl font-mono font-bold ${config.color}`}>{display}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
      <div className={`text-xs font-medium ${config.color} mt-1`}>
        {config.label} ({config.threshold})
      </div>
    </div>
  );
}
