# MoneyTwin AI — UI/UX and Screens

## Visual direction
Premium, reassuring Malaysian fintech web app: generous whitespace, rounded cards (12-18px), subtle shadows, modern sans fonts with system fallbacks, accessible contrast. Colors: navy #14213D, jade #159B83, blue #4878E8, canvas #F7F9FC, slate #334155, muted #64748B. Avoid flashy casino styling, cramped tables, wall-of-text chatbot. Brand mark can be a simple dual-circle / financial path icon made with CSS or Lucide; no external image downloads required.

## Site navigation
Public: Home, Features, How it works, Pricing (clearly demo pricing), Sign in, Get started.
Signed-in desktop sidebar: Dashboard / Transactions / Budgets / Savings Goals / Simulation / AI Insights / Ask MoneyTwin / Settings. Floating chatbot button persistent except chat page. Signed-in mobile: collapsible drawer or bottom nav for key screens; responsive table -> cards.
Admin (separate protected route): Users (account status, not their raw records), Plans (non-live placeholder), AI Usage, System Status.

## Detailed pages
**Landing:** strong hero "Know your money. Preview your next move.", CTA Start Free, SaaS proof *demo preview* (not invented customer testimonials), three how-it-works cards, value props, FAQs, pricing assumptions labelled illustrative, footer privacy/contact placeholder.
**Auth / onboarding:** secure login, registration, validation; choose BM/EN, set monthly income, currency preset MYR, example categories and budgets; option to load fictional demo data. Empty vs completed onboarding.
**Dashboard:** total income, total expenses, balance, savings goal progress, month selector; income/expense trend chart; category breakdown; budget risk cards, recent five transactions; actions Add Expense, Run Simulation, Ask AI.
**Transactions:** income/expense toggle, add/edit/delete modal or form, type/category/date/amount/description, search and filter month/category/type, pagination or sensible list, confirmation before delete.
**Budgets:** set monthly category caps; progress bars at 0/80/100/+100 states; amount left, actual spend, warnings; edit/reset for month.
**Savings Goals:** goal cards, target/current/deadline/monthly contribution; add contribution manually with confirmation; visual progress; no actual cash movement.
**Simulator:** choose baseline from current month OR manual demo inputs, form for income change, expense reduction, new recurring expense, one-off purchase, time horizon; baseline/proposed/delta summary; assumptions disclosure; line projection graph only if genuine deterministic series; save named scenario.
**AI Insights:** month selector, Generate analysis; animated load skeleton; grounded category totals with AI explanation and recommendation; show "AI-assisted explanation; amounts calculated from your recorded data"; if provider unavailable display explicit status + deterministic summary.
**MoneyTwin Chat:** friendly welcome (BM/EN), suggested question chips, history list per user, bot/person bubbles, typing indicator, send/retry, clear chat, data context badge (e.g. "Using your October 2026 budget"), useful short replies, uncertainty message. Chatbot cannot see other users' records.
**Settings:** profile, preferred language, sample-data reset, privacy/download own records, AI usage and spend limit, logout.
**Admin:** aggregate usage, status, accounts list without data leakage. No admin impersonation or hidden user transaction inspection.

## Suggested welcome
EN: "Hi! I'm MoneyTwin AI 👋 I can help you understand your spending, budget better, and test what-if scenarios. What would you like to check?"
BM: "Hai! Saya MoneyTwin AI 👋 Saya boleh bantu semak perbelanjaan, bajet dan simulasi kewangan. Nak mula dengan apa?"
Quick chips: "Where did my money go?" / "Am I overspending?" / "Can I afford RM300 extra each month?" / "How much should I save monthly?"

## Responsive breakpoints and states
- 320px-767px: single column, large tap targets, charts adaptive, tabs accessible, no horizontal overflow.
- 768px-1199px: 2-column cards, nav collapse.
- >=1200px: full sidebar, 3-4 summary cards, two-column panels.
- Every interactive screen: loading, empty, error, success and validation states, keyboard focus and readable form labels.
- UI never shows false "Connected to AI" if integration fails; show Online only after successful health/inference checks.
