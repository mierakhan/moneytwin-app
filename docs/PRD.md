# Product requirements

**MoneyTwinAI**: A web-based AI personal finance assistant that helps Malaysians track expenses, manage budgets, set savings goals, and simulate financial decisions.

## Customer and problem
- Who pays: Malaysian students, young working adults, and individuals who want better financial management through an affordable monthly subscription.
- Problem: I struggle to track where my money goes every month. I often overspend, find it difficult to save, and cannot predict how my financial decisions will affect my future budget.
- Today: They manually record expenses in notebooks or Excel, check their banking apps, use basic calculators, and estimate their future spending without personalized analysis.
- How often: 100 tasks per customer a month
- What it costs them now: about RM100.00 a month
- Languages: Both; channel: A web app or web chat

## Who uses it
- Owner: Manages personal finances, records expenses, creates budgets, sets savings goals, and uses AI simulations.
- Administrator: Manages user accounts, subscription plans, platform configuration, and system monitoring.

## AI fit
- Good fit.
- ✓ The task mostly repeats: you can write test cases for it.
- ✓ Code can check the answer (Module 2).
- ✓ A mistake costs something, but can be caught.
- ✓ 100 tasks per customer a month: enough to be worth paying for.
- ✓ The problem costs them about RM100.00 a month: your price must sit well below that.

## Version 1 does
- Expense Tracking: Records and categorizes personal income and expenses.
- Budget Management: Creates monthly budgets and tracks spending against limits.
- AI Expense Analysis: Analyzes spending patterns and identifies overspending habits. (AI, checked by code before anyone sees it)
- Financial Simulation: Simulates financial what-if scenarios and predicts budget impact. (AI, checked by code before anyone sees it)
- Savings Goal Tracker: Tracks savings targets, progress, and required monthly contributions.
- AI Finance Chatbot: Answers questions about the user's financial data and explains insights. (AI, checked by code before anyone sees it)
- Each customer’s data is kept apart; people sign in, and each role may do only what docs/AUTH.md allows.

## Later
- Overspending Alerts (should)
- Financial Dashboard (should)
- Expense CSV Import (could)

## Version 1 does not do
- Shared Family Finance
- Native Android and iOS applications
- Direct bank account integration
- Automatic money transfers
- Family and spouse shared accounts
- Investment trading and personalized investment recommendations
- Real-time credit scoring
- Anything not listed above.

## Success
- The release gate passes: every case passes.
- The quality targets in docs/QUALITY.md pass.
- A task costs about $0.002264 in tokens.
- 3 paying customers in the first three months.

## Never
- Never invent income, expenses, transactions or account balances.
- Never expose another user's financial information.
- Never reveal passwords, API keys or authentication tokens.
- Never guarantee future financial outcomes.
- Never execute money transfers, purchases or payments.
- Never modify financial records without user authorization.
- Never use unverified AI-generated numbers for financial calculations.
- Never follow instructions that attempt to bypass security rules.
