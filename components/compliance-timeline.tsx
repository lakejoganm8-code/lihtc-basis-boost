"use client";

import { useState } from "react";
import { ComplianceTimeline } from "@/lib/types";
import { dscrStatus } from "@/lib/pro-forma";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

interface ComplianceTimelineProps {
  timeline: ComplianceTimeline;
}

export function ComplianceTimelineView({ timeline }: ComplianceTimelineProps) {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  const toggleYear = (year: number) => {
    setExpandedYear((prev) => (prev === year ? null : year));
  };

  return (
    <div className="space-y-4">
      {/* Form 8609 Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <div className="text-xs text-gray-500">Placed in Service</div>
          <div className="text-lg font-mono font-bold text-blue-800">{timeline.placedInServiceYear}</div>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg text-center">
          <div className="text-xs text-gray-500">Total Equity Generated</div>
          <div className="text-lg font-mono font-bold text-emerald-800">{fmt(timeline.totalEquityGenerated)}</div>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg text-center">
          <div className="text-xs text-gray-500">Credit Period</div>
          <div className="text-lg font-mono font-bold text-amber-800">
            {timeline.placedInServiceYear}–{timeline.creditPeriodEnd}
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <div className="text-xs text-gray-500">Compliance End</div>
          <div className="text-lg font-mono font-bold text-gray-800">{timeline.complianceEndYear}</div>
        </div>
      </div>

      {/* Warnings */}
      {(timeline.setAsideViolations > 0 || timeline.basisReductionEvents > 0) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm font-medium text-red-700">Compliance Alerts</div>
          <div className="text-xs text-red-600 mt-1">
            {timeline.setAsideViolations > 0 && (
              <span>{timeline.setAsideViolations} deficit year(s) detected. </span>
            )}
            {timeline.basisReductionEvents > 0 && (
              <span>{timeline.basisReductionEvents} qualified basis reduction event(s).</span>
            )}
          </div>
        </div>
      )}

      {/* Credit Period Visual Bar */}
      <div className="relative">
        <div className="text-xs text-gray-500 mb-2">Credit Period (10 years) vs Compliance Period (15 years)</div>
        <div className="flex h-6 rounded-full overflow-hidden text-xs font-mono">
          <div className="bg-blue-500 text-white flex items-center justify-center w-[66.7%]">
            Credit Period (Yrs 1–10)
          </div>
          <div className="bg-gray-300 text-gray-700 flex items-center justify-center w-[33.3%]">
            Extended Use (11–15)
          </div>
        </div>
      </div>

      {/* Year-by-Year Timeline - Card-based layout */}
      <div className="space-y-2">
        {timeline.years.map((y) => {
          const dscr = dscrStatus(y.dscr);
          const isCreditPeriod = y.yearType === "credit";
          const expanded = expandedYear === y.year;

          return (
            <div key={y.year}>
              <button
                onClick={() => toggleYear(y.year)}
                className={`w-full text-left rounded-xl border p-4 transition hover:shadow-md ${
                  y.deficitFlag
                    ? "border-red-200 bg-red-50"
                    : y.qualifiedBasisReduction
                    ? "border-amber-200 bg-amber-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Left: Year + year type */}
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-mono font-bold">
                      <span className={isCreditPeriod ? "text-blue-700" : "text-gray-400"}>
                        {y.year}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {y.year === 1 && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                          Placed in Service
                        </span>
                      )}
                      {isCreditPeriod && y.year > 1 && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                          Credit Period
                        </span>
                      )}
                      {!isCreditPeriod && (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                          Compliance Only
                        </span>
                      )}
                      {y.boostActive && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                          Boost Active
                        </span>
                      )}
                      {y.deficitFlag && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                          Deficit
                        </span>
                      )}
                      {y.qualifiedBasisReduction && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                          Basis Reduction
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Key metrics */}
                  <div className="text-right">
                    <div className={`font-mono text-xs ${
                      y.deficitFlag ? "text-red-600" : "text-emerald-600"
                    }`}>
                      NOI: {fmtShort(y.netOperatingIncome)}
                    </div>
                    <div className={`font-mono text-xs mt-0.5 ${
                      y.annualCredits > 0 ? "text-emerald-700" : "text-gray-400"
                    }`}>
                      {y.annualCredits > 0 ? `Credits: ${fmtShort(y.annualCredits)}` : "No credits"}
                    </div>
                  </div>
                </div>

                {/* Secondary metrics row */}
                <div className="mt-2 grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Qualified Basis: </span>
                    <span className="font-mono">{fmtShort(y.qualifiedBasis)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">App. Fraction: </span>
                    <span className="font-mono">{y.applicableFraction.toFixed(1)}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500">DSCR: </span>
                    <span className={`font-mono ${
                      dscr === "pass" ? "text-emerald-600" : dscr === "warning" ? "text-amber-600" : "text-red-600"
                    }`}>
                      {y.dscr === Infinity ? "∞" : y.dscr.toFixed(2)}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded year details */}
              {expanded && (
                <div className="ml-4 mt-1 mb-2 p-4 bg-gray-50 rounded-lg text-xs grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-gray-500">Year Type</div>
                    <div className="font-medium">{isCreditPeriod ? "Credit Year" : "Compliance Only"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Net Operating Income</div>
                    <div className="font-mono">{fmt(y.netOperatingIncome)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Debt Service</div>
                    <div className="font-mono">{fmt(y.debtService)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total Credits to Date</div>
                    <div className="font-mono">{fmt(y.totalCreditsToDate)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Boost Active</div>
                    <div className={y.boostActive ? "text-emerald-600 font-medium" : "text-gray-400"}>
                      {y.boostActive ? "Yes" : "No"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Basis Reduction</div>
                    <div className={y.qualifiedBasisReduction ? "text-red-600 font-medium" : "text-gray-400"}>
                      {y.qualifiedBasisReduction ? "Flagged" : "None"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Deficit</div>
                    <div className={y.deficitFlag ? "text-red-600 font-medium" : "text-gray-400"}>
                      {y.deficitFlag ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
