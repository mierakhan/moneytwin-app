export function myr(value: string | number | null | undefined, opts: { compact?: boolean } = {}): string {
  const num = typeof value === "string" ? Number(value) : value ?? 0;
  if (!Number.isFinite(num)) return "RM 0.00";
  if (opts.compact && Math.abs(num) >= 10000) {
    return `RM ${(num / 1000).toFixed(num >= 100000 ? 0 : 1)}k`;
  }
  return `RM ${num.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function pct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value * 10) / 10}%`;
}

export function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string, locale = "en"): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, (month || 1) - 1, 1);
  return d.toLocaleDateString(locale === "bm" ? "ms-MY" : "en-MY", { month: "long", year: "numeric" });
}

export function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return monthKey(d);
}

export function dateLabel(iso: string, locale = "en"): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(locale === "bm" ? "ms-MY" : "en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
