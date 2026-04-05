"use client";

import { useState } from "react";
import { SetAsideComplianceYear, YearlyOccupancyData } from "@/lib/types";
import { trackSetAsideCompliance } from "@/lib/compliance";

const SET_ASIDE_TESTING_PERIOD = 3;

interface SetAsideCheckerProps {
  totalUnits: number;
}

export function SetAsideChecker({ totalUnits }: SetAsideCheckerProps) {
  const [electedTest, setElectedTest] = useState<"2050" | "4060">("2050");
  const [showDetailed, setShowDetailed] = useState(false);
  const [occupancyData, setOccupancyData] = useState<Omit<YearlyOccupancyData, "election">[]>(
    Array.from({ length: 15 }, (_, i) => ({
      year: i + 1,
      totalUnits,
      compliantUnits: Math.ceil(totalUnits * 0.5),
      totalFloorArea: 10_000,
      compliantFloorArea: 5_000,
    }))
  );

  const updateOccupancy = (year: number, field: string, value: number) => {
    setOccupancyData((prev) =>
      prev.map((d) => (d.year === year ? { ...d, [field]: value } : d))
    );
  };

  const yearlyData: YearlyOccupancyData[] = occupancyData.map((d) => ({
    ...d,
    election: electedTest,
  }));

  const complianceYears: SetAsideComplianceYear[] = trackSetAsideCompliance(yearlyData);
  const violations = complianceYears.filter((y) => !y.met);
  const testingFailures = violations.filter((y) => y.isTestingPeriod);

  const description = electedTest === "2050"
    ? "20/50: 20% of units at 50% AMI"
    : "40/60: 40% of units at 60% AMI";

  return (
    <div className="space-y-4">
      {/* Election Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Elected Test:</span>
        <button
          onClick={() => setElectedTest(electedTest === "2050" ? "4060" : "2050")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            electedTest === "2050"
              ? "bg-blue-100 text-blue-700 border border-blue-300"
              : "bg-purple-100 text-purple-700 border border-purple-300"
          }`}
        >
          {description}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`p-3 rounded-lg text-center ${violations.length === 0 ? "bg-emerald-50" : "bg-red-50"}`}>
          <div className="text-xs text-gray-500">All 15 Years</div>
          <div className={`text-lg font-mono font-bold ${violations.length === 0 ? "text-emerald-700" : "text-red-700"}`}>
            {violations.length === 0 ? "All Pass" : `${violations.length} Fail`}
          </div>
        </div>
        <div className={`p-3 rounded-lg text-center ${testingFailures.length === 0 ? "bg-emerald-50" : "bg-red-50"}`}>
          <div className="text-xs text-gray-500">Testing Period (Yrs 1-3)</div>
          <div className={`text-lg font-mono font-bold ${testingFailures.length === 0 ? "text-emerald-700" : "text-red-700"}`}>
            {testingFailures.length === 0 ? "Pass" : `${testingFailures.length} Fail`}
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <div className="text-xs text-gray-500">Test Description</div>
          <div className="text-sm font-medium">{description}</div>
        </div>
      </div>

      {/* Yearly compliance grid */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-1">
        {complianceYears.map((cy) => (
          <div
            key={cy.year}
            className={`text-center p-2 rounded-lg border transition ${
              cy.met
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            } ${cy.isTestingPeriod ? "ring-2 ring-amber-300" : ""}`}
          >
            <div className="text-xs text-gray-500">Year {cy.year}</div>
            <div className="text-lg font-bold">
              {cy.compliantUnits}/{cy.totalUnits}
            </div>
            <div className="text-xs text-gray-400">
              req: {cy.requiredUnits}
            </div>
            <div className="text-lg">
              {cy.met ? "✓" : "✗"}
            </div>
            {cy.isTestingPeriod && (
              <div className="text-[10px] text-amber-600">Testing</div>
            )}
          </div>
        ))}
      </div>

      {/* Expandable detailed view */}
      <button
        onClick={() => setShowDetailed(!showDetailed)}
        className="w-full py-2 text-sm text-blue-600 hover:underline"
      >
        {showDetailed ? "Hide" : "Show"} Detailed Year Editor
      </button>

      {showDetailed && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {occupancyData.map((d) => {
            const cy = complianceYears.find((c) => c.year === d.year);
            return (
              <div
                key={d.year}
                className={`grid grid-cols-4 gap-2 p-3 rounded-lg border ${
                  cy?.met ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                }`}
              >
                <div>
                  <label className="block text-xs text-gray-500">Year</label>
                  <div className="text-sm font-mono">{d.year}</div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Total Units</label>
                  <input
                    type="number"
                    min="1"
                    value={d.totalUnits}
                    onChange={(e) => updateOccupancy(d.year, "totalUnits", Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Compliant Units</label>
                  <input
                    type="number"
                    min="0"
                    value={d.compliantUnits}
                    onChange={(e) => updateOccupancy(d.year, "compliantUnits", Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Status</label>
                  <div className={`text-sm font-bold ${cy?.met ? "text-emerald-600" : "text-red-600"}`}>
                    {cy?.met ? "Pass" : "Fail"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
