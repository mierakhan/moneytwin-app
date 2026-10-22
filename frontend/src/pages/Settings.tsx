import { useState } from "react";
import { Download, LogOut, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../state/AuthContext";
import { useToast } from "../state/Toast";
import { Modal, SectionCard } from "../components/ui";

export default function SettingsPage() {
  const { user, setUser, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { push } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.display_name ?? "");
  const [income, setIncome] = useState(user?.monthly_income ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.patch<{ user: typeof user }>("/api/auth/profile", {
        display_name: name,
        locale: lang,
        monthly_income: income || null,
      });
      if (res.user) setUser(res.user);
      push(lang === "bm" ? "Profil dikemas kini." : "Profile saved.", "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    setBusy(true);
    try {
      const [txns, budgets, goals, conversations] = await Promise.all([
        api.get<{ items: unknown[] }>("/api/transactions?limit=200"),
        api.get<{ budgets: unknown[] }>("/api/budgets"),
        api.get<{ goals: unknown[] }>("/api/goals"),
        api.get<{ conversations: unknown[] }>("/api/ai/conversations"),
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        account: { email: user?.email, display_name: user?.display_name, locale: user?.locale },
        transactions: txns.items,
        budgets: budgets.budgets,
        goals: goals.goals,
        conversations: conversations.conversations,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `moneytwin-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      push(lang === "bm" ? "Eksport dimuat turun." : "Export downloaded.", "success");
    } catch (err) {
      push(err instanceof ApiError ? err.message : t("somethingWrong"), "error");
    } finally {
      setBusy(false);
    }
  };

  const resetDemo = async () => {
    setBusy(true);
    try {
      await api.post("/api/auth/reset-demo");
      push(lang === "bm" ? "Data contoh ditetapkan semula." : "Sample data reset.", "success");
    } catch (err) {
      push(err instanceof ApiError ? err.message : t("somethingWrong"), "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    try {
      await api.del("/api/auth/account");
      setUser(null);
      navigate("/");
    } catch (err) {
      push(err instanceof ApiError ? err.message : t("somethingWrong"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">{t("navSettings")}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">{lang === "bm" ? "Tetapan anda" : "Your settings"}</h1>
        <p className="mt-1 text-sm text-muted">{user?.email}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title={t("settingsProfile")}>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label htmlFor="display" className="label">{t("displayName")}</label>
              <input id="display" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </div>
            <div>
              <label htmlFor="income" className="label">{t("monthlyIncome")} (MYR)</label>
              <input id="income" className="input" inputMode="decimal" value={income ?? ""} onChange={(e) => setIncome(e.target.value)} placeholder="2500.00" />
            </div>
            <div>
              <span className="label">{t("language")}</span>
              <div className="flex gap-2">
                {(["en", "bm"] as const).map((code) => (
                  <button key={code} type="button" onClick={() => setLang(code)}
                          className={`rounded-xl border px-3 py-2 text-sm font-semibold ${lang === code ? "border-navy bg-navy text-white" : "border-line text-slate-600"}`}>
                    {code === "en" ? "English" : "Bahasa Melayu"}
                  </button>
                ))}
              </div>
            </div>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? t("saving") : t("save")}</button>
          </form>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title={t("privacy")}>
            <p className="text-sm text-muted">
              {lang === "bm"
                ? "Muat turun semua rekod anda, atau tetapkan semula data contoh pada akaun demo."
                : "Download every record you own, or reset the sample data on the demo account."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => void exportData()} disabled={busy}>
                <Download className="h-4 w-4" />{t("exportData")}
              </button>
              {user?.is_demo && (
                <button type="button" className="btn-ghost" onClick={() => void resetDemo()} disabled={busy}>
                  <RotateCcw className="h-4 w-4" />{t("resetDemo")}
                </button>
              )}
              <button type="button" className="btn-ghost" onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" />{t("signOut")}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">
              {lang === "bm"
                ? "Data disimpan dalam pangkalan data pelayan, bukan localStorage pelayar."
                : "Records live in the server database, not in browser localStorage."}
            </p>
          </SectionCard>

          <SectionCard title={t("dangerZone")}>
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-800">{t("deleteAccount")}</p>
                <p className="mt-1 text-xs text-red-700">
                  {lang === "bm"
                    ? "Ini memadam akaun dan semua transaksi, bajet, sasaran dan sembang anda sahaja."
                    : "This deletes your account and only your own transactions, budgets, goals and chats."}
                </p>
                <button type="button" className="btn-danger mt-3 !py-1.5 !px-3 text-xs" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-3.5 w-3.5" />{t("delete")}
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t("deleteAccount")}
             footer={
               <>
                 <button type="button" className="btn-ghost" onClick={() => setConfirmDelete(false)}>{t("cancel")}</button>
                 <button type="button" className="btn-danger" onClick={() => void deleteAccount()} disabled={busy}>{t("delete")}</button>
               </>
             }>
        <p className="text-sm text-slate-600">
          {lang === "bm"
            ? "Tindakan ini tidak boleh dibatalkan. Akaun lain tidak terjejas."
            : "This cannot be undone. No other account is affected."}
        </p>
      </Modal>
    </div>
  );
}
