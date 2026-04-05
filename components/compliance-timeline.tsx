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

      {/* Year-by-Year Timeline */}
      <div className="space-y-1">
        <div className="grid grid-cols-5 md:grid-cols-7 gap-2 text-xs text-gray-500 font-medium px-2 py-1 border-b border-gray-200">
          <div>Year</div>
          <div className="text-right">App. Fraction</div>
          <div className="text-right">Qualified Basis</div>
          <div className="text-right hidden md:block">Credits</div>
          <div className="text-right">DSCR</div>
          <div className="text-center hidden md:block">Status</div>
          <div className="text-center">Expand</div>
        </div>

        {timeline.years.map((y) => {
          const dscr = dscrStatus(y.dscr);
          const isCreditPeriod = y.yearType === "credit";

          return (
            <div key={y.year}>
              <button
                onClick={() => toggleYear(y.year)}
                className={`w-full grid grid-cols-5 md:grid-cols-7 gap-2 text-sm px-2 py-2.5 rounded-lg transition hover:bg-gray-50 ${
                  y.deficitFlag
                    ? "bg-red-50 border border-red-100"
                    : y.qualifiedBasisReduction
                    ? "bg-amber-50 border border-amber-100"
                    : ""
                }`}
              >
                <div className="font-mono">
                  <span className={isCreditPeriod ? "text-blue-700 font-semibold" : "text-gray-500"}>
                    {y.year}
                  </span>
                  {y.year === 1 && <span className="ml-1 text-[10px] text-green-600">PIS</span>}
                </div>
                <div className="text-right font-mono">{y.applicableFraction.toFixed(1)}%</div>
                <div className="text-right font-mono text-xs">{fmtShort(y.qualifiedBasis)}</div>
                <div className={`text-right font-mono text-xs hidden md:block ${y.annualCredits > 0 ? "text-emerald-700" : "text-gray-400"}`}>
                  {y.annualCredits > 0 ? fmtShort(y.annualCredits) : "—"}
                </div>
                <div className={`text-right font-mono ${
                  dscr === "pass" ? "text-emerald-600" : dscr === "warning" ? "text-amber-600" : "text-red-600"
                }`}>
                  {y.dscr === Infinity ? "∞" : y.dscr.toFixed(2)}
                </div>
                <div className="text-center hidden md:block">
                  {y.deficitFlag ? (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Def</span>
                  ) : y.qualifiedBasisReduction ? (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Red</span>
                  ) : (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">OK</span>
                  )}
                </div>
                <div className="text-center text-gray-400 text-xs">
                  {expandedYear === y.year ? "−" : "+"}
                </div>
              </button>

              {/* Expanded year details */}
              {expandedYear === y.year && (
                <div className="ml-4 mt-1 mb-2 p-3 bg-gray-50 rounded-lg text-xs grid grid-cols-2 md:grid-cols-4 gap-3">
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
