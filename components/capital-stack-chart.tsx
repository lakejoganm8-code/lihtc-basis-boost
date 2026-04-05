"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  SourcesUsesSummary,
  useLabels,
  sourceLabels,
} from "@/lib/types";

const useColors: Record<string, string> = {
  land: "#6366F1",
  construction: "#8B5CF6",
  soft: "#A78BFA",
  developerFee: "#C4B5FD",
  financing: "#7C3AED",
  operatingReserve: "#5B21B6",
  replacementReserve: "#4C1D95",
  contingency: "#DDD6FE",
};

const sourceColors: Record<string, string> = {
  constructionLoan: "#06B6D4",
  permanentDebt: "#0891B2",
  lihtcEquity: "#14B8A6",
  landContribution: "#10B981",
  deferredDevFee: "#059669",
  stateSubsidy: "#047857",
  bonds: "#34D399",
  other: "#6EE7B7",
};

interface CapitalStackChartProps {
  summary: SourcesUsesSummary;
  uses: UseLineItem[];
  sources: SourceLineItem[];
}

interface UseLineItem {
  category: string;
  label: string;
  value: number;
}

interface SourceLineItem {
  category: string;
  label: string;
  value: number;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function CapitalStackChart({ summary, uses, sources }: CapitalStackChartProps) {
  const allItems = [...uses.filter((u) => u.value > 0), ...sources.filter((s) => s.value > 0)];
  const total = summary.totalUses + summary.totalSources;

  if (total === 0) return null;

  // Calculate percentages
  const data = allItems.map((item) => ({
    name: item.label,
    amount: item.value,
    pct: ((item.value / total) * 100).toFixed(1),
    type: "category" in item ? (item as any).category : "",
  }));

  // Get colors
  const getColor = (item: { category: string }) => {
    return useColors[item.category] || sourceColors[item.category] || "#94A3B8";
  };

  return (
    <div className="space-y-4">
      {/* Stacked bar chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={10} />
            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value) => [fmt(Number(value)), "Amount"]} />
            <Bar dataKey="amount" name="Amount">
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={getColor({ category: allItems[index]?.category || "" })} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stacked bar */}
      <div className="space-y-3">
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Uses Breakdown</div>
        <StackedBar items={uses} colorMap={useColors} />

        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-4">Sources Breakdown</div>
        <StackedBar items={sources} colorMap={sourceColors} />
      </div>

      {/* Gap summary */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500">Total Uses</div>
          <div className="text-lg font-mono font-bold text-gray-900">{fmt(summary.totalUses)}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500">Total Sources</div>
          <div className="text-lg font-mono font-bold text-gray-900">{fmt(summary.totalSources)}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500">Gap</div>
          <div className={`text-lg font-mono font-bold ${summary.gap > 0 ? "text-red-600" : summary.gap < 0 ? "text-emerald-600" : "text-gray-400"}`}>
            {summary.gap > 0 ? `−${fmt(summary.gap)}` : summary.gap < 0 ? `+${fmt(Math.abs(summary.gap))}` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StackedBarProps {
  items: Array<{ category: string; label: string; value: number }>;
  colorMap: Record<string, string>;
}

function StackedBar({ items, colorMap }: StackedBarProps) {
  const total = items.reduce((sum, i) => sum + i.value, 0);
  if (total === 0) return <div className="h-2 bg-gray-100 rounded-full" />;

  // Filter to items with value > 0
  const validItems = items.filter((i) => i.value > 0);

  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden">
        {validItems.map((item) => (
          <div
            key={item.category}
            style={{
              width: `${(item.value / total) * 100}%`,
              backgroundColor: colorMap[item.category],
            }}
            className="transition-all"
            title={`${item.label}: $${item.value.toLocaleString("en-US")}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {validItems.map((item) => (
          <div key={item.category} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: colorMap[item.category] }}
            />
            <span className="text-gray-600">{item.label}</span>
            <span className="font-mono text-gray-400">
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
