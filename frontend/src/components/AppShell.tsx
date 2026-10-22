import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bot, ChevronLeft, ChevronRight, LayoutDashboard, LogOut, Menu, MessageSquare, PiggyBank,
  Receipt, Settings, Shield, Sparkles, Target, Wallet, X,
} from "lucide-react";
import { useAuth } from "../state/AuthContext";
import { useI18n } from "../lib/i18n";
import type { DictKey } from "../lib/i18n";
import { Logo } from "./ui";
import type { LucideIcon } from "lucide-react";

type NavItem = { to: string; labelKey: DictKey; icon: LucideIcon; end?: boolean };

const items: NavItem[] = [
  { to: "/app", labelKey: "navDashboard", icon: LayoutDashboard, end: true },
  { to: "/app/transactions", labelKey: "navTransactions", icon: Receipt },
  { to: "/app/budgets", labelKey: "navBudgets", icon: Wallet },
  { to: "/app/goals", labelKey: "navGoals", icon: Target },
  { to: "/app/simulator", labelKey: "navSimulator", icon: Sparkles },
  { to: "/app/insights", labelKey: "navInsights", icon: PiggyBank },
  { to: "/app/chat", labelKey: "navChat", icon: MessageSquare },
];

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const onChatPage = location.pathname.startsWith("/app/chat");

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
              isActive ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:bg-canvas hover:text-navy"
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
            isActive ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:bg-canvas hover:text-navy"
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
              isActive ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:bg-canvas hover:text-navy"
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
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-white px-3 py-5 transition-[width] md:flex ${
          collapsed ? "w-[76px]" : "w-[248px]"
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <Link to="/app" aria-label="MoneyTwin home" className="flex items-center gap-2 text-navy">
            <svg width={30} height={30} viewBox="0 0 64 64" aria-hidden="true">
              <rect width="64" height="64" rx="18" fill="#16333A" />
              <circle cx="25" cy="32" r="11" fill="none" stroke="#F5A623" strokeWidth="4" />
              <circle cx="39" cy="32" r="11" fill="none" stroke="#FFFFFF" strokeWidth="4" />
            </svg>
            {!collapsed && <span className="display text-[19px] tracking-tight text-navy">MoneyTwin</span>}
          </Link>
          <button
            type="button"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            className="rounded-full p-1.5 text-slate-400 hover:bg-canvas hover:text-navy"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        {nav}
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl bg-canvas p-3">
            {!collapsed && (
              <>
                <p className="truncate text-sm font-semibold text-navy">{user?.display_name}</p>
                <p className="truncate text-xs text-muted">{user?.email}</p>
              </>
            )}
            <button
              type="button"
              onClick={() => void signOut().then(() => navigate("/"))}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-xs font-medium text-slate-500 hover:text-navy"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && t("signOut")}
            </button>
          </div>
          <div className="flex gap-1 rounded-full bg-canvas p-1 text-xs">
            {(["en", "bm"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`flex-1 rounded-full px-2 py-1 font-semibold uppercase ${
                  lang === code ? "bg-navy text-white" : "text-slate-500"
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

      <div className={`flex min-h-dvh flex-col ${collapsed ? "md:pl-[76px]" : "md:pl-[248px]"}`}>
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <button type="button" aria-label="Open menu" className="rounded-lg p-1.5 text-navy" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Logo label />
          <Link to="/app/settings" aria-label="Settings" className="rounded-lg p-1.5 text-navy">
            <Settings className="h-5 w-5" />
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pb-10 sm:pt-8">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 backdrop-blur md:hidden" aria-label="Mobile">
          {[items[0], items[1], items[2], items[3], items[6]].map(({ to, labelKey, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end as boolean | undefined}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold ${
                  isActive ? "text-navy" : "text-slate-400"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        {!onChatPage && (
          <Link
            to="/app/chat"
            className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-navy shadow-lg hover:brightness-95 md:bottom-6 md:right-6"
          >
            <Bot className="h-5 w-5" />
            <span className="hidden sm:inline">{t("askAi")}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
