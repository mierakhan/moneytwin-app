import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { dateLabel, monthKey, myr, todayISO } from "../lib/format";
import { useI18n } from "../lib/i18n";
import type { Category, Transaction } from "../lib/types";
import { useToast } from "../state/Toast";
import MonthPicker from "../components/MonthPicker";
import { Badge, EmptyState, ErrorState, Modal, SectionCard, Skeleton } from "../components/ui";

type Draft = {
  type: "income" | "expense";
  amount: string;
  category_id: string;
  transaction_date: string;
  description: string;
  merchant: string;
};

const emptyDraft = (date: string): Draft => ({
  type: "expense", amount: "", category_id: "", transaction_date: date, description: "", merchant: "",
});

export default function Transactions() {
  const { t, lang } = useI18n();
  const { push } = useToast();
  const [month, setMonth] = useState(monthKey());
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [categoryId, setCategoryId] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft(todayISO()));
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null);

  useEffect(() => {
    void api.get<{ categories: Category[] }>("/api/auth/categories")
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ month, limit: "100" });
      if (filterType !== "all") params.set("type", filterType);
      if (categoryId) params.set("category_id", categoryId);
      if (query.trim()) params.set("q", query.trim());
      const res = await api.get<{ items: Transaction[]; total: number }>(`/api/transactions?${params}`);
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setLoading(false);
    }
  }, [month, filterType, categoryId, query, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 220);
    return () => window.clearTimeout(timer);
  }, [load]);

  const categoriesForType = useMemo(
    () => categories.filter((c) => c.type === draft.type),
    [categories, draft.type],
  );

  const openAdd = () => {
    setEditing(null);
    setFormError(null);
    setDraft({ ...emptyDraft(todayISO()), category_id: categoriesForType[0]?.id ?? "" });
    setModalOpen(true);
  };

  const openEdit = (txn: Transaction) => {
    setEditing(txn);
    setFormError(null);
    setDraft({
      type: txn.type,
      amount: txn.amount,
      category_id: txn.category_id,
      transaction_date: txn.transaction_date,
      description: txn.description ?? "",
      merchant: txn.merchant ?? "",
    });
    setModalOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!draft.category_id) {
      setFormError(lang === "bm" ? "Pilih kategori." : "Choose a category.");
      return;
    }
    if (!(Number(draft.amount) > 0)) {
      setFormError(lang === "bm" ? "Jumlah mesti lebih daripada sifar." : "Amount must be greater than zero.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.patch<Transaction>(`/api/transactions/${editing.id}`, draft);
        push(lang === "bm" ? "Transaksi dikemas kini." : "Transaction updated.", "success");
      } else {
        await api.post<Transaction>("/api/transactions", draft);
        push(lang === "bm" ? "Transaksi disimpan." : "Transaction saved.", "success");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    try {
      await api.del(`/api/transactions/${confirmDelete.id}`);
      push(lang === "bm" ? "Transaksi dipadam." : "Transaction deleted.", "success");
      setConfirmDelete(null);
      await load();
    } catch (err) {
      push(err instanceof ApiError ? err.message : t("somethingWrong"), "error");
    }
  };

  const income = items.filter((i) => i.type === "income").reduce((sum, i) => sum + Number(i.amount), 0);
  const expenses = items.filter((i) => i.type === "expense" && !i.is_refund).reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t("navTransactions")}</p>
          <h1 className="display mt-1 text-[30px] leading-tight text-navy sm:text-[36px]">Ledger</h1>
          <p className="mt-1 text-sm text-muted">
            {lang === "bm" ? "Setiap baris milik akaun anda sahaja." : "Every row belongs to your account only."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <button type="button" className="btn-primary" onClick={openAdd}><Plus className="h-4 w-4" />{t("add")}</button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("income")}</p>
          <p className="mt-1 text-lg font-bold text-jade">{myr(income)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("expenses")}</p>
          <p className="mt-1 text-lg font-bold text-navy">{myr(expenses)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("balance")}</p>
          <p className="mt-1 text-lg font-bold text-blue">{myr(income - expenses)}</p>
        </div>
      </div>

      <SectionCard>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-line p-0.5">
            {(["all", "expense", "income"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setFilterType(value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filterType === value ? "bg-navy text-white" : "text-slate-600"}`}>
                {value === "all" ? t("all") : value === "expense" ? t("expense") : t("income")}
              </button>
            ))}
          </div>
          <select className="input !w-auto !py-1.5 text-xs" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label={t("category")}>
            <option value="">{t("all")} {t("category").toLowerCase()}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input !pl-9" placeholder={t("search")} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {error && <ErrorState message={error} onRetry={() => void load()} retryLabel={t("retry")} />}

        {loading && !items.length && (
          <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        )}

        {!loading && items.length === 0 && !error && (
          <EmptyState title={t("noData")} body={t("noDataBody")}
                      action={<button type="button" className="btn-jade" onClick={openAdd}>{t("addTransaction")}</button>} />
        )}

        {items.length > 0 && (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-line sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">{t("date")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("description")}</th>
                    <th className="px-4 py-2.5 font-semibold">{t("category")}</th>
                    <th className="px-4 py-2.5 text-right font-semibold">{t("amount")}</th>
                    <th className="px-4 py-2.5 text-right font-semibold">{t("edit")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 text-muted">{dateLabel(txn.transaction_date, lang)}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-navy">{txn.description || "—"}</span>
                        {txn.merchant && <span className="ml-2 text-xs text-muted">{txn.merchant}</span>}
                        {txn.is_refund && <Badge tone="blue">{lang === "bm" ? "Bayaran balik" : "Refund"}</Badge>}
                      </td>
                      <td className="px-4 py-2.5 text-muted">{txn.category}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${txn.type === "income" || txn.is_refund ? "text-jade" : "text-navy"}`}>
                        {txn.type === "income" || txn.is_refund ? "+" : "−"}{myr(txn.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <button type="button" aria-label={t("edit")} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" onClick={() => openEdit(txn)}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" aria-label={t("delete")} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(txn)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-2 sm:hidden">
              {items.map((txn) => (
                <li key={txn.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">{txn.description || txn.category}</p>
                      <p className="text-xs text-muted">{txn.category} · {dateLabel(txn.transaction_date, lang)}</p>
                    </div>
                    <span className={`text-sm font-bold ${txn.type === "income" || txn.is_refund ? "text-jade" : "text-navy"}`}>
                      {txn.type === "income" || txn.is_refund ? "+" : "−"}{myr(txn.amount)}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="chip !py-1 text-xs" onClick={() => openEdit(txn)}>{t("edit")}</button>
                    <button type="button" className="chip !py-1 text-xs text-red-600" onClick={() => setConfirmDelete(txn)}>{t("delete")}</button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">{total} {lang === "bm" ? "rekod" : "records"}</p>
          </>
        )}
      </SectionCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t("edit") : t("addTransaction")}
             footer={
               <>
                 <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>{t("cancel")}</button>
                 <button type="submit" form="txn-form" className="btn-primary" disabled={saving}>{saving ? t("saving") : t("save")}</button>
               </>
             }>
        <form id="txn-form" onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["expense", "income"] as const).map((value) => (
              <button key={value} type="button"
                      onClick={() => setDraft((d) => ({ ...d, type: value, category_id: "" }))}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${draft.type === value ? "border-navy bg-navy text-white" : "border-line text-slate-600"}`}>
                {value === "expense" ? t("expense") : t("income")}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="amount" className="label">{t("amount")} (MYR)</label>
            <input id="amount" className="input" inputMode="decimal" placeholder="12.50" value={draft.amount}
                   onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))} required />
          </div>
          <div>
            <label htmlFor="category" className="label">{t("category")}</label>
            <select id="category" className="input" value={draft.category_id}
                    onChange={(e) => setDraft((d) => ({ ...d, category_id: e.target.value }))} required>
              <option value="">—</option>
              {categoriesForType.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="date" className="label">{t("date")}</label>
            <input id="date" type="date" className="input" value={draft.transaction_date}
                   onChange={(e) => setDraft((d) => ({ ...d, transaction_date: e.target.value }))} required />
          </div>
          <div>
            <label htmlFor="desc" className="label">{t("description")}</label>
            <input id="desc" className="input" maxLength={500} placeholder={lang === "bm" ? "Contoh: makan tengah hari" : "e.g. Lunch"}
                   value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="merchant" className="label">Merchant</label>
            <input id="merchant" className="input" maxLength={120} value={draft.merchant}
                   onChange={(e) => setDraft((d) => ({ ...d, merchant: e.target.value }))} />
          </div>
          {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t("delete")}
             footer={
               <>
                 <button type="button" className="btn-ghost" onClick={() => setConfirmDelete(null)}>{t("cancel")}</button>
                 <button type="button" className="btn-danger" onClick={() => void remove()}>{t("delete")}</button>
               </>
             }>
        <p className="text-sm text-slate-600">
          {lang === "bm" ? "Transaksi ini akan dipadam secara kekal." : "This transaction will be permanently removed."}
        </p>
        {confirmDelete && (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-navy">
            {confirmDelete.description || confirmDelete.category} · {myr(confirmDelete.amount)}
          </p>
        )}
      </Modal>
    </div>
  );
}
