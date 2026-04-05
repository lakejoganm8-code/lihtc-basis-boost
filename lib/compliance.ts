import {
  ComplianceYear,
  ComplianceTimeline,
  YearlyOccupancyData,
  SetAsideComplianceYear,
  Form8609Data,
  ProFormaYear,
} from "./types";
import { checkSetAside } from "./hud-api";

const CREDIT_PERIOD_YEARS = 10;
const COMPLIANCE_PERIOD_YEARS = 15;
const SET_ASIDE_TESTING_PERIOD = 3;

/**
 * Calculate applicable fraction per IRC §42 — the lesser of
 * unit fraction or floor space fraction.
 */
export function calculateApplicableFraction(
  unitFraction: number,
  floorSpaceFraction: number,
): number {
  return Math.min(unitFraction, floorSpaceFraction);
}

/**
 * Build a Form 8609 tracking record from placed-in-service date.
 */
export function calculateForm8609(
  placedInServiceYear: number,
): Form8609Data {
  const creditStartYear = placedInServiceYear;
  const creditPeriodEnd = placedInServiceYear + CREDIT_PERIOD_YEARS - 1;
  const compliancePeriodEnd = placedInServiceYear + COMPLIANCE_PERIOD_YEARS - 1;

  const milestones = [
    { year: placedInServiceYear, label: "Placed in Service (Form 8609, Line 1)" },
    { year: creditStartYear, label: "Credit Period Begins" },
    { year: placedInServiceYear + 1, label: "Year 2 — Set-aside testing ongoing" },
    { year: placedInServiceYear + 2, label: "Year 3 — Set-aside testing period ends" },
    { year: placedInServiceYear + CREDIT_PERIOD_YEARS - 1, label: "Year 10 — Final credit year" },
    { year: placedInServiceYear + CREDIT_PERIOD_YEARS, label: "Year 11 — Extended use period" },
    { year: compliancePeriodEnd, label: "Year 15 — Compliance period ends" },
  ];

  return {
    placedInServiceYear,
    creditStartYear,
    creditPeriodEnd,
    compliancePeriodEnd,
    milestones,
  };
}

/**
 * Track set-aside compliance across multiple years.
 */
export function trackSetAsideCompliance(
  yearlyData: YearlyOccupancyData[],
): SetAsideComplianceYear[] {
  return yearlyData.map((y) => {
    const testResult = checkSetAside(y.totalUnits, y.compliantUnits, y.election);
    return {
      year: y.year,
      totalUnits: y.totalUnits,
      compliantUnits: y.compliantUnits,
      requiredUnits: testResult.requiredUnits,
      met: testResult.met,
      isTestingPeriod: y.year <= SET_ASIDE_TESTING_PERIOD,
    };
  });
}

/**
 * Build one compliance year from a pro forma year and basis parameters.
 */
export function buildComplianceYear(
  yearNum: number,
  proFormaYear: ProFormaYear,
  applicableFraction: number,
  eligibleBasis: number,
  boostApplied: boolean,
  creditRate: number,
): ComplianceYear {
  const qualifiedBasis = eligibleBasis * (applicableFraction / 100) * (yearNum === 1 && boostApplied ? 1.3 : 1);

  // Credits only apply during the 10-year credit period
  const inCreditPeriod = yearNum <= CREDIT_PERIOD_YEARS;
  const annualCredits = inCreditPeriod ? qualifiedBasis * creditRate : 0;

  // Credits are claimed annually; totalCreditsToDate is cumulative
  const totalCreditsToDate = inCreditPeriod ? annualCredits * yearNum : annualCredits * CREDIT_PERIOD_YEARS;

  // Check if applicable fraction dropped below prior year (basis reduction)
  const qualifiedBasisReduction = applicableFraction < 100 && yearNum > 1;

  return {
    year: yearNum,
    applicableFraction,
    qualifiedBasis: Math.round(qualifiedBasis),
    annualCredits: Math.round(annualCredits),
    totalCreditsToDate: Math.round(totalCreditsToDate),
    boostActive: inCreditPeriod && boostApplied,
    deficitFlag: proFormaYear.deficit,
    qualifiedBasisReduction,
    yearType: inCreditPeriod ? "credit" : "compliance",
    netOperatingIncome: Math.round(proFormaYear.netOperatingIncome),
    debtService: Math.round(proFormaYear.debtService),
    dscr: proFormaYear.dscr,
  };
}

/**
 * Build the full 15-year compliance timeline.
 */
export function buildComplianceTimeline(
  proFormaYears: ProFormaYear[],
  eligibleBasis: number,
  applicableFraction: number,
  boostApplied: boolean,
  creditType: "4%" | "9%",
  placedInServiceYear: number,
): ComplianceTimeline {
  const creditRate = creditType === "4%" ? 0.04 : 0.09;

  const years: ComplianceYear[] = proFormaYears.slice(0, COMPLIANCE_PERIOD_YEARS).map((pfy) =>
    buildComplianceYear(pfy.year, pfy, applicableFraction, eligibleBasis, boostApplied, creditRate)
  );

  // Check for qualified basis reduction events
  const basisReductionEvents = years.filter((y) => y.qualifiedBasisReduction).length;
  const deficitYears = years.filter((y) => y.deficitFlag).length;

  const totalEquityGenerated = years.reduce(
    (s, y) => s + y.annualCredits, 0
  ) * (0.95) * CREDIT_PERIOD_YEARS / CREDIT_PERIOD_YEARS; // approximate equity pricing

  const form8609 = calculateForm8609(placedInServiceYear);

  return {
    years,
    totalEquityGenerated: Math.round(totalEquityGenerated),
    complianceEndYear: form8609.compliancePeriodEnd,
    creditPeriodEnd: form8609.creditPeriodEnd,
    placedInServiceYear: form8609.placedInServiceYear,
    setAsideViolations: deficitYears,
    basisReductionEvents,
  };
}
