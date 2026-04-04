"use client";

import { useState } from "react";
import { AddressForm } from "@/components/address-form";
import { FinancialInputsForm } from "@/components/financial-inputs";
import { EligibilityBadges } from "@/components/eligibility-badge";
import { Results } from "@/components/results";
import { LoadingSpinner } from "@/components/loading-spinner";
import { GeocodeResponse, EligibilityResponse, FinancialInputs, ComparisonResult } from "@/lib/types";
import { calculateComparison } from "@/lib/calculations";

type Step = "address" | "eligibility-done" | "financial" | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("address");
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [geocoded, setGeocoded] = useState<GeocodeResponse | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState("");

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
      setStep("eligibility-done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGeocodeLoading(false);
    }
  }

  async function handleFinancialSubmit(inputs: FinancialInputs) {
    setCalcLoading(true);
    try {
      const result = calculateComparison(inputs);
      setComparison(result);
      setStep("results");
    } catch {
      setError("Calculation failed.");
    } finally {
      setCalcLoading(false);
    }
  }

  function reset() {
    setStep("address");
    setGeocoded(null);
    setEligibility(null);
    setComparison(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">LIHTC Basis Boost Impact Tool</h1>
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
          <span className="text-gray-400">{"\u2192"}</span>
          <span className={`px-3 py-1 rounded-full font-medium ${step === "eligibility-done" ? "bg-blue-600 text-white" : step === "address" ? "bg-gray-200 text-gray-400" : "bg-emerald-100 text-emerald-700"}`}>
            2. Eligibility
          </span>
          <span className="text-gray-400">{"\u2192"}</span>
          <span className={`px-3 py-1 rounded-full font-medium ${step === "financial" ? "bg-blue-600 text-white" : step === "results" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-400"}`}>
            3. Financials
          </span>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Location</h2>
            <AddressForm onSubmit={handleAddressSubmit} loading={geocodeLoading} />
          </section>

          {geocodeLoading && <LoadingSpinner />}

          {(step === "eligibility-done" || step === "financial" || step === "results") && geocoded && eligibility && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Eligibility Results</h2>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                <span className="font-medium">Census Tract:</span> {geocoded.tract} &middot;{" "}
                <span className="font-medium">County:</span> {geocoded.county}, {geocoded.state}
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

          {(step === "financial" || step === "results") && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Financial Details</h2>
              <FinancialInputsForm onSubmit={handleFinancialSubmit} loading={calcLoading} />
            </section>
          )}

          {calcLoading && <LoadingSpinner />}

          {step === "results" && comparison && eligibility && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Impact Analysis</h2>
              <Results comparison={comparison} eligibility={eligibility} />
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
            Data sources: US Census Geocoder (geocoding), HUD QCT/DDA (eligibility).
          </p>
        </footer>
      </div>
    </main>
  );
}
