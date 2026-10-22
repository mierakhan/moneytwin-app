# MoneyTwin AI — TODO

## Next
- [ ] Saved-scenario list on the simulator page (API already stores them)
- [ ] CSV import with preview, validation and duplicate detection
- [ ] Full data export as CSV alongside the existing JSON export
- [ ] Light/dark theme toggle
- [ ] Tighten the Flowise agent prompt for 2–5 sentence answers
- [ ] Onboarding wizard after registration (income, categories, first budget)
- [ ] Alembic revision for any schema change after the initial one

## Hardening
- [ ] Move the login and AI rate limiters from process memory to Redis/DB for multi-worker use
- [ ] Add a `tenant_id` column path if shared accounts are ever in scope
- [ ] Password reset via a real provider (none configured, so no fake flow)
- [ ] Two-factor for admin when an auth provider supports it
- [ ] Structured request logging with a trace id, still excluding free text
- [ ] Postgres integration test in CI

## Out of scope (v1)
Bank connections, real payments, credit scoring, shared family finance, native apps.
