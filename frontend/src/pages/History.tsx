import { useCallback, useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarRange, Minus } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api, ApiError } from "../lib/api";
import { myr } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { Badge, ErrorState, SectionCard, Skeleton } from "../components/ui";

type Change = { delta_minor: number; delta: string; percent: number | null; direction: "up" | "down" | "flat" };

type Row = {
  month: string;
  label: string;
  income: string;
  expenses: string;
  balance: string;
  income_minor: number;
  expenses_minor: number;
  balance_minor: number;
  transaction_count: number;
  has_data: boolean;
  top_category: string | null;
  top_category_amount: string | null;
  budget_limit: string;
  budget_spent: string;
  over_budget: string;
  expenses_change: Change | null;
  income_change: Change | null;
  balance_change: Change | null;
};

export default function HistoryPage() {
  const { t, lang } = useI18n();
  const [months, setMonths] = useState(6);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ rows: Row[] }>(`/api/history?months=${months}`);
      setRows(res.rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setLoading(false);
    }
  }, [months, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const latest = rows[rows.length - 1];
  const previous = rows[rows.length - 2];
  const withData = rows.filter((row) => row.has_data);
  const chartRows = rows.map((row) => ({
    label: row.label.slice(0, 3),
    income: row.income_minor / 100,
    expenses: row.expenses_minor / 100,
    balance: row.balance_minor / 100,
  }));

  const trendWord = (change: Change | null) => {
    if (!change) return "";
    if (change.direction === "up") return lang === "bm" ? "naik" : "up";
    if (change.direction === "down") return lang === "bm" ? "turun" : "down";
    return lang === "bm" ? "sama" : "flat";
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("navHistory")}</p>
          <h1 className="display mt-1 text-[30px] leading-tight text-navy sm:text-[36px]">{t("history")}</h1>
          <p className="mt-1 text-sm text-muted">{t("historyBody")}</p>
        </div>
        <div className="inline-flex rounded-full border border-line bg-white p-1 text-xs">
          {[3, 6, 12].map((value) => (
            <button key={value} type="button" onClick={() => setMonths(value)}
                    className={`rounded-full px-3 py-1.5 font-semibold ${
                      months === value ? "bg-navy text-white" : "text-slate-500"
                    }`}>
              {value} {lang === "bm" ? "bulan" : "months"}
            </button>
          ))}
        </div>
      </header>

      {error && <ErrorState message={error} onRetry={() => void load()} retryLabel={t("retry")} />}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5"><Skeleton className="h-3 w-20" /><Skeleton className="mt-4 h-7 w-24" /></div>
          ))}
        </div>
      )}

      {!loading && latest && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: t("income"), value: myr(latest.income), change: latest.income_change },
              { label: t("expenses"), value: myr(latest.expenses), change: latest.expenses_change },
              { label: t("balance"), value: myr(latest.balance), change: latest.balance_change },
              { label: t("overspent"), value: myr(latest.over_budget), change: null },
            ].map((card) => (
              <div key={card.label} className="card p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-navy">{card.value}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                  {card.change && card.change.direction === "up" && <ArrowUpRight className="h-3 w-3 text-jade" />}
                  {card.change && card.change.direction === "down" && <ArrowDownRight className="h-3 w-3 text-[#c2563a]" />}
                  {card.change && card.change.direction === "flat" && <Minus className="h-3 w-3" />}
                  {card.change ? (
                    <span>
                      {card.change.delta} ({card.change.percent === null ? "—" : `${card.change.percent}%`}){" "}
                      {t("comparePrev")}
                    </span>
                  ) : (
                    <span>{latest.label}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {previous && previous.has_data && latest.has_data && (
            <SectionCard title={lang === "bm" ? "Perbandingan" : "Compared with last month"}>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li>
                  {lang === "bm" ? "Perbelanjaan " : "Expenses "}
                  <strong className="text-navy">{trendWord(latest.expenses_change)}</strong>
                  {latest.expenses_change ? ` ${myr(Math.abs(latest.expenses_change.delta_minor / 100))}` : ""}
                  {latest.expenses_change?.percent != null ? ` (${Math.abs(latest.expenses_change.percent)}%)` : ""}{" "}
                  {lang === "bm" ? `berbanding ${previous.label}.` : `versus ${previous.label}.`}
                </li>
                <li>
                  {lang === "bm" ? "Baki " : "Balance "}
                  <strong className="text-navy">{trendWord(latest.balance_change)}</strong>
                  {latest.balance_change ? ` ${myr(Math.abs(latest.balance_change.delta_minor / 100))}` : ""}{" "}
                  {lang === "bm" ? "berbanding bulan lepas." : "against last month."}
                </li>
                {latest.top_category && (
                  <li>
                    {lang === "bm" ? "Kategori terbesar: " : "Biggest category: "}
                    <strong className="text-navy">{latest.top_category}</strong>{" "}
                    {latest.top_category_amount ? myr(latest.top_category_amount) : ""}
                  </li>
                )}
              </ul>
            </SectionCard>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title={t("trend")}>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartRows} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6E9E4" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7A80" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6B7A80" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => myr(Number(value))}
                             contentStyle={{ borderRadius: 14, border: "1px solid #E6E9E4", fontSize: 12 }} />
                    <Bar dataKey="income" name={t("income")} fill="#16333A" radius={[6, 6, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="expenses" name={t("expenses")} fill="#F5A623" radius={[6, 6, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title={lang === "bm" ? "Aliran baki" : "Balance trend"}>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartRows} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6E9E4" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7A80" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6B7A80" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => myr(Number(value))}
                             contentStyle={{ borderRadius: 14, border: "1px solid #E6E9E4", fontSize: 12 }} />
                    <Line type="monotone" dataKey="balance" name={t("balance")} stroke="#14806B" strokeWidth={2.5}
                          dot={{ r: 3, fill: "#14806B" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title={lang === "bm" ? "Bulan ke bulan" : "Month by month"}
            subtitle={`${withData.length} ${lang === "bm" ? "bulan dengan rekod" : "months with records"} · ${months} ${lang === "bm" ? "dipaparkan" : "shown"}`}
          >
            <ul className="divide-y divide-line">
              {[...rows].reverse().map((row) => (
                <li key={row.month}>
                  <button type="button"
                          onClick={() => setOpenMonth(openMonth === row.month ? null : row.month)}
                          className="flex w-full items-center gap-3 py-3 text-left">
                    <span className="w-28 shrink-0 text-sm font-semibold text-navy">{row.label}</span>
                    <span className="flex-1 text-xs text-muted">
                      {row.has_data
                        ? `${myr(row.income)} ${lang === "bm" ? "masuk" : "in"} · ${myr(row.expenses)} ${lang === "bm" ? "keluar" : "out"}`
                        : (lang === "bm" ? "Tiada rekod" : "No records")}
                    </span>
                    <span className={`text-sm font-semibold ${Number(row.balance) < 0 ? "text-[#c2563a]" : "text-navy"}`}>
                      {row.has_data ? myr(row.balance) : "—"}
                    </span>
                    {row.has_data && row.over_budget !== "0.00" && (
                      <Badge tone="amber">{lang === "bm" ? "Lebih" : "Over"} {myr(row.over_budget)}</Badge>
                    )}
                    <ArrowRight className={`h-4 w-4 shrink-0 text-slate-300 transition ${openMonth === row.month ? "rotate-90" : ""}`} />
                  </button>
                  {openMonth === row.month && (
                    <div className="mb-3 rounded-2xl bg-canvas p-3.5 text-xs text-slate-600">
                      {row.has_data ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <p>{t("income")}: <strong className="text-navy">{myr(row.income)}</strong></p>
                          <p>{t("expenses")}: <strong className="text-navy">{myr(row.expenses)}</strong></p>
                          <p>{t("balance")}: <strong className="text-navy">{myr(row.balance)}</strong></p>
                          <p>
                            {lang === "bm" ? "Bajet" : "Budget"}: <strong className="text-navy">{myr(row.budget_spent)}</strong>{" "}
                            / {myr(row.budget_limit)}
                          </p>
                          <p>
                            {lang === "bm" ? "Kategori terbesar" : "Biggest category"}:{" "}
                            <strong className="text-navy">{row.top_category ?? "—"}</strong>
                            {row.top_category_amount ? ` · ${myr(row.top_category_amount)}` : ""}
                          </p>
                          <p>
                            {lang === "bm" ? "Transaksi" : "Transactions"}:{" "}
                            <strong className="text-navy">{row.transaction_count}</strong>
                          </p>
                        </div>
                      ) : (
                        <p className="flex items-center gap-2 text-muted">
                          <CalendarRange className="h-3.5 w-3.5" />
                          {lang === "bm"
                            ? "Tiada transaksi direkod. Angka tidak diisi secara automatik."
                            : "No transactions recorded. No figures are invented here."}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </SectionCard>
        </>
      )}

      {!loading && rows.length === 0 && !error && (
        <SectionCard>
          <p className="text-sm text-muted">{lang === "bm" ? "Tiada data sejarah." : "No history yet."}</p>
        </SectionCard>
      )}
      {latest && (
        <p className="text-[11px] text-muted">
          {lang === "bm" ? "Semua angka dikira daripada tarikh transaksi anda, mengikut " : "All figures computed from your transaction dates, in "}
          Asia/Kuala_Lumpur · MYR
        </p>
      )}
    </div>
  );
}
