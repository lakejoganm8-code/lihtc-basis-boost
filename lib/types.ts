export interface GeocodeRequest {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface GeocodeResponse {
  matched: boolean;
  tract: string;
  countyFips: string;
  stateFips: string;
  fullGeoId: string;
  county: string;
  state: string;
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

export interface FinancialInputs {
  tdc: number;
  eligibleBasisPct: number;
  applicableFraction: number;
  creditType: CreditType;
  equityPricing: number;
}

export interface CalculationResult {
  eligibleBasis: number;
  qualifiedBasis: number;
  annualCredits: number;
  totalCredits: number;
  equity: number;
}

export interface ComparisonResult {
  withoutBoost: CalculationResult;
  withBoost: CalculationResult;
  equityDelta: number;
  boostPct: number;
}
