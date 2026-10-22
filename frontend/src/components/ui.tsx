import { useEffect, type ReactNode } from "react";
import { AlertCircle, Inbox, Loader2, X } from "lucide-react";
import { pct } from "../lib/format";

export function Logo({ size = 32, label = true }: { size?: number; label?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#14213D" />
        <circle cx="25" cy="32" r="11" fill="none" stroke="#159B83" strokeWidth="4" />
        <circle cx="39" cy="32" r="11" fill="none" stroke="#4878E8" strokeWidth="4" />
      </svg>
      {label && (
        <span className="display text-[21px] tracking-tight text-navy">
          Money<span className="text-accent">Twin</span>
        </span>
      )}
    </span>
  );
}

export function SectionCard({
  title, subtitle, action, children, className = "",
}: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card card-pad ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold text-navy">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label, value, hint, tone = "navy", icon,
}: { label: string; value: string; hint?: string; tone?: "navy" | "jade" | "blue" | "amber"; icon?: ReactNode }) {
  const tones: Record<string, string> = {
    navy: "bg-navy/5 text-navy",
    jade: "bg-jade-soft text-jade",
    blue: "bg-blue-soft text-blue",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted">{label}</p>
        {icon && <span className={`rounded-lg p-2 ${tones[tone]}`}>{icon}</span>}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function ProgressBar({ value, state = "ok" }: { value: number | null; state?: string }) {
  const width = Math.min(100, Math.max(0, value ?? 0));
  const color =
    state === "over" ? "bg-red-500" : state === "reached" ? "bg-amber-500" : state === "warning" ? "bg-amber-400" : "bg-jade";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar"
         aria-valuenow={Math.round(width)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export function EmptyState({
  title, body, action, icon,
}: { title: string; body?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-slate-50/60 px-6 py-12 text-center">
      <span className="mb-3 rounded-full bg-white p-3 text-slate-400 shadow-sm">
        {icon ?? <Inbox className="h-6 w-6" />}
      </span>
      <p className="text-sm font-semibold text-navy">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry, retryLabel = "Try again" }: { message: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-800">{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </span>
  );
}

export function Modal({
  open, onClose, title, children, footer, wide = false,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6 ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-navy">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "jade" | "amber" | "red" | "blue" }) {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    jade: "bg-jade-soft text-jade",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-soft text-blue",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}

export function PercentText({ value, state }: { value: number | null; state?: string }) {
  const tone = state === "over" ? "text-red-600" : state === "reached" || state === "warning" ? "text-amber-700" : "text-jade";
  return <span className={`text-sm font-semibold ${tone}`}>{pct(value)}</span>;
}
