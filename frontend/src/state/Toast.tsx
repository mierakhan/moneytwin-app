import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type Tone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<{ push: (message: string, tone?: Tone) => void }>({ push: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Tone = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-3), { id, message, tone }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 5200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6 sm:left-auto">
        {items.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-lg"
          >
            <span className="mt-0.5">
              {toast.tone === "success" && <CheckCircle2 className="h-5 w-5 text-jade" />}
              {toast.tone === "error" && <TriangleAlert className="h-5 w-5 text-red-600" />}
              {toast.tone === "info" && <Info className="h-5 w-5 text-blue" />}
            </span>
            <p className="flex-1 text-sm text-slate-ink">{toast.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              className="rounded p-1 text-slate-400 hover:text-slate-600"
              onClick={() => setItems((prev) => prev.filter((t) => t.id !== toast.id))}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
