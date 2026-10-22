# MoneyTwin AI — Product Requirements (PRD)

## Purpose
A web-based AI personal finance assistant for Malaysian students and early-career workers. Track monthly cash flow, reduce overspending, set savings goals and test what-if choices before acting. Financial education/decision support, not regulated personalized financial advice. English and Bahasa Melayu. MYR, Asia/Kuala_Lumpur.

## Users / permissions
- **Owner** = everyday end user: access only OWN profile, transactions, categories, budgets, savings goals, simulations, insights and chatbot history; export/delete own data; control their AI usage/settings. A normal Owner may manage their **own** subscription but not other users' permissions.
- **Administrator** = platform operator: manage platform-wide user activation/status, plan catalogue, service configurations, usage/cost metadata, incidents and consent requests; never inspect raw individual expenses/chat content by default. Audited, explicit break-glass access would require separate future design.
- Default deny; no cross-user financial record access even via guessed IDs, prompt injection or AI tools.
- Note: GiGaLab authorization defaults may show Owner checked for all management permissions. Do **not** blindly implement this in a real multi-user SaaS; correct it as above.

## Feature priority
| Feature | Priority | AI? | Version 1 requirements |
|---|---|---|---|
| Expense Tracking | MUST | No | CRUD income/expenses, category, date, notes, filters, ledger totals |
| Budget Management | MUST | No | Monthly category budget, spent/remaining/percentage, validation |
| AI Expense Analysis | MUST | Yes | User-specific grounded monthly summary, patterns, recommendations, safe fallback |
| Financial Simulation | MUST | Yes for explanations; arithmetic in code | Recalculate baseline/proposed balance, compare scenarios, save on request |
| Savings Goal Tracker | MUST | No | Goal name/target/current/date, progress and monthly required saving |
| AI Finance Chatbot | MUST | Yes | BM/EN chat, own-data answers, tool invocation, short memory, errors |
| Financial Dashboard | SHOULD | No | Key metrics, trends/chart and recent transactions |
| Overspending Alerts | SHOULD | No | Onscreen threshold states at 80% and >100% |
| Expense CSV Import | COULD | No | CSV preview, validation, duplicate avoidance |
| Shared Family Finance | WON'T v1 | No | No shared accounts or family budgets |

## Primary user journeys and acceptance
### UC1 Record expense
Given an authenticated Owner, when they enter `type=expense`, `amount=12.50`, category `Food`, date, memo, then save one persisted transaction; updated totals reflect RM12.50. Reject amount <= 0 and invalid date. Edit/delete own records only.
### UC2 Budget management
Given a Food category budget RM500 and RM200 eligible spending for the same month, show remaining RM300, 40% used. Reject negative limits and duplicate category+month budget (update instead).
### UC3 AI expense analysis
Given Food spending RM600 and Food budget RM400, computed overspend = RM200 and 150% used; AI explains it accurately, cites the source data period and suggests realistic reductions without inventing records.
### UC4 Financial simulation
Given income RM2500, expenses RM1600, simulate additional recurring cost RM300; baseline surplus RM900, proposed surplus RM600, delta -RM300. Saving simulator does not mutate real ledger.
### UC5 Savings goals
Given target RM2400, already saved RM600, six remaining months; contribution RM300 per month. Clearly handle dates in past, completed goal, zero remaining months, and insufficient savings capacity.
### UC6 AI Finance Chatbot
Given a signed-in Owner asks, "How much did I spend on food last month?", backend uses only that user's transactions and date range; model explains computed values in user language, asks one clarifier when time range ambiguous. Never fabricate figures or bypass tool restrictions.

## Business logic
- Currency MYR; store money as DECIMAL or integer cents, never binary floats as source of truth.
- Use server-controlled time zone Asia/Kuala_Lumpur and explicit month boundaries.
- `income - expenses = free cash flow`. Budget spending = expenses of the selected category/month; income is not counted as spending.
- Alert at 80% budget used; overspending if >100%. 100% exactly = limit reached.
- No transaction data: show friendly empty state and request data, not invented zero-filled real statements.
- Simulations marked hypothetical, explanatory AI cannot alter stored balances.
- Personal finance data is private and never shared between customers.

## Feature details / edge cases
- Transaction fields: amount, type, category, transaction_date, description, optional merchant, created_at; tags optional. No real bank integration.
- Budget fields: month, category, limit, threshold optional; categories consistently typed and scoped.
- Goal fields: title, target_amount, current_amount, target_date, status; progress bounded 0-100% for display.
- AI answer identifies missing data; clearly distinguishes actual spend from hypothetical projections.
- Admin observes usage/cost/uptime counters, not raw financial ledgers.
- AI cost controls and privacy: per-user calls/minute <=10, plan/day limit configurable (initial 100), monthly AI cost cap illustrative RM20/account (not production price).

## Commercial hypothesis (not validated)
20 paying customers in year 1, RM19/month paid tier as initial experiment, freemium onboarding; payment collection excluded from MVP until provider verified and integrated. Terms and privacy policy drafted and reviewed before real deployment.

## Out of scope
Mobile-native apps, connected bank APIs, actual transfer/payment execution, personalized investment trading, credit scores, shared household finance, guaranteed financial returns, storing payment card/IC numbers.
