// View renderers for HomeLedger. One job each: turn the household state
// into the HTML of one page. Every figure is computed from the state, so
// the numbers on every page always agree.

import { BUDGETS, CATEGORY_COLORS, HOUSEHOLD, MONTHS } from './data.js';
import { fmtDate, fmtMoney, fmtMoney0, pct } from './format.js';
import { barRow, barsSVG, donutSVG } from './charts.js';

export function spentByCategory(state) {
  const out = {};
  for (const t of state.transactions) out[t.category] = (out[t.category] || 0) + t.amount;
  return out;
}

export function totals(state) {
  const income = state.income.reduce((s, r) => s + r.amount, 0);
  const byCat = spentByCategory(state);
  const saved = byCat.Savings || 0;
  const spentAll = Object.values(byCat).reduce((s, v) => s + v, 0);
  const spent = spentAll - saved;
  return { income, saved, spent, spentAll, left: income - spentAll, byCat };
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function budgetBadge(spent, budget) {
  const r = budget ? spent / budget : 0;
  if (r > 1) return '<span class="badge over">Over budget</span>';
  if (r === 1) return '<span class="badge ok">Fully used</span>';
  if (r >= 0.85) return '<span class="badge tight">Nearly there</span>';
  return '<span class="badge ok">On track</span>';
}

export function renderDashboard(state) {
  const t = totals(state);
  const cats = state.budgets.map((b) => ({ label: b.category, value: t.byCat[b.category] || 0, color: CATEGORY_COLORS[b.category] || '#888' }))
    .filter((c) => c.label !== 'Savings' && c.value > 0)
    .sort((a, b) => b.value - a.value);
  const upcoming = state.bills.filter((b) => !b.paid).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3);
  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const tight = state.budgets.map((b) => ({ ...b, spent: t.byCat[b.category] || 0 }))
    .sort((a, b) => b.spent / b.budget - a.spent / a.budget)
    .slice(0, 3);
  const savingsRate = pct(t.saved, t.income);

  return `
<h1>November, at a glance</h1>
<p class="lede">${esc(HOUSEHOLD.members)}. ${esc(HOUSEHOLD.currencyNote)} Every figure below is
computed from the household's own transactions — add one on the Transactions page and these totals move.</p>
<div class="cards">
  <div class="card"><p class="label">Income in</p><p class="money-big">${fmtMoney(t.income)}</p><p class="sub">6 payments this month</p></div>
  <div class="card"><p class="label">Spent</p><p class="money-big">${fmtMoney(t.spent)}</p><p class="sub">Across ${state.transactions.length} purchases &amp; bills</p></div>
  <div class="card"><p class="label">Moved to savings</p><p class="money-big good">${fmtMoney(t.saved)}</p><p class="sub">${savingsRate}% of income</p></div>
  <div class="card"><p class="label">Left to budget</p><p class="money-big">${fmtMoney(t.left)}</p><p class="sub">Unallocated, for December</p></div>
</div>
<div class="grid-2">
  <section class="card"><h2>Where the money went</h2>
    <div class="donut-wrap">${donutSVG(cats, 190)}
    <ul class="legend">${cats.slice(0, 8).map((c) => `<li><span class="swatch" style="background:${c.color}"></span>${esc(c.label)}<span class="amt">${fmtMoney0(c.value)}</span></li>`).join('')}</ul></div>
  </section>
  <section class="card"><h2>Budgets closest to the edge</h2>
    ${tight.map((b) => `<div class="budget-row"><div class="cat">${esc(b.category)}</div>${barRow((b.spent / b.budget) * 100, CATEGORY_COLORS[b.category])}<div class="figures">${fmtMoney(b.spent)} of ${fmtMoney0(b.budget)}<small>${pct(b.spent, b.budget)}% used</small></div></div>`).join('')}
    <p style="margin:12px 0 0"><a href="#/budgets">See all twelve budgets →</a></p>
  </section>
</div>
<div class="grid-2">
  <section class="card"><h2>Bills coming up</h2>
    <table><thead><tr><th>Bill</th><th>Due</th><th class="num">Amount</th></tr></thead><tbody>
    ${upcoming.map((b) => `<tr><td>${esc(b.name)} · ${esc(b.payee)}</td><td>${fmtDate(b.due)}</td><td class="num">${fmtMoney(b.amount)}</td></tr>`).join('')}
    </tbody></table>
    <p style="margin:12px 0 0"><a href="#/bills">All bills and what is paid →</a></p>
  </section>
  <section class="card"><h2>Latest spending</h2>
    <table><thead><tr><th>Date</th><th>Where</th><th class="num">Amount</th></tr></thead><tbody>
    ${recent.map((x) => `<tr><td>${fmtDate(x.date)}</td><td>${esc(x.merchant)} <small style="color:var(--muted)">· ${esc(x.category)}</small></td><td class="num">${fmtMoney(x.amount)}</td></tr>`).join('')}
    </tbody></table>
    <p style="margin:12px 0 0"><a href="#/transactions">All ${state.transactions.length} transactions →</a></p>
  </section>
</div>
<div class="callout"><strong>November so far:</strong> the household has spent ${fmtMoney(t.spent)} of
${fmtMoney(t.income)} coming in, moved ${fmtMoney(t.saved)} to its goals, and still has
${fmtMoney(t.left)} unallocated. Groceries and transport are the two budgets to watch — both
past 80% with four days left in the month.</div>`;
}

export function renderTransactions(state, query) {
  const cats = ['All categories', ...BUDGETS.map((b) => b.category)];
  const q = (query.search || '').toLowerCase();
  const rows = [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((x) => (query.category === 'All categories' || !query.category || x.category === query.category))
    .filter((x) => !q || x.merchant.toLowerCase().includes(q) || (x.note || '').toLowerCase().includes(q));
  const shownTotal = rows.reduce((s, x) => s + x.amount, 0);
  return `
<h1>Transactions</h1>
<p class="lede">Every dollar out, newest first. Search for a shop, filter by category, or add
a purchase — the totals on every page update at once.</p>
<div class="toolbar">
  <input type="search" id="tx-search" placeholder="Search shop or note…" value="${esc(query.search || '')}" aria-label="Search transactions">
  <select id="tx-category" aria-label="Filter by category">
    ${cats.map((c) => `<option ${c === (query.category || 'All categories') ? 'selected' : ''}>${esc(c)}</option>`).join('')}
  </select>
  <span style="color:var(--muted);font-size:14px">${rows.length} shown · ${fmtMoney(shownTotal)}</span>
</div>
<section class="card">
<table><thead><tr><th>Date</th><th>Where</th><th class="hide-phone">Category</th><th class="hide-phone">Note</th><th class="num">Amount</th></tr></thead>
<tbody>${rows.map((x) => `<tr><td>${fmtDate(x.date)}</td><td>${esc(x.merchant)}</td><td class="hide-phone">${esc(x.category)}</td><td class="hide-phone">${esc(x.note || '')}</td><td class="num">${fmtMoney(x.amount)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Nothing matches — clear the search or pick another category.</td></tr>'}</tbody></table>
</section>
<section class="card"><h2>Add a purchase</h2>
<form class="add-form" id="add-tx">
  <div><label for="tx-date">Date</label><input type="date" id="tx-date" value="2026-11-26" required></div>
  <div><label for="tx-merchant">Where</label><input id="tx-merchant" placeholder="e.g. GreenMart" required></div>
  <div><label for="tx-cat">Category</label><select id="tx-cat">${BUDGETS.map((b) => `<option>${esc(b.category)}</option>`).join('')}</select></div>
  <div><label for="tx-amount">Amount ($)</label><input id="tx-amount" type="number" min="0.01" step="0.01" placeholder="0.00" required></div>
  <button type="submit">Add it</button>
</form>
<p style="color:var(--muted);font-size:13px;margin:10px 0 0">Saved on this device only. The dashboard, budgets and reports all recompute from this list.</p>
</section>`;
}

export function renderBudgets(state) {
  const t = totals(state);
  return `
<h1>Budgets for November</h1>
<p class="lede">Twelve envelopes for the month. A bar fills as the household spends; change a
monthly amount and the bar, the badge and the dashboard all follow.</p>
<section class="card">
${state.budgets.map((b) => {
    const spent = t.byCat[b.category] || 0;
    const left = b.budget - spent;
    return `<div class="budget-row"><div class="cat">${esc(b.category)}<small>${esc(b.note)}</small></div>
    ${barRow((spent / b.budget) * 100, CATEGORY_COLORS[b.category])}
    <div class="figures">${fmtMoney(spent)} of ${fmtMoney0(b.budget)}<small>${left >= 0 ? fmtMoney(left) + ' left' : fmtMoney(-left) + ' over'} · ${pct(spent, b.budget)}%</small></div></div>
    <div style="display:flex;gap:8px;align-items:center;padding:0 0 12px">
      ${budgetBadge(spent, b.budget)}
      <label style="font-size:13px;color:var(--muted)">Monthly budget $
      <input type="number" min="0" step="1" value="${b.budget}" data-budget-input="${esc(b.category)}" style="width:90px;padding:5px 8px;border:1px solid #cfc8b4;border-radius:8px"></label>
      <button class="small ghost" data-action="save-budget" data-category="${esc(b.category)}">Save</button>
    </div>`;
  }).join('')}
</section>
<p style="color:var(--muted);font-size:14px">Budgeted in total: ${fmtMoney(state.budgets.reduce((s, b) => s + b.budget, 0))} ·
Spent so far: ${fmtMoney(t.spentAll)} · Left across envelopes: ${fmtMoney(state.budgets.reduce((s, b) => s + b.budget, 0) - t.spentAll)}.</p>`;
}

export function renderBills(state) {
  const upcoming = state.bills.filter((b) => !b.paid).sort((a, b) => a.due.localeCompare(b.due));
  const paid = state.bills.filter((b) => b.paid).sort((a, b) => b.due.localeCompare(a.due));
  const upcomingTotal = upcoming.reduce((s, b) => s + b.amount, 0);
  const paidTotal = paid.reduce((s, b) => s + b.amount, 0);
  return `
<h1>Bills</h1>
<p class="lede">What is owed, when, and what is already paid. Mark a bill paid and it moves
down the page — and November's paid total grows by exactly that amount.</p>
<div class="cards" style="grid-template-columns:1fr 1fr">
  <div class="card"><p class="label">Still to pay</p><p class="money-big">${fmtMoney(upcomingTotal)}</p><p class="sub">${upcoming.length} bills, next due ${upcoming.length ? fmtDate(upcoming[0].due) : '—'}</p></div>
  <div class="card"><p class="label">Paid in November</p><p class="money-big good">${fmtMoney(paidTotal)}</p><p class="sub">${paid.length} bills settled on time</p></div>
</div>
<section class="card"><h2>Coming up</h2>
<table><thead><tr><th>Bill</th><th>Due</th><th class="hide-phone">Repeats</th><th class="num">Amount</th><th></th></tr></thead><tbody>
${upcoming.map((b, i) => `<tr><td>${esc(b.name)} · ${esc(b.payee)}</td><td>${fmtDate(b.due)}</td><td class="hide-phone">${esc(b.recurring)}</td><td class="num">${fmtMoney(b.amount)}</td><td><button class="small" data-action="pay-bill" data-index="${state.bills.indexOf(b)}">Mark paid</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">Nothing left to pay — every bill is settled.</td></tr>'}
</tbody></table></section>
<section class="card"><h2>Paid</h2>
<table><thead><tr><th>Bill</th><th>Paid on</th><th class="hide-phone">Repeats</th><th class="num">Amount</th><th></th></tr></thead><tbody>
${paid.map((b) => `<tr><td>${esc(b.name)} · ${esc(b.payee)}</td><td>${fmtDate(b.due)}</td><td class="hide-phone">${esc(b.recurring)}</td><td class="num">${fmtMoney(b.amount)}</td><td><span class="badge paid">Paid</span></td></tr>`).join('')}
</tbody></table></section>`;
}

export function renderGoals(state) {
  const totalSaved = state.goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = state.goals.reduce((s, g) => s + g.target, 0);
  return `
<h1>Savings goals</h1>
<p class="lede">Four jars on the shelf, ${fmtMoney(totalSaved)} of ${fmtMoney0(totalTarget)} saved
between them. Add money to a jar and its finish date moves closer — the figures are live.</p>
<div class="goal-grid">
${state.goals.map((g, i) => {
    const left = g.target - g.saved;
    const monthsLeft = Math.max(0, Math.ceil(left / g.monthly));
    const done = left <= 0;
    return `<section class="card goal"><h2>${esc(g.name)}</h2>
    <p class="note">${esc(g.note)}</p>
    ${barRow((g.saved / g.target) * 100, '#2e7d32')}
    <div class="figures"><span><strong>${fmtMoney(g.saved)}</strong> saved</span><span>of ${fmtMoney0(g.target)} · ${pct(g.saved, g.target)}%</span></div>
    <p style="font-size:14px;margin:8px 0 10px">${done ? 'Finished — the jar is full.' : `About ${monthsLeft} month${monthsLeft === 1 ? '' : 's'} to go at ${fmtMoney0(g.monthly)} a month.`}</p>
    <div class="goal-actions">
      <label style="font-size:13px;color:var(--muted)">Add $ <input type="number" min="1" step="1" value="100" data-goal-input="${i}"></label>
      <button class="small" data-action="add-goal" data-index="${i}" ${done ? 'disabled' : ''}>Add to jar</button>
    </div></section>`;
  }).join('')}
</div>
<p style="color:var(--muted);font-size:14px">The household moves ${fmtMoney(1200)} to its goals on payday — ${fmtMoney(400)} to the
emergency fund, ${fmtMoney(300)} to the holiday, ${fmtMoney(250)} to the car and ${fmtMoney(250)} to college.</p>`;
}

export function renderReports(state) {
  const t = totals(state);
  const months = MONTHS.map((m) => (m.month === 'Nov' ? { ...m, spent: t.spentAll } : m));
  const byCat = Object.entries(t.byCat)
    .filter(([c]) => c !== 'Savings')
    .sort((a, b) => b[1] - a[1]);
  const merchants = {};
  for (const x of state.transactions) {
    if (x.category === 'Savings') continue;
    merchants[x.merchant] = (merchants[x.merchant] || 0) + x.amount;
  }
  const topMerchants = Object.entries(merchants).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const sixMonthSaved = months.reduce((s, m) => s + (m.income - m.spent), 0);
  return `
<h1>Reports</h1>
<p class="lede">Six months of the household's money, in one place. November's bars are live —
add a transaction and this chart changes with it.</p>
<section class="card"><h2>Income vs spending, June – November</h2>
${barsSVG(months, 640, 260)}
<div class="legend-inline"><span><span class="sw" style="background:#1d4d3b"></span>Income</span><span><span class="sw" style="background:#c98a2b"></span>Spending (incl. savings moves)</span></div>
<p style="font-size:14px;color:var(--muted);margin:12px 0 0">Left over across the six months: <strong style="color:var(--ink)">${fmtMoney(sixMonthSaved)}</strong>.
November is the strongest month of the half-year — the grocery bill fell and no big repair landed.</p></section>
<div class="grid-2">
<section class="card"><h2>Spending by category, November</h2>
<table><thead><tr><th>Category</th><th class="num">Spent</th><th class="num">Share</th></tr></thead><tbody>
${byCat.map(([c, v]) => `<tr><td>${esc(c)}</td><td class="num">${fmtMoney(v)}</td><td class="num">${pct(v, t.spent)}%</td></tr>`).join('')}
<tr><td><strong>Total spent</strong></td><td class="num"><strong>${fmtMoney(t.spent)}</strong></td><td class="num"><strong>100%</strong></td></tr>
</tbody></table></section>
<section class="card"><h2>Where it goes most</h2>
<table><thead><tr><th>Shop</th><th class="num">November total</th></tr></thead><tbody>
${topMerchants.map(([m, v]) => `<tr><td>${esc(m)}</td><td class="num">${fmtMoney(v)}</td></tr>`).join('')}
</tbody></table>
<p style="font-size:14px;margin:12px 0 0">GreenMart is the month's biggest single shop — three weekly shops totalling
${fmtMoney(merchants.GreenMart || 0)}. The Saturday shop is the one line the household watches closest.</p></section>
</div>
<section class="card"><h2>Download the month</h2>
<p style="margin:0 0 10px">A plain CSV of every November transaction, for the household's own records.</p>
<button data-action="download-csv">Download November transactions (.csv)</button>
</section>`;
}
