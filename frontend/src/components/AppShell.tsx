import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, History, LayoutDashboard, LogOut, Menu, MessageSquare,
  PiggyBank, Receipt, Settings, Shield, Sparkles, Target, Wallet, X,
} from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../lib/i18n";
import type { DictKey } from "../lib/i18n";
import { Logo } from "./ui";
import FloatingChat from "./FloatingChat";
import type { LucideIcon } from "lucide-react";

type NavItem = { to: string; labelKey: DictKey; icon: LucideIcon; end?: boolean };

const items: NavItem[] = [
  { to: "/app", labelKey: "navDashboard", icon: LayoutDashboard, end: true },
  { to: "/app/transactions", labelKey: "navTransactions", icon: Receipt },
  { to: "/app/budgets", labelKey: "navBudgets", icon: Wallet },
  { to: "/app/goals", labelKey: "navGoals", icon: Target },
  { to: "/app/simulator", labelKey: "navSimulator", icon: Sparkles },
  { to: "/app/insights", labelKey: "navInsights", icon: PiggyBank },
  { to: "/app/history", labelKey: "navHistory", icon: History },
  { to: "/app/chat", labelKey: "navChat", icon: MessageSquare },
];

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {items.map(({ to, labelKey, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end as boolean | undefined}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition ${
              isActive ? "bg-indigo text-white shadow-lg shadow-indigo/30" : "text-[#c9cef0] hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="truncate">{t(labelKey)}</span>}
        </NavLink>
      ))}
      <NavLink
        to="/app/settings"
        onClick={() => setOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition ${
            isActive ? "bg-indigo text-white shadow-lg shadow-indigo/30" : "text-[#c9cef0] hover:bg-white/10 hover:text-white"
          }`
        }
      >
        <Settings className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="truncate">{t("navSettings")}</span>}
      </NavLink>
      {user?.role === "admin" && (
        <NavLink
          to="/app/admin"
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition ${
              isActive ? "bg-indigo text-white shadow-lg shadow-indigo/30" : "text-[#c9cef0] hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <Shield className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="truncate">{t("navAdmin")}</span>}
        </NavLink>
      )}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-canvas">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-ink px-3 py-5 transition-[width] md:flex ${
          collapsed ? "w-[76px]" : "w-[248px]"
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <Link to="/app" aria-label="MoneyTwin home" className="flex items-center gap-2 text-white">
            <svg width={30} height={30} viewBox="0 0 64 64" aria-hidden="true">
              <rect width="64" height="64" rx="18" fill="#16333A" />
              <circle cx="25" cy="32" r="11" fill="none" stroke="#F5A623" strokeWidth="4" />
              <circle cx="39" cy="32" r="11" fill="none" stroke="#FFFFFF" strokeWidth="4" />
            </svg>
            {!collapsed && <span className="display text-[19px] tracking-tight text-white">Money<span className="text-coral">Twin</span></span>}
          </Link>
          <button
            type="button"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            className="rounded-full p-1.5 text-[#8f96c9] hover:bg-white/10 hover:text-white"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        {nav}
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            {!collapsed && (
              <>
                <p className="truncate text-sm font-semibold text-white">{user?.display_name}</p>
                <p className="truncate text-xs text-[#9aa1cf]">{user?.email}</p>
              </>
            )}
            <button
              type="button"
              onClick={() => void signOut().then(() => navigate("/"))}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-xs font-medium text-[#c9cef0] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && t("signOut")}
            </button>
          </div>
          <div className="flex gap-1 rounded-full bg-white/10 p-1 text-xs">
            {(["en", "bm"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`flex-1 rounded-full px-2 py-1 font-semibold uppercase ${
                  lang === code ? "bg-white text-ink" : "text-[#c9cef0]"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] border-r border-line bg-white p-4">
            <div className="mb-6 flex items-center justify-between">
              <Logo label />
              <button type="button" aria-label="Close menu" className="rounded-full p-1.5 text-slate-500" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <button
              type="button"
              onClick={() => void signOut().then(() => navigate("/"))}
              className="mt-6 flex w-full items-center gap-2 rounded-full px-3 py-2.5 text-sm text-slate-500"
            >
              <LogOut className="h-4 w-4" /> {t("signOut")}
            </button>
          </div>
        </div>
      )}

      <div className={`flex min-h-dvh flex-col bg-ink ${collapsed ? "md:pl-[76px]" : "md:pl-[248px]"}`}>
        <div className="hidden items-center justify-between px-8 pb-9 pt-4 md:flex">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8f96c9]">
            MoneyTwin · Personal ledger
          </p>
          <p className="text-[11px] font-medium tracking-wide text-[#8f96c9]">MYR · Asia/Kuala_Lumpur</p>
        </div>
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-ink px-4 py-3 md:hidden">
          <button type="button" aria-label="Open menu" className="rounded-lg p-1.5 text-white" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Logo label />
          <Link to="/app/settings" aria-label="Settings" className="rounded-lg p-1.5 text-white">
            <Settings className="h-5 w-5" />
          </Link>
        </header>

        <main className="sheet relative z-10 mx-auto -mt-6 w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-8 sm:pb-12 sm:pt-9 md:-mt-8">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Mobile">
          {[items[0], items[1], items[2], items[3], items[6]].map(({ to, labelKey, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end as boolean | undefined}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold ${
                  isActive ? "text-indigo" : "text-slate-400"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        <FloatingChat />

      </div>
    </div>
  );
}
