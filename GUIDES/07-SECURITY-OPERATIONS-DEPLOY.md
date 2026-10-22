# MoneyTwin AI — Security, Cost, Deployment and Operations

## Absolute rules
Never store real card details, online banking credentials, identity-card numbers, or API secrets in client code, Git, screenshots or prompt. Secrets live in backend-only `.env` (gitignored). Derive authenticated user ID server-side on every API/tool call. Least privilege, default deny. Treat saved user text as untrusted. Require confirmation for state-changing actions. No real money transfers.

## Controls
- Validate body/query params server-side, constrain length/amount/date/category and pagination; use ORM queries with user ownership filtering.
- HTTPS in deployment; dev HTTP bound to localhost only; strict CORS allowlist; secure cookies and CSRF protection as appropriate.
- Password hashing using argon2id/bcrypt from maintained lib, or managed auth; protect sessions and rate-limit login.
- Log metadata (trace id, result, time, token count) only. No full prompts, passwords or private transaction descriptions in logs.
- Back up DB, verify a restoration at least once before production; make user export/delete workflows explicit.
- In-app service failure message with request ID; financial CRUD works even when AI vendor down.
- Two-factor for admin if auth library/provider supports it; do not fake MFA UI.
- Retention: 1 year is a workshop planning option, NOT a universal PDPA legal requirement. Define real retention by purposes, contracts, consent and legal review before launch. Users may delete their data.
- Live subscription billing should be implemented only with a legitimate payment provider and server-side webhook verification later.

## Deployment and ports
Preferred local frontend 5173, backend 8000, database 5432 internal-only via Docker Compose. Existing workshop Flowise 3000 and KedaiVolt website 8766 remain unchanged. Expose only required services, bind dev servers to localhost if not intentionally sharing. Check port collisions first.

## `.env` keys
DATABASE_URL, APP_SECRET_KEY, FRONTEND_ORIGIN, API_HOST, API_PORT, VITE_API_BASE_URL (public only), FLOWISE_URL, FLOWISE_FLOW_ID, FLOWISE_API_KEY (private), AI_PROVIDER (flowise/off), AI_REQUEST_TIMEOUT_SECONDS, AI_DAILY_LIMIT, AI_MONTHLY_BUDGET_RM.

## Build/run instruction that Hermes must supply
- Install Docker Desktop OR local Python/Node/Postgres prerequisites.
- Copy `.env.example` to `.env`, generate strong session secret securely and set database config.
- Run migrations/seed, install dependencies, run backend and frontend; provide a `.bat` helper for Windows and Docker Compose alternative.
- Test `/health`, login, finance CRUD, simulation, AI connection; report local URLs.
- Git ignore `.env`, DB files and logs; provide `.env.example` without actual credentials.

## Monitoring, pricing and SaaS assumptions
- Metrics: API errors, response latency, daily active owners, AI calls/account, AI token costs, budget alerts, failed login patterns; no raw user-content analytics by default.
- Trial market hypothesis: freemium + potential RM19/month upgrade, 20 paying users in year 1; do not assert verified demand.
- Planning AI budget RM20/account/month is a cap for testing, not actual observed costs; calculate pricing using provider rates and measured use after selecting the model.
- Fallback provider optional; only switch if configured and permitted. Respect all provider rate limits and privacy commitments.
