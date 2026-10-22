import { useCallback, useEffect, useState } from "react";
import { Bot, ScanLine, Sparkles, TrendingDown, TriangleAlert } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { monthKey, myr, pct } from "../lib/format";
import { useI18n } from "../lib/i18n";
import type { Analysis } from "../lib/types";
import MonthPicker from "../components/MonthPicker";
import { Badge, EmptyState, ErrorState, SectionCard, Skeleton, StatCard } from "../components/ui";
import Markdown from "../components/Markdown";

export default function Insights() {
  const { t, lang } = useI18n();
  const [month, setMonth] = useState(monthKey());
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ configured: boolean; provider: string; model: string | null } | null>(null);

  useEffect(() => {
    void api.get<{ configured: boolean; provider: string; model: string | null }>("/api/ai/status")
      .then((res) => setStatus(res))
      .catch(() => setStatus(null));
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<Analysis>("/api/ai/analyze", { month, locale: lang });
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setLoading(false);
    }
  }, [month, lang, t]);

  useEffect(() => {
    setData(null);
  }, [month]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("navInsights")}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">{lang === "bm" ? "Wawasan perbelanjaan" : "Spending insight"}</h1>
          <p className="mt-1 text-sm text-muted">{t("insightNotice")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <button type="button" className="btn-primary" onClick={() => void run()} disabled={loading}>
            <ScanLine className="h-4 w-4" />{loading ? t("loading") : t("generateInsight")}
          </button>
        </div>
      </header>

      <div
        className={`flex flex-wrap items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
          status?.configured ? "border-jade/30 bg-jade-soft text-jade" : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <Bot className="h-4 w-4" />
        {status?.configured ? (
          <span>
            {lang === "bm" ? "Penyedia AI dikonfigurasi" : "AI provider configured"} · {status.provider}
            {status.model ? ` · ${status.model}` : ""} ·{" "}
            {lang === "bm" ? "Pengesahan berlaku semasa panggilan sebenar" : "verified on a real call"}
          </span>
        ) : (
          <span>
            {t("aiNotConnected")} — {lang === "bm"
              ? "angka di bawah tetap dikira daripada data anda."
              : "the figures below are still computed from your data."}
          </span>
        )}
      </div>

      {error && <ErrorState message={error} onRetry={() => void run()} retryLabel={t("retry")} />}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5"><Skeleton className="h-3 w-20" /><Skeleton className="mt-4 h-7 w-24" /></div>
          ))}
        </div>
      )}

      {!data && !loading && (
        <SectionCard>
          <EmptyState icon={<Sparkles className="h-6 w-6" />}
                      title={lang === "bm" ? "Jana analisis untuk bulan ini" : "Generate this month's analysis"}
                      body={lang === "bm"
                        ? "Kami kira jumlah sebenar dahulu, kemudian AI menerangkannya."
                        : "We compute the real totals first, then the assistant explains them."}
                      action={<button type="button" className="btn-jade" onClick={() => void run()}>{t("generateInsight")}</button>} />
        </SectionCard>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t("income")} value={myr(data.computed.income)} tone="jade" />
            <StatCard label={t("expenses")} value={myr(data.computed.expenses)} tone="navy" />
            <StatCard label={t("balance")} value={myr(data.computed.balance)} tone="blue" />
            <StatCard label={t("overspent")} value={myr(data.computed.overspending_amount)} tone="amber" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
            <SectionCard title={lang === "bm" ? "Penjelasan" : "Explanation"}
                         action={<Badge tone={data.grounded ? "jade" : "amber"}>
                           {data.grounded
                             ? (lang === "bm" ? "Berpandukan data" : "Grounded")
                             : (lang === "bm" ? "Ringkasan dikira" : "Computed summary")}
                         </Badge>}>
              {data.notice && (
                <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{data.notice}</p>
              )}
              {data.insight.includes("|") || data.insight.includes("**") ? (
                <Markdown>{data.insight}</Markdown>
              ) : (
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{data.insight}</p>
              )}
              {data.recommendation && (
                <div className="mt-4 rounded-xl bg-canvas p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {lang === "bm" ? "Cadangan" : "Suggestion"}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{data.recommendation}</p>
                </div>
              )}
              <p className="mt-4 text-xs text-muted">
                {data.ai.status === "ok"
                  ? `${data.ai.provider}${data.ai.model ? ` · ${data.ai.model}` : ""}`
                  : `${lang === "bm" ? "Status AI" : "AI status"}: ${data.ai.status}`}
              </p>
            </SectionCard>

            <div className="space-y-4">
              <SectionCard title={t("breakdown")}>
                {data.computed.categories.length === 0 ? (
                  <p className="text-sm text-muted">{t("noData")}</p>
                ) : (
                  <ul className="space-y-2.5">
                    {data.computed.categories.slice(0, 6).map((cat) => (
                      <li key={cat.category_id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{cat.name}</span>
                        <span className="font-semibold text-navy">{myr(cat.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard title={t("budget")}>
                {data.computed.budgets.length === 0 ? (
                  <p className="text-sm text-muted">{lang === "bm" ? "Belum ada bajet ditetapkan." : "No budgets set yet."}</p>
                ) : (
                  <ul className="space-y-2.5">
                    {data.computed.budgets.map((b) => (
                      <li key={b.category} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          {b.state === "over" && <TriangleAlert className="h-3.5 w-3.5 text-red-600" />}
                          {b.category}
                        </span>
                        <span className={b.state === "over" ? "font-semibold text-red-600" : "text-muted"}>
                          {myr(b.spent)} / {myr(b.limit)} · {pct(b.percent_used)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <div className="card p-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-navy">
                  <TrendingDown className="h-4 w-4 text-jade" />
                  {lang === "bm" ? "Perlu diingat" : "Worth knowing"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {lang === "bm"
                    ? "AI menerangkan angka ini tetapi tidak mengiranya. Semak semula jika anda mengimport data lama."
                    : "The assistant explains these figures but never calculates them. Re-check if you later import older data."}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
