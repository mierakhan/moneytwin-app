import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Info, Save, Sparkles } from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api, ApiError } from "../lib/api";
import { monthKey, myr } from "../lib/format";
import { useI18n } from "../lib/i18n";
import type { Dashboard, SimulationResult } from "../lib/types";
import { useToast } from "../state/Toast";
import { ErrorState, SectionCard } from "../components/ui";

type Form = {
  monthly_income: string;
  monthly_expenses: string;
  income_change: string;
  expense_reduction: string;
  new_recurring_expense: string;
  savings_contribution: string;
  one_off_purchase: string;
  months: number;
  title: string;
};

const initial: Form = {
  monthly_income: "",
  monthly_expenses: "",
  income_change: "0.00",
  expense_reduction: "0.00",
  new_recurring_expense: "0.00",
  savings_contribution: "0.00",
  one_off_purchase: "0.00",
  months: 6,
  title: "",
};

export default function Simulator() {
  const { t, lang } = useI18n();
  const { push } = useToast();
  const [form, setForm] = useState<Form>(initial);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baselineLoaded, setBaselineLoaded] = useState(false);

  const loadBaseline = useCallback(async () => {
    try {
      const dash = await api.get<Dashboard>(`/api/dashboard?month=${monthKey()}`);
      setForm((f) => ({ ...f, monthly_income: dash.income, monthly_expenses: dash.expenses }));
      setBaselineLoaded(true);
    } catch {
      setBaselineLoaded(false);
    }
  }, []);

  useEffect(() => {
    void loadBaseline();
  }, [loadBaseline]);

  const update = (key: keyof Form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = key === "months" ? Number(event.target.value) : event.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const calculate = async (save = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ result: SimulationResult; saved_id: string | null }>("/api/simulations/calculate", {
        ...form,
        months: Number(form.months) || 6,
        title: form.title || undefined,
        save,
      });
      setResult(res.result);
      if (save) push(lang === "bm" ? "Senario disimpan." : "Scenario saved.", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setLoading(false);
    }
  };

  const delta = result ? Number(result.monthly_delta) : 0;

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">{t("navSimulator")}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">{lang === "bm" ? "Apa jika…" : "What if…"}</h1>
        <p className="mt-1 text-sm text-muted">
          {lang === "bm"
            ? "Angka dikira oleh pelayan. Rekod anda tidak diubah."
            : "Computed by the server. Your saved records are never changed."}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
        <SectionCard title={lang === "bm" ? "Senario anda" : "Your scenario"}>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void calculate(); }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="income" className="label">{t("monthlyIncome")}</label>
                <input id="income" className="input" inputMode="decimal" value={form.monthly_income} onChange={update("monthly_income")} placeholder="2500.00" />
              </div>
              <div>
                <label htmlFor="expenses" className="label">{lang === "bm" ? "Perbelanjaan bulanan" : "Monthly expenses"}</label>
                <input id="expenses" className="input" inputMode="decimal" value={form.monthly_expenses} onChange={update("monthly_expenses")} placeholder="1600.00" />
              </div>
            </div>
            <div className="rounded-xl bg-canvas p-3 text-xs text-muted">
              {baselineLoaded
                ? (lang === "bm" ? "Nilai awal diambil daripada bulan semasa anda." : "Prefilled from your current month.")
                : (lang === "bm" ? "Masukkan angka anda sendiri mengikut keperluan." : "Enter your own figures if you prefer.")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="new" className="label">{lang === "bm" ? "Perbelanjaan tetap baharu" : "New recurring cost"}</label>
                <input id="new" className="input" inputMode="decimal" value={form.new_recurring_expense} onChange={update("new_recurring_expense")} placeholder="300.00" />
              </div>
              <div>
                <label htmlFor="reduction" className="label">{lang === "bm" ? "Kurangkan perbelanjaan" : "Spending cut"}</label>
                <input id="reduction" className="input" inputMode="decimal" value={form.expense_reduction} onChange={update("expense_reduction")} placeholder="0.00" />
              </div>
              <div>
                <label htmlFor="change" className="label">{lang === "bm" ? "Perubahan pendapatan" : "Income change"}</label>
                <input id="change" className="input" inputMode="decimal" value={form.income_change} onChange={update("income_change")} placeholder="0.00" />
              </div>
              <div>
                <label htmlFor="savings" className="label">{lang === "bm" ? "Komitmen simpanan" : "Savings commitment"}</label>
                <input id="savings" className="input" inputMode="decimal" value={form.savings_contribution} onChange={update("savings_contribution")} placeholder="0.00" />
              </div>
              <div>
                <label htmlFor="oneoff" className="label">{lang === "bm" ? "Beli sekali sahaja" : "One-off purchase"}</label>
                <input id="oneoff" className="input" inputMode="decimal" value={form.one_off_purchase} onChange={update("one_off_purchase")} placeholder="0.00" />
              </div>
              <div>
                <label htmlFor="months" className="label">{lang === "bm" ? "Bulan" : "Months"}</label>
                <input id="months" type="number" min={1} max={60} className="input" value={form.months} onChange={update("months")} />
              </div>
            </div>
            <div>
              <label htmlFor="title" className="label">{lang === "bm" ? "Nama senario (pilihan)" : "Scenario name (optional)"}</label>
              <input id="title" className="input" value={form.title} onChange={update("title")} placeholder={lang === "bm" ? "Kereta baharu" : "New car"} maxLength={120} />
            </div>

            {error && <ErrorState message={error} />}

            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary" disabled={loading}>
                <Sparkles className="h-4 w-4" />{loading ? t("loading") : t("runSimulation")}
              </button>
              <button type="button" className="btn-ghost" disabled={!result || loading} onClick={() => void calculate(true)}>
                <Save className="h-4 w-4" />{lang === "bm" ? "Simpan senario" : "Save scenario"}
              </button>
            </div>
          </form>
        </SectionCard>

        <div className="space-y-4">
          {!result && (
            <SectionCard title={t("baseline")}>
              <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-slate-50/60 text-center">
                <ArrowRight className="h-6 w-6 text-slate-400" />
                <p className="max-w-xs text-sm text-muted">
                  {lang === "bm"
                    ? "Jalankan simulasi untuk melihat baki asas dan cadangan."
                    : "Run a simulation to see your baseline and proposed balance."}
                </p>
              </div>
            </SectionCard>
          )}

          {result && (
            <>
              <SectionCard title={lang === "bm" ? "Hasil" : "Result"} subtitle={`${result.months} ${lang === "bm" ? "bulan" : "months"}`}>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-canvas p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t("baseline")}</p>
                    <p className="mt-1 text-sm font-bold text-navy">{myr(result.baseline_balance)}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${delta < 0 ? "bg-red-50" : "bg-jade-soft"}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t("proposed")}</p>
                    <p className={`mt-1 text-sm font-bold ${delta < 0 ? "text-red-700" : "text-jade"}`}>{myr(result.projected_balance)}</p>
                  </div>
                  <div className="rounded-xl bg-canvas p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t("difference")}</p>
                    <p className={`mt-1 text-sm font-bold ${delta < 0 ? "text-red-700" : "text-jade"}`}>
                      {delta > 0 ? "+" : ""}{myr(result.monthly_delta)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[{ month: 0, cumulative: 0 }, ...result.series.map((s) => ({ month: s.month, cumulative: Number(s.cumulative) }))]}
                               margin={{ top: 6, right: 10, bottom: 0, left: -16 }}>
                      <defs>
                        <linearGradient id="simFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4878E8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4878E8" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false}
                             tickFormatter={(v) => (v === 0 ? "Now" : `M${v}`)} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => myr(Number(value))} labelFormatter={(v) => (Number(v) === 0 ? "Now" : `Month ${v}`)}
                               contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                      <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="cumulative" stroke="#4878E8" strokeWidth={2} fill="url(#simFill)"
                            name={lang === "bm" ? "Terkumpul" : "Cumulative"} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 rounded-xl border border-line bg-canvas p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-navy">
                    <Info className="h-3.5 w-3.5" />{t("assumptions")}
                  </p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-muted">
                    {result.assumptions.map((a) => <li key={a}>{a}</li>)}
                  </ul>
                </div>
                <p className="mt-2 text-xs text-amber-700">{t("hypothetical")}</p>
              </SectionCard>

              <div className="card p-4 text-sm">
                <p className="font-semibold text-navy">{lang === "bm" ? "Tajaan untuk chat" : "Carry this into chat"}</p>
                <p className="mt-1 text-muted">
                  {lang === "bm"
                    ? `Tanya MoneyTwin: "Kalau saya tambah ${myr(result.new_recurring_expense)} sebulan, apa kesannya?"`
                    : `Ask MoneyTwin: "If I add ${myr(result.new_recurring_expense)} a month, what happens?"`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
