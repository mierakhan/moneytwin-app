# Changelog

## 22 October 2026 — audit, redesign and global assistant

### Added
- `GET /api/history?months=3|6|12|24` for month-by-month summaries with change figures.
- `POST /api/ai/brief` returning a short snapshot (three findings, one action) with a
  grounded fallback when the provider is unavailable.
- Monthly Financial History page at `/app/history`: 3/6/12-month filters, comparison with
  the previous month, income/expense and balance charts, expandable month detail, honest
  empty months.
- Global floating assistant on every authenticated page, sharing one conversation with
  `/app/chat` through `ChatContext`. Status dot reflects a real successful call.
- Dashboard summary line with spend/keep split bar and previous-month comparison data.
- AI Insights rebuilt: four snapshot cards, "Your money at a glance", suggested action,
  budget-vs-actual chart, trend chart, recommendation cards, expandable detailed analysis.
- `AUDIT-REPORT.md` and this changelog.

### Changed
- Design tokens: deep teal `#16333A`, amber `#F5A623`, mint and blush tints, cream canvas,
  24 px card radius, serif display face for headings and the wordmark.
- Sidebar is light with a teal active pill; the assistant button is amber.
- Chat moved from page-local state to a shared provider so navigation no longer loses threads.
- Nav gained a History item; the mobile bottom bar keeps five destinations.

### Fixed
- `/api/ai/analyze` returned 500 when a spent/limit pair was read from the trimmed context
  (`KeyError: spent_minor`).
- Grounding check rejected correct arithmetic; pairwise sums and differences of verified
  values, plus amounts the user typed, are now allowed.
- Short answers from Flowise no longer fail validation on markdown tables.

### Verified
- 37 backend tests pass; TypeScript compiles; production build succeeds.
- Live AI calls against the hosted Flowise agentflow return grounded figures.
