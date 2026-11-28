# HomeLedger — The Hartley Household Budget

[![Household Budget Site](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/competitions/best-household-budget-site-20261126-1457)
[![Rank](https://make.fun/badge/best-household-budget-site-20261126-1457/emasinves0-commits/best-household-budget-site-20261126-1457/rank.svg)](https://make.fun/competitions/best-household-budget-site-20261126-1457)
[![Reward](https://make.fun/badge/best-household-budget-site-20261126-1457/emasinves0-commits/best-household-budget-site-20261126-1457/reward.svg)](https://make.fun/competitions/best-household-budget-site-20261126-1457)

A working household budget site for the Hartley household (Maya & Tom, plus June, 9, and Leo, 6),
November 2026 actuals and the December 2026 plan. Ten working views, all reachable from the top
navigation, and a month switcher in the header — November is the month in progress, December is
the plan (the bills are real, the spending is what the household expects):

- **Dashboard** — income, spending, savings and what is left, a spending donut, budgets
  closest to the edge, bills coming up with "in N days", latest purchases, a Getting started
  checklist that ticks itself off as the household does things, a 50/30/20 check that scores
  the month against the old rule (November: needs 47% — on track; wants 7% — well under; savings
  14% — $480 short of the 20% line; December planned: needs 41% — on track; wants 5% — well under;
  savings 15% — $400 short), a Plan December/January panel that turns the unassigned
  leftover into one-click assignments to the household's goals, and a Find-the-leaks
  panel that totals the seven subscriptions ($96 a month, $1,152 a year) with a Cut
  button on each.
- **Transactions** — all 48 November purchases (32 planned for December), searchable and
  filterable by category, plus an add-a-purchase form that updates every total on the site.
- **Budgets** — twelve monthly envelopes with live bars, over/under badges and editable amounts.
- **Bills** — what is owed and when, with Mark paid buttons that move bills to the paid list.
- **Bill calendar** — the month on a grid, every bill on the day it falls due, plus the next
  month's bills listed ahead (November: December's five bills, $2,356; December: January's
  four bills, $2,244).
- **Payday plan** — the household's money arrives in five paydays, not one lump: each card
  shows what came in, which bills fell due before the next money arrived, and what was left
  after those bills, plus the next payday worked out in advance (Dec 15: $6,800 in, $2,356 of
  December bills due first, $4,444 left; Jan 15: $6,800 in, $2,244 due first, $4,556 left).
- **Debt payoff** — the one debt the household carries, the $318,384 mortgage at 6.2%:
  a live extra-payment slider (pay $100 more a month and the household is debt-free in
  February 2053, 45 months sooner, $56,905 less interest), a balance table, and what the
  leftover would do if it went to the mortgage once ($2,625.26 in November, $3,149.25 in December).
- **Goals** — four savings jars with progress, finish dates and an add-money control.
- **Reports** — twelve months of income vs spending, spending by category, top shops, CSV download.
- **Year at a glance** — 2026 in one place: $98,950 came in, $79,315.49 went out, $19,634.51 saved
  (19.8% of everything that came in); December was the strongest month ($3,149.25 left over),
  January the tightest ($1,220).

Every figure is computed from the household's own transaction list, so the numbers on every
page agree. Edits are kept on the device only (localStorage) — nothing leaves the browser.

## Run it

Static files under `app/`, no build step, no network requests:

```sh
python3 -m http.server 8080 --directory app
# open http://localhost:8080
```

Hand it in (writes `app/`, `screenshots/` and `dossier.json` to the output directory):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `app/index.html` — shell, navigation, mount point
- `app/style.css` — the whole look (system fonts only)
- `app/data.js` — the household's data: November actuals, the December plan, January's first bills and salaries (for the look-ahead), income, budgets, transactions, bills, goals, debts
- `app/format.js` — money and date formatting
- `app/charts.js` — hand-drawn SVG donut and bar charts
- `app/views.js` — the ten page renderers, the month switcher math, plus the mortgage amortisation math
- `app/main.js` — router, state (localStorage) and every control's wiring
- `main.ts` — the hand-in driver
- `vendor/makefun-frontend.ts` — the kit's copy, unchanged
