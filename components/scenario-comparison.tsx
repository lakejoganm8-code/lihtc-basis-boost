"use client";

import { ScenarioConfig, ScenarioResult } from "@/lib/types";
import { buildDefaultScenarios, compareScenarios, evaluateScenario } from "@/lib/scenarios";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

interface ScenarioComparisonProps {
  totalDevelopmentCost: number;
  eligibleBasisPct: number;
  applicableFraction: number;
  equityPricing: number;
  boostApplied: boolean;
}

export function ScenarioComparison({
  totalDevelopmentCost,
  eligibleBasisPct,
  applicableFraction,
  equityPricing,
  boostApplied,
}: ScenarioComparisonProps) {
  const configs = buildDefaultScenarios(
    totalDevelopmentCost,
    eligibleBasisPct,
    applicableFraction,
    equityPricing,
    boostApplied,
  );
  const results = compareScenarios(configs);
  const maxEquity = Math.max(...results.map((r) => r.equity));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {results.map((result) => (
          <ScenarioCard key={result.config.id} result={result} isBest={result.equity === maxEquity} />
        ))}
      </div>
    </div>
  );
}

function ScenarioCard({ result, isBest }: { result: ScenarioResult; isBest: boolean }) {
  return (
    <div
      className={`rounded-xl p-4 border-2 transition-all ${
        isBest ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="text-xs font-medium text-gray-500 mb-2">{result.config.label}</div>
      <div className="text-xl font-mono font-bold text-gray-900">{fmt(result.equity)}</div>
      <div className="text-xs text-gray-500 mt-1">LIHTC Equity</div>

      <div className="mt-3 space-y-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Qualified Basis</span>
          <span className="font-mono">{fmt(result.qualifiedBasis)}</span>
        </div>
        <div className="flex justify-between">
          <span>Annual Credits</span>
          <span className="font-mono">{fmt(result.annualCredits)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total (10yr)</span>
          <span className="font-mono">{fmt(result.totalCredits)}</span>
        </div>
      </div>

      {isBest && (
        <div className="mt-2 text-xs text-emerald-600 font-medium text-center">Best Scenario</div>
      )}
    </div>
  );
}
