export type TxnType = "income" | "expense";

export type Category = { id: string; name: string; type: TxnType; icon: string };

export type Transaction = {
  id: string;
  type: TxnType;
  amount: string;
  category_id: string;
  category: string;
  transaction_date: string;
  description: string | null;
  merchant: string | null;
  is_refund: boolean;
  created_at: string | null;
};

export type BudgetRow = {
  id: string;
  category_id: string;
  category_name: string;
  month: string;
  limit: string;
  spent: string;
  remaining: string;
  overspend: string;
  percent_used: number | null;
  state: "ok" | "warning" | "reached" | "over";
};

export type Goal = {
  id: string;
  title: string;
  target_amount: string;
  saved_amount: string;
  remaining_amount: string;
  deadline: string | null;
  months_remaining: number | null;
  monthly_needed: string | null;
  percent_complete: number;
  status: "active" | "completed";
  deadline_note: string | null;
};

export type CategorySlice = { category_id: string; name: string; amount: string; amount_minor: number };

export type Dashboard = {
  month: string;
  month_label: string;
  income: string;
  expenses: string;
  balance: string;
  income_minor: number;
  expenses_minor: number;
  balance_minor: number;
  categories: CategorySlice[];
  transaction_count: number;
  budgets: BudgetRow[];
  warnings: Array<{
    budget_id: string;
    category_name: string;
    state: string;
    percent_used: number | null;
    remaining: string;
    overspend: string;
  }>;
  trend: Array<{ month: string; label: string; income: string; expenses: string }>;
  goals: Goal[];
  top_category: CategorySlice | null;
  recent_transactions: Array<{
    id: string;
    type: TxnType;
    amount: string;
    category: string;
    date: string;
    description: string | null;
    is_refund: boolean;
  }>;
  currency: string;
  timezone: string;
};

export type User = {
  id: string;
  email: string;
  display_name: string;
  role: "owner" | "admin";
  locale: "en" | "bm";
  status: string;
  is_demo: boolean;
  monthly_income: string | null;
  created_at: string | null;
  csrf_token: string | null;
};

export type SimulationResult = {
  currency: string;
  months: number;
  monthly_income: string;
  monthly_expenses: string;
  income_change: string;
  expense_reduction: string;
  new_recurring_expense: string;
  savings_contribution: string;
  one_off_purchase: string;
  baseline_balance: string;
  projected_balance: string;
  monthly_delta: string;
  total_proposed: string;
  series: Array<{ month: number; flow: string; cumulative: string }>;
  assumptions: string[];
  hypothetical: boolean;
};

export type AIStatus = {
  configured: boolean;
  provider: string;
  model: string | null;
  verified_for_user: boolean;
  last_success: string | null;
  daily_limit: number;
  rate_limit_per_minute: number;
  welcome?: Record<string, string>;
  suggestions?: Record<string, string[]>;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  created_at?: string;
};

export type Analysis = {
  computed: {
    period: string;
    period_label: string;
    income: string;
    expenses: string;
    balance: string;
    highest_spending_category: string | null;
    highest_category_amount: string | null;
    overspending_amount: string;
    overspent_categories: string[];
    categories: CategorySlice[];
    budgets: Array<{ category: string; limit: string; spent: string; remaining: string; percent_used: number | null; state: string }>;
    goals: Goal[];
    has_data: boolean;
  };
  insight: string;
  recommendation: string | null;
  ai: { status: string; provider: string; model: string | null; error_code?: string };
  needs_review: boolean;
  grounded: boolean;
  notice?: string;
};
