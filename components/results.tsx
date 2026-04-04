"use client";

import { ComparisonResult, EligibilityResponse } from "@/lib/types";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function ResultCard({ title, data, highlight }: { title: string; data: any; highlight: boolean }) {
  return (
    <div
      className={`rounded-xl p-6 border-2 transition-all ${
        highlight
          ? "border-emerald-500 bg-emerald-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <dl className="space-y-3">
        <div>
          <dt className="text-xs text-gray-500">Eligible Basis</dt>
          <dd className="text-lg font-mono font-semibold text-gray-800">{fmt(data.eligibleBasis)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Qualified Basis</dt>
          <dd className="text-lg font-mono font-semibold text-gray-800">{fmt(data.qualifiedBasis)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Annual Credits</dt>
          <dd className="text-lg font-mono font-semibold text-gray-800">{fmt(data.annualCredits)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Total Credits (10yr)</dt>
          <dd className="text-lg font-mono font-semibold text-gray-800">{fmt(data.totalCredits)}</dd>
        </div>
        <div className="pt-3 border-t border-gray-300/50">
          <dt className="text-sm font-medium text-gray-700">Equity Proceeds</dt>
          <dd className="text-2xl font-mono font-bold text-gray-900">{fmt(data.equity)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function Results({
  comparison,
  eligibility,
}: {
  comparison: ComparisonResult;
  eligibility: EligibilityResponse;
}) {
  if (!eligibility.eligible) {
    return (
      <ResultCard title="No Boost Available" data={comparison.withoutBoost} highlight={false} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResultCard title="Without Boost" data={comparison.withoutBoost} highlight={false} />
        <ResultCard title="With 30% Boost" data={comparison.withBoost} highlight={true} />
      </div>

      <div className="text-center py-4 bg-emerald-100 rounded-xl border border-emerald-200">
        <div className="text-sm text-emerald-700 font-medium">Additional Equity from Basis Boost</div>
        <div className="text-3xl font-bold text-emerald-800 font-mono mt-1">
          +{fmt(comparison.equityDelta)}
        </div>
        <div className="text-sm text-emerald-600 mt-1">
          ({comparison.boostPct.toFixed(1)}% increase)
        </div>
      </div>
    </div>
  );
}
