export interface GeocodeRequest {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface ReverseGeocodeRequest {
  lat: number;
  lng: number;
}

export interface GeocodeResponse {
  matched: boolean;
  tract: string;
  countyFips: string;
  stateFips: string;
  fullGeoId: string;
  county: string;
  state: string;
  lat?: number;
  lng?: number;
}

export interface EligibilityRequest {
  tract: string;
  countyFips: string;
  stateFips: string;
  fullGeoId: string;
}

export interface EligibilityResponse {
  isQCT: boolean;
  isDDA: boolean;
  eligible: boolean;
  reason: string;
}

export type CreditType = "4%" | "9%";

// Simple financial inputs (legacy)
export interface FinancialInputs {
  tdc: number;
  eligibleBasisPct: number;
  applicableFraction: number;
  creditType: CreditType;
  equityPricing: number;
}

// Phase 1: Sources & Uses
export type UseCategory = "land" | "construction" | "soft" | "developerFee" | "financing" | "operatingReserve" | "replacementReserve" | "contingency";
export type SourceCategory = "constructionLoan" | "permanentDebt" | "lihtcEquity" | "landContribution" | "deferredDevFee" | "stateSubsidy" | "bonds" | "other";

export const useLabels: [UseCategory, string][] = [
  ["land", "Land Acquisition"],
  ["construction", "Hard Construction"],
  ["soft", "Soft Costs"],
  ["developerFee", "Developer Fee"],
  ["financing", "Financing Costs"],
  ["operatingReserve", "Operating Reserve"],
  ["replacementReserve", "Replacement Reserve"],
  ["contingency", "Contingency"],
];

export const sourceLabels: [SourceCategory, string][] = [
  ["constructionLoan", "Construction Loan"],
  ["permanentDebt", "Permanent Debt"],
  ["lihtcEquity", "LIHTC Equity"],
  ["landContribution", "Land Contribution"],
  ["deferredDevFee", "Deferred Developer Fee"],
  ["stateSubsidy", "State / Subsidy Grants"],
  ["bonds", "Tax-Exempt Bonds"],
  ["other", "Other Sources"],
];

// Default values for the form
export const DEFAULT_ELIGIBLE_BASIS_PCT = 80;
export const DEFAULT_APPLICABLE_FRACTION = 100;
export const DEFAULT_EQUITY_PRICING = 0.95;

export interface UseLineItem {
  category: UseCategory;
  label: string;
  value: number;
}

export interface SourceLineItem {
  category: SourceCategory;
  label: string;
  value: number;
}

export interface SourcesUsesInputs {
  uses: UseLineItem[];
  sources: SourceLineItem[];
  eligibleBasisPct: number;
  applicableFraction: number;
  creditType: CreditType;
  equityPricing: number;
}

export interface SourcesUsesSummary {
  totalUses: number;
  totalSources: number;
  gap: number; // positive = shortfall, negative = overage
  usesPct: Record<UseCategory, number>;
  sourcesPct: Record<SourceCategory, number>;
}

export interface CalculationResult {
  eligibleBasis: number;
  qualifiedBasis: number;
  annualCredits: number;
  totalCredits: number;
  equity: number;
}

export interface SourcesUsesResult {
  summary: SourcesUsesSummary;
  uses: UseLineItem[];
  sources: SourceLineItem[];
  withoutBoost: CalculationResult;
  withBoost: CalculationResult;
  equityDelta: number;
  boostPct: number;
}

export interface ComparisonResult {
  withoutBoost: CalculationResult;
  withBoost: CalculationResult;
  equityDelta: number;
  boostPct: number;
}

// ============================================================
// Phase 2: Multi-Year Pro Forma
// ============================================================

export interface ProFormaAssumptions {
  projectionYears: number; // 15 or 30

  // Income
  grossPotentialRent: number; // Year 1 annual
  otherIncome: number;
  vacancyRate: number; // %

  // Expenses
  propertyMgmtPct: number; // % of EGI
  taxes: number;
  insurance: number;
  utilities: number;
  maintenance: number;
  personnel: number;
  admin: number;
  reserveContrib: number; // annual reserve contribution

  // Escalation rates (annual %)
  rentGrowth: number;
  expenseGrowth: number;

  // Debt
  annualDebtService: number; // Year 1
  debtServiceGrowth: number; // for adjustable rate

  // Boost
  creditType: CreditType;
  applicableFraction: number;
  equityPricing: number;
  boostApplied: boolean;
  totalDevelopmentCost: number; // or from Phase 1 Uses total
  eligibleBasisPct: number;
}

export interface ProFormaYear {
  year: number;
  yearOffset: number;

  // Income
  grossPotentialRent: number;
  otherIncome: number;
  vacancyLoss: number;
  effectiveGrossIncome: number;

  // Expenses
  propertyMgmt: number;
  taxes: number;
  insurance: number;
  utilities: number;
  maintenance: number;
  personnel: number;
  admin: number;
  reserveContrib: number;
  totalOperatingExpenses: number;

  // NOI & Cash Flow
  netOperatingIncome: number;
  debtService: number;
  cashFlowBeforeTax: number;
  dscr: number;

  // Flags
  deficit: boolean;

  // Cumulative
  cumulativeCashFlow: number;
  cumulativeDeficit: number;
}

export interface ProFormaResult {
  years: ProFormaYear[];
  // Key years for highlighting
  year1: ProFormaYear;
  year15: ProFormaYear | undefined;
  // Aggregate metrics
  totalIncome: number;
  totalOperatingExpenses: number;
  totalNOI: number;
  totalDebtService: number;
  totalCashFlow: number;
  avgDSCR: number;
  minDSCR: number;
  minDSCRYear: number;
  deficitYears: number[];
  cumulativeDeficitTotal: number;
  // Equity calc
  equityGenerated: number;
}

// ============================================================
// Phase 3: Scenario Engine
// ============================================================

export interface ScenarioConfig {
  id: string;
  name: string;
  boostApplied: boolean;
  creditType: CreditType;
  equityPricing: number;
  totalDevelopmentCost: number;
  eligibleBasisPct: number;
  applicableFraction: number;
  label?: string; // e.g. "9% + Boost", "4% + Bonds"
}

export interface ScenarioResult {
  config: ScenarioConfig;
  equity: number;
  annualCredits: number;
  totalCredits: number;
  qualifiedBasis: number;
}

export interface SensitivityParam {
  name: string;
  key: keyof SensitivityInputs;
  min: number;
  max: number;
  base: number;
  step: number;
  format: (v: number) => string;
}

export interface SensitivityInputs {
  creditPrice: number;
  constructionCostPerUnit: number;
  vacancyRate: number;
  interestRate: number;
  expenseGrowth: number;
}

export interface TornadoBar {
  param: string;
  impact: number;
  direction: "positive" | "negative"; // which direction helps net cash flow
  value: number; // the perturbed value
  baseline: number;
}

export interface BreakevenResult {
  minRentRequired: number;
  feasible: boolean;
}
