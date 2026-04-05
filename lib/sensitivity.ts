import { TornadoBar, BreakevenResult } from "./types";
import { calculateProForma, dscrStatus } from "./pro-forma";

// Baseline pro forma assumptions
const baseline = () =>
  calculateProForma({
    projectionYears: 15,
    grossPotentialRent: 500_000,
    otherIncome: 15_000,
    vacancyRate: 5,
    propertyMgmtPct: 5,
    taxes: 60_000,
    insurance: 25_000,
    utilities: 30_000,
    maintenance: 20_000,
    personnel: 15_000,
    admin: 10_000,
    reserveContrib: 0,
    rentGrowth: 2.5,
    expenseGrowth: 2.5,
    annualDebtService: 180_000,
    debtServiceGrowth: 0,
    creditType: "9%" as const,
    applicableFraction: 100,
    equityPricing: 0.95,
    boostApplied: true,
    totalDevelopmentCost: 5_000_000,
    eligibleBasisPct: 80,
  });

interface TestConfig {
  key: string;
  name: string;
  baseValue: number;
  perturbedValue: number;
}

/** Build tornado bars: impact of each variable on total cash flow. */
export function calculateTornadoBars(): TornadoBar[] {
  const baseResult = baseline();
  const baseCF = baseResult.totalCashFlow;

  // Each variable test: change this param, recalc, get delta
  const tests: TestConfig[] = [
    { key: "creditPrice", name: "Credit Price", baseValue: 0.95, perturbedValue: 1.15 },
    { key: "vacancyRate", name: "Vacancy Rate", baseValue: 5, perturbedValue: 10 },
    { key: "annualDebtService", name: "Interest Rate (via Debt Service)", baseValue: 180_000, perturbedValue: 210_000 },
    { key: "expenseGrowth", name: "Expense Growth", baseValue: 2.5, perturbedValue: 4 },
    { key: "grossPotentialRent", name: "Rent Level", baseValue: 500_000, perturbedValue: 450_000 },
    { key: "totalDevelopmentCost", name: "Cost / Unit (TDC)", baseValue: 5_000_000, perturbedValue: 5_500_000 },
  ];

  const bars: TornadoBar[] = [];

  for (const test of tests) {
    const perturbed = calculateProForma({
      projectionYears: 15,
      grossPotentialRent: test.key === "grossPotentialRent" ? test.perturbedValue : 500_000,
      otherIncome: 15_000,
      vacancyRate: test.key === "vacancyRate" ? test.perturbedValue : 5,
      propertyMgmtPct: 5,
      taxes: 60_000,
      insurance: 25_000,
      utilities: 30_000,
      maintenance: 20_000,
      personnel: 15_000,
      admin: 10_000,
      reserveContrib: 0,
      rentGrowth: 2.5,
      expenseGrowth: test.key === "expenseGrowth" ? test.perturbedValue : 2.5,
      annualDebtService: test.key === "annualDebtService" ? test.perturbedValue : 180_000,
      debtServiceGrowth: 0,
      creditType: "9%" as const,
      applicableFraction: 100,
      equityPricing: test.key === "creditPrice" ? test.perturbedValue : 0.95,
      boostApplied: true,
      totalDevelopmentCost: test.key === "totalDevelopmentCost" ? test.perturbedValue : 5_000_000,
      eligibleBasisPct: 80,
    });

    const delta = perturbed.totalCashFlow - baseCF;
    bars.push({
      param: test.name,
      impact: Math.abs(delta),
      direction: delta >= 0 ? "positive" : "negative",
      value: delta,
      baseline: baseCF,
    });
  }

  // Sort by impact descending
  bars.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  return bars;
}

/** Find the minimum credit pricing that makes Year 1 DSCR ≥ 1.25x (breakeven). */
export function calculateBreakeven(): BreakevenResult {
  // First check if even at max price it's feasible
  const maxCheck = calculateProForma({
    projectionYears: 15,
    grossPotentialRent: 500_000,
    otherIncome: 15_000,
    vacancyRate: 5,
    propertyMgmtPct: 5,
    taxes: 60_000,
    insurance: 25_000,
    utilities: 30_000,
    maintenance: 20_000,
    personnel: 15_000,
    admin: 10_000,
    reserveContrib: 0,
    rentGrowth: 2.5,
    expenseGrowth: 2.5,
    annualDebtService: 180_000,
    debtServiceGrowth: 0,
    creditType: "9%" as const,
    applicableFraction: 100,
    equityPricing: 10,
    boostApplied: true,
    totalDevelopmentCost: 5_000_000,
    eligibleBasisPct: 80,
  });

  // DSCR doesn't depend on equityPricing, it depends on NOI vs debt service
  // So "breakeven" here means: minimum NOI relative to debt service
  // A better breakeven: what grossPotentialRent would make DSCR >= 1.25?
  // Let's binary search on required rent level

  let lo = 0;
  let hi = 5_000_000;

  const hiCheck = calculateProForma({
    projectionYears: 15,
    grossPotentialRent: hi,
    otherIncome: 15_000,
    vacancyRate: 5,
    propertyMgmtPct: 5,
    taxes: 60_000,
    insurance: 25_000,
    utilities: 30_000,
    maintenance: 20_000,
    personnel: 15_000,
    admin: 10_000,
    reserveContrib: 0,
    rentGrowth: 2.5,
    expenseGrowth: 2.5,
    annualDebtService: 180_000,
    debtServiceGrowth: 0,
    creditType: "9%" as const,
    applicableFraction: 100,
    equityPricing: 0.95,
    boostApplied: true,
    totalDevelopmentCost: 5_000_000,
    eligibleBasisPct: 80,
  });

  const feasible = hiCheck.year1.dscr >= 1.25;

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const result = calculateProForma({
      projectionYears: 15,
      grossPotentialRent: mid,
      otherIncome: 15_000,
      vacancyRate: 5,
      propertyMgmtPct: 5,
      taxes: 60_000,
      insurance: 25_000,
      utilities: 30_000,
      maintenance: 20_000,
      personnel: 15_000,
      admin: 10_000,
      reserveContrib: 0,
      rentGrowth: 2.5,
      expenseGrowth: 2.5,
      annualDebtService: 180_000,
      debtServiceGrowth: 0,
      creditType: "9%" as const,
      applicableFraction: 100,
      equityPricing: 0.95,
      boostApplied: true,
      totalDevelopmentCost: 5_000_000,
      eligibleBasisPct: 80,
    });

    if (result.year1.dscr >= 1.25) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return {
    minRentRequired: hi,
    feasible,
  };
}
