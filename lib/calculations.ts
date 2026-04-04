import { FinancialInputs, CalculationResult, ComparisonResult } from "./types";

export function calculate(inputs: FinancialInputs, boostApplied: boolean): CalculationResult {
  const eligibleBasis = inputs.tdc * (inputs.eligibleBasisPct / 100);
  let qualifiedBasis = eligibleBasis * (inputs.applicableFraction / 100);

  if (boostApplied) {
    qualifiedBasis *= 1.3;
  }

  const creditRate = inputs.creditType === "4%" ? 0.04 : 0.09;
  const annualCredits = qualifiedBasis * creditRate;
  const totalCredits = annualCredits * 10;
  const equity = totalCredits * inputs.equityPricing;

  return {
    eligibleBasis,
    qualifiedBasis,
    annualCredits,
    totalCredits,
    equity,
  };
}

export function calculateComparison(inputs: FinancialInputs): ComparisonResult {
  const withoutBoost = calculate(inputs, false);
  const withBoost = calculate(inputs, true);
  const equityDelta = withBoost.equity - withoutBoost.equity;
  const boostPct = withoutBoost.equity > 0 ? (equityDelta / withoutBoost.equity) * 100 : 0;

  return {
    withoutBoost,
    withBoost,
    equityDelta,
    boostPct,
  };
}
