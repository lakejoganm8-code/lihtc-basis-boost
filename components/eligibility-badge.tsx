import { EligibilityResponse } from "@/lib/types";

interface BadgeProps {
  label: string;
  value: boolean;
}

function Badge({ label, value }: BadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
          value ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
        }`}
      >
        {value ? "\u2713" : "\u2717"}
      </span>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}

export function EligibilityBadges({ eligibility }: { eligibility: EligibilityResponse }) {
  return (
    <div className="space-y-2">
      <Badge label="Qualified Census Tract" value={eligibility.isQCT} />
      <Badge label="Difficult Development Area" value={eligibility.isDDA} />
      <div className="pt-2 border-t border-gray-200 mt-2">
        <p className="text-sm text-gray-500">{eligibility.reason}</p>
      </div>
    </div>
  );
}
