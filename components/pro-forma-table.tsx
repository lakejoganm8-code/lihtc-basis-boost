"use client";

import { useState, useCallback, useRef } from "react";
import { ProFormaAssumptions, ProFormaResult } from "@/lib/types";
import { calculateProForma, dscrStatus } from "@/lib/pro-forma";

interface ProFormaTableProps {
  initialAssumptions?: Partial<ProFormaAssumptions>;
  totalDevelopmentCost: number;
  eligibleBasisPct: number;
  applicableFraction: number;
  creditType: "4%" | "9%";
  equityPricing: number;
  boostApplied: boolean;
}

const defaults: ProFormaAssumptions = {
  projectionYears: 15,
  grossPotentialRent: 500000,
  otherIncome: 15000,
  vacancyRate: 5,
  propertyMgmtPct: 5,
  taxes: 60000,
  insurance: 25000,
  utilities: 30000,
  maintenance: 20000,
  personnel: 15000,
  admin: 10000,
  reserveContrib: 0,
  rentGrowth: 2.5,
  expenseGrowth: 2.5,
  annualDebtService: 180000,
  debtServiceGrowth: 0,
  creditType: "9%" as const,
  applicableFraction: 100,
  equityPricing: 0.95,
  boostApplied: true,
  totalDevelopmentCost: 5000000,
  eligibleBasisPct: 80,
};

const fmt = (n: number) => {
  if (n === Infinity) return "∞";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
};

function dscrCell(dscr: number) {
  const status = dscrStatus(dscr);
  const color = status === "pass" ? "text-emerald-600" : status === "warning" ? "text-amber-600" : "text-red-600";
  return (
    <span className={`font-mono ${color}`}>
      {dscr === Infinity ? "∞" : dscr.toFixed(2)}
    </span>
  );
}

function cell(val: number, prefix = "$") {
  return <span className="font-mono text-sm">{fmt(val)}</span>;
}

// Collapsible years: start with some expanded
const DEFAULT_EXPANDED = 5;

export function ProFormaTable({
  initialAssumptions,
  totalDevelopmentCost,
  eligibleBasisPct,
  applicableFraction,
  creditType,
  equityPricing,
  boostApplied,
}: ProFormaTableProps) {
  const base: ProFormaAssumptions = {
    ...defaults,
    totalDevelopmentCost,
    eligibleBasisPct,
    applicableFraction,
    creditType,
    equityPricing,
    boostApplied,
    ...initialAssumptions,
  };

  const [assumptions, setAssumptions] = useState(base);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(
    new Set(Array.from({ length: DEFAULT_EXPANDED }, (_, i) => i + 1))
  );
  const tableRef = useRef<HTMLDivElement>(null);

  const result = calculateProForma(assumptions);

  function updateField<K extends keyof ProFormaAssumptions>(
    field: K,
    value: ProFormaAssumptions[K]
  ) {
    setAssumptions((prev) => ({ ...prev, [field]: value }));
  }

  function toggleRow(year: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  function toggleAll() {
    if (expandedRows.size === result.years.length) {
      setExpandedRows(new Set());
    } else {
      setExpandedRows(new Set(result.years.map((y) => y.year)));
    }
  }

  return (
    <div className="space-y-6">
      {/* Assumptions panel */}
      <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/50">
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 select-none list-none [&>span]:open:hidden">
            <span>Assumptions (click to expand)</span>
          </summary>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Projection */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Projection Years</label>
              <select
                value={assumptions.projectionYears}
                onChange={(e) => updateField("projectionYears", parseInt(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              >
                <option value={15}>15 Years</option>
                <option value={30}>30 Years</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Gross Potential Rent /yr</label>
              <input
                type="text"
                value={assumptions.grossPotentialRent.toLocaleString("en-US")}
                onChange={(e) => {
                  const v = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                  updateField("grossPotentialRent", v);
                }}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Other Income</label>
              <input
                type="text"
                value={assumptions.otherIncome.toLocaleString("en-US")}
                onChange={(e) => {
                  const v = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                  updateField("otherIncome", v);
                }}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vacancy Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={assumptions.vacancyRate}
                onChange={(e) => updateField("vacancyRate", parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Debt Service /yr</label>
              <input
                type="text"
                value={assumptions.annualDebtService.toLocaleString("en-US")}
                onChange={(e) => {
                  const v = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                  updateField("annualDebtService", v);
                }}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rent Growth (%)</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={assumptions.rentGrowth}
                onChange={(e) => updateField("rentGrowth", parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Expense Growth (%)</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={assumptions.expenseGrowth}
                onChange={(e) => updateField("expenseGrowth", parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mgmt (%)</label>
              <input
                type="number"
                min="0"
                max="15"
                step="0.5"
                value={assumptions.propertyMgmtPct}
                onChange={(e) => updateField("propertyMgmtPct", parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Taxes</label>
              <input
                type="text"
                value={assumptions.taxes.toLocaleString("en-US")}
                onChange={(e) => {
                  const v = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                  updateField("taxes", v);
                }}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Insurance</label>
              <input
                type="text"
                value={assumptions.insurance.toLocaleString("en-US")}
                onChange={(e) => {
                  const v = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                  updateField("insurance", v);
                }}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Maintenance</label>
              <input
                type="text"
                value={assumptions.maintenance.toLocaleString("en-US")}
                onChange={(e) => {
                  const v = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
                  updateField("maintenance", v);
                }}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>
        </details>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-gray-500">Total Income (all yrs)</div>
          <div className="text-sm font-mono font-bold text-blue-800">{fmt(result.totalIncome)}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500">Total NOI</div>
          <div className="text-sm font-mono font-bold text-gray-800">{fmt(result.totalNOI)}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500">Min DSCR / Year</div>
          <div className={`text-sm font-mono font-bold ${result.minDSCR === 0 && result.totalDebtService === 0 ? "text-emerald-600" : dscrStatus(result.minDSCR) === "pass" ? "text-emerald-600" : result.minDSCR >= 1.0 ? "text-amber-600" : "text-red-600"}`}>
            {result.minDSCR === 0 && result.totalDebtService === 0 ? "∞ (No debt)" : result.minDSCR === Infinity ? "∞" : result.minDSCR.toFixed(2)} (Yr {result.minDSCRYear})
          </div>
        </div>
        <div className={`p-3 rounded-lg ${result.deficitYears.length > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
          <div className="text-xs text-gray-500">{result.deficitYears.length > 0 ? "Deficit Years" : "No Deficit Years"}</div>
          <div className={`text-sm font-mono font-bold ${result.deficitYears.length > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {result.deficitYears.length > 0 ? result.deficitYears.join(", ") : "—"}</div>
        </div>
      </div>

      {/* Yearly table */}
      <div className="overflow-x-auto" ref={tableRef}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Click row to expand/collapse</span>
          <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
            {expandedRows.size === result.years.length ? "Collapse All" : "Expand All"}
          </button>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-2 text-right text-xs text-gray-500 w-8">Yr</th>
              <th className="p-2 text-right text-xs text-gray-500">EGI</th>
              <th className="p-2 text-right text-xs text-gray-500">OpEx</th>
              <th className="p-2 text-right text-xs text-gray-500">NOI</th>
              <th className="p-2 text-right text-xs text-gray-500">Debt</th>
              <th className="p-2 text-right text-xs text-gray-500">CashFlow</th>
              <th className="p-2 text-right text-xs text-gray-500">DSCR</th>
              <th className="p-2 text-right text-xs text-gray-500">Cum. CF</th>
            </tr>
          </thead>
          <tbody>
            {result.years.map((y) => {
              const isExp = expandedRows.has(y.year);
              const highlight = y.year === 1 || y.year === 15;
              const deficit = y.cashFlowBeforeTax < 0;

              return (
                <tr key={y.year} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => toggleRow(y.year)}>
                  <td className={`p-2 text-right font-mono ${highlight ? "font-bold text-blue-700" : ""}`}>
                    {y.year}
                    {y.year === 15 && " 🏁"}
                  </td>
                  <td className={`p-2 text-right font-mono ${highlight ? "font-bold" : ""}`}>{cell(y.effectiveGrossIncome)}</td>
                  <td className={`p-2 text-right font-mono ${highlight ? "font-bold" : ""}`}>{cell(y.totalOperatingExpenses)}</td>
                  <td className={`p-2 text-right font-mono ${highlight ? "font-bold text-emerald-700" : ""}`}>{fmt(y.netOperatingIncome)}</td>
                  <td className={`p-2 text-right font-mono ${highlight ? "font-bold" : ""}`}>{cell(y.debtService)}</td>
                  <td className={`p-2 text-right font-mono ${deficit ? "text-red-600 font-bold" : ""}`}>{fmt(y.cashFlowBeforeTax)}</td>
                  <td className={`p-2 text-right`}>{dscrCell(y.dscr)}</td>
                  <td className={`p-2 text-right font-mono ${y.cumulativeCashFlow < 0 ? "text-red-600" : ""}`}>{fmt(y.cumulativeCashFlow)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Equity callout */}
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
        <div className="text-sm text-emerald-700 font-medium">LIHTC Equity Generated (10-year credit period)</div>
        <div className="text-3xl font-bold text-emerald-800 font-mono mt-1">{fmt(result.equityGenerated)}</div>
      </div>
    </div>
  );
}
