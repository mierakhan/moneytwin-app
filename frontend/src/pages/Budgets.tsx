import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { monthKey, myr, pct } from "../lib/format";
import { useI18n } from "../lib/i18n";
import type { BudgetRow, Category } from "../lib/types";

type Unbudgeted = { category_id: string; category_name: string; spent: string };
import { useToast } from "../state/Toast";
import MonthPicker from "../components/MonthPicker";
import { Badge, EmptyState, ErrorState, Modal, PercentText, ProgressBar, SectionCard, Skeleton } from "../components/ui";

export default function Budgets() {
  const { t, lang } = useI18n();
  const { push } = useToast();
  const [month, setMonth] = useState(monthKey());
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [unbudgeted, setUnbudgeted] = useState<Unbudgeted[]>([]);
  const [overspendTotal, setOverspendTotal] = useState("0.00");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetRow | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const alerted = useRef<Set<string>>(new Set());

  useEffect(() => {
    void api.get<{ categories: Category[] }>("/api/auth/categories")
      .then((res) => setCategories(res.categories.filter((c) => c.type === "expense")))
      .catch(() => setCategories([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ budgets: BudgetRow[]; unbudgeted: Unbudgeted[]; overspending_total: string }>(
        `/api/budgets/summary?month=${month}`);
      setRows(res.budgets);
      setUnbudgeted(res.unbudgeted ?? []);
      setOverspendTotal(res.overspending_total ?? "0.00");
      res.budgets.forEach((row) => {
        const key = `${row.id}:${row.state}`;
        if ((row.state === "warning" || row.state === "over") && !alerted.current.has(key)) {
          alerted.current.add(key);
          push(
            row.state === "over"
              ? (lang === "bm" ? `${row.category_name} melebihi bajet sebanyak ${myr(row.overspend)}` : `${row.category_name} is ${myr(row.overspend)} over budget`)
              : (lang === "bm" ? `${row.category_name} sudah ${pct(row.percent_used)} daripada bajet` : `${row.category_name} is at ${pct(row.percent_used)} of its budget`),
            row.state === "over" ? "error" : "info",
          );
        }
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setLoading(false);
    }
  }, [month, push, lang, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = (preset?: string) => {
    setEditing(null);
    setCategoryId(preset ?? categories[0]?.id ?? "");
    setLimit("");
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: BudgetRow) => {
    setEditing(row);
    setCategoryId(row.category_id);
    setLimit(row.limit);
    setFormError(null);
    setModalOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!(Number(limit) >= 0)) {
      setFormError(lang === "bm" ? "Had mesti sifar atau lebih." : "The limit must be zero or more.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/api/budgets/${editing.id}`, { limit });
      } else {
        await api.post("/api/budgets", { category_id: categoryId, month, limit });
      }
      push(lang === "bm" ? "Bajet disimpan." : "Budget saved.", "success");
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: BudgetRow) => {
    try {
      await api.del(`/api/budgets/${row.id}`);
      push(lang === "bm" ? "Bajet dipadam." : "Budget removed.", "success");
      await load();
    } catch (err) {
      push(err instanceof ApiError ? err.message : t("somethingWrong"), "error");
    }
  };

  const totalLimit = rows.reduce((sum, r) => sum + Number(r.limit), 0);
  const totalSpent = rows.reduce((sum, r) => sum + Number(r.spent), 0);
  const available = categories.filter((c) => !rows.some((r) => r.category_id === c.id));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("navBudgets")}</p>
          <h1 className="display mt-1 text-[30px] leading-tight text-navy sm:text-[36px]">{lang === "bm" ? "Had bulanan" : "Monthly limits"}</h1>
          <p className="mt-1 text-sm text-muted">
            {lang === "bm" ? "Amaran pada 80% dan apabila had dicapai." : "Alerts at 80% and when the limit is reached."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <button type="button" className="btn-primary" onClick={() => openAdd()} disabled={available.length === 0}>
            <Plus className="h-4 w-4" />{t("newBudget")}
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{lang === "bm" ? "Jumlah had" : "Total limits"}</p>
          <p className="mt-1 text-lg font-bold text-navy">{myr(totalLimit)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("spent")}</p>
          <p className="mt-1 text-lg font-bold text-blue">{myr(totalSpent)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("remaining")}</p>
          <p className={`mt-1 text-lg font-bold ${totalLimit - totalSpent < 0 ? "text-red-600" : "text-jade"}`}>{myr(totalLimit - totalSpent)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("overspent")}</p>
          <p className={`mt-1 text-lg font-bold ${overspendTotal !== "0.00" ? "text-[#c2563a]" : "text-navy"}`}>{myr(overspendTotal)}</p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={() => void load()} retryLabel={t("retry")} />}

      {loading && !rows.length && (
        <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="card p-5"><Skeleton className="h-4 w-24" /><Skeleton className="mt-4 h-2 w-full" /></div>)}</div>
      )}

      {!loading && rows.length === 0 && !error && (
        <SectionCard>
          <EmptyState title={lang === "bm" ? "Belum ada bajet" : "No budgets yet"}
                      body={lang === "bm" ? "Tetapkan had untuk makanan, sewa atau kategori lain." : "Set a limit for food, rent or any other category."}
                      action={<button type="button" className="btn-jade" onClick={() => openAdd()}>{t("newBudget")}</button>} />
        </SectionCard>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((row) => {
          const stateTone = row.state === "over" ? "red" : row.state === "warning" || row.state === "reached" ? "amber" : "jade";
          return (
            <article key={row.id} className="card card-pad">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-navy">{row.category_name}</h2>
                  <p className="mt-0.5 text-sm text-muted">
                    {myr(row.spent)} {lang === "bm" ? "daripada" : "of"} {myr(row.limit)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge tone={stateTone}>
                    {row.state === "over" ? t("overspent") : row.state === "reached" ? (lang === "bm" ? "Had dicapai" : "At limit") : row.state === "warning" ? "80%+" : t("budget")}
                  </Badge>
                </div>
              </div>
              <div className="mt-4">
                <ProgressBar value={row.percent_used} state={row.state} />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-sm">
                <PercentText value={row.percent_used} state={row.state} />
                <span className={Number(row.remaining) < 0 ? "font-semibold text-red-600" : "text-muted"}>
                  {Number(row.remaining) < 0
                    ? `${lang === "bm" ? "Terlebih" : "Over"} ${myr(row.overspend)}`
                    : `${myr(row.remaining)} ${lang === "bm" ? "tinggal" : "left"}`}
                </span>
              </div>
              {row.state === "over" && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {lang === "bm"
                    ? `${row.category_name} melebihi had sebanyak ${myr(row.overspend)}.`
                    : `${row.category_name} is ${myr(row.overspend)} above the limit.`}
                </p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="chip !py-1 text-xs" onClick={() => openEdit(row)}>{t("edit")}</button>
                <button type="button" className="chip !py-1 text-xs text-red-600" onClick={() => void remove(row)}>
                  <Trash2 className="mr-1 inline h-3 w-3" />{t("delete")}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {unbudgeted.length > 0 && (
        <section className="card card-pad">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {lang === "bm" ? "Belanja tanpa bajet" : "Unbudgeted spending"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {lang === "bm"
              ? "Kategori ini ada perbelanjaan tetapi tiada had untuk bulan ini."
              : "These categories have spending but no limit this month."}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {unbudgeted.map((row) => (
              <li key={row.category_id} className="flex items-center justify-between gap-3 rounded-2xl bg-canvas px-3.5 py-3">
                <span className="text-sm text-slate-600">{row.category_name}</span>
                <span className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-navy">{myr(row.spent)}</span>
                  <button type="button" className="chip !py-1 text-xs" onClick={() => openAdd(row.category_id)}>
                    {t("newBudget")}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `${t("edit")} ${editing.category_name}` : t("newBudget")}
             footer={
               <>
                 <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>{t("cancel")}</button>
                 <button type="submit" form="budget-form" className="btn-primary" disabled={saving}>{saving ? t("saving") : t("save")}</button>
               </>
             }>
        <form id="budget-form" onSubmit={save} className="space-y-4">
          {!editing && (
            <div>
              <label htmlFor="bcat" className="label">{t("category")}</label>
              <select id="bcat" className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                <option value="">—</option>
                {available.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="limit" className="label">{t("monthlyLimit")} (MYR)</label>
            <input id="limit" className="input" inputMode="decimal" placeholder="400.00" value={limit}
                   onChange={(e) => setLimit(e.target.value)} required />
          </div>
          {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
        </form>
      </Modal>
    </div>
  );
}
