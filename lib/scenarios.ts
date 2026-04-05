import {
  ScenarioConfig,
  ScenarioResult,
  SensitivityInputs,
  TornadoBar,
  BreakevenResult,
  ProFormaResult,
} from "./types";
import { calculateProForma, dscrStatus } from "./pro-forma";
import { calculateComparison } from "./calculations";

const DEFAULT_TDC = 5_000_000;

/** Build scenario result from a config. */
export function evaluateScenario(config: ScenarioConfig): ScenarioResult {
  const result = calculateComparison({
    tdc: config.totalDevelopmentCost,
    eligibleBasisPct: config.eligibleBasisPct,
    applicableFraction: config.applicableFraction,
    creditType: config.creditType,
    equityPricing: config.equityPricing,
  });
  return {
    config,
    equity: result.withBoost.equity,
    annualCredits: result.withBoost.annualCredits,
    totalCredits: result.withBoost.totalCredits,
    qualifiedBasis: result.withBoost.qualifiedBasis,
  };
}

/** Compare multiple scenarios side-by-side. */
export function compareScenarios(configs: ScenarioConfig[]): ScenarioResult[] {
  return configs.map(evaluateScenario);
}

/** Default 9% vs 4% scenarios. */
export function buildDefaultScenarios(
  totalDevelopmentCost: number,
  eligibleBasisPct: number,
  applicableFraction: number,
  equityPricing: number,
  boostApplied: boolean,
): ScenarioConfig[] {
  const base = {
    name: "Base",
    totalDevelopmentCost,
    eligibleBasisPct,
    applicableFraction,
    equityPricing,
  };
  return [
    {
      ...base,
      id: "9pct-boost",
      name: "9% + Boost",
      creditType: "9%" as const,
      boostApplied: boostApplied,
      label: "9% + 30% Boost",
    },
    {
      ...base,
      id: "9pct-noboost",
      name: "9% No Boost",
      creditType: "9%" as const,
      boostApplied: false,
      label: "9% (no boost)",
    },
    {
      ...base,
      id: "4pct-boost",
      name: "4% + Boost",
      creditType: "4%" as const,
      boostApplied: boostApplied,
      label: "4% + 30% Boost",
    },
    {
      ...base,
      id: "4pct-noboost",
      name: "4% No Boost",
      creditType: "4%" as const,
      boostApplied: false,
      label: "4% (no boost)",
    },
  ];
}
