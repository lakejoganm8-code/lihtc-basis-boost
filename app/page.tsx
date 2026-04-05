"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AddressForm } from "@/components/address-form";
import { FinancialInputsForm } from "@/components/financial-inputs";
import { SourcesUsesForm } from "@/components/sources-uses-form";
import { EligibilityBadges } from "@/components/eligibility-badge";
import { Results } from "@/components/results";
import { CapitalStackChart } from "@/components/capital-stack-chart";
import { LoadingSpinner } from "@/components/loading-spinner";
import { GeocodeResponse, EligibilityResponse, FinancialInputs, ComparisonResult, SourcesUsesInputs, SourcesUsesResult, ProFormaAssumptions } from "@/lib/types";
import { calculateComparison } from "@/lib/calculations";
import { calculateSourcesUsesResult } from "@/lib/sources-uses";
import { ProFormaTable } from "@/components/pro-forma-table";
import { DscrIndicator } from "@/components/dscr-indicator";
import { ScenarioComparison } from "@/components/scenario-comparison";
import { SensitivitySliders } from "@/components/sensitivity-sliders";
import { UnitMixBuilder } from "@/components/unit-mix-builder";
import { RentComparison } from "@/components/rent-comparison";
import { ComplianceTimelineView } from "@/components/compliance-timeline";
import { SetAsideChecker } from "@/components/set-aside-checker";
import { AmiApiResponse, FairMarketRent } from "@/lib/types";
import { buildComplianceTimeline } from "@/lib/compliance";

const LocationMap = dynamic(
  () => import("@/components/location-map").then((m) => m.LocationMap),
  { ssr: false, loading: () => <div className="h-[450px] bg-slate-100 rounded-xl animate-pulse" /> }
);

type Step = "address" | "eligibility-done" | "financial" | "financial-detailed" | "results" | "proforma" | "scenarios" | "market" | "compliance";

export default function Home() {
  const [step, setStep] = useState<Step>("address");
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [geocoded, setGeocoded] = useState<GeocodeResponse | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [sourcesUsesResult, setSourcesUsesResult] = useState<SourcesUsesResult | null>(null);
  const [error, setError] = useState("");

  // Phase 1: Simple vs detailed capital stack
  const [phase1Enabled, setPhase1Enabled] = useState(false);

  // Pro Forma parameters (carried from financial inputs)
  const [proFormaParams, setProFormaParams] = useState<{
    totalDevelopmentCost: number;
    eligibleBasisPct: number;
    applicableFraction: number;
    creditType: "4%" | "9%";
    equityPricing: number;
    boostApplied: boolean;
  } | null>(null);

  // Phase 4: Market & Rent Context data
  const [amiData, setAmiData] = useState<AmiApiResponse | null>(null);
  const [fmrData, setFmrData] = useState<FairMarketRent | null>(null);

  // Map interaction
  const [mapSelection, setMapSelection] = useState<[number, number] | null>(null);

  async function handleAddressSubmit(address: { street: string; city: string; state: string; zip: string }) {
    setGeocodeLoading(true);
    setError("");
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(address),
      });
      const data: GeocodeResponse = await res.json();

      if (!data.matched) {
        setError("Address not found. Please check and try again.");
        return;
      }

      setGeocoded(data);
      if (data.lat != null && data.lng != null) {
        setMapSelection([data.lat, data.lng] as [number, number]);
      }

      const eligRes = await fetch("/api/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tract: data.tract,
          countyFips: data.countyFips,
          stateFips: data.stateFips,
          fullGeoId: data.fullGeoId,
        }),
      });
      const eligData: EligibilityResponse = await eligRes.json();
      setEligibility(eligData);
      await fetchMarketData(data.state, data.county || undefined);
      setStep("eligibility-done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGeocodeLoading(false);
    }
  }

  async function handleMapClick(lat: number, lng: number, tract: string, stateFips: string, countyFips: string) {
    const fullGeoId = `${stateFips}${countyFips}${tract}`;
    // Lookup state name from FIPS for AMI data
    const stateNames: Record<string, string> = { "36": "NY", "34": "NJ", "09": "CT" };
    const stateName = stateNames[stateFips] || "NY";
    setGeocoded({
      matched: true,
      tract,
      countyFips,
      stateFips,
      fullGeoId,
      county: "",
      state: stateName,
      lat,
      lng,
    });
    setMapSelection([lat, lng] as [number, number]);

    setGeocodeLoading(true);
    setError("");
    try {
      const eligRes = await fetch("/api/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tract, countyFips, stateFips, fullGeoId }),
      });
      const eligData: EligibilityResponse = await eligRes.json();
      setEligibility(eligData);
      await fetchMarketData(stateName);
      setStep("eligibility-done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGeocodeLoading(false);
    }
  }

  // Simple financial inputs
  async function handleFinancialSubmit(inputs: FinancialInputs) {
    setCalcLoading(true);
    try {
      const result = calculateComparison(inputs);
      setComparison(result);
      setSourcesUsesResult(null);
      setProFormaParams({
        totalDevelopmentCost: inputs.tdc,
        eligibleBasisPct: inputs.eligibleBasisPct,
        applicableFraction: inputs.applicableFraction,
        creditType: inputs.creditType,
        equityPricing: inputs.equityPricing,
        boostApplied: eligibility?.eligible ?? false,
      });
      setStep("proforma");
    } catch {
      setError("Calculation failed.");
    } finally {
      setCalcLoading(false);
    }
  }

  // Phase 1: Sources & Uses
  async function handleSourcesUsesSubmit(inputs: SourcesUsesInputs) {
    setCalcLoading(true);
    try {
      const { calculateSourcesUsesSummary } = await import("@/lib/sources-uses");
      const summary = calculateSourcesUsesSummary(inputs);
      const result = calculateSourcesUsesResult(inputs);
      setSourcesUsesResult(result);
      setComparison(null);
      setProFormaParams({
        totalDevelopmentCost: summary.totalUses,
        eligibleBasisPct: inputs.eligibleBasisPct,
        applicableFraction: inputs.applicableFraction,
        creditType: inputs.creditType,
        equityPricing: inputs.equityPricing,
        boostApplied: eligibility?.eligible ?? false,
      });
      setStep("proforma");
    } catch {
      setError("Calculation failed.");
    } finally {
      setCalcLoading(false);
    }
  }

  async function fetchMarketData(state: string, county?: string) {
    try {
      const [amiRes, fmrRes] = await Promise.all([
        fetch("/api/hud-ami", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state, county }),
        }),
        fetch("/api/hud-fmr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state }),
        }),
      ]);
      if (amiRes.ok) setAmiData(await amiRes.json());
      if (fmrRes.ok) setFmrData(await fmrRes.json());
    } catch {
      // Non-blocking — market data is optional
    }
  }

  function reset() {
    setStep("address");
    setGeocoded(null);
    setEligibility(null);
    setComparison(null);
    setSourcesUsesResult(null);
    setProFormaParams(null);
    setError("");
    setMapSelection(null);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">LIHTC Basis Boost Impact Tool</h1>
          <p className="text-blue-600 mt-1 text-sm font-medium">NYC Tri-State Area — New York · New Jersey · Connecticut</p>
          <p className="text-gray-600 mt-2 text-lg">
            Determine if your property qualifies for the 30% basis boost under IRC Section 42(d)(5)(C)
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mb-8 text-sm">
          <span className={`px-3 py-1 rounded-full font-medium ${step === "address" ? "bg-blue-600 text-white" : "bg-emerald-100 text-emerald-700"}`}>
            1. Address
          </span>
          <span className="text-gray-400">→</span>
          <span className={`px-3 py-1 rounded-full font-medium ${step === "eligibility-done" ? "bg-blue-600 text-white" : step === "address" ? "bg-gray-200 text-gray-400" : "bg-emerald-100 text-emerald-700"}`}>
            2. Eligibility
          </span>
          <span className="text-gray-400">→</span>
          <span className={`px-3 py-1 rounded-full font-medium ${step === "financial" || step === "financial-detailed" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}>
            3. Financials
          </span>
          <span className="text-gray-400">→</span>
          <span className={`px-3 py-1 rounded-full font-medium ${step === "results" ? "bg-blue-600 text-white" : step === "proforma" || step === "scenarios" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-400"}`}>
            4. Results
          </span>
          <span className="text-gray-400">→</span>
          <span className={`px-3 py-1 rounded-full font-medium ${step === "market" ? "bg-emerald-100 text-emerald-700" : step === "compliance" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-400"}`}>
            5. Advanced
          </span>
          <span className="text-gray-400">→</span>
          <span className={`px-3 py-1 rounded-full font-medium ${step === "compliance" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-400"}`}>
            6. Compliance
          </span>
        </div>

        <div className="space-y-6">
          {/* Step 1: Map + Address, side-by-side */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Property Location</h2>
            <p className="text-sm text-gray-500 mb-4">Type an address or click on the map to select a location.</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-2">
                <AddressForm onSubmit={handleAddressSubmit} loading={geocodeLoading} />
              </div>
              <div className="md:col-span-3">
                <LocationMap
                  onLocationSelect={handleMapClick}
                  selectedLocation={mapSelection}
                  eligibilityStatus={eligibility ? { isQCT: eligibility.isQCT, isDDA: eligibility.isDDA } : null}
                />
              </div>
            </div>
          </section>

          {geocodeLoading && <LoadingSpinner />}

          {(step === "eligibility-done" || step === "financial" || step === "financial-detailed" || step === "results") && geocoded && eligibility && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Eligibility Results</h2>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                <span className="font-medium">Census Tract:</span> {geocoded.tract}
                {geocoded.county && (
                  <>
                    {" · "}
                    <span className="font-medium">County:</span> {geocoded.county}, {geocoded.state}
                  </>
                )}
              </div>
              <EligibilityBadges eligibility={eligibility} />
              {step === "eligibility-done" && (
                <button
                  onClick={() => setStep("financial")}
                  className="mt-4 w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Enter Financial Details
                </button>
              )}
            </section>
          )}

          {/* Step 3: Financial Details with Simple/Detailed toggle */}
          {(step === "financial" || step === "financial-detailed" || step === "results") && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Financial Details</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Simple</span>
                  <button
                    onClick={() => {
                      setPhase1Enabled(!phase1Enabled);
                      if (phase1Enabled) {
                        setStep("financial");
                      } else {
                        setStep("financial-detailed");
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${phase1Enabled ? "bg-emerald-600" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${phase1Enabled ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className="text-xs text-gray-500">Capital Stack</span>
                </div>
              </div>

              {!phase1Enabled ? (
                <FinancialInputsForm onSubmit={handleFinancialSubmit} loading={calcLoading} />
              ) : (
                <SourcesUsesForm onSubmit={handleSourcesUsesSubmit} loading={calcLoading} />
              )}
            </section>
          )}

          {calcLoading && <LoadingSpinner />}

          {/* Results with capital stack chart */}
          {step === "results" && sourcesUsesResult && (
            <SourcesUsesResultsSection
              result={sourcesUsesResult}
              eligibility={eligibility!}
              onContinue={() => setStep("proforma")}
            />
          )}

          {step === "results" && comparison && !sourcesUsesResult && eligibility && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Impact Analysis</h2>
              <Results comparison={comparison} eligibility={eligibility} />
              <div className="mt-4">
                <button
                  onClick={() => setStep("proforma")}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Continue to Multi-Year Pro Forma →
                </button>
              </div>
            </section>
          )}

          {/* Phase 2: Pro Forma */}
          {(step === "proforma" || step === "scenarios") && proFormaParams && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">15-Year Pro Forma</h2>
                <button
                  onClick={() => setStep("scenarios")}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Scenario Analysis →
                </button>
              </div>
              <ProFormaTable
                totalDevelopmentCost={proFormaParams.totalDevelopmentCost}
                eligibleBasisPct={proFormaParams.eligibleBasisPct}
                applicableFraction={proFormaParams.applicableFraction}
                creditType={proFormaParams.creditType}
                equityPricing={proFormaParams.equityPricing}
                boostApplied={proFormaParams.boostApplied}
              />
            </section>
          )}

          {/* Phase 3: Scenario Engine */}
          {step === "scenarios" && proFormaParams && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Scenario &amp; Sensitivity Analysis</h2>
                <button
                  onClick={() => setStep("proforma")}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  ← Back to Pro Forma
                </button>
              </div>

              {/* Scenario comparison cards */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Compare Scenarios</h3>
                <ScenarioComparison
                  totalDevelopmentCost={proFormaParams.totalDevelopmentCost}
                  eligibleBasisPct={proFormaParams.eligibleBasisPct}
                  applicableFraction={proFormaParams.applicableFraction}
                  equityPricing={proFormaParams.equityPricing}
                  boostApplied={proFormaParams.boostApplied}
                />
              </div>

              {/* Sensitivity analysis */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Sensitivity Analysis</h3>
                <SensitivitySliders />
              </div>

              {/* Link to Phase 4 */}
              {geocoded && (
                <div>
                  <button
                    onClick={() => setStep("market")}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    Continue to Market & Rent Context →
                  </button>
                  {" | "}
                  <button
                    onClick={() => setStep("compliance")}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    Compliance Dashboard →
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Phase 4: Market & Rent Context */}
          {step === "market" && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Market & Rent Context</h2>
                <button
                  onClick={() => setStep("scenarios")}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  ← Back to Scenarios
                </button>
              </div>

              {/* Unit Mix Builder */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Unit Mix Builder</h3>
                <UnitMixBuilder
                  state={geocoded?.state}
                  county={geocoded?.county}
                  amiData={amiData}
                />
              </div>

              {/* Rent Comparison vs FMR */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Fair Market Rent Comparison</h3>
                <RentComparison
                  fmrData={fmrData ? {
                    "0": fmrData.zeroBr ?? 0,
                    "1": fmrData.oneBr ?? 0,
                    "2": fmrData.twoBr ?? 0,
                    "3": fmrData.threeBr ?? 0,
                    "4": fmrData.fourBr ?? 0,
                  } : null}
                  state={geocoded?.state || "NY"}
                />
              </div>

              {/* Link to Phase 5 */}
              {proFormaParams && (
                <div>
                  <button
                    onClick={() => setStep("compliance")}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    Continue to 15-Year Compliance Dashboard →
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Phase 5: Compliance Dashboard */}
          {step === "compliance" && proFormaParams && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">15-Year Compliance Dashboard</h2>
                <button
                  onClick={() => setStep("market")}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  ← Back to Market & Rent
                </button>
              </div>

              {/* Compliance Timeline */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Compliance Timeline & Form 8609</h3>
                <ComplianceTimelineView
                  timeline={buildComplianceTimeline(
                    Array.from({ length: 15 }, (_, i) => ({
                      year: i + 1,
                      yearOffset: i,
                      grossPotentialRent: 0,
                      otherIncome: 0,
                      vacancyLoss: 0,
                      effectiveGrossIncome: 0,
                      propertyMgmt: 0,
                      taxes: 0,
                      insurance: 0,
                      utilities: 0,
                      maintenance: 0,
                      personnel: 0,
                      admin: 0,
                      reserveContrib: 0,
                      totalOperatingExpenses: 0,
                      netOperatingIncome: 100_000,
                      debtService: 75_000,
                      cashFlowBeforeTax: 25_000,
                      dscr: 1.33,
                      deficit: false,
                      cumulativeCashFlow: 0,
                      cumulativeDeficit: 0,
                    })),
                    proFormaParams.totalDevelopmentCost * (proFormaParams.eligibleBasisPct / 100),
                    proFormaParams.applicableFraction,
                    proFormaParams.boostApplied,
                    proFormaParams.creditType,
                    new Date().getFullYear(),
                  )}
                />
              </div>

              {/* Set-aside checker */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Set-aside Compliance Checker</h3>
                <SetAsideChecker totalUnits={10} />
              </div>
            </section>
          )}

          {step !== "address" && (
            <button
              onClick={reset}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              Start over
            </button>
          )}
        </div>

        <footer className="mt-12 text-center text-xs text-gray-400">
          <p>This tool is for illustrative purpose only. Not financial or tax advice.</p>
          <p className="mt-1">
            Data sources: Census TIGER/Line (map), Census Geocoder (eligibility), HUD QCT/DDA (designation).
          </p>
        </footer>
      </div>
    </main>
  );
}

function SourcesUsesResultsSection({
  result,
  eligibility,
  onContinue,
}: {
  result: SourcesUsesResult;
  eligibility: EligibilityResponse;
  onContinue?: () => void;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Capital Stack Analysis</h2>

      {/* Capital Stack Chart */}
      <CapitalStackChart
        summary={result.summary}
        uses={result.uses}
        sources={result.sources}
      />

      {/* Results comparison */}
      <Results comparison={{
        withoutBoost: result.withoutBoost,
        withBoost: result.withBoost,
        equityDelta: result.equityDelta,
        boostPct: result.boostPct,
      }} eligibility={eligibility} />

      {onContinue && (
        <div className="mt-4">
          <button
            onClick={onContinue}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Continue to Multi-Year Pro Forma →
          </button>
        </div>
      )}
    </section>
  );
}
