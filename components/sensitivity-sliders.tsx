"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { TornadoBar, BreakevenResult } from "@/lib/types";
import { calculateTornadoBars, calculateBreakeven } from "@/lib/sensitivity";
import { DscrIndicator } from "@/components/dscr-indicator";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const fmtPct = (n: number) => n.toFixed(1) + "%";

export function SensitivitySliders() {
  const [tornadoData, setTornadoData] = useState<TornadoBar[]>([]);
  const [breakeven, setBreakeven] = useState<BreakevenResult | null>(null);
  const [showTornado, setShowTornado] = useState(false);
  const [showBreakeven, setShowBreakeven] = useState(false);

  function runTornado() {
    setTornadoData(calculateTornadoBars());
    setShowTornado(true);
  }

  function runBreakeven() {
    const result = calculateBreakeven();
    setBreakeven(result);
    setShowBreakeven(true);
  }

  return (
    <div className="space-y-6">
      {/* Sensitivity analysis buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={runTornado}
          className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition text-center"
        >
          <div className="text-sm font-semibold text-purple-700">Tornado Analysis</div>
          <div className="text-xs text-purple-500 mt-1">Which variable matters most?</div>
        </button>
        <button
          onClick={runBreakeven}
          className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition text-center"
        >
          <div className="text-sm font-semibold text-blue-700">Breakeven Analysis</div>
          <div className="text-xs text-blue-500 mt-1">Minimum rent for DSCR ≥ 1.25x</div>
        </button>
      </div>

      {/* Tornado chart */}
      {showTornado && tornadoData.length > 0 && (
        <div className="space-y-3">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tornadoData}
                layout="vertical"
                margin={{ top: 30, left: 30, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
                  fontSize={10}
                />
                <YAxis
                  dataKey="param"
                  type="category"
                  fontSize={10}
                  width={200}
                />
                <Tooltip formatter={(value) => [fmt(Number(value)), "Impact"]} />
                <Bar dataKey="impact" name="Impact">
                  {tornadoData.map((entry, index) => {
                    const isPositive = entry.direction === "positive";
                    return (
                      <Cell key={`cell-${index}`} fill={isPositive ? "#8B5CF6" : "#F59E0B"} />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-sm font-medium text-gray-800 text-center mt-6">
            Impact on Total 15-yr Cash Flow (sorted by sensitivity)
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {tornadoData.map((bar) => (
              <div key={bar.param} className="flex justify-between py-1">
                <span>{bar.param}: </span>
                <span className={`font-mono font-medium ${bar.value >= 0 ? "text-purple-600" : "text-amber-600"}`}>
                  {bar.value >= 0 ? "+" : ""}$
                  {Math.round(bar.value).toLocaleString("en-US")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakeven result */}
      {showBreakeven && breakeven && (
        <div className={`rounded-xl p-4 border-2 ${breakeven.feasible ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
          <div className={`text-sm font-medium ${breakeven.feasible ? "text-emerald-700" : "text-red-700"}`}>
            {breakeven.feasible ? "Minimum Rent Required for DSCR 1.25x" : "Not feasible at any reasonable rent level"}
          </div>
          <div className="text-2xl font-mono font-bold text-gray-900 mt-1">
            {breakeven.feasible ? `${fmt(breakeven.minRentRequired)} / year` : "—"}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Gross Potential Rent (before vacancy)
          </div>
        </div>
      )}
    </div>
  );
}
