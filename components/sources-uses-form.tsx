"use client";

import { useState, useMemo } from "react";
import {
  UseCategory,
  SourceCategory,
  useLabels,
  sourceLabels,
  SourcesUsesInputs,
  CreditType,
  DEFAULT_ELIGIBLE_BASIS_PCT,
  DEFAULT_APPLICABLE_FRACTION,
  DEFAULT_EQUITY_PRICING,
} from "@/lib/types";

interface SourcesUsesFormProps {
  onSubmit: (inputs: SourcesUsesInputs) => void;
  loading: boolean;
}

type Tab = "uses" | "sources" | "params";

const useDefaults: Record<UseCategory, number> = {
  land: 0,
  construction: 0,
  soft: 0,
  developerFee: 0,
  financing: 0,
  operatingReserve: 0,
  replacementReserve: 0,
  contingency: 0,
};

const sourceDefaults: Record<SourceCategory, number> = {
  constructionLoan: 0,
  permanentDebt: 0,
  lihtcEquity: 0,
  landContribution: 0,
  deferredDevFee: 0,
  stateSubsidy: 0,
  bonds: 0,
  other: 0,
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function SourcesUsesForm({ onSubmit, loading }: SourcesUsesFormProps) {
  const [tab, setTab] = useState<Tab>("uses");
  const [uses, setUses] = useState(useDefaults);
  const [sources, setSources] = useState(sourceDefaults);
  const [eligibleBasisPct, setEligibleBasisPct] = useState(DEFAULT_ELIGIBLE_BASIS_PCT.toString());
  const [applicableFraction, setApplicableFraction] = useState(DEFAULT_APPLICABLE_FRACTION.toString());
  const [creditType, setCreditType] = useState<CreditType>("9%");
  const [equityPricing, setEquityPricing] = useState(DEFAULT_EQUITY_PRICING.toString());

  const totalUses = useMemo(() => Object.values(uses).reduce((s, v) => s + v, 0), [uses]);
  const totalSources = useMemo(() => Object.values(sources).reduce((s, v) => s + v, 0), [sources]);
  const gap = totalUses - totalSources;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      uses: useLabels.map(([cat, label]) => ({ category: cat, label, value: uses[cat] })),
      sources: sourceLabels.map(([cat, label]) => ({ category: cat, label, value: sources[cat] })),
      eligibleBasisPct: parseFloat(eligibleBasisPct) || DEFAULT_ELIGIBLE_BASIS_PCT,
      applicableFraction: parseFloat(applicableFraction) || DEFAULT_APPLICABLE_FRACTION,
      creditType,
      equityPricing: parseFloat(equityPricing) || DEFAULT_EQUITY_PRICING,
    });
  }

  function updateUse(cat: UseCategory, raw: string) {
    const num = raw.replace(/[^0-9.]/g, "");
    setUses((prev) => ({ ...prev, [cat]: num ? parseInt(num) || 0 : 0 }));
  }

  function updateSource(cat: SourceCategory, raw: string) {
    const num = raw.replace(/[^0-9.]/g, "");
    setSources((prev) => ({ ...prev, [cat]: num ? parseInt(num) || 0 : 0 }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Gap analysis bar */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Uses: <span className="font-mono font-bold text-gray-900">{fmt(totalUses)}</span></span>
          <span className="text-gray-600">Total Sources: <span className={`font-mono font-bold ${gap > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(totalSources)}</span></span>
        </div>
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-blue-500 transition-all"
            style={{ width: `${totalUses > 0 ? Math.min((totalSources / totalUses) * 100, 100) : 0}%` }}
          />
        </div>
        <div className="text-xs text-center">
          {gap > 0 ? (
            <span className="text-red-500 font-medium">Gap (Shortfall): −{fmt(gap)}</span>
          ) : gap < 0 ? (
            <span className="text-emerald-600 font-medium">Overage: +{fmt(Math.abs(gap))}</span>
          ) : totalUses === 0 ? (
            <span className="text-gray-400">Enter values below to see your capital stack</span>
          ) : (
            <span className="text-emerald-600 font-medium">Sources cover uses</span>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {(["uses", "sources", "params"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition capitalize ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "params" ? "Parameters" : t}
          </button>
        ))}
      </div>

      {/* Uses tab */}
      {tab === "uses" && (
        <div className="space-y-3">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Development Costs</div>
          {useLabels.map(([cat, label]) => (
            <div key={cat} className="flex items-center gap-3">
              <label className="text-sm text-gray-600 flex-1 truncate">{label}</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input
                  type="text"
                  value={uses[cat] ? uses[cat].toLocaleString("en-US") : ""}
                  onChange={(e) => updateUse(cat, e.target.value)}
                  className="w-32 text-right text-sm border border-gray-300 rounded-lg pl-5 pr-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sources tab */}
      {tab === "sources" && (
        <div className="space-y-3">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Capital Stack</div>
          {sourceLabels.map(([cat, label]) => (
            <div key={cat} className="flex items-center gap-3">
              <label className="text-sm text-gray-600 flex-1 truncate">{label}</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input
                  type="text"
                  value={sources[cat] ? sources[cat].toLocaleString("en-US") : ""}
                  onChange={(e) => updateSource(cat, e.target.value)}
                  className="w-32 text-right text-sm border border-gray-300 rounded-lg pl-5 pr-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Parameters tab */}
      {tab === "params" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eligible Basis (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={eligibleBasisPct}
                onChange={(e) => setEligibleBasisPct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applicable Fraction (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={applicableFraction}
                onChange={(e) => setApplicableFraction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Type</label>
              <div className="flex gap-2">
                {(["4%", "9%"] as CreditType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCreditType(type)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                      creditType === type
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equity Pricing ($/credit)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={equityPricing}
                onChange={(e) => setEquityPricing(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || totalUses === 0}
        className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? "Calculating..." : "Calculate Capital Stack"}
      </button>
    </form>
  );
}
