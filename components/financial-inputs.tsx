"use client";

import { useState } from "react";
import { FinancialInputs, CreditType } from "@/lib/types";

interface FinancialInputsProps {
  onSubmit: (inputs: FinancialInputs) => void;
  loading: boolean;
}

export function FinancialInputsForm({ onSubmit, loading }: FinancialInputsProps) {
  const [tdc, setTdc] = useState("5000000");
  const [eligibleBasisPct, setEligibleBasisPct] = useState("80");
  const [applicableFraction, setApplicableFraction] = useState("100");
  const [creditType, setCreditType] = useState<CreditType>("9%");
  const [equityPricing, setEquityPricing] = useState("0.95");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      tdc: parseFloat(tdc) || 0,
      eligibleBasisPct: parseFloat(eligibleBasisPct) || 80,
      applicableFraction: parseFloat(applicableFraction) || 100,
      creditType,
      equityPricing: parseFloat(equityPricing) || 0.95,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Total Development Cost ($)
        </label>
        <input
          type="text"
          value={tdc}
          onChange={(e) => setTdc(e.target.value.replace(/[^\d.]/g, ""))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Eligible Basis (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={eligibleBasisPct}
            onChange={(e) => setEligibleBasisPct(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Applicable Fraction (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={applicableFraction}
            onChange={(e) => setApplicableFraction(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Equity Pricing ($/credit)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={equityPricing}
            onChange={(e) => setEquityPricing(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        Calculate Impact
      </button>
    </form>
  );
}
