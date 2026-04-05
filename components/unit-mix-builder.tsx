"use client";

import { useState } from "react";
import { AmiLevel, UnitDefinition, RentComparisonResult, AmiApiResponse, UnitMixResult } from "@/lib/types";
import { compareRents, getFairMarketRent, FMR_LABELS } from "@/lib/hud-api";
import { checkSetAside } from "@/lib/hud-api";

const AMI_OPTIONS: AmiLevel[] = [30, 40, 50, 60];
const BR_OPTIONS = [0, 1, 2, 3, 4];
const BR_LABELS: Record<number, string> = { 0: "Studio", 1: "1 BR", 2: "2 BR", 3: "3 BR", 4: "4 BR" };

interface UnitMixBuilderProps {
  state?: string;
  county?: string;
  amiData?: AmiApiResponse | null;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

let nextId = 1;

export function UnitMixBuilder({ state, county, amiData }: UnitMixBuilderProps) {
  const [units, setUnits] = useState<UnitDefinition[]>([
    { id: `u-${nextId++}`, unit: 1, bedrooms: 1, amiTier: 50, proposedRent: 800, count: 1 },
  ]);
  const [showSetAside, setShowSetAside] = useState(false);

  function addUnit() {
    setUnits((prev) => [
      ...prev,
      {
        id: `u-${nextId++}`,
        unit: units.length + 1,
        bedrooms: 1,
        amiTier: 50,
        proposedRent: 800,
        count: 1,
      },
    ]);
  }

  function updateUnit(id: string, field: keyof UnitDefinition, value: number | AmiLevel) {
    setUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [field]: value } : u))
    );
  }

  function removeUnit(id: string) {
    setUnits((prev) => prev.filter((u) => u.id !== id));
  }

  // Calculate results
  const results = units.map((unit) => {
    const amiLimit = amiData?.limits.find(
      (l) => l.householdSize === Math.max(1, unit.bedrooms) && l.amiPct === unit.amiTier
    );

    const rentComparison = compareRents(unit.bedrooms, unit.proposedRent, state || "NY");
    rentComparison.amiLimitRent = amiLimit?.maxRent ?? null;

    // Check against both AMI and FMR
    let exceedsLimit = false;
    if (amiLimit && unit.proposedRent > amiLimit.maxRent * 1.2) {
      exceedsLimit = true;
    }
    if (!rentComparison.isFeasible) {
      exceedsLimit = true;
    }

    const variance = unit.proposedRent - (amiLimit?.maxRent ?? 0);

    return { unit, maxAllowedRent: amiLimit?.maxRent ?? 0, exceedsLimit, variance, ...rentComparison };
  });

  const totalUnits = units.reduce((s, u) => s + u.count, 0);
  const totalIncome = results.reduce((s, r) => s + r.proposedRent * r.unit.count, 0);

  // Get max AMI level for set aside calculation
  const maxAmiLevel = Math.max(...units.map((u) => u.amiTier));
  const affordableUnits = units.filter((u) => u.amiTier >= 50).reduce((s, u) => s + u.count, 0);
  const setAside5050 = checkSetAside(totalUnits, affordableUnits, "2050");
  const setAside4060 = checkSetAside(totalUnits, affordableUnits, "4060");

  return (
    <div className="space-y-4">
      {/* Unit list */}
      <div className="space-y-2">
        {units.map((unit, index) => {
          const result = results[index];
          return (
            <div
              key={unit.id}
              className={`grid grid-cols-6 md:grid-cols-6 gap-2 p-3 rounded-lg border transition-all ${
                result?.exceedsLimit
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              {/* Bedrooms */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">BR</label>
                <select
                  value={unit.bedrooms}
                  onChange={(e) => updateUnit(unit.id, "bedrooms", parseInt(e.target.value))}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                >
                  {BR_OPTIONS.map((br) => (
                    <option key={br} value={br}>{BR_LABELS[br]}</option>
                  ))}
                </select>
              </div>

              {/* AMI Tier */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">AMI</label>
                <select
                  value={unit.amiTier}
                  onChange={(e) => updateUnit(unit.id, "amiTier", parseInt(e.target.value) as AmiLevel)}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                >
                  {AMI_OPTIONS.map((tier) => (
                    <option key={tier} value={tier}>{tier}% AMI</option>
                  ))}
                </select>
              </div>

              {/* Proposed rent */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Rent/mo</label>
                <input
                  type="number"
                  min="0"
                  value={unit.proposedRent}
                  onChange={(e) => updateUnit(unit.id, "proposedRent", parseInt(e.target.value) || 0)}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 font-mono"
                />
              </div>

              {/* Count */}
              <div>
                <label className="block text-xs text-gray-500 mb-1"># units</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={unit.count}
                  onChange={(e) => updateUnit(unit.id, "count", parseInt(e.target.value) || 1)}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 font-mono"
                />
              </div>

              {/* Max allowed */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Allowed</label>
                <div className={`text-sm font-mono py-1.5 ${result?.exceedsLimit ? "text-red-600" : "text-emerald-600"}`}>
                  {result?.maxAllowedRent ? fmt(result.maxAllowedRent) : "—"}
                </div>
                {result?.exceedsLimit && (
                  <div className="text-xs text-red-500">+{fmt(result.variance + result.maxAllowedRent)} over</div>
                )}
              </div>

              {/* Remove */}
              <div className="flex items-end justify-center">
                {units.length > 1 && (
                  <button
                    onClick={() => removeUnit(unit.id)}
                    className="text-red-400 hover:text-red-600 text-lg"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add unit */}
      <button
        onClick={addUnit}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition text-sm"
      >
        + Add Unit Type
      </button>

      {/* Set aside check toggle */}
      <button
        onClick={() => setShowSetAside(!showSetAside)}
        className="w-full py-2 text-sm text-blue-600 hover:underline"
      >
        {showSetAside ? "Hide" : "Show"} Set-Aside Test Validation
      </button>

      {/* Set aside results */}
      {showSetAside && (
        <div className="space-y-2">
          <SetAsideCard test={setAside5050} />
          <SetAsideCard test={setAside4060} />
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <div className="text-xs text-gray-500">Total Units</div>
          <div className="text-xl font-mono font-bold text-blue-800">{totalUnits}</div>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg text-center">
          <div className="text-xs text-gray-500">Monthly Income</div>
          <div className="text-xl font-mono font-bold text-emerald-800">{fmt(totalIncome)}</div>
        </div>
      </div>
    </div>
  );
}

function SetAsideCard({ test }: { test: ReturnType<typeof checkSetAside> }) {
  return (
    <div
      className={`rounded-lg p-3 border-2 ${
        test.met ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-800">{test.description}</div>
          <div className="text-xs text-gray-500 mt-1">
            {test.actualUnits}/{test.totalUnits} units at ≥ {test.requiredPct}% AMI
          </div>
        </div>
        <div
          className={`text-2xl font-bold ${
            test.met ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {test.met ? "✓" : "✗"}
        </div>
      </div>
    </div>
  );
}
