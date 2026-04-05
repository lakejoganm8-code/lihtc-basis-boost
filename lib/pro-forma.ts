import {
  ProFormaAssumptions,
  ProFormaYear,
  ProFormaResult,
} from "./types";

/** Project a single value with annual compounding. */
function escalate(base: number, rate: number, yearOffset: number): number {
  return base * Math.pow(1 + rate / 100, yearOffset);
}

/** Build one year of the pro forma. */
function buildYear(
  year: number,
  yearOffset: number, // 0-indexed for escalation math
  prior: ProFormaYear | null,
  a: ProFormaAssumptions,
  boostApplied: boolean,
  qualifiedBasisBase: number,
  creditRate: number,
): ProFormaYear {
  // Income
  const grossPotentialRent = escalate(a.grossPotentialRent, a.rentGrowth, yearOffset);
  const otherIncome = escalate(a.otherIncome, a.rentGrowth, yearOffset); // Other income follows rent growth
  const vacancyLoss = grossPotentialRent * (a.vacancyRate / 100);
  const effectiveGrossIncome = grossPotentialRent + otherIncome - vacancyLoss;

  // Expenses
  const propertyMgmt = effectiveGrossIncome * (a.propertyMgmtPct / 100);
  const taxes = escalate(a.taxes, a.expenseGrowth, yearOffset);
  const insurance = escalate(a.insurance, a.expenseGrowth, yearOffset);
  const utilities = escalate(a.utilities, a.expenseGrowth, yearOffset);
  const maintenance = escalate(a.maintenance, a.expenseGrowth, yearOffset);
  const personnel = escalate(a.personnel, a.expenseGrowth, yearOffset);
  const admin = escalate(a.admin, a.expenseGrowth, yearOffset);
  const reserveContrib = a.reserveContrib > 0
    ? escalate(a.reserveContrib, a.expenseGrowth, yearOffset)
    : 0;

  const totalOperatingExpenses =
    propertyMgmt + taxes + insurance + utilities + maintenance +
    personnel + admin + reserveContrib;

  // NOI & DSCR
  const netOperatingIncome = effectiveGrossIncome - totalOperatingExpenses;

  // Debt service: escalate if adjustable rate
  const debtService = a.annualDebtService > 0
    ? escalate(a.annualDebtService, a.debtServiceGrowth, yearOffset)
    : 0;

  const cashFlowBeforeTax = netOperatingIncome - debtService;
  const dscr = debtService > 0 ? netOperatingIncome / debtService : Infinity;

  // Cumulative
  const cumulativeCashFlow = (prior ? prior.cumulativeCashFlow : 0) + cashFlowBeforeTax;
  const deficit = cashFlowBeforeTax < 0;
  const cumulativeDeficit = (prior ? prior.cumulativeDeficit : 0) + (deficit ? Math.abs(cashFlowBeforeTax) : 0);

  return {
    year,
    yearOffset,
    grossPotentialRent,
    otherIncome,
    vacancyLoss,
    effectiveGrossIncome,
    propertyMgmt,
    taxes,
    insurance,
    utilities,
    maintenance,
    personnel,
    admin,
    reserveContrib,
    totalOperatingExpenses,
    netOperatingIncome,
    debtService,
    cashFlowBeforeTax,
    dscr,
    deficit,
    cumulativeCashFlow,
    cumulativeDeficit,
  };
}

/** Run the full multi-year pro forma projection. */
export function calculateProForma(assumptions: ProFormaAssumptions): ProFormaResult {
  const years: ProFormaYear[] = [];
  const a = assumptions;

  // Credit calculation
  const creditRate = a.creditType === "4%" ? 0.04 : 0.09;
  const eligibleBasis = a.totalDevelopmentCost * (a.eligibleBasisPct / 100);
  let qualifiedBasis = eligibleBasis * (a.applicableFraction / 100);
  if (a.boostApplied) {
    qualifiedBasis *= 1.3;
  }
  // 10-year credit period (LIHTC standard)
  const annualCredits = qualifiedBasis * creditRate;
  const totalCredits = annualCredits * 10;
  const equityGenerated = totalCredits * a.equityPricing;

  for (let i = 0; i < a.projectionYears; i++) {
    const year = buildYear(
      i + 1,
      i,
      years.length > 0 ? years[i - 1] : null,
      a,
      a.boostApplied,
      qualifiedBasis,
      creditRate,
    );
    years.push(year);
  }

  // Extract key metrics
  const totalIncome = years.reduce((s, y) => s + y.effectiveGrossIncome, 0);
  const totalExpenses = years.reduce((s, y) => s + y.totalOperatingExpenses, 0);
  const totalNOI = years.reduce((s, y) => s + y.netOperatingIncome, 0);
  const totalDebt = years.reduce((s, y) => s + y.debtService, 0);
  const totalCash = years.reduce((s, y) => s + y.cashFlowBeforeTax, 0);

  const dscrValues = years.filter((y) => y.dscr !== Infinity);
  const noDebtService = dscrValues.length === 0;
  const minDSCR = noDebtService ? 0 : Math.min(...dscrValues.map((y) => y.dscr));
  const minDSCRYear = noDebtService ? 0 : (years.find((y) => y.dscr === minDSCR)?.year ?? 0);
  const avgDSCR = noDebtService ? 0 : dscrValues.reduce((s, y) => s + y.dscr, 0) / dscrValues.length;

  const deficitYears = years.filter((y) => y.deficit).map((y) => y.year);
  const cumulativeDeficitTotal = years[years.length - 1]?.cumulativeDeficit ?? 0;

  return {
    years,
    year1: years[0],
    year15: years.length >= 15 ? years[14] : undefined,
    totalIncome,
    totalOperatingExpenses: totalExpenses,
    totalNOI,
    totalDebtService: totalDebt,
    totalCashFlow: totalCash,
    avgDSCR,
    minDSCR,
    minDSCRYear,
    deficitYears,
    cumulativeDeficitTotal,
    equityGenerated,
  };
}

/** Get a DSCR score for display: pass/fail color. */
export function dscrStatus(dscr: number): "pass" | "warning" | "fail" {
  if (dscr === Infinity) return "pass";
  if (dscr >= 1.25) return "pass";
  if (dscr >= 1.0) return "warning";
  return "fail";
}
