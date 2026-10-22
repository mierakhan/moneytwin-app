import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Plus, Target, Trash2 } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { dateLabel, myr, pct } from "../lib/format";
import { useI18n } from "../lib/i18n";
import type { Goal } from "../lib/types";
import { useToast } from "../state/Toast";
import { Badge, EmptyState, ErrorState, Modal, ProgressBar, SectionCard, Skeleton } from "../components/ui";

export default function Goals() {
  const { t, lang } = useI18n();
  const { push } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("2400.00");
  const [saved, setSaved] = useState("0.00");
  const [deadline, setDeadline] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [contributeTo, setContributeTo] = useState<Goal | null>(null);
  const [contribution, setContribution] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ goals: Goal[] }>("/api/goals");
      setGoals(res.goals);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!(Number(target) > 0)) {
      setFormError(lang === "bm" ? "Sasaran mesti lebih daripada sifar." : "Target must be greater than zero.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/goals", {
        title: title.trim() || "Savings goal",
        target_amount: target,
        saved_amount: saved || "0.00",
        deadline: deadline || null,
      });
      push(lang === "bm" ? "Sasaran dicipta." : "Goal created.", "success");
      setCreateOpen(false);
      setTitle("");
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setSaving(false);
    }
  };

  const contribute = async () => {
    if (!contributeTo) return;
    try {
      await api.post(`/api/goals/${contributeTo.id}/contribute`, { amount: contribution });
      push(lang === "bm" ? "Simpanan direkod." : "Contribution recorded.", "success");
      setContributeTo(null);
      setContribution("");
      await load();
    } catch (err) {
      push(err instanceof ApiError ? err.message : t("somethingWrong"), "error");
    }
  };

  const remove = async (goal: Goal) => {
    try {
      await api.del(`/api/goals/${goal.id}`);
      push(lang === "bm" ? "Sasaran dipadam." : "Goal removed.", "success");
      await load();
    } catch (err) {
      push(err instanceof ApiError ? err.message : t("somethingWrong"), "error");
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("navGoals")}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">{lang === "bm" ? "Sasaran simpanan" : "Savings goals"}</h1>
          <p className="mt-1 text-sm text-muted">
            {lang === "bm" ? "Rekod simpanan sahaja. Tiada wang benar bergerak." : "Bookkeeping only. No real money moves."}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => { setFormError(null); setCreateOpen(true); }}>
          <Plus className="h-4 w-4" />{t("addGoal")}
        </button>
      </header>

      {error && <ErrorState message={error} onRetry={() => void load()} retryLabel={t("retry")} />}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="card p-5"><Skeleton className="h-4 w-32" /><Skeleton className="mt-4 h-2 w-full" /></div>)}</div>
      )}

      {!loading && goals.length === 0 && !error && (
        <SectionCard>
          <EmptyState icon={<Target className="h-6 w-6" />}
                      title={lang === "bm" ? "Belum ada sasaran" : "No goals yet"}
                      body={lang === "bm" ? "Contoh: dana kecemasan RM2,400 dalam 6 bulan." : "Example: a RM2,400 emergency fund in six months."}
                      action={<button type="button" className="btn-jade" onClick={() => setCreateOpen(true)}>{t("addGoal")}</button>} />
        </SectionCard>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const completed = goal.status === "completed";
          return (
            <article key={goal.id} className="card card-pad">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-navy">{goal.title}</h2>
                  <p className="mt-0.5 text-sm text-muted">
                    {myr(goal.saved_amount)} / {myr(goal.target_amount)}
                  </p>
                </div>
                <Badge tone={completed ? "jade" : goal.deadline_note === "overdue" ? "red" : "blue"}>
                  {completed ? t("completed") : goal.deadline_note === "overdue" ? t("overdue") : t("target")}
                </Badge>
              </div>

              <div className="mt-4"><ProgressBar value={goal.percent_complete} /></div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-jade">{pct(goal.percent_complete)}</span>
                <span className="text-muted">{myr(goal.remaining_amount)} {lang === "bm" ? "lagi" : "to go"}</span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-canvas p-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">{t("deadline")}</dt>
                  <dd className="mt-0.5 font-medium text-navy">{goal.deadline ? dateLabel(goal.deadline, lang) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t("monthlyNeeded")}</dt>
                  <dd className="mt-0.5 font-medium text-navy">
                    {goal.monthly_needed ? myr(goal.monthly_needed) : (lang === "bm" ? "Tiada tempoh sah" : "No valid period")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{lang === "bm" ? "Bulan tinggal" : "Months left"}</dt>
                  <dd className="mt-0.5 font-medium text-navy">{goal.months_remaining ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t("status")}</dt>
                  <dd className="mt-0.5 font-medium text-navy">{completed ? t("completed") : t("target")}</dd>
                </div>
              </dl>

              {goal.deadline_note === "overdue" && (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {lang === "bm" ? "Tarikh akhir sudah lepas. Tetapkan tarikh baharu." : "The deadline has passed. Set a new date to get a monthly figure."}
                </p>
              )}

              <div className="mt-4 flex justify-end gap-2">
                {!completed && (
                  <button type="button" className="btn-jade !py-1.5 !px-3 text-xs"
                          onClick={() => { setContributeTo(goal); setContribution(""); }}>
                    {t("contribute")}
                  </button>
                )}
                <button type="button" className="chip !py-1 text-xs text-red-600" onClick={() => void remove(goal)}>
                  <Trash2 className="mr-1 inline h-3 w-3" />{t("delete")}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("addGoal")}
             footer={
               <>
                 <button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>{t("cancel")}</button>
                 <button type="submit" form="goal-form" className="btn-primary" disabled={saving}>{saving ? t("saving") : t("save")}</button>
               </>
             }>
        <form id="goal-form" onSubmit={create} className="space-y-4">
          <div>
            <label htmlFor="gtitle" className="label">{lang === "bm" ? "Nama sasaran" : "Goal name"}</label>
            <input id="gtitle" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Emergency fund" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="gtarget" className="label">{t("target")} (MYR)</label>
              <input id="gtarget" className="input" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="gsaved" className="label">{t("saved")} (MYR)</label>
              <input id="gsaved" className="input" inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor="gdeadline" className="label">{t("deadline")}</label>
            <input id="gdeadline" type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
        </form>
      </Modal>

      <Modal open={!!contributeTo} onClose={() => setContributeTo(null)} title={t("contribute")}
             footer={
               <>
                 <button type="button" className="btn-ghost" onClick={() => setContributeTo(null)}>{t("cancel")}</button>
                 <button type="button" className="btn-jade" onClick={() => void contribute()}>{t("save")}</button>
               </>
             }>
        <p className="text-sm text-slate-600">
          {lang === "bm" ? "Ini hanya rekod simpanan, bukan pemindahan wang." : "This records savings only. No money is transferred."}
        </p>
        <div className="mt-4">
          <label htmlFor="contrib" className="label">{t("amount")} (MYR)</label>
          <input id="contrib" className="input" inputMode="decimal" placeholder="300.00" value={contribution}
                 onChange={(e) => setContribution(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
