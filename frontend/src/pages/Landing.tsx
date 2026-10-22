import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, BarChart3, Bot, CheckCircle2, Lock, PiggyBank, Sparkles, Target, Wallet,
} from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../lib/i18n";
import { Logo } from "../components/ui";
import { myr } from "../lib/format";

const faqs = [
  {
    q: "Do you connect to my bank?",
    a: "No. You enter your own transactions. MoneyTwin never asks for online banking details or card numbers.",
  },
  {
    q: "Is this financial advice?",
    a: "It is budgeting education and decision support. Simulations are hypothetical and nothing here is a guaranteed outcome.",
  },
  {
    q: "What does the AI actually see?",
    a: "Only totals, budget usage and goal progress computed from your own records. It never sees another account, and it never does the maths.",
  },
  {
    q: "Is my data shared?",
    a: "No. Every record is tied to your account and checked server-side on every request.",
  },
];

export default function Landing() {
  const { user, demo, loading } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

  const startDemo = async () => {
    try {
      await demo();
      navigate("/app");
    } catch {
      /* surfaced on the auth screen */
    }
  };

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" aria-label="MoneyTwin home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex" aria-label="Sections">
            <a href="#features" className="hover:text-navy">{t("features")}</a>
            <a href="#how" className="hover:text-navy">{t("howItWorks")}</a>
            <a href="#pricing" className="hover:text-navy">{t("pricing")}</a>
            <a href="#faq" className="hover:text-navy">{t("faq")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden gap-1 rounded-lg border border-line p-0.5 text-xs sm:flex">
              {(["en", "bm"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`rounded-md px-2 py-1 font-semibold uppercase ${lang === code ? "bg-navy text-white" : "text-slate-500"}`}
                >
                  {code}
                </button>
              ))}
            </div>
            {user ? (
              <Link to="/app" className="btn-primary">{t("navDashboard")}</Link>
            ) : (
              <>
                <Link to="/signin" className="hidden text-sm font-semibold text-navy px-2 sm:block">{t("signIn")}</Link>
                <Link to="/signup" className="btn-primary">{t("signUp")}</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-blue-soft/80 via-canvas to-white" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-jade/30 bg-white px-3 py-1 text-xs font-semibold text-jade">
              <Sparkles className="h-3.5 w-3.5" /> Built for Malaysian students and young workers
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-navy sm:text-5xl">
              Know your money.<br />
              <span className="text-jade">Preview your next move.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-slate-600">
              Track income and spending in Ringgit, set budgets that actually warn you, grow a savings goal,
              and test a what-if choice before you commit. The numbers are always computed from your own records.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/signup" className="btn-jade px-5 py-3">
                {t("startFree")} <ArrowRight className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => void startDemo()} disabled={loading} className="btn-ghost px-5 py-3">
                <Bot className="h-4 w-4" /> {t("demoLogin")}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">{t("demoNote")}</p>
            <ul className="mt-7 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              {["MYR and Asia/Kuala_Lumpur dates", "English and Bahasa Melayu", "AI explains, backend calculates", "No bank login required"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-jade" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="text-sm font-semibold text-navy">October overview</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Demo preview
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 px-5 pt-4">
                {[
                  { label: "Income", value: myr(2500), tone: "text-jade" },
                  { label: "Expenses", value: myr(1600), tone: "text-navy" },
                  { label: "Balance", value: myr(900), tone: "text-blue" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-canvas p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{stat.label}</p>
                    <p className={`mt-1 text-sm font-bold ${stat.tone}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 px-5 py-4">
                {[
                  { name: "Food", spent: 450, limit: 400, pct: 112, tone: "bg-red-500" },
                  { name: "Transport", spent: 200, limit: 250, pct: 80, tone: "bg-amber-400" },
                  { name: "Rent", spent: 600, limit: 600, pct: 100, tone: "bg-amber-500" },
                ].map((row) => (
                  <div key={row.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{row.name}</span>
                      <span className="text-muted">{myr(row.spent)} / {myr(row.limit)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${Math.min(row.pct, 100)}%` }} />
                    </div>
                  </div>
                ))}
                <div className="rounded-xl border border-blue/20 bg-blue-soft/70 p-3">
                  <p className="text-xs font-semibold text-navy">MoneyTwin</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Food is RM200 over its RM400 budget this month. Cutting RM50 a week would bring it back inside the limit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="eyebrow">What you get</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy sm:text-3xl">Six working tools, one ledger</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Wallet, title: "Budgets with alerts", body: "Per-category monthly limits with 80% and over-limit states, computed on the server." },
            { icon: BarChart3, title: "Live dashboard", body: "Income, expenses and balance for any month, with category breakdown and six-month trend." },
            { icon: Target, title: "Savings goals", body: "Target, deadline and the exact monthly contribution still needed. No division by zero." },
            { icon: Sparkles, title: "What-if simulator", body: "Change income, cut spending, add a bill. Baseline, proposed balance and assumptions in one view." },
            { icon: Bot, title: "Grounded AI assistant", body: "Explains your own numbers in English or BM. It never invents an amount, and it never sees another account." },
            { icon: PiggyBank, title: "AI insights", body: "A monthly read on where the money went, with the deterministic totals shown next to it." },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="card card-pad">
              <span className="inline-flex rounded-xl bg-jade-soft p-2.5 text-jade"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 text-base font-semibold text-navy">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-line bg-canvas">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy sm:text-3xl">Three steps, no bank login</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              { step: "01", title: "Record your month", body: "Income, rent, food, transport. Amounts are stored as sen, so nothing drifts." },
              { step: "02", title: "Set limits and goals", body: "Budgets warn you at 80% and flag overspend. Goals show the monthly amount still needed." },
              { step: "03", title: "Test before you commit", body: "Simulate RM300 extra a month, then ask the assistant to explain the trade-off." },
            ].map((item) => (
              <div key={item.step} className="card card-pad">
                <span className="text-xs font-bold tracking-widest text-jade">{item.step}</span>
                <h3 className="mt-2 text-base font-semibold text-navy">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card card-pad">
            <p className="eyebrow">Free</p>
            <p className="mt-2 text-3xl font-bold text-navy">RM0</p>
            <p className="mt-1 text-sm text-muted">Everything in this build</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {["Unlimited transactions", "Budgets and goals", "Simulator and AI assistant"].map((i) => (
                <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-jade" />{i}</li>
              ))}
            </ul>
          </div>
          <div className="card card-pad border-navy/20 bg-navy text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Paid (illustrative)</p>
            <p className="mt-2 text-3xl font-bold">RM19<span className="text-base font-medium text-slate-300">/month</span></p>
            <p className="mt-1 text-sm text-slate-300">A hypothesis, not a live product</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              {["CSV import and export", "Deeper monthly reviews", "Priority AI allowance"].map((i) => (
                <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-jade" />{i}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-400">No billing is connected in this build.</p>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-line bg-canvas">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-navy">Questions</h2>
          <div className="mt-6 space-y-3">
            {faqs.map((item) => (
              <details key={item.q} className="group card px-5 py-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-navy marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <span className="text-muted transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Logo label={false} size={26} />
            <p className="text-xs text-muted">MoneyTwin AI · Local demo build · Asia/Kuala_Lumpur · MYR</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Private by default</span>
            <a href="#faq" className="hover:text-navy">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
