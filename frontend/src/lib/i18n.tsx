import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "bm";

export const dict = {
  appName: { en: "MoneyTwin AI", bm: "MoneyTwin AI" },
  tagline: { en: "Know your money. Preview your next move.", bm: "Kenal wang anda. Rancang langkah seterusnya." },
  navDashboard: { en: "Dashboard", bm: "Papan Pemuka" },
  navTransactions: { en: "Transactions", bm: "Transaksi" },
  navBudgets: { en: "Budgets", bm: "Bajet" },
  navGoals: { en: "Savings goals", bm: "Sasaran Simpanan" },
  navSimulator: { en: "Simulation", bm: "Simulasi" },
  navInsights: { en: "AI insights", bm: "Wawasan AI" },
  navChat: { en: "Ask MoneyTwin", bm: "Tanya MoneyTwin" },
  navSettings: { en: "Settings", bm: "Tetapan" },
  navAdmin: { en: "Admin", bm: "Pentadbir" },
  signIn: { en: "Sign in", bm: "Masuk" },
  signUp: { en: "Get started", bm: "Mula sekarang" },
  signOut: { en: "Sign out", bm: "Keluar" },
  email: { en: "Email", bm: "E-mel" },
  password: { en: "Password", bm: "Kata laluan" },
  name: { en: "Name", bm: "Nama" },
  cancel: { en: "Cancel", bm: "Batal" },
  save: { en: "Save", bm: "Simpan" },
  saving: { en: "Saving…", bm: "Menyimpan…" },
  delete: { en: "Delete", bm: "Padam" },
  edit: { en: "Edit", bm: "Ubah" },
  add: { en: "Add", bm: "Tambah" },
  close: { en: "Close", bm: "Tutup" },
  search: { en: "Search", bm: "Cari" },
  loading: { en: "Loading…", bm: "Memuatkan…" },
  retry: { en: "Try again", bm: "Cuba lagi" },
  somethingWrong: { en: "Something went wrong.", bm: "Ada sesuatu tidak kena." },
  tryAgain: { en: "Please try again.", bm: "Sila cuba lagi." },
  language: { en: "Language", bm: "Bahasa" },
  income: { en: "Income", bm: "Pendapatan" },
  expenses: { en: "Expenses", bm: "Perbelanjaan" },
  balance: { en: "Balance", bm: "Baki" },
  budget: { en: "Budget", bm: "Bajet" },
  spent: { en: "Spent", bm: "Dibelanja" },
  remaining: { en: "Remaining", bm: "Baki" },
  overspent: { en: "Over budget", bm: "Melebihi bajet" },
  category: { en: "Category", bm: "Kategori" },
  amount: { en: "Amount", bm: "Jumlah" },
  date: { en: "Date", bm: "Tarikh" },
  description: { en: "Description", bm: "Keterangan" },
  type: { en: "Type", bm: "Jenis" },
  expense: { en: "Expense", bm: "Perbelanjaan" },
  all: { en: "All", bm: "Semua" },
  empty: { en: "Nothing here yet", bm: "Belum ada apa-apa" },
  addTransaction: { en: "Add transaction", bm: "Tambah transaksi" },
  recent: { en: "Recent transactions", bm: "Transaksi terkini" },
  thisMonth: { en: "This month", bm: "Bulan ini" },
  trend: { en: "Income vs expenses", bm: "Pendapatan vs perbelanjaan" },
  breakdown: { en: "Spending by category", bm: "Perbelanjaan mengikut kategori" },
  warnings: { en: "Budget alerts", bm: "Amaran bajet" },
  goals: { en: "Savings goals", bm: "Sasaran simpanan" },
  viewAll: { en: "View all", bm: "Lihat semua" },
  runSimulation: { en: "Run simulation", bm: "Jalankan simulasi" },
  askAi: { en: "Ask MoneyTwin", bm: "Tanya MoneyTwin" },
  noData: { en: "No transactions yet", bm: "Belum ada transaksi" },
  noDataBody: {
    en: "Add your first expense or income and this page fills in with your real numbers.",
    bm: "Tambah perbelanjaan atau pendapatan pertama dan halaman ini akan menunjukkan angka sebenar anda.",
  },
  target: { en: "Target", bm: "Sasaran" },
  saved: { en: "Saved", bm: "Tersimpan" },
  deadline: { en: "Deadline", bm: "Tarikh akhir" },
  monthlyNeeded: { en: "Needed per month", bm: "Perlu sebulan" },
  addGoal: { en: "New goal", bm: "Sasaran baharu" },
  contribute: { en: "Add contribution", bm: "Tambah simpanan" },
  completed: { en: "Completed", bm: "Selesai" },
  overdue: { en: "Deadline passed", bm: "Tarikh akhir lepas" },
  newBudget: { en: "Set budget", bm: "Tetapkan bajet" },
  monthlyLimit: { en: "Monthly limit", bm: "Had bulanan" },
  aiAssistant: { en: "MoneyTwin Assistant", bm: "Pembantu MoneyTwin" },
  sendMessage: { en: "Send", bm: "Hantar" },
  typeMessage: { en: "Ask about your money…", bm: "Tanya tentang wang anda…" },
  aiNotConnected: { en: "AI is not connected yet", bm: "AI belum disambungkan" },
  aiNotConnectedBody: {
    en: "Your finance features all work. To enable the assistant, set AI_PROVIDER and its keys in backend/.env, then restart the API.",
    bm: "Semua ciri kewangan berfungsi. Untuk mengaktifkan pembantu, tetapkan AI_PROVIDER dan kuncinya dalam backend/.env, kemudian mula semula API.",
  },
  computedSummary: { en: "Computed summary from your records", bm: "Ringkasan dikira daripada rekod anda" },
  clearChat: { en: "Clear chat", bm: "Kosongkan sembang" },
  settingsProfile: { en: "Profile", bm: "Profil" },
  displayName: { en: "Display name", bm: "Nama paparan" },
  monthlyIncome: { en: "Monthly income", bm: "Pendapatan bulanan" },
  resetDemo: { en: "Reset sample data", bm: "Set semula data contoh" },
  exportData: { en: "Download my data", bm: "Muat turun data saya" },
  deleteAccount: { en: "Delete my account", bm: "Padam akaun saya" },
  dangerZone: { en: "Danger zone", bm: "Zon bahaya" },
  privacy: { en: "Privacy", bm: "Privasi" },
  generateInsight: { en: "Generate analysis", bm: "Jana analisis" },
  insightNotice: {
    en: "AI-assisted explanation. Every amount is calculated from your recorded data.",
    bm: "Penjelasan dibantu AI. Setiap jumlah dikira daripada data yang anda rekod.",
  },
  hypothetical: { en: "Hypothetical projection, not a guarantee.", bm: "Unjuran hipotetikal, bukan jaminan." },
  assumptions: { en: "Assumptions", bm: "Andaian" },
  baseline: { en: "Baseline", bm: "Asas" },
  proposed: { en: "Proposed", bm: "Cadangan" },
  difference: { en: "Difference", bm: "Perbezaan" },
  demoLogin: { en: "Explore the demo", bm: "Cuba demo" },
  demoNote: { en: "Fictional data only. No real bank login needed.", bm: "Data rekaan sahaja. Tiada log masuk bank sebenar." },
  features: { en: "Features", bm: "Ciri" },
  howItWorks: { en: "How it works", bm: "Cara ia berfungsi" },
  pricing: { en: "Pricing", bm: "Harga" },
  startFree: { en: "Start free", bm: "Mula percuma" },
  faq: { en: "Questions", bm: "Soalan" },
  status: { en: "Status", bm: "Status" },
  navHistory: { en: "History", bm: "Sejarah" },
  history: { en: "Monthly history", bm: "Sejarah bulanan" },
  historyBody: { en: "Every month back to your first record, compared honestly.", bm: "Setiap bulan sejak rekod pertama anda, dibandingkan dengan jujur." },
  comparePrev: { en: "vs previous month", bm: "berbanding bulan lepas" },
  snapshot: { en: "Your monthly financial snapshot", bm: "Gambaran kewangan bulanan anda" },
  detailedAnalysis: { en: "View detailed analysis", bm: "Lihat analisis terperinci" },
  collapse: { en: "Collapse", bm: "Tutup" },
  recommendations: { en: "Suggested next steps", bm: "Langkah seterusnya" },
};

export type DictKey = keyof typeof dict;

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: DictKey) => string;
};

const I18nContext = createContext<I18nValue>({ lang: "en", setLang: () => {}, t: (k) => dict[k].en });

export function I18nProvider({ children, initial }: { children: ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("mt_lang");
    return (stored as Lang) || initial || "en";
  });

  useEffect(() => {
    if (initial && !localStorage.getItem("mt_lang")) setLangState(initial);
  }, [initial]);

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem("mt_lang", next);
    setLangState(next);
    document.documentElement.lang = next === "bm" ? "ms" : "en";
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: (key) => dict[key][lang] ?? dict[key].en }),
    [lang, setLang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
