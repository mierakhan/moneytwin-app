import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, shiftMonth } from "../lib/format";
import { useI18n } from "../lib/i18n";

export default function MonthPicker({
  value, onChange, className = "",
}: { value: string; onChange: (next: string) => void; className?: string }) {
  const { lang } = useI18n();
  return (
    <div className={`inline-flex items-center gap-1 rounded-xl border border-line bg-white p-1 ${className}`}>
      <button
        type="button"
        aria-label="Previous month"
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        onClick={() => onChange(shiftMonth(value, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[132px] px-1 text-center text-sm font-semibold text-navy">
        {monthLabel(value, lang)}
      </span>
      <button
        type="button"
        aria-label="Next month"
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        onClick={() => onChange(shiftMonth(value, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
