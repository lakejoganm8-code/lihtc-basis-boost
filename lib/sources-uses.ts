import { SourcesUsesInputs, SourcesUsesSummary, SourcesUsesResult, UseCategory, SourceCategory } from "./types";
import { calculateComparison } from "./calculations";

/** Calculate the Sources & Uses summary with gap analysis. */
export function calculateSourcesUsesSummary(inputs: SourcesUsesInputs): SourcesUsesSummary {
  const totalUses = usesTotal(inputs.uses);
  const totalSources = sourcesTotal(inputs.sources);
  const gap = totalUses - totalSources;

  const usesPct: Record<UseCategory, number> = {} as any;
  const sourcesPct: Record<SourceCategory, number> = {} as any;

  for (const u of inputs.uses) {
    usesPct[u.category] = totalUses > 0 ? (u.value / totalUses) * 100 : 0;
  }
  for (const s of inputs.sources) {
    sourcesPct[s.category] = totalSources > 0 ? (s.value / totalSources) * 100 : 0;
  }

  return { totalUses, totalSources, gap, usesPct, sourcesPct };
}

/** Calculate the full Sources & Uses result including LIHTC credit comparison. */
export function calculateSourcesUsesResult(inputs: SourcesUsesInputs): SourcesUsesResult {
  const summary = calculateSourcesUsesSummary(inputs);

  const financialInputs = {
    tdc: summary.totalUses,
    eligibleBasisPct: inputs.eligibleBasisPct,
    applicableFraction: inputs.applicableFraction,
    creditType: inputs.creditType,
    equityPricing: inputs.equityPricing,
  };

  const comparison = calculateComparison(financialInputs);

  return {
    summary,
    uses: inputs.uses,
    sources: inputs.sources,
    withoutBoost: comparison.withoutBoost,
    withBoost: comparison.withBoost,
    equityDelta: comparison.equityDelta,
    boostPct: comparison.boostPct,
  };
}

export function usesTotal(uses: SourcesUsesInputs["uses"]): number {
  return uses.reduce((sum, u) => sum + u.value, 0);
}

export function sourcesTotal(sources: SourcesUsesInputs["sources"]): number {
  return sources.reduce((sum, s) => sum + s.value, 0);
}
