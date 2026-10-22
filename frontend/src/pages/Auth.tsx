import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { ApiError } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { Logo } from "../components/ui";

export default function AuthPage({ mode }: { mode: "signin" | "signup" }) {
  const { signIn, signUp, demo, user } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [income, setIncome] = useState("2500.00");
  const [loadDemo, setLoadDemo] = useState(false);
  const [busy, setBusy] = useState<"form" | "demo" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy("form");
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        await signUp({
          email: email.trim(),
          password,
          display_name: name.trim() || "MoneyTwin user",
          locale: lang,
          monthly_income: income ? income : null,
          load_demo_data: loadDemo,
        });
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const startDemo = async () => {
    setError(null);
    setBusy("demo");
    try {
      await demo();
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The demo account is unavailable.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="relative hidden flex-col justify-between bg-navy p-10 text-white lg:flex">
        <Link to="/" className="inline-flex" aria-label="MoneyTwin home">
          <span className="inline-flex items-center gap-2.5">
            <svg width={34} height={34} viewBox="0 0 64 64" aria-hidden="true">
              <rect width="64" height="64" rx="16" fill="#1D2D52" />
              <circle cx="25" cy="32" r="11" fill="none" stroke="#159B83" strokeWidth="4" />
              <circle cx="39" cy="32" r="11" fill="none" stroke="#4878E8" strokeWidth="4" />
            </svg>
            <span className="text-lg font-bold tracking-tight">MoneyTwin AI</span>
          </span>
        </Link>
        <div>
          <h1 className="max-w-sm text-3xl font-extrabold leading-tight">Know your money. Preview your next move.</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300">
            Ringgit budgets, savings goals and a what-if simulator. Every figure is calculated from your own records,
            and the assistant explains rather than guesses.
          </p>
        </div>
        <p className="text-xs text-slate-400">Fictional demo data available. No real bank connection.</p>
      </div>

      <div className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link to="/" aria-label="Home"><Logo /></Link>
            <div className="flex gap-1 rounded-lg border border-line p-0.5 text-xs">
              {(["en", "bm"] as const).map((code) => (
                <button key={code} type="button" onClick={() => setLang(code)}
                        className={`rounded px-2 py-1 font-semibold uppercase ${lang === code ? "bg-navy text-white" : "text-slate-500"}`}>
                  {code}
                </button>
              ))}
            </div>
          </div>

          <h2 className="display text-[32px] leading-tight text-navy">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {mode === "signin" ? "Sign in to see your month." : "Takes under a minute. MYR is the default currency."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className="label">{t("name")}</label>
                <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)}
                       autoComplete="name" placeholder="Aisyah Rahman" required />
              </div>
            )}
            <div>
              <label htmlFor="email" className="label">{t("email")}</label>
              <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)}
                     autoComplete="email" placeholder="you@example.com" required />
            </div>
            <div>
              <label htmlFor="password" className="label">{t("password")}</label>
              <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)}
                     autoComplete={mode === "signin" ? "current-password" : "new-password"}
                     placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} required minLength={8} />
            </div>
            {mode === "signup" && (
              <>
                <div>
                  <label htmlFor="income" className="label">{t("monthlyIncome")} (MYR)</label>
                  <input id="income" inputMode="decimal" className="input" value={income} onChange={(e) => setIncome(e.target.value)}
                         placeholder="2500.00" />
                </div>
                <label className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas p-3 text-sm">
                  <input type="checkbox" checked={loadDemo} onChange={(e) => setLoadDemo(e.target.checked)}
                         className="mt-0.5 h-4 w-4 rounded border-line text-jade" />
                  <span>
                    <span className="font-semibold text-navy">Load fictional sample data</span>
                    <span className="block text-xs text-muted">RM2,500 income, RM1,600 expenses, one savings goal.</span>
                  </span>
                </label>
              </>
            )}

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy !== null} className="btn-primary w-full py-3">
              {busy === "form" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "signin" ? t("signIn") : t("signUp")}
              {busy !== "form" && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>

          <button type="button" onClick={() => void startDemo()} disabled={busy !== null} className="btn-ghost w-full py-3">
            {busy === "demo" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("demoLogin")}
          </button>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === "signin" ? (
              <>No account yet? <Link to="/signup" className="font-semibold text-navy hover:underline">{t("signUp")}</Link></>
            ) : (
              <>Already have one? <Link to="/signin" className="font-semibold text-navy hover:underline">{t("signIn")}</Link></>
            )}
          </p>
          <p className="mt-8 text-center text-xs text-slate-400">
            Passwords are hashed with Argon2. Sessions live in HttpOnly cookies.
          </p>
        </div>
      </div>
    </div>
  );
}
