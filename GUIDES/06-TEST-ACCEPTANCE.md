# MoneyTwin AI — Acceptance Test Plan

The build is NOT done until tests are run and evidenced. Use automated pytest + frontend tests where practical, and manually smoke-test important UI paths.

## Critical tests
| ID | Scenario | Expected result |
|---|---|---|
| AUTH-01 | Valid registration and sign-in | Signed-in Owner session works; logout invalidates it |
| AUTH-02 | Wrong password / invalid magic link | Login rejected, rate-limited, no account info leakage |
| SEC-01 | User A GET/PATCH/DELETE user B transaction UUID | 403/404, no data leak or mutation |
| SEC-02 | AI prompt asks to show another account's money | Refused; no cross-user tool call |
| SEC-03 | API key scan of frontend bundle | No secrets found |
| FIN-01 | Add expense RM12.50 and income RM100 | Correct ledger / totals in MYR with cents |
| FIN-02 | Reject amount -20 | Validation error, no negative normal expense |
| FIN-03 | Food budget RM500, spend RM200 | Remaining RM300, used 40% |
| FIN-04 | Food budget RM400, spend RM600 | Overspend RM200; 150% used; warning |
| FIN-05 | Category/month different boundary | Spending attributed only to correct month/timezone |
| SIM-01 | Income 2500, expenses 1600, new monthly 300 | Baseline 900, proposed 600, delta -300 |
| SIM-02 | Run simulation then reload real budget | Transactions and balances unchanged |
| GOAL-01 | Target 2400, current 600, 6 months | Required RM300/month |
| GOAL-02 | Zero/negative remaining months | Safe informative error, no division by zero |
| AI-01 | Flowise configured, chat asks own food total | Actual result grounded in scoped tool data |
| AI-02 | Provider unavailable | Clear "AI temporarily unavailable" not fake response; manual finance still works |
| AI-03 | Input BM | Reply BM where provider supports it |
| AI-04 | Prompt injection inside transaction description | Agent ignores untrusted instructions |
| AI-05 | Wrong model-generated numeric claim | Business validation catches/rejects it |
| UI-01 | 375px mobile viewport | No overflow, controls tappable, chat usable |
| UI-02 | Empty first-time account | Intentional empty states / onboarding |
| UI-03 | Data persisted after service restart | Real DB persistence, not only in browser localStorage |
| ADMIN-01 | Admin dashboard | Aggregate metrics only; no private financial info |

## Required demo walkthrough
1. Open localhost site, register/login demo user.
2. Show dashboard with clearly fictional profile, RM2,500 income.
3. Add Food transaction; confirm dashboard changes.
4. Set Food budget RM400, create RM600 expense, see RM200 over-budget warning.
5. Create savings goal RM2,400, saved RM600, six months, see RM300/month needed.
6. Run extra RM300 monthly scenario, show RM900 -> RM600 balance and clear assumptions.
7. Ask MoneyTwin chat: "Am I overspending on food?" Expect data-grounded answer if AI configured; otherwise clearly disconnected, not fake.
8. Show user isolation test and backend health; prove no secret in frontend.

## Required reporting
For each test write status PASS/FAIL/NOT RUN with command, date, key output and screenshot where useful. Explicitly separate *code compiles* from *website actually served* and *AI inference actually succeeded*. No fake green checkmarks.
