# MoneyTwin AI — Build Roadmap and Decision Register

## Milestones (order, not fixed time promise)
P0: inspect environment, create repo, project skeleton, .env.example, README.
P1: backend, migrations, auth/session/tenant checks, fictional seed data.
P2: transactions, budgets and savings goals with automated tests.
P3: dashboards, responsive front-end navigation, empty/error states.
P4: deterministic simulator and tested worked examples.
P5: AI backend adapter, MoneyTwin chatbot, grounded analysis and usage controls; verify live prediction only if actual credential/flow available.
P6: end-to-end tests, fix defects, Windows startup script, screenshots, deployment instructions and final status report.
P7 optional: CSV importer, freemium plan mock, more charts and localization polish.

## Decisions and assumptions
- **Selected project:** MoneyTwin AI, NOT KedaiVolt Vee.
- **Target:** Malaysia; MYR and English/BM.
- **Platform:** web app, mobile responsive; no native app.
- **Six MUST features:** Expense Tracking, Budget Management, AI Expense Analysis, Financial Simulation, Savings Goal Tracker, AI Finance Chatbot.
- **Model:** choose cheapest appropriate configured model that passes tests; no claim that Ollama is free to operate in the real world.
- **Flowise:** optional dedicated MoneyTwin flow; may be absent. Never reuse KedaiVolt Flow ID. Keep frontend completely secret-free.
- **UI:** premium fintech, accessible, with charted dashboard and chat widget.
- **Demo:** invented records only, not real personal finances.
- **Business:** freemium and RM19/month are hypotheses, no live billing in MVP.
- **Data:** PostgreSQL preferred; SQLite only explicitly stated dev fallback.
- **Auth:** backend-managed secure session; email magic link / Google sign-in possible later only with configured providers; do not fabricate external sign-in functionality.
- **Cost / rate limits:** 10 AI calls/min/user, 100/day per account, RM20 monthly planning cap.

## Definition of done
A user can authenticate, add transactions, set budgets, see a dashboard, create savings goal, run a simulator and interact with a genuinely connected AI assistant **if credentials are configured**. No cross-user leaks or invented financial facts. Automated test report, explicit remaining dependencies, local start/stop instructions, working URLs, readable code and `.env.example` are provided.

## Graceful degradation
If actual AI credentials or Flowise flow are not ready, finish full financial website and backend, show a clearly labeled AI setup state, and provide precise instructions for connecting and verifying the API. Do not claim "AI works" until an actual end-to-end prediction call succeeds.
