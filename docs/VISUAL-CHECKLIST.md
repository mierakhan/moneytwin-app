# Twilight Fintech — visual acceptance checklist

Checked on 22 October 2026 against the addendum's Section H. Screenshots could not be taken
because the local Brave profile was locked, so each row records what was implemented and how it
was verified (code tokens, build output, route status), not a pixel comparison.

Legend: **Met** implemented across the app · **Partial** implemented on some pages or in a
simplified form · **Not met** not built.

| Trait | Status | Where it stands |
|---|---|---|
| Navy frame around the app | Met | Sidebar and mobile header are `#0E1233`; the content sheet follows a navy band |
| Lavender sheet with 36px top corners overlapping the navy band | Met | `.sheet` utility, `-mt-8` overlap in `AppShell` |
| Royal-blue balance hero with sparkline and delta chip | Met | Dashboard hero `card-grad-blue`, inline SVG sparkline from real trend points, "No previous data" fallback |
| Tinted icon-tile quick actions | Met | Five tiles (expense, income, budget, simulate, ask) on the dashboard |
| Donut with legend and percentages | Partial | Recharts donut with the new eight-colour palette and legend; total-in-centre is not drawn |
| Avatar activity rows | Met | Category initial tiles in recent activity and the transaction list |
| Gradient promo/insight banner | Partial | Unbudgeted strip and the savings card exist, but no illustration-led promo banner |
| Segmented pill tabs (navy track, white active) | Partial | `.pill-tabs` style defined and used on History; not yet on Dashboard, Budgets or Insights |
| Gradient goal cards with rings | Partial | Coloured gradient accent per goal; the card face is still white, no ring |
| Coral-and-lavender chat bubbles | Met | Coral user bubbles, lavender assistant bubbles, navy header, coral launcher |
| Bottom tab bar on mobile | Met | Five-item bar, indigo active state, safe-area padding |
| Plus Jakarta Sans with serif-free hierarchy | Met | Loaded from Google Fonts with Manrope/system fallbacks; display weight 700 |
| Money in tabular numerals with dimmed sen | Partial | Tabular class on the hero; the dimmed `.00` suffix is not implemented |
| Coral AI accent only on AI | Met | Launcher, chat send, AI badge use coral; primary buttons are indigo |
| Status never colour-only | Met | Over/Caution badges carry text and an icon; deltas carry arrows and words |
| Reduced motion respected | Met | Global `prefers-reduced-motion` block, animations duration-collapsed |
| Spotlight on sign-in only | Not met | Not implemented |
| Magnetic hover on launcher and Run Simulation | Not met | Not implemented |
| Dark theme toggle | Not met | Deliberately deferred; addendum puts it in P2 |
| Original SVG illustrations | Not met | No illustrations were drawn for empty states or onboarding |

## Pages and their three required blocks

| Page | Hero/summary | Visualization | Real list | Insight/action |
|---|---|---|---|---|
| Dashboard | Balance hero + summary line | Trend bars, category donut | Recent transactions, goals | Overspending pill, quick actions |
| Transactions | Income/expense/balance strip | – (list-first by design) | Ledger, desktop table plus mobile cards | Empty-state CTA |
| Budgets | Totals row including overspending | Progress bars per category | Budget cards, unbudgeted list | Over-budget callout per card |
| Goals | Goal cards with progress | Progress bars | Goals, contributions via API | Deadline guidance when missing |
| History | Net cards with deltas | Income/expense bars, balance line | Month rows | "No records" honesty |
| Insights | Four snapshot cards plus AI brief | Budget-vs-actual, trend line | Category rows | Recommended action |
| Simulation | Baseline vs proposed | Projection chart | Assumptions list | Risk note |
| Chat | Status header | – | Message thread | Quick prompts |
| Settings | Profile card | – | Grouped settings | Export, danger zone |

## Colour tokens in use

`#0E1233` ink · `#1A1F4D` raised dark · `#14183F` text · `#6C5CE7` indigo · `#E8E5FD` indigo tint ·
`#2F5BFF`→`#4B7BFF` hero gradient · `#ECEEFA` sheet · `#F4F5FC` canvas · `#FFFFFF` surface ·
`#E3E6F5` hairline · `#F25C66` coral · `#1FB67A` emerald · `#F59A5B` orange · `#D93C5A` danger ·
category palette `#4C8DF6 #8B6CF0 #C86CE6 #B9C4F5 #F25C66 #F59A5B #1FB67A #8A93B8`.

## Contrast notes

- Text `#14183F` on `#FFFFFF` ≈ 15.8:1, on `#ECEEFA` ≈ 13.9:1.
- `#4A5078` secondary on white ≈ 7.4:1, on lavender ≈ 6.5:1.
- White on `#6C5CE7` ≈ 5.1:1; white on `#F25C66` ≈ 3.6:1 — used only for large bold button text
  and bubbles at 15px bold, which clears AA large-text (3:1). Body copy never sits on coral.
- White on `#2F5BFF` ≈ 5.6:1.

These are calculated ratios, not axe measurements; an automated axe run is still outstanding.
