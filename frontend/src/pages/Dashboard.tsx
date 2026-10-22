import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { ArrowUpRight, Bot, Plus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { dateLabel, monthKey, myr, pct } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../state/AuthContext";
import type { Dashboard as DashboardData } from "../lib/types";
import MonthPicker from "../components/MonthPicker";
import { Badge, EmptyState, ErrorState, ProgressBar, SectionCard, Skeleton } from "../components/ui";

const COLORS = ["#159B83", "#4878E8", "#14213D", "#F2A65A", "#8B5CF6", "#EC4899", "#0EA5E9", "#94A3B8"];

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [month, setMonth] = useState(monthKey());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<DashboardData>(`/api/dashboard?month=${month}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setLoading(false);
    }
  }, [month, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const firstName = user?.display_name?.split(" ")[0] ?? "there";
  const savings = data?.goals.find((g) => g.status === "active") ?? data?.goals[0];
  const budgetLimit = data?.budgets.reduce((sum, b) => sum + Number(b.limit), 0) ?? 0;
  const budgetSpent = data?.budgets.reduce((sum, b) => sum + Number(b.spent), 0) ?? 0;
  const usage = budgetLimit > 0 ? Math.min(100, Math.round((budgetSpent / budgetLimit) * 100)) : 0;
  const overBudget = data?.budgets.find((b) => b.state === "over");

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{data?.month_label ?? ""}</p>
          <h1 className="display mt-1 text-[32px] leading-tight text-navy sm:text-[40px]">
            {lang === "bm" ? `Hai, ${firstName}.` : `Hi, ${firstName}.`}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {lang === "bm" ? "Ini gambaran bulan anda, dikira daripada rekod anda sendiri." : "Here is your month, computed from your own records."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <Link to="/app/transactions" className="btn-primary"><Plus className="h-4 w-4" />{t("addTransaction")}</Link>
        </div>
      </header>

      {error && <ErrorState message={error} onRetry={() => void load()} retryLabel={t("retry")} />}

      {loading && !data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="card p-5"><Skeleton className="h-3 w-20" /><Skeleton className="mt-4 h-7 w-28" /></div>)}
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <section className="relative overflow-hidden rounded-[28px] bg-navy p-6 text-white sm:p-7">
              <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-accent/15" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                {t("balance")} · {data.month_label}
              </p>
              <p className="display mt-2 text-[40px] leading-none sm:text-[52px]">{myr(data.balance)}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  <span className="text-white/60">{t("income")} </span>
                  <span className="font-semibold">{myr(data.income)}</span>
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  <span className="text-white/60">{t("expenses")} </span>
                  <span className="font-semibold">{myr(data.expenses)}</span>
                </span>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${usage}%` }} />
                </div>
                <span className="shrink-0 text-[11px] text-white/70">
                  {usage}% {lang === "bm" ? "bajet digunakan" : "of budget used"}
                </span>
              </div>
              {overBudget && (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-[11px] font-medium text-accent">
                  <TrendingDown className="h-3.5 w-3.5" />
                  {lang === "bm"
                    ? `${overBudget.category_name} terlebih ${myr(overBudget.overspend)}`
                    : `${overBudget.category_name} is ${myr(overBudget.overspend)} over`}
                </p>
              )}
            </section>

            <section className="card card-pad">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                {lang === "bm" ? "Ringkasan pantas" : "Quick overview"}
              </p>
              <ul className="mt-3 divide-y divide-line/70">
                {[
                  { label: t("income"), value: myr(data.income), icon: TrendingUp, tint: "bg-mint text-jade" },
                  { label: t("expenses"), value: myr(data.expenses), icon: TrendingDown, tint: "bg-blush text-[#c2563a]" },
                  { label: t("goals"), value: savings ? pct(savings.percent_complete) : "—", icon: Sparkles, tint: "bg-accent-soft text-[#a86a00]" },
                ].map((row) => (
                  <li key={row.label} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${row.tint}`}>
                      <row.icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm text-slate-600">{row.label}</span>
                    <span className="text-sm font-semibold text-navy">{row.value}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-2xl bg-canvas px-3.5 py-3">
                <p className="text-[11px] text-muted">
                  {data.transaction_count} {lang === "bm" ? "rekod bulan ini" : "records this month"}
                  {data.top_category ? ` · ${lang === "bm" ? "terbesar" : "top"}: ${data.top_category.name}` : ""}
                </p>
              </div>
            </section>
          </div>

          {data.warnings.length > 0 && (
            <div className="card border-amber-200 bg-amber-50/60 p-4">
              <p className="text-sm font-semibold text-amber-900">{t("warnings")}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-amber-900/90">
                {data.warnings.map((w) => (
                  <li key={w.budget_id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold">{w.category_name}</span>
                    <span>
                      {w.state === "over"
                        ? (lang === "bm" ? `terlebih RM${w.overspend} bajet` : `is RM${w.overspend} over budget`)
                        : (lang === "bm" ? `${pct(w.percent_used)} digunakan` : `is at ${pct(w.percent_used)} of its budget`)}
                    </span>
                    <Link to="/app/budgets" className="text-xs font-semibold underline decoration-amber-700/40">{t("navBudgets")}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <SectionCard title={t("trend")} subtitle={lang === "bm" ? "Enam bulan terakhir" : "Last six months"}>
              {data.trend.every((row) => Number(row.income) === 0 && Number(row.expenses) === 0) ? (
                <EmptyState title={t("noData")} body={t("noDataBody")} />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.trend} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value: number) => myr(value)} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="income" name={t("income")} fill="#159B83" radius={[6, 6, 0, 0]} maxBarSize={26} />
                      <Bar dataKey="expenses" name={t("expenses")} fill="#4878E8" radius={[6, 6, 0, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>

            <SectionCard title={t("breakdown")} subtitle={data.month_label}>
              {data.categories.length === 0 ? (
                <EmptyState title={t("noData")} body={t("noDataBody")} />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.categories} dataKey="amount_minor" nameKey="name" innerRadius={52} outerRadius={82}
                           paddingAngle={2} stroke="none">
                        {data.categories.map((entry, index) => (
                          <Cell key={entry.category_id} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => myr(value / 100)} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <SectionCard
              title={t("recent")}
              action={<Link to="/app/transactions" className="text-sm font-semibold text-jade">{t("viewAll")} <ArrowUpRight className="inline h-3.5 w-3.5" /></Link>}
            >
              {data.recent_transactions.length === 0 ? (
                <EmptyState title={t("noData")} body={t("noDataBody")}
                            action={<Link to="/app/transactions" className="btn-jade">{t("addTransaction")}</Link>} />
              ) : (
                <ul className="divide-y divide-line">
                  {data.recent_transactions.map((txn) => (
                    <li key={txn.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy">{txn.description || txn.category}</p>
                        <p className="text-xs text-muted">{txn.category} · {dateLabel(txn.date, lang)}</p>
                      </div>
                      <span className={`shrink-0 text-sm font-semibold ${txn.type === "income" ? "text-jade" : txn.is_refund ? "text-jade" : "text-navy"}`}>
                        {txn.type === "income" ? "+" : txn.is_refund ? "+" : "−"}{myr(txn.amount).replace("RM ", "RM")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title={t("goals")}
              action={<Link to="/app/goals" className="text-sm font-semibold text-jade">{t("viewAll")} <ArrowUpRight className="inline h-3.5 w-3.5" /></Link>}
            >
              {data.goals.length === 0 ? (
                <EmptyState title={t("empty")} body={lang === "bm" ? "Tetapkan sasaran simpanan pertama anda." : "Set your first savings target."}
                            action={<Link to="/app/goals" className="btn-jade">{t("addGoal")}</Link>} />
              ) : (
                <ul className="space-y-4">
                  {data.goals.slice(0, 3).map((goal) => (
                    <li key={goal.id}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-navy">{goal.title}</p>
                        <span className="shrink-0 text-xs text-muted">{myr(goal.saved_amount)} / {myr(goal.target_amount)}</span>
                      </div>
                      <ProgressBar value={goal.percent_complete} state={goal.status === "completed" ? "ok" : "ok"} />
                      <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
                        <span>{pct(goal.percent_complete)}</span>
                        {goal.monthly_needed ? <span>{t("monthlyNeeded")}: <strong className="text-navy">{myr(goal.monthly_needed)}</strong></span> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => navigate("/app/simulator")} className="card card-pad text-left transition hover:border-blue/40">
              <span className="inline-flex rounded-xl bg-blue-soft p-2.5 text-blue"><Sparkles className="h-5 w-5" /></span>
              <p className="mt-3 font-semibold text-navy">{t("runSimulation")}</p>
              <p className="mt-1 text-sm text-muted">{lang === "bm" ? "Uji pilihan sebelum anda komited." : "Test a choice before you commit."}</p>
            </button>
            <button type="button" onClick={() => navigate("/app/chat")} className="card card-pad text-left transition hover:border-jade/40">
              <span className="inline-flex rounded-xl bg-jade-soft p-2.5 text-jade"><Bot className="h-5 w-5" /></span>
              <p className="mt-3 font-semibold text-navy">{t("askAi")}</p>
              <p className="mt-1 text-sm text-muted">{lang === "bm" ? "Tanya tentang angka anda sendiri." : "Ask about your own numbers."}</p>
            </button>
          </div>

          {data.categories.length > 0 && (
            <SectionCard title={lang === "bm" ? "Kadar penggunaan bajet" : "Budget usage"}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.categories.map((c) => ({ name: c.name, amount: c.amount_minor / 100 }))}
                             margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                    <defs>
                      <linearGradient id="catFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#159B83" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#159B83" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} interval={0} angle={-12} height={40} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: number) => myr(value)} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                    <Area type="monotone" dataKey="amount" stroke="#159B83" strokeWidth={2} fill="url(#catFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.budgets.slice(0, 6).map((budget) => (
                  <Badge key={budget.id} tone={budget.state === "over" ? "red" : budget.state === "warning" || budget.state === "reached" ? "amber" : "jade"}>
                    {budget.category_name} {pct(budget.percent_used)}
                  </Badge>
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
