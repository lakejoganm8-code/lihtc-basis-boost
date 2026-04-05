import { AmiLimit, HouseholdSize, AmiLevel, AmiApiResponse, UnitDefinition, AmiLevel as AmiTier, SetAsideTest, RentComparisonResult, FairMarketRent } from "./types";

// ============================================
// HUD AMI Data (2024) — NYC Tri-State counties
// Source: HUD Income Limits, approximated for key counties
// ============================================

interface CountyAmiData {
  county: string;
  state: string;
  veryLowIncome: number; // 50% AMI
  limits: Record<AmiLevel, Record<HouseholdSize, { rent: number; income: number }>>;
}

const COUNTY_AMI_DATA: Record<string, CountyAmiData> = {
  // New York - NYC metro area (Bronx, Kings, New York, Queens, Richmond)
  "nyc_metro": {
    county: "New York (NYC Metro)",
    state: "NY",
    veryLowIncome: 33_550,
    limits: {
      30: {
        1: { rent: 506, income: 25_118 },
        2: { rent: 578, income: 28_706 },
        3: { rent: 650, income: 32_294 },
        4: { rent: 721, income: 35_883 },
        5: { rent: 779, income: 38_754 },
        6: { rent: 837, income: 41_625 },
        7: { rent: 895, income: 44_497 },
        8: { rent: 952, income: 47_368 },
      },
      40: {
        1: { rent: 674, income: 33_490 },
        2: { rent: 771, income: 38_274 },
        3: { rent: 866, income: 43_059 },
        4: { rent: 961, income: 47_844 },
        5: { rent: 1_038, income: 51_672 },
        6: { rent: 1_116, income: 55_500 },
        7: { rent: 1_193, income: 59_328 },
        8: { rent: 1_270, income: 63_157 },
      },
      50: {
        1: { rent: 843, income: 41_863 },
        2: { rent: 964, income: 47_843 },
        3: { rent: 1_083, income: 53_823 },
        4: { rent: 1_202, income: 59_805 },
        5: { rent: 1_298, income: 64_590 },
        6: { rent: 1_394, income: 69_374 },
        7: { rent: 1_491, income: 74_160 },
        8: { rent: 1_588, income: 78_945 },
      },
      60: {
        1: { rent: 1_011, income: 50_235 },
        2: { rent: 1_156, income: 57_411 },
        3: { rent: 1_300, income: 64_588 },
        4: { rent: 1_442, income: 71_766 },
        5: { rent: 1_558, income: 77_508 },
        6: { rent: 1_673, income: 83_250 },
        7: { rent: 1_789, income: 88_992 },
        8: { rent: 1_906, income: 94_737 },
      },
    },
  },
  // Hudson/Bergen/Essex etc. - NY Non-Metro (for upstate counties)
  "ny_nonmetro": {
    county: "New York (Non-Metro)",
    state: "NY",
    veryLowIncome: 27_350,
    limits: {
      30: {
        1: { rent: 414, income: 20_513 },
        2: { rent: 473, income: 23_443 },
        3: { rent: 531, income: 26_374 },
        4: { rent: 589, income: 29_304 },
        5: { rent: 637, income: 31_648 },
        6: { rent: 685, income: 33_992 },
        7: { rent: 733, income: 36_337 },
        8: { rent: 780, income: 38_681 },
      },
      40: {
        1: { rent: 551, income: 27_350 },
        2: { rent: 631, income: 31_257 },
        3: { rent: 709, income: 35_165 },
        4: { rent: 786, income: 39_072 },
        5: { rent: 846, income: 42_110 },
        6: { rent: 907, income: 45_156 },
        7: { rent: 967, income: 48_194 },
        8: { rent: 1_027, income: 51_233 },
      },
      50: {
        1: { rent: 689, income: 34_188 },
        2: { rent: 789, income: 39_071 },
        3: { rent: 886, income: 43_957 },
        4: { rent: 983, income: 48_840 },
        5: { rent: 1_058, income: 52_638 },
        6: { rent: 1_133, income: 56_432 },
        7: { rent: 1_209, income: 60_226 },
        8: { rent: 1_284, income: 64_020 },
      },
      60: {
        1: { rent: 827, income: 41_025 },
        2: { rent: 947, income: 46_885 },
        3: { rent: 1_063, income: 52_748 },
        4: { rent: 1_180, income: 58_608 },
        5: { rent: 1_270, income: 63_165 },
        6: { rent: 1_360, income: 67_718 },
        7: { rent: 1_450, income: 72_274 },
        8: { rent: 1_540, income: 76_824 },
      },
    },
  },
  "nj_metro": {
    county: "New Jersey (Metro)",
    state: "NJ",
    veryLowIncome: 35_200,
    limits: {
      30: {
        1: { rent: 531, income: 26_400 },
        2: { rent: 607, income: 30_171 },
        3: { rent: 683, income: 33_943 },
        4: { rent: 758, income: 37_714 },
        5: { rent: 819, income: 40_731 },
        6: { rent: 880, income: 43_749 },
        7: { rent: 940, income: 46_766 },
        8: { rent: 1_001, income: 49_783 },
      },
      40: {
        1: { rent: 708, income: 35_200 },
        2: { rent: 809, income: 40_229 },
        3: { rent: 911, income: 45_257 },
        4: { rent: 1_011, income: 50_285 },
        5: { rent: 1_099, income: 54_309 },
        6: { rent: 1_187, income: 58_333 },
        7: { rent: 1_274, income: 62_356 },
        8: { rent: 1_362, income: 66_379 },
      },
      50: {
        1: { rent: 885, income: 44_000 },
        2: { rent: 1_011, income: 50_286 },
        3: { rent: 1_139, income: 56_571 },
        4: { rent: 1_264, income: 62_856 },
        5: { rent: 1_374, income: 67_886 },
        6: { rent: 1_484, income: 72_916 },
        7: { rent: 1_593, income: 77_945 },
        8: { rent: 1_703, income: 82_974 },
      },
      60: {
        1: { rent: 1_062, income: 52_800 },
        2: { rent: 1_213, income: 60_343 },
        3: { rent: 1_367, income: 67_886 },
        4: { rent: 1_517, income: 75_427 },
        5: { rent: 1_649, income: 81_463 },
        6: { rent: 1_780, income: 87_499 },
        7: { rent: 1_912, income: 93_534 },
        8: { rent: 2_043, income: 99_569 },
      },
    },
  },
  "ct_metro": {
    county: "Connecticut (Metro)",
    state: "CT",
    veryLowIncome: 36_800,
    limits: {
      30: {
        1: { rent: 556, income: 27_600 },
        2: { rent: 635, income: 31_543 },
        3: { rent: 714, income: 35_486 },
        4: { rent: 793, income: 39_429 },
        5: { rent: 857, income: 42_582 },
        6: { rent: 922, income: 45_736 },
        7: { rent: 986, income: 48_889 },
        8: { rent: 1_050, income: 52_043 },
      },
      40: {
        1: { rent: 740, income: 36_800 },
        2: { rent: 847, income: 42_057 },
        3: { rent: 953, income: 47_314 },
        4: { rent: 1_057, income: 52_571 },
        5: { rent: 1_148, income: 57_067 },
        6: { rent: 1_229, income: 61_029 },
        7: { rent: 1_311, income: 64_987 },
        8: { rent: 1_392, income: 68_946 },
      },
      50: {
        1: { rent: 925, income: 46_000 },
        2: { rent: 1_059, income: 52_571 },
        3: { rent: 1_191, income: 59_143 },
        4: { rent: 1_321, income: 65_714 },
        5: { rent: 1_435, income: 71_334 },
        6: { rent: 1_537, income: 76_287 },
        7: { rent: 1_639, income: 81_241 },
        8: { rent: 1_740, income: 86_199 },
      },
      60: {
        1: { rent: 1_110, income: 55_200 },
        2: { rent: 1_271, income: 63_086 },
        3: { rent: 1_429, income: 70_971 },
        4: { rent: 1_585, income: 78_857 },
        5: { rent: 1_722, income: 85_600 },
        6: { rent: 1_845, income: 91_480 },
        7: { rent: 1_967, income: 97_354 },
        8: { rent: 2_088, income: 103_228 },
      },
    },
  },
};

/** Map a state to the appropriate AMI data profile. */
export function getAmiProfile(state: string, county?: string): CountyAmiData {
  if (state === "NY") return county && county.includes("NYC") ? COUNTY_AMI_DATA["nyc_metro"] : COUNTY_AMI_DATA["ny_nonmetro"];
  if (state === "NJ") return COUNTY_AMI_DATA["nj_metro"];
  if (state === "CT") return COUNTY_AMI_DATA["ct_metro"];
  return COUNTY_AMI_DATA["nyc_metro"]; // fallback
}

/** Get AMI limits for a given county/state. */
export function getAmiLimits(state: string, county?: string): AmiApiResponse {
  const profile = getAmiProfile(state, county);

  return {
    county: profile.county,
    state: profile.state,
    year: 2024,
    veryLowIncome: profile.veryLowIncome,
    lowIncome: profile.veryLowIncome * 1.6, // 80% AMI ≈ 50% * 80/50
    limits: ([30, 40, 50, 60] as AmiLevel[]).flatMap((ami) =>
      ([1, 2, 3, 4, 5, 6, 7, 8] as HouseholdSize[]).map((hs) => ({
        householdSize: hs,
        amiPct: ami,
        maxRent: profile.limits[ami][hs].rent,
        incomeLimit: profile.limits[ami][hs].income,
      }))
    ),
  };
}

/** Fair Market Rents for the tri-state area (2024). */
const FMR_DATA: Record<string, FairMarketRent> = {
  "NYC": {
    fips: "36005",
    year: 2024,
    zeroBr: 1_720,
    oneBr: 1_910,
    twoBr: 2_450,
    threeBr: 3_110,
    fourBr: 3_520,
  },
  "NJ_Metro": {
    fips: "34003",
    year: 2024,
    zeroBr: 1_450,
    oneBr: 1_680,
    twoBr: 2_100,
    threeBr: 2_740,
    fourBr: 3_270,
  },
  "CT_Metro": {
    fips: "09001",
    year: 2024,
    zeroBr: 1_280,
    oneBr: 1_510,
    twoBr: 1_860,
    threeBr: 2_300,
    fourBr: 2_780,
  },
  "NY_NonMetro": {
    fips: "36111",
    year: 2024,
    zeroBr: 940,
    oneBr: 1_090,
    twoBr: 1_430,
    threeBr: 1_880,
    fourBr: 2_320,
  },
};

export function getFairMarketRent(state: string): FairMarketRent {
  if (state === "NY") return FMR_DATA["NYC"];
  if (state === "NJ") return FMR_DATA["NJ_Metro"];
  if (state === "CT") return FMR_DATA["CT_Metro"];
  return FMR_DATA["NYC"];
}

export const FMR_LABELS: Record<number, string> = {
  0: "Studio",
  1: "1 BR",
  2: "2 BR",
  3: "3 BR",
  4: "4 BR",
};

/** Compare a proposed rent to FMR and AMI limits. */
export function compareRents(
  bedrooms: number,
  proposedRent: number,
  state: string,
  amiLevel: number = 50,
): RentComparisonResult {
  const fmr = getFairMarketRent(state);
  const fmrKey: (keyof FairMarketRent & string) = ((bedrooms === 0 ? "zeroBr" : bedrooms === 1 ? "oneBr" : bedrooms === 2 ? "twoBr" : bedrooms === 3 ? "threeBr" : "fourBr") as keyof FairMarketRent & string);
  const fmrValue = fmr[fmrKey] as number | undefined;

  let flag: string | null = null;
  let isFeasible = true;

  if (fmrValue !== undefined && proposedRent > fmrValue * 1.2) {
    flag = `Rent ${((proposedRent / fmrValue - 1) * 100).toFixed(0)}% above Fair Market Rent — may be unrealistic`;
    isFeasible = false;
  }

  return {
    bedrooms,
    proposedRent,
    fairMarketRent: fmrValue ?? null,
    amiLimitRent: null, // calculated by caller from AMI data
    isFeasible,
    flag,
  };
}

/** Validate set-aside compliance. */
export function checkSetAside(
  totalUnits: number,
  affordableUnits: number,
  testType: "2050" | "4060" = "2050",
): SetAsideTest {
  const requiredPct = testType === "2050" ? 20 : 40;
  const requiredUnits = Math.ceil(totalUnits * (requiredPct / 100));
  const actualPct = (affordableUnits / Math.max(totalUnits, 1)) * 100;

  return {
    type: testType,
    description: testType === "2050" ? "20/50 Test (20% of units at 50% AMI)" : "40/60 Test (40% of units at 60% AMI)",
    met: affordableUnits >= requiredUnits,
    requiredUnits,
    actualUnits: affordableUnits,
    totalUnits,
    requiredPct,
    actualPct,
  };
}
