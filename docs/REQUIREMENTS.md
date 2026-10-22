# Requirements

Version 1: **The must-haves only**. The source of truth is `blueprint.json`; this file explains it.

## Roles
| Role | What they do |
|---|---|
| Owner | Manages personal finances, records expenses, creates budgets, sets savings goals, and uses AI simulations. |
| Administrator | Manages user accounts, subscription plans, platform configuration, and system monitoring. |

## Features
| Id | Feature | Priority | Used by | AI | What it does |
|---|---|---|---|---|---|
| F1 | Expense Tracking | Must, version 1 | Owner |  | Records and categorizes personal income and expenses. |
| F2 | Budget Management | Must, version 1 | Owner |  | Creates monthly budgets and tracks spending against limits. |
| F3 | AI Expense Analysis | Must, version 1 | Owner | yes | Analyzes spending patterns and identifies overspending habits. |
| F4 | Financial Simulation | Must, version 1 | Owner | yes | Simulates financial what-if scenarios and predicts budget impact. |
| F5 | Savings Goal Tracker | Must, version 1 | Owner |  | Tracks savings targets, progress, and required monthly contributions. |
| F6 | AI Finance Chatbot | Must, version 1 | Owner | yes | Answers questions about the user's financial data and explains insights. |
| F7 | Overspending Alerts | Should | Owner |  | Notifies users when spending approaches or exceeds budget limits. |
| F8 | Financial Dashboard | Should | Owner |  | Displays income, expenses, savings, and budget summaries. |
| F9 | Expense CSV Import | Could | Owner |  | Imports transaction records from CSV files. |
| F10 | Shared Family Finance | Won’t | Owner |  | Allows family members to manage shared budgets. |

## Use cases (version 1)

### UC1 · Expense Tracking (F1)
- Actor: Owner
- Goal: Allow users to record, edit, and view income and expense transactions accurately.

Main steps:
1. User logs into MoneyTwin AI.
2. User opens Expense Tracking.
3. User enters a transaction type, amount, category, date, and optional description.
4. System validates and saves the transaction to the user's account.
5. System updates the transaction list and spending totals.

Errors and edge cases:
- User enters a negative or zero amount.
- User leaves a required field empty.
- User enters an invalid transaction date or category.
- User attempts to edit a transaction owned by another user.

Acceptance criteria (tests in `tests/acceptance/test_f1_expense_tracking.py`):
- AC1.1 Given a logged-in user and valid transaction fields, when they save an expense of RM25, then the system stores an RM25 expense under that user's account.
- AC1.2 Given an existing expense of RM25, when the user updates its amount to RM30, then the transaction list and relevant totals reflect RM30.
- AC1.3 Given an amount of RM0, when the user submits the form, then the system rejects the entry and shows a validation error.
- AC1.4 Given a transaction owned by another user, when a user attempts to access or change it, then the system denies the request.

### UC2 · Budget Management (F2)
- Actor: Owner
- Goal: Allow users to set monthly spending limits, track budget usage, and see remaining balances. 

Main steps:
1. User opens Budget Management.
2. User selects a month and spending category.
3. User enters a monthly budget limit.
4. System validates and saves the budget.
5. System calculates category spending and displays the remaining balance.

Errors and edge cases:
- User enters a zero, negative, or non-numeric budget.
- User creates a duplicate budget for the same category and month.
- User has no expenses in the selected month.
- Spending is higher than the budget limit.

Acceptance criteria (tests in `tests/acceptance/test_f2_budget_management.py`):
- AC2.1 Given a logged-in user, when they save a valid RM500 food budget for October, then the system stores it for that category and month.
- AC2.2 Given a RM500 budget and RM200 of matching expenses, when the budget page loads, then the remaining balance is RM300.
- AC2.3 Given RM600 spending against a RM500 budget, when the budget is viewed, then the system shows an RM100 overspend warning.
- AC2.4 Given an invalid negative limit, when the user submits it, then the system rejects it without saving a budget.

### UC3 · AI Expense Analysis (F3)
- Actor: Owner
- Goal: Help users understand spending patterns and receive AI explanations grounded in their actual transactions.

Main steps:
1. User opens AI Expense Analysis and selects a period.
2. System retrieves only the user's transactions and budgets for that period.
3. System calculates totals, category breakdowns, and budget variances using code.
4. AI explains notable patterns and suggests practical actions using the computed figures.
5. System displays the analysis with the selected period and supporting amounts.

Errors and edge cases:
- User has no transactions for the period.
- Some transaction values are missing or invalid.
- AI service times out or returns an error.
- AI output contradicts the calculated totals or invents data.

Acceptance criteria (tests in `tests/acceptance/test_f3_ai_expense_analysis.py`):
- AC3.1 Given valid expenses of RM200 for food and RM100 for transport, when analysis runs, then the system reports total expenses of RM300.
- AC3.2 Given RM600 food spending and a RM400 food budget, when analysis runs, then it identifies RM200 overspending based on calculated data.
- AC3.3 Given no transactions in the period, when analysis is requested, then the system asks the user to add transactions instead of fabricating insights.
- AC3.4 Given an AI service failure, when analysis is requested, then the system shows an error or calculated summary without invented AI recommendations.

### UC4 · Financial Simulation (F4)
- Actor: Owner
- Goal: Let users compare what-if financial scenarios and understand how a change in expenses or income affects their projected balance.

Main steps:
1. User opens Financial Simulation.
2. User selects a baseline month or enters baseline income and spending values.
3. User enters a scenario such as reducing dining expenses by RM100.
4. System calculates baseline and scenario balances using deterministic formulas.
5. AI explains the difference and clearly identifies all assumptions.

Errors and edge cases:
- User enters missing, invalid, or negative spending adjustments.
- User tries to reduce a category by more than its current spending.
- There is insufficient baseline data for a projection.
- AI service fails or describes different figures from the calculated result.

Acceptance criteria (tests in `tests/acceptance/test_f4_financial_simulation.py`):
- AC4.1 ACCEPTANCE CRITERIA (ONE PER LINE)
- AC4.2 Given monthly income of RM2,000 and expenses of RM1,500, when the baseline is calculated, then the remaining balance is RM500.
- AC4.3 Given baseline expenses of RM1,500 and a valid RM100 expense reduction, when the simulation runs, then simulated expenses are RM1,400 and the remaining balance is RM600.
- AC4.4 Given a RM100 monthly improvement for 6 months with no interest or other changes, when projected, then the additional cumulative savings are RM600.
- AC4.5 Given an invalid adjustment that exceeds category spending, when the simulation runs, then the system rejects it or requests a corrected value.

### UC5 · Savings Goal Tracker (F5)
- Actor: Owner
- Goal: Enable users to create savings targets, record contributions, and track their progress toward a deadline. 

Main steps:
1. User opens Savings Goals.
2. User enters a goal name, target amount, and target date.
3. System validates and saves the goal.
4. User adds savings contributions.
5. System updates progress, remaining amount, and required future contributions.

Errors and edge cases:
- Target amount is zero or negative.
- Target date is in the past.
- Contribution is invalid or negative.
- Goal has been reached or exceeded.

Acceptance criteria (tests in `tests/acceptance/test_f5_savings_goal_tracker.py`):
- AC5.1 Given a target amount of RM1,200 and current savings of RM300, when the goal is viewed, then the system displays RM900 remaining and 25% progress.
- AC5.2 Given a valid new contribution of RM100, when it is saved, then current savings increase by RM100.
- AC5.3 Given RM900 remaining and 9 equal months until the deadline, when the plan is calculated, then the system suggests RM100 per month excluding interest.
- AC5.4 Given a past target date for a new goal, when the user saves it, then the system asks for a valid future date.

### UC6 · AI Finance Chatbot (F6)
- Actor: Owner
- Goal: Allow users to ask finance questions in English or Bahasa Melayu and receive short, accurate answers based on their own authorized financial records.

Main steps:
1. User opens the MoneyTwin AI chat panel.
2. User asks a question about expenses, budgets, savings, or a what-if scenario.
3. System identifies the relevant request and retrieves authorized financial context.
4. System performs required numerical calculations using code or tools.
5. AI returns a concise answer grounded in the retrieved figures and assumptions.

Errors and edge cases:
- Question is unclear or missing essential financial inputs.
- User has insufficient transaction records.
- AI service or Flowise endpoint is unavailable.
- User requests another person's financial information.

Acceptance criteria (tests in `tests/acceptance/test_f6_ai_finance_chatbot.py`):
- AC6.1 Given expenses totaling RM450 for the selected month, when the user asks how much they spent, then the chatbot answers RM450 without inventing transactions.
- AC6.2 Given a RM600 budget and RM450 expenses, when the user asks for the remaining budget, then the chatbot answers RM150.
- AC6.3 Given a Malay-language question, when the chatbot responds, then it provides a helpful answer in Bahasa Melayu.
- AC6.4 Given an unavailable AI endpoint, when the user submits a question, then the chatbot displays a safe retry message rather than a fabricated answer.
- AC6.5 Given a request for another user's private financial records, when it is submitted, then the system refuses access.

## Integrations
- Flowise Prediction API for AI Chatbot, personalized financial analysis, and financial scenario explanations.

## Platforms
- A web app (works on phones too)
- An API for other software

## Out of scope for version 1
- Shared Family Finance
- Native Android and iOS applications
- Direct bank account integration
- Automatic money transfers
- Family and spouse shared accounts
- Investment trading and personalized investment recommendations
- Real-time credit scoring
- Anything not listed above.

## Data
See docs/DATA_MODEL.md.
