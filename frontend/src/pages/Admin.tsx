import { useCallback, useEffect, useState } from "react";
import { Activity, ShieldCheck, Users } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../state/AuthContext";
import { useToast } from "../state/Toast";
import { Badge, ErrorState, SectionCard, Skeleton, StatCard } from "../components/ui";

type Metrics = {
  users: { total: number; active: number; demo: number };
  content_counts: { transactions: number; budgets: number; goals: number; simulations: number; conversations: number };
  ai_last_7_days: { calls: number; errors: number; error_rate: number | null; avg_latency_ms: number };
  privacy_note: string;
  generated_at: string;
};

type AdminUser = {
  id: string; email: string; display_name: string; role: string; status: string;
  locale: string; is_demo: boolean; created_at: string; transaction_count: number;
};

export default function Admin() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { push } = useToast();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, u] = await Promise.all([
        api.get<Metrics>("/api/admin/metrics"),
        api.get<{ users: AdminUser[] }>("/api/admin/users"),
      ]);
      setMetrics(m);
      setUsers(u.users);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("somethingWrong"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (row: AdminUser) => {
    const next = row.status === "active" ? "disabled" : "active";
    try {
      await api.patch(`/api/admin/users/${row.id}`, { status: next });
      push(`${row.email} → ${next}`, "success");
      await load();
    } catch (err) {
      push(err instanceof ApiError ? err.message : t("somethingWrong"), "error");
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow">{t("navAdmin")}</p>
        <h1 className="display mt-1 text-[30px] leading-tight text-navy sm:text-[36px]">{lang === "bm" ? "Kesihatan platform" : "Platform health"}</h1>
        <p className="mt-1 text-sm text-muted">
          {lang === "bm" ? "Metrik agregat sahaja. Tiada jumlah atau sembang peribadi." : "Aggregate metrics only. No private amounts or chat text."}
        </p>
      </header>

      {error && <ErrorState message={error} onRetry={() => void load()} retryLabel={t("retry")} />}

      {loading && !metrics && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="card p-5"><Skeleton className="h-3 w-20" /><Skeleton className="mt-4 h-7 w-16" /></div>)}
        </div>
      )}

      {metrics && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={lang === "bm" ? "Pengguna" : "Accounts"} value={String(metrics.users.total)} tone="navy" icon={<Users className="h-4 w-4" />}
                      hint={`${metrics.users.active} ${lang === "bm" ? "aktif" : "active"} · ${metrics.users.demo} demo`} />
            <StatCard label="AI calls (7d)" value={String(metrics.ai_last_7_days.calls)} tone="blue" icon={<Activity className="h-4 w-4" />}
                      hint={`${lang === "bm" ? "Ralat" : "Errors"}: ${metrics.ai_last_7_days.errors}`} />
            <StatCard label={lang === "bm" ? "Kependaman purata" : "Avg latency"} value={`${metrics.ai_last_7_days.avg_latency_ms} ms`} tone="jade" />
            <StatCard label={t("navTransactions")} value={String(metrics.content_counts.transactions)} tone="amber" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
            <SectionCard title={lang === "bm" ? "Kandungan platform" : "Platform content"}>
              <ul className="space-y-2 text-sm">
                {Object.entries(metrics.content_counts).map(([key, value]) => (
                  <li key={key} className="flex items-center justify-between">
                    <span className="capitalize text-slate-600">{key.replace("_", " ")}</span>
                    <span className="font-semibold text-navy">{value}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-lg bg-canvas p-3 text-xs text-muted">{metrics.privacy_note}</p>
            </SectionCard>

            <SectionCard title={lang === "bm" ? "Akaun" : "Accounts"}
                         action={<Badge tone="jade"><ShieldCheck className="mr-1 h-3 w-3" />metadata only</Badge>}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="py-2 font-semibold">{t("email")}</th>
                      <th className="py-2 font-semibold">Role</th>
                      <th className="py-2 font-semibold">{t("status")}</th>
                      <th className="py-2 text-right font-semibold">Rows</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {users.map((row) => (
                      <tr key={row.id}>
                        <td className="py-2.5">
                          <p className="font-medium text-navy">{row.display_name}</p>
                          <p className="text-xs text-muted">{row.email}</p>
                        </td>
                        <td className="py-2.5 text-muted">{row.role}</td>
                        <td className="py-2.5">
                          <button type="button" disabled={row.id === user?.id}
                                  onClick={() => void toggle(row)}
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    row.status === "active" ? "bg-jade-soft text-jade" : "bg-red-50 text-red-700"
                                  } disabled:opacity-60`}>
                            {row.status}
                          </button>
                        </td>
                        <td className="py-2.5 text-right text-muted">{row.transaction_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
