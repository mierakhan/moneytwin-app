# Fit review — implementation vs the new `docs/` set

Checked 22 October 2026 against `REQUIREMENTS.md`, `PROMPT_CONTRACT.md`, `EVALS.md`,
`QUALITY.md`, `AI_SETTINGS.md`, `STATE.md`, `STACK.md`, `PRISMA.md`-adjacent `DATA_MODEL.md`,
`DECISIONS.md` and `BUILD_PLAN.md`. Rule applied: change only what actually conflicts.

## Changed in this pass (necessary conflicts)

| Doc | Requirement | What conflicted | Change |
|---|---|---|---|
| PROMPT_CONTRACT | F3, F6 replies are JSON with `summary/highest_spending_category/total_expenses/overspending_amount/recommendation/needs_review` and `answer/topic/needs_review` | Backend accepted free prose and only checked RM amounts | Added `CHAT_CONTRACT`, `ANALYZE_CONTRACT`, `SIM_CONTRACT`, `extract_json`, `check_contract`, `numbers_match`; the prompt now asks for the contracted JSON; chat and analysis unpack it and report `contract: "json" \| "text"` plus `needs_review` |
| PROMPT_CONTRACT | Numbers in the reply must agree with backend totals | An analysis could state any total as long as it was an RM figure | `analyze` now compares `total_expenses` and `overspending_amount` to the computed sen totals; a mismatch falls back to the template and marks `needs_review` |
| REQUIREMENTS AC5.4 | A new goal with a past target date is rejected | Past dates were accepted and shown as overdue | `POST /api/goals` returns 400 "Choose a target date in the future"; editing an existing goal to a past date still yields the safe overdue state (tested) |
| EVALS | Cases live in `evals/cases.json` and the release gate runs them | No eval set existed | Added `evals/cases.json` (12 cases) and `tests/test_evals.py`: 8 deterministic cases run, 5 provider cases are parametrised and skipped with a reason |
| QUALITY | A dependency audit runs on every build | No audit had been run | `npm audit --omit=dev` executed: 2 moderate advisories in `react-router-dom` (6.x). Fixing them needs `npm audit fix --force`, which jumps to v7 and breaks the router API, so it is recorded rather than force-applied. `pip-audit` is not installed and was not run |

## Fits, no change made

| Doc | Requirement | Evidence |
|---|---|---|
| REQUIREMENTS | Owner/Administrator roles | `users.role`, admin routes guarded server-side |
| REQUIREMENTS | F1, F2, F7, F8 | CRUD, budgets with thresholds, alerts, dashboard — tests `test_finance.py` |
| REQUIREMENTS | F3 grounded analysis, empty month, provider failure | `/api/ai/analyze` + `/api/ai/brief`, deterministic fallbacks |
| REQUIREMENTS | F5 goal maths, AC5.1–5.3 | `test_goal01_required_monthly`, contribution tests |
| REQUIREMENTS | F6 chat, EN/BM, refusal, retry | `test_sec02`, BM live reply earlier in the session |
| REQUIREMENTS | UC1–UC6 acceptance behaviour | Covered by `test_finance.py`, `test_auth_isolation.py`, `test_history.py`, `test_p0_correctness.py` |
| PROMPT_CONTRACT | Owner-only data, no invented figures, concise answers | Grounding validator + `allowed_numbers` |
| QUALITY | Server-side validation, secrets in env, CSRF, rate limits | `deps.py`, `security.py`, `ai.check_limits` |
| QUALITY | Prompt injection cannot change rules | Descriptions and merchants are never sent to the model; context is numeric only |
| QUALITY | Indexes for list and search | `ix_txn_user_date`, `ix_transactions_transaction_date`, `ix_budgets_month` |
| STACK | Commands, two parts (web + API) | `START-MONEYTWIN.bat`, README |
| DATA_MODEL | user, transaction, category, budget, savings_goal, simulation, conversation, message, ai_usage | `app/models.py` (names pluralised) |

## Gaps kept as gaps (not silently "fixed")

| Doc | Gap | Why it stays |
|---|---|---|
| REQUIREMENTS F9 | CSV import | Priority **Could**; not built |
| REQUIREMENTS F5 / DATA_MODEL | Contributions are a single `saved_minor` balance, not dated rows | Needs an additive table + backfill of an opening balance; not faked |
| PROMPT_CONTRACT | "Repair once" on a schema mismatch | Grounding failures are retried once; a JSON schema miss currently falls back to the prose answer flagged `needs_review` instead of a second model call |
| PROMPT_CONTRACT | F4 simulation explanation contract | The simulator has no AI explain endpoint yet; only deterministic results and assumptions are shown |
| EVALS | Full release gate with a live model | 5 provider cases are skipped until the gate is run manually against Flowise |
| QUALITY | Retry with back-off on external calls, daily backups restored once, idempotency | Timeouts exist; the rest is not implemented |
| AI_SETTINGS | Per-customer RM20 monthly AI budget with an 80% alert, prompt versions and rollback, model switch in Settings, customer AI off switch | Only a daily call cap and per-user usage counts exist |
| STATE | Tenant-scoped keys | Single-tenant local build; keys are user-scoped instead |
| DATA_MODEL | `Allnsight` (insight cache) table | Insights are computed per request; no cache table |

## Verification after the changes

- `pytest -q`: **63 passed, 5 skipped** (was 55 passed).
- Live chat through the hosted Flowise flow: `status: ok`, `contract: json`, `needs_review: false`.
- `POST /api/goals` with `2020-01-01` → 400 with the new message.
- `GET /ready` → `ai_configured: true`.
- Frontend untouched in this pass; build and type-check were already green.
