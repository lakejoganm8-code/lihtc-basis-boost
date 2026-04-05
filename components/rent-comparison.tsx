"use client";

import { useState } from "react";

const FMR_LABELS: Record<number, string> = {
  0: "Studio",
  1: "1 BR",
  2: "2 BR",
  3: "3 BR",
  4: "4 BR",
};

interface FmrData {
  "0": number;
  "1": number;
  "2": number;
  "3": number;
  "4": number;
}

interface RentComparisonProps {
  fmrData: FmrData | null;
  state: string;
  onRentChange?: (bedrooms: number, rent: number) => void;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function RentComparison({ fmrData, state }: RentComparisonProps) {
  const [proposedRents, setProposedRents] = useState<Record<number, number>>({
    0: 800,
    1: 1000,
    2: 1300,
    3: 1600,
    4: 1900,
  });

  if (!fmrData) {
    return (
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
        Select a location first to see Fair Market Rent comparisons.
      </div>
    );
  }

  const bedrooms = [0, 1, 2, 3, 4] as const;

  return (
    <div className="space-y-3">
      {bedrooms.map((br) => {
        const fmr = fmrData[br];
        const proposed = proposedRents[br];
        const pctOfFmr = fmr > 0 ? (proposed / fmr) * 100 : 0;
        const over = pctOfFmr > 110;
        const under = pctOfFmr < 90;

        return (
          <div
            key={br}
            className={`rounded-lg border-2 p-3 transition-all ${
              over ? "border-red-200 bg-red-50" : under ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{FMR_LABELS[br]}</div>
              <div className="text-sm font-mono">
                Proposed: <span className={over ? "text-red-600" : "text-emerald-700"}>{fmt(proposed)}</span>
              </div>
              <div className="text-xs text-gray-500">
                FMR: {fmt(fmr)}
              </div>
              <div className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                over ? "bg-red-200 text-red-800" : pctOfFmr >= 90 ? "bg-emerald-200 text-emerald-800" : "bg-amber-200 text-amber-800"
              }`}>
                {pctOfFmr.toFixed(0)}%
              </div>
            </div>

            {/* Slider */}
            <div className="mt-2">
              <div className="relative h-2 bg-gray-200 rounded-full">
                <div
                  className="absolute left-0 top-0 h-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(pctOfFmr, 100)}%` }}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-gray-400"
                  style={{ left: 110 / 200 * 100 + "%" }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>$0</span>
                <span className="text-gray-600">FMR = {fmt(fmr)}</span>
                <span>{fmt(fmr * 1.5)}</span>
              </div>
            </div>

            {over && (
              <div className="text-xs text-red-500 mt-1">
                ⚠ {fmt(proposed - fmr)} above Fair Market Rent — may not qualify
              </div>
            )}

            {/* Hidden input for adjusting */}
            <input
              type="range"
              min="0"
              max={fmr * 2}
              step="25"
              value={proposed}
              onChange={(e) =>
                setProposedRents((prev) => ({
                  ...prev,
                  [br]: parseInt(e.target.value),
                }))
              }
              className="w-full mt-2 hidden"
            />
          </div>
        );
      })}
    </div>
  );
}
