import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Bot, ChevronDown, Loader2, ScanLine, Sparkles, TriangleAlert,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api, ApiError } from "../lib/api";
import { myr, pct } from "../lib/format";
import { useI18n } from "../lib/i18n";
import type { Analysis, Dashboard } from "../lib/types";
import MonthPicker from "../components/MonthPicker";
import { Badge, ErrorState, SectionCard, Skeleton } from "../components/ui";
import Markdown from "../components/Markdown";
import { monthKey } from "../lib/format";

type Brief = {
  summary: string;
  findings: string[];
  action: string | null;
  ai: { status: string; provider: string; model: string | null };
  grounded: boolean;
  period: string;
  period_label: string;
  notice?: string;
};

export default function Insights() {
  const { t, lang } = useI18n();
  const [month, setMonth] = useState(monthKey());
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [detail, setDetail] = useState<Analysis | null>(null);
  const [loadingDash, setLoadingDash] = useState(true);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDash = useCallback(async () => {
    setLoadingDash(true);
    setError(null);
    try {
      setDash(await api.get<Dashboard>(`/api/dashboard?month=${month}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setLoadingDash(false);
    }
  }, [month, t]);

  useEffect(() => {
    setBrief(null);
    setDetail(null);
    setShowDetail(false);
    void loadDash();
  }, [loadDash]);

  const generate = async () => {
    setLoadingBrief(true);
    setError(null);
    try {
      setBrief(await api.post<Brief>("/api/ai/brief", { month, locale: lang }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setLoadingBrief(false);
    }
  };

  const openDetail = async () => {
    if (detail) {
      setShowDetail((value) => !value);
      return;
    }
    setShowDetail(true);
    setLoadingDetail(true);
    try {
      setDetail(await api.post<Analysis>("/api/ai/analyze", { month, locale: lang }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setLoadingDetail(false);
    }
  };

  const overTotal = dash?.budgets.reduce(
    (sum, row) => sum + Math.max(0, Number(row.spent) - Number(row.limit)), 0) ?? 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("navInsights")}</p>
          <h1 className="display mt-1 text-[30px] leading-tight text-navy sm:text-[36px]">
            {lang === "bm" ? "Gambaran kewangan anda" : "Your financial snapshot"}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("insightNotice")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <button type="button" className="btn-primary" onClick={() => void generate()} disabled={loadingBrief}>
            {loadingBrief ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            {loadingBrief ? t("loading") : t("generateInsight")}
          </button>
        </div>
      </header>

      {error && <ErrorState message={error} onRetry={() => void loadDash()} retryLabel={t("retry")} />}

      {loadingDash && !dash && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5"><Skeleton className="h-3 w-20" /><Skeleton className="mt-4 h-7 w-24" /></div>
          ))}
        </div>
      )}

      {dash && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: t("income"), value: myr(dash.income), tone: "text-jade" },
              { label: t("expenses"), value: myr(dash.expenses), tone: "text-navy" },
              { label: t("balance"), value: myr(dash.balance), tone: "text-navy" },
              { label: t("overspent"), value: myr(overTotal), tone: overTotal > 0 ? "text-[#c2563a]" : "text-navy" },
            ].map((card) => (
              <div key={card.label} className="card p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{card.label}</p>
                <p className={`mt-2 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
                <p className="mt-1 text-[11px] text-muted">{dash.month_label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
            <SectionCard
              title={lang === "bm" ? "Wang anda sekilas pandang" : "Your money at a glance"}
              action={
                <Badge tone={brief?.ai.status === "ok" ? "jade" : brief ? "amber" : "blue"}>
                  {brief
                    ? brief.ai.status === "ok"
                      ? (lang === "bm" ? "AI" : "AI")
                      : (lang === "bm" ? "Dikira" : "Computed")
                    : (lang === "bm" ? "Belum dijana" : "Not generated")}
                </Badge>
              }
            >
              {!brief && !loadingBrief && (
                <div className="rounded-2xl border border-dashed border-line bg-canvas/60 p-6 text-center">
                  <Sparkles className="mx-auto h-6 w-6 text-accent" />
                  <p className="mt-2 text-sm text-slate-600">
                    {lang === "bm"
                      ? "Jana ringkasan pendek: tiga penemuan dan satu cadangan."
                      : "Generate a short read: three findings and one suggestion."}
                  </p>
                  <button type="button" className="btn-jade mt-3 !py-2 !text-xs" onClick={() => void generate()}>
                    {t("generateInsight")}
                  </button>
                </div>
              )}

              {loadingBrief && (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-11/12" />
                  <Skeleton className="h-3 w-8/12" />
                </div>
              )}

              {brief && !loadingBrief && (
                <>
                  <p className="text-[15px] leading-relaxed text-slate-700">{brief.summary}</p>
                  {brief.findings.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                      {brief.findings.slice(0, 3).map((finding) => (
                        <li key={finding} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                  )}
                  {brief.action && (
                    <div className="mt-3 rounded-2xl bg-accent-soft px-3.5 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a86a00]">
                        {lang === "bm" ? "Cadangan" : "Suggested action"}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{brief.action}</p>
                    </div>
                  )}
                  {brief.notice && <p className="mt-2 text-[11px] text-amber-700">{brief.notice}</p>}
                </>
              )}
            </SectionCard>

            <SectionCard title={lang === "bm" ? "Bajet vs sebenar" : "Budget vs actual"}>
              {dash.budgets.length === 0 ? (
                <p className="text-sm text-muted">
                  {lang === "bm" ? "Belum ada bajet untuk bulan ini." : "No budgets set for this month."}
                </p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dash.budgets.map((b) => ({
                        name: b.category_name,
                        limit: Number(b.limit),
                        spent: Number(b.spent),
                      }))}
                      margin={{ top: 6, right: 8, bottom: 0, left: -18 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E6E9E4" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7A80" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#6B7A80" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => myr(Number(value))}
                               contentStyle={{ borderRadius: 14, border: "1px solid #E6E9E4", fontSize: 12 }} />
                      <Bar dataKey="limit" name={t("budget")} fill="#D9E4E0" radius={[6, 6, 0, 0]} maxBarSize={22} />
                      <Bar dataKey="spent" name={t("spent")} fill="#16333A" radius={[6, 6, 0, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title={lang === "bm" ? "Langkah seterusnya" : "Suggested next steps"}
            subtitle={lang === "bm" ? "Pautan ke halaman yang berkaitan" : "Links to the pages that do the work"}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  title: lang === "bm" ? "Semak belanja makanan" : "Review food spending",
                  to: "/app/transactions",
                  idle: dash.top_category?.name ?? "Food",
                },
                {
                  title: lang === "bm" ? "Laraskan bajet" : "Adjust a budget",
                  to: "/app/budgets",
                  idle: `${dash.warnings.length} ${lang === "bm" ? "amaran" : "alerts"}`,
                },
                {
                  title: lang === "bm" ? "Cuba senario simpanan" : "Explore a savings scenario",
                  to: "/app/simulator",
                  idle: lang === "bm" ? "Simulasi" : "Simulator",
                },
              ].map((card) => (
                <Link key={card.title} to={card.to}
                      className="group rounded-2xl border border-line bg-white p-3.5 transition hover:border-navy/30 hover:bg-canvas">
                  <p className="text-sm font-semibold text-navy">{card.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{card.idle}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-jade">
                    {lang === "bm" ? "Buka" : "Open"}
                    <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={t("breakdown")}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dash.trend.map((row) => ({
                  label: row.label, income: Number(row.income), expenses: Number(row.expenses),
                }))} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E9E4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7A80" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7A80" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => myr(Number(value))}
                           contentStyle={{ borderRadius: 14, border: "1px solid #E6E9E4", fontSize: 12 }} />
                  <Line type="monotone" dataKey="income" name={t("income")} stroke="#14806B" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="expenses" name={t("expenses")} stroke="#F5A623" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {dash.categories.slice(0, 6).map((category) => (
                <div key={category.category_id} className="flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-sm">
                  <span className="text-slate-600">{category.name}</span>
                  <span className="font-semibold text-navy">{myr(category.amount)}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={lang === "bm" ? "Analisis terperinci" : "Detailed analysis"}
            action={
              <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs" onClick={() => void openDetail()}>
                <ChevronDown className={`h-3.5 w-3.5 transition ${showDetail ? "rotate-180" : ""}`} />
                {showDetail ? t("collapse") : t("detailedAnalysis")}
              </button>
            }
          >
            {!showDetail && (
              <p className="text-sm text-muted">
                {lang === "bm"
                  ? "Buka untuk penjelasan penuh, kategori demi kategori dan perbandingan bulan lepas."
                  : "Open for the full explanation, category by category and a month-over-month read."}
              </p>
            )}
            {showDetail && loadingDetail && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {lang === "bm" ? "Menganalisis rekod anda…" : "Analysing your records…"}
              </p>
            )}
            {showDetail && detail && !loadingDetail && (
              <div className="space-y-4">
                {detail.notice && (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{detail.notice}</p>
                )}
                <Markdown>{detail.insight}</Markdown>
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-canvas text-[11px] uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-3 py-2 font-semibold">{t("category")}</th>
                        <th className="px-3 py-2 font-semibold">{t("spent")}</th>
                        <th className="px-3 py-2 font-semibold">{t("budget")}</th>
                        <th className="px-3 py-2 font-semibold">{lang === "bm" ? "Status" : "Status"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {detail.computed.budgets.map((row) => (
                        <tr key={row.category}>
                          <td className="px-3 py-2 text-slate-600">{row.category}</td>
                          <td className="px-3 py-2 text-navy">{myr(row.spent)}</td>
                          <td className="px-3 py-2 text-muted">{myr(row.limit)}</td>
                          <td className="px-3 py-2">
                            {row.state === "over" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#c2563a]">
                                <TriangleAlert className="h-3 w-3" />
                                {myr(row.remaining)} · {pct(row.percent_used)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted">{pct(row.percent_used)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="flex items-center gap-1.5 text-[11px] text-muted">
                  <Bot className="h-3 w-3" />
                  {detail.ai.status === "ok"
                    ? `${detail.ai.provider}${detail.ai.model ? ` · ${detail.ai.model}` : ""}`
                    : (lang === "bm" ? "Ringkasan dikira oleh pelayan" : "Backend-computed summary")}
                </p>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
