# HomeLedger — The Hartley Household Budget

[![Household Budget Site](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/competitions/best-household-budget-site-20261126-1457)
[![Rank](https://make.fun/badge/best-household-budget-site-20261126-1457/emasinves0-commits/best-household-budget-site-20261126-1457/rank.svg)](https://make.fun/competitions/best-household-budget-site-20261126-1457)
[![Reward](https://make.fun/badge/best-household-budget-site-20261126-1457/emasinves0-commits/best-household-budget-site-20261126-1457/reward.svg)](https://make.fun/competitions/best-household-budget-site-20261126-1457)

A working household budget site for the Hartley household (Maya & Tom, plus June, 9, and Leo, 6),
November 2026. Six working views, all reachable from the top navigation:

- **Dashboard** — income, spending, savings and what is left, a spending donut, budgets
  closest to the edge, bills coming up, latest purchases.
- **Transactions** — all 48 November purchases, searchable and filterable by category, plus
  an add-a-purchase form that updates every total on the site.
- **Budgets** — twelve monthly envelopes with live bars, over/under badges and editable amounts.
- **Bills** — what is owed and when, with Mark paid buttons that move bills to the paid list.
- **Goals** — four savings jars with progress, finish dates and an add-money control.
- **Reports** — six months of income vs spending, spending by category, top shops, CSV download.

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
- `app/data.js` — the household's November data: income, budgets, transactions, bills, goals
- `app/format.js` — money and date formatting
- `app/charts.js` — hand-drawn SVG donut and bar charts
- `app/views.js` — the six page renderers
- `app/main.js` — router, state (localStorage) and every control's wiring
- `main.ts` — the hand-in driver
- `vendor/makefun-frontend.ts` — the kit's copy, unchanged
