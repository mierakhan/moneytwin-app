# MoneyTwin AI — SaaS Builder Lab Answer Pack

These are project-planning proposals, not verified business research. Use the nearest options in dropdowns.

## Stage 1 — Idea
- Product name: MoneyTwin AI
- One sentence: A web-based AI personal finance assistant that helps Malaysians track expenses, manage budgets, set savings goals, and simulate financial decisions.
- Who pays: Malaysian students, young working adults, and individuals who want better financial management through an affordable monthly subscription.
- The problem, in their words: I struggle to track where my money goes every month. I often overspend, find it difficult to save, and cannot predict how my financial decisions will affect my future budget.
- How they solve it today: They manually record expenses in notebooks or Excel, check their banking apps, use basic calculators, and estimate their future spending without personalized analysis.
- Tasks per customer per month: 100 (assumption)
- Paying customers in year one: 20 (assumption)
- Problem cost RM/month: 100 (placeholder to validate)
- Wrong answer cost: Medium / Moderate; real financial decisions require caution.
- Same kind of task: Yes / Mostly yes
- Can code check the answer: Yes, numeric calculations, totals, budget rules, validated input
- Languages: Bahasa Melayu and English
- Customer sends: Text and numeric financial entries
- Where customers use it: Web app

## Stage 2 — Requirements
### Roles
- Owner: Manages personal finances, records expenses, creates budgets, sets savings goals, and uses AI simulations.
- Administrator: Manages user accounts, subscription plans, platform configuration, and system monitoring.

### Features (name | description | priority | role | Uses AI)
- Expense Tracking | Records and categorizes personal income and expenses. | Must | Owner | No
- Budget Management | Creates monthly budgets and tracks spending against limits. | Must | Owner | No
- AI Expense Analysis | Analyzes spending patterns and identifies overspending habits. | Must | Owner | Yes
- Financial Simulation | Simulates financial what-if scenarios and predicts budget impact. | Must | Owner | Yes
- Savings Goal Tracker | Tracks savings targets, progress, and required monthly contributions. | Must | Owner | No
- AI Finance Chatbot | Answers questions about the user's financial data and explains insights. | Must | Owner | Yes
- Overspending Alerts | Notifies users when spending approaches or exceeds budget limits. | Should | Owner | No
- Financial Dashboard | Displays income, expenses, savings, and budget summaries. | Should | Owner | No
- Expense CSV Import | Imports transaction records from CSV files. | Could | Owner | No
- Shared Family Finance | Allows family members to manage shared budgets. | Won't | Owner | No

### Use cases / acceptance criteria
- Record an expense: Given a signed-in user, when they enter amount, date, category and description, the transaction is saved and visible in their own dashboard.
- Manage a budget: Given a monthly spending limit, when expenses are recorded, remaining budget equals limit minus eligible expenses and never includes other users' transactions.
- Analyze spending: Given real transaction data, when the user requests analysis, the AI names relevant categories and amounts grounded in retrieved user data; it does not invent figures.
- Simulate decisions: Given a baseline budget and a proposed purchase or savings change, when scenario inputs are updated, deterministic calculation returns projected monthly balance and AI explains assumptions.
- Track savings: Given a target amount and deadline, when user enters current savings, the required monthly contribution is computed from remaining amount and months.
- Chat with MoneyTwin: Given an authorized user question, the assistant only accesses that user's financial data, answers concisely in the chosen language, and signals uncertainty when evidence is insufficient.

### Data (thing | fields | relations)
- User | name, email, password_hash, role | has many Transactions
- Transaction | amount, type, category_id, date, description | belongs to User
- Category | name, type | has many Transactions
- Budget | category_id, monthly_limit, month | belongs to User
- SavingsGoal | name, target_amount, saved_amount, target_date | belongs to User
- Simulation | scenario_name, input_data, projected_balance | belongs to User
- AIInsight | insight_type, explanation, created_at | belongs to User
- Subscription (optional for paid SaaS) | plan, status, next_billing_date | belongs to User

### Integrations
Other integrations: Flowise Prediction API for AI chatbot, personalized financial analysis, and financial scenario explanations.
Platform: A web app (works on phones too). Also select API for other software only if exposing one is in scope.
Out of scope v1:
Native Android and iOS applications
Direct bank account integration
Automatic money transfers
Family and spouse shared accounts
Investment trading and personalized investment recommendations
Real-time credit scoring
Version 1: The must-haves only.

## Stage 3 — Tech stack
- Code you read best: JavaScript or TypeScript
- Who looks after the code: Two to five people (for workshop pair; choose one person if deploying solo)
- Comfortable running Linux server: Yes with Docker and guided setup, or No if not confident
- Screens update live without reload: Yes for instant dashboard and chat updates; no websocket required at first
- Frontend: React with Vite (suggested); simpler alternative HTML/CSS/JS if workshop deadline is tight
- Backend: Python FastAPI (or Node Express if one-language stack is easier)
- Database: PostgreSQL
- AI orchestration: Flowise API for chatbot/agent workflows
- Hosting/deployment: Docker Compose on a test server, or managed hosting after development
- Auth: Server-side secure sessions or managed authentication; per-user authorization
- Extras: Redis only if sessions/rate-limits require it; vector search only if app-specific RAG is needed; no file storage until CSV import is implemented
- Data protection: HTTPS, secret environment variables, user data isolation, backups

## Stage 4 — Quality (proposed)
- Quality goals: Accurate financial arithmetic, clear assumptions, understandable explanations, mobile-friendly interface, private financial data, and safe error handling.
- Acceptance tests: Correct totals and budgets, no data leakage between users, invalid inputs rejected, AI explanation grounded in calculated values, no advice presented as a guaranteed financial outcome.
- Latency targets (proposed, not measured): standard dashboard actions under 2 seconds on local test; AI response target under 15 seconds with visible loading state.
- Reliability: graceful AI outage fallback while manual budgeting remains available.

## Stage 5 — Core modules (proposed)
1. Authentication & User Profile: login, registration, per-user data boundaries.
2. Expense & Income Ledger: add, edit, categorize and list transactions.
3. Budget & Savings: monthly limits, progress, alerts, goal calculations.
4. Deterministic Simulation Engine: project balances for what-if inputs.
5. AI Analysis & Chat: retrieve authorized user figures, explain results in BM/EN.
6. Administration & Subscription: manage service configuration and plan access (billing integration can follow MVP).

## Stage 6 — AI features (proposed)
- Expense Analysis Agent: summarize monthly spending by category and highlight anomalies or overspending, using recorded transactions; output structured category summaries and grounded text.
- Scenario Explanation Agent: explain output of deterministic calculations for proposed expenses, savings contributions, or income changes; clearly label assumptions.
- Finance Q&A Agent: answer finance questions about user's own records and educational budgeting concepts; do not fabricate balances or guarantees.

## Stage 7 — Tools and agent (proposed)
- get_user_transactions(user_id, date_range): fetch authorized user's transaction list only.
- calculate_budget_summary(user_id, month): compute income, expense totals and balance in backend, not solely AI.
- calculate_savings_goal(target, current, months): compute required monthly savings and validate months > 0.
- simulate_cashflow(monthly_income, fixed_costs, variable_costs, new_purchase, monthly_savings): return deterministic projected balance.
- Agent routing: user question -> classify analysis/simulation/general -> call approved tools -> assemble grounded response.
- Protect tools with server-side authenticated user identity, not user-provided user_id.

## Stage 8 — State (proposed)
- Persist user budgets, transactions, goals, simulations in PostgreSQL.
- Store session ID and short conversation context separately.
- Do not store API keys or raw sensitive banking credentials in agent memory.
- The backend controls user identity and access scopes on each call.

## Stage 9 — Context (proposed)
- Supply only transactions for authenticated user and relevant date range.
- Include current month, currency MYR, category labels, and outputs of calculations.
- Use a small budgeting education knowledge base if needed; keep user-private data outside shared RAG.
- Include source timestamps and explicitly state when data is missing.

## Stage 10 — Reliability (proposed)
- Validate numerical inputs and budget periods, retry recoverable API failures with limits, time out long requests, and display a clear fallback.
- Log trace IDs, duration and errors without logging secret keys or full private financial data.
- Add tests for edge cases: zero income, negative input, no transactions, invalid goal dates, big expenses.
- User approves any action that changes financial records.

## Stage 11 — Cost (illustrative estimates, not verified prices)
- AI calls depend on model/provider, tokens and usage; estimate before launch with actual logs.
- Limit repeated calls and use deterministic code for arithmetic to reduce AI spend.
- Set per-user requests/day and an administrator spend cap.
- Example planning allowance: RM50–RM150/month for early experiments, to be validated with actual provider pricing and traffic.

## Stage 12 — SaaS business (proposed)
- Target segment: students and young working adults in Malaysia.
- Value proposition: Understand where your money goes, plan your month and preview money decisions in one web app.
- Monetization: Freemium; paid plan example RM19/month (hypothesis for testing, not market-validated).
- Acquisition: campus demonstrations, student communities, social media finance tips, referral invites.
- Success metrics: users who log expenses weekly, 30-day retention, simulation usage, trial-to-paid conversion.

## Stage 13 — Build pack (proposed)
Include product brief, user roles, prioritized features, acceptance tests, data model, API contracts, UI screens, tool schemas, agent prompts, security requirements, run instructions and test cases.
Use the generated pack only after checking that it includes the six Must features and three Uses AI flags.

## Stage 14 — Build and sell (proposed)
- Implement smallest working demo: account -> 5 example transactions -> budget -> AI analysis -> scenario simulation.
- Test end-to-end with one sample Malaysian user profile and no bank integrations.
- Demo to prospective users; collect usability feedback and measure whether the explanations help them make clearer choices.
- Validate willingness to pay before committing to subscription infrastructure.

## Sample demo scenario
Income: RM2,500/month. Rent: RM600. Food: RM450. Transport: RM200. Other expenses: RM350. Baseline balance = RM900. Proposed extra monthly spending RM300 => new balance RM600. All numbers are fictional examples.
