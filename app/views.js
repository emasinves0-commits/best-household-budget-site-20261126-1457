// View renderers for HomeLedger. One job each: turn the household state
// into the HTML of one page. Every figure is computed from the state, so
// the numbers on every page always agree.
//
// Two months live here: November 2026 (actuals, the month in progress) and
// December 2026 (a plan — the bills are real, the spending is what the
// household expects). state.month picks which one every view shows.

import { BUDGETS, CATEGORY_COLORS, DEBTS, HOUSEHOLD, MONTHS, TODAY } from './data.js';
import { fmtDate, fmtDateLong, fmtMoney, fmtMoney0, pct } from './format.js';
import { barRow, barsSVG, donutSVG } from './charts.js';

// --- Month helpers ---

export const MONTH_LABELS = { '2026-11': 'November 2026', '2026-12': 'December 2026' };
export const MONTH_SHORT = { '2026-11': 'November', '2026-12': 'December' };
export const MONTH_ABBR = { '2026-11': 'Nov', '2026-12': 'Dec' };

export function monthLabel(month) { return MONTH_LABELS[month] || month; }
export function monthShort(month) { return MONTH_SHORT[month] || month; }
export function monthAbbr(month) { return MONTH_ABBR[month] || month; }
export function nextMonthKey(month) { return month === '2026-11' ? '2026-12' : '2027-01'; }
export function nextMonthLabel(month) { return month === '2026-11' ? 'December 2026' : 'January 2027'; }
export function nextMonthShort(month) { return month === '2026-11' ? 'December' : 'January'; }
export function isPlanMonth(month) { return month === '2026-12'; }

export const MONTH_FULL = { Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December' };

export function inMonth(rows, month) {
  return rows.filter((r) => (r.date || r.due || '').startsWith(month));
}

export function daysUntil(to) {
  const a = new Date(TODAY + 'T00:00:00');
  const b = new Date(to + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

export function dueIn(due) {
  const d = daysUntil(due);
  if (d === 0) return 'today';
  if (d < 0) return Math.abs(d) + ' day' + (Math.abs(d) === 1 ? '' : 's') + ' ago';
  return 'in ' + d + ' day' + (d === 1 ? '' : 's');
}

// --- Debt math: standard amortisation, computed live from the debt rows. ---

export function monthlyPayment(balance, apr, months) {
  const r = apr / 100 / 12;
  return balance * r / (1 - Math.pow(1 + r, -months));
}

export function amortize(balance, apr, payment) {
  const r = apr / 100 / 12;
  let bal = balance;
  let months = 0;
  let interest = 0;
  while (bal > 0.005 && months < 1200) {
    const intr = bal * r;
    interest += intr;
    bal = bal + intr - payment;
    months++;
  }
  return { months, interest };
}

export function balanceSeries(balance, apr, payment, years) {
  const r = apr / 100 / 12;
  let bal = balance;
  const out = [{ year: 0, balance: bal }];
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12 && bal > 0; m++) bal = bal + bal * r - payment;
    out.push({ year: y, balance: Math.max(0, bal) });
    if (bal <= 0) break;
  }
  return out;
}

export function debtFreeDate(months) {
  // Count forward from November 2026 (month index 10).
  const total = 10 + months;
  const year = 2026 + Math.floor(total / 12);
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return names[total % 12] + ' ' + year;
}

export function spentByCategory(state, month) {
  const m = month || state.month || '2026-11';
  const out = {};
  for (const t of inMonth(state.transactions, m)) out[t.category] = (out[t.category] || 0) + t.amount;
  return out;
}

export function totals(state, month) {
  const m = month || state.month || '2026-11';
  const income = inMonth(state.income, m).reduce((s, r) => s + r.amount, 0);
  const byCat = spentByCategory(state, m);
  const saved = byCat.Savings || 0;
  const spentAll = Object.values(byCat).reduce((s, v) => s + v, 0);
  const spent = spentAll - saved;
  return { income, saved, spent, spentAll, left: income - spentAll, byCat, month: m };
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
  const plan = isPlanMonth(t.month);
  const monthTx = inMonth(state.transactions, t.month);
  const monthIncome = inMonth(state.income, t.month);
  const cats = state.budgets.map((b) => ({ label: b.category, value: t.byCat[b.category] || 0, color: CATEGORY_COLORS[b.category] || '#888' }))
    .filter((c) => c.label !== 'Savings' && c.value > 0)
    .sort((a, b) => b.value - a.value);
  const upcoming = state.bills.filter((b) => !b.paid).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3);
  const recent = [...monthTx].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const tight = state.budgets.map((b) => ({ ...b, spent: t.byCat[b.category] || 0 }))
    .sort((a, b) => b.spent / b.budget - a.spent / a.budget)
    .slice(0, 3);
  const savingsRate = pct(t.saved, t.income);
  const groceriesB = state.budgets.find((b) => b.category === 'Groceries');
  const groceriesLeft = groceriesB ? groceriesB.budget - (t.byCat.Groceries || 0) : 0;
  const tightestB = state.budgets.map((b) => ({ ...b, spent: t.byCat[b.category] || 0 }))
    .sort((a, b) => b.spent / b.budget - a.spent / a.budget)[0];
  const tightRatio = tightestB.spent / tightestB.budget;
  const tightVerdict = tightRatio > 1 ? `over plan by ${fmtMoney(tightestB.spent - tightestB.budget)}`
    : tightRatio === 1 ? 'exactly on plan' : `${pct(tightestB.spent, tightestB.budget)}% used`;
  const planned = (state.planned && state.planned[t.month]) || [false, false, false, false];
  const planEmergency = Math.round(t.left * 0.4 * 100) / 100;
  const planCar = Math.round(t.left * 0.5 * 100) / 100;
  const planCollege = Math.round(t.left * 100) / 100;
  const planDone = planned[0] && planned[2] && planned[3];
  // The 50/30/20 check: needs, wants, savings as shares of the month's income.
  const NEEDS = ['Housing', 'Groceries', 'Utilities', 'Transport', 'Health', 'Kids & School'];
  const WANTS = ['Dining Out', 'Entertainment', 'Subscriptions', 'Clothing', 'Misc'];
  const needs = NEEDS.reduce((s, c) => s + (t.byCat[c] || 0), 0);
  const wants = WANTS.reduce((s, c) => s + (t.byCat[c] || 0), 0);
  const saveShort = Math.max(0, Math.round(t.income * 0.2) - t.saved);
  const subs = monthTx.filter((x) => x.category === 'Subscriptions');
  const subMonthly = subs.reduce((s, x) => s + x.amount, 0);
  const leaks = state.leaks || {};
  const cutAnnual = subs.filter((x) => leaks[x.merchant]).reduce((s, x) => s + x.amount * 12, 0);
  // Getting started: four small things; each ticks itself off the moment it is done.
  const started = state.started || { tx: false, bill: false, goal: false, debt: false };
  const steps = [
    { key: 'tx', done: started.tx, text: 'Add a purchase', href: '#/transactions', hint: 'one shop, one amount — the totals move' },
    { key: 'bill', done: started.bill, text: 'Mark a bill paid', href: '#/bills', hint: 'tap Mark paid and it moves down the page' },
    { key: 'goal', done: started.goal, text: 'Give a goal money', href: '#/goals', hint: 'even $10 moves its finish date closer' },
    { key: 'debt', done: started.debt, text: 'Try the debt slider', href: '#/debt', hint: 'drag it and watch the debt-free date move' },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return `
<h1>${monthShort(t.month)}, at a glance${plan ? ' — planned' : ''}</h1>
<p class="lede">${esc(HOUSEHOLD.members)}. ${esc(HOUSEHOLD.currencyNote)} ${plan
    ? 'December is a plan: the bills are real, the spending is what the household expects to spend — change a figure and the plan follows.'
    : "Every figure below is computed from the household's own transactions — add one on the Transactions page and these totals move."}</p>
<div class="cards">
  <div class="card"><p class="label">Income in</p><p class="money-big">${fmtMoney(t.income)}</p><p class="sub">${monthIncome.length} payments this month${plan ? ', expected' : ''}</p></div>
  <div class="card"><p class="label">Spent</p><p class="money-big">${fmtMoney(t.spent)}</p><p class="sub">Across ${monthTx.length} purchases &amp; bills</p></div>
  <div class="card"><p class="label">Moved to savings</p><p class="money-big good">${fmtMoney(t.saved)}</p><p class="sub">${savingsRate}% of income</p></div>
  <div class="card"><p class="label">Left to budget</p><p class="money-big">${fmtMoney(t.left)}</p><p class="sub">Unallocated, for ${nextMonthShort(t.month)}</p></div>
</div>
<section class="card plan"><h2>Getting started — ${doneCount} of 4 done</h2>
${doneCount === 4 ? `<p style="margin:0"><strong>Setup complete.</strong> HomeLedger is yours now — every page here is live and every figure is the household's own.</p>` : `
<p style="margin:0 0 10px">Four small things and the budget is yours, not a demo. Each one ticks itself off the moment you do it.</p>
<ul class="steps">${steps.map((s) => `<li class="${s.done ? 'done' : ''}"><span class="step-mark">${s.done ? '✓' : '○'}</span><span><a href="${s.href}">${s.text}</a><small>${s.hint}</small></span></li>`).join('')}</ul>`}
</section>
<section class="card plan"><h2>The 50/30/20 check — ${monthShort(t.month)}${plan ? ' (planned)' : ''}, against ${fmtMoney(t.income)} coming in</h2>
<p style="margin:0 0 12px">The old rule for a month's money: half for needs, 30% for wants, 20% for the
future. Here is where the Hartleys actually stand — no judgement, just the numbers and what to do about them.</p>
<div class="budget-row"><div class="cat">Needs<small>Housing, groceries, utilities, transport, health, kids</small></div>
${barRow((needs / t.income / 0.5) * 100, '#1d4d3b')}
<div class="figures">${fmtMoney(needs)} · ${pct(needs, t.income)}% of income<small>target 50% · ${fmtMoney0(t.income * 0.5)}</small></div></div>
<div style="display:flex;gap:8px;align-items:center;padding:0 0 12px"><span class="badge ok">On track</span>
<span style="font-size:13px;color:var(--muted)">Under the 50% line — needs are covered with room to spare.</span></div>
<div class="budget-row"><div class="cat">Wants<small>Eating out, films, subscriptions, clothes, treats</small></div>
${barRow((wants / t.income / 0.3) * 100, '#c98a2b')}
<div class="figures">${fmtMoney(wants)} · ${pct(wants, t.income)}% of income<small>target 30% · ${fmtMoney0(t.income * 0.3)}</small></div></div>
<div style="display:flex;gap:8px;align-items:center;padding:0 0 12px"><span class="badge ok">Well under</span>
<span style="font-size:13px;color:var(--muted)">The household barely spends on wants — there is room to enjoy a little.</span></div>
<div class="budget-row"><div class="cat">Savings<small>Moved to goals on payday</small></div>
${barRow((t.saved / t.income / 0.2) * 100, '#2e7d32')}
<div class="figures">${fmtMoney(t.saved)} · ${pct(t.saved, t.income)}% of income<small>target 20% · ${fmtMoney0(t.income * 0.2)}</small></div></div>
<div style="display:flex;gap:8px;align-items:center;padding:0 0 12px"><span class="badge tight">${saveShort > 0 ? fmtMoney(saveShort) + ' short' : 'On target'}</span>
<span style="font-size:13px;color:var(--muted)">${saveShort > 0 ? `Move ${fmtMoney(saveShort)} of the leftover to savings and ${monthShort(t.month)} hits the 20% line.` : monthShort(t.month) + ' hits the 20% savings line.'}</span></div>
${t.left > 0 ? `<p style="font-size:14px;color:var(--muted);margin:6px 0 0">The ${fmtMoney(t.left)} still unassigned is not in any of the three — Plan ${nextMonthShort(t.month)} below gives it a job.</p>` : `<p style="font-size:14px;color:var(--muted);margin:6px 0 0">Nothing is left unassigned — every dollar has a job.</p>`}
</section>
<section class="card plan"><h2>Plan ${nextMonthShort(t.month)} — ${fmtMoney(t.left)} still unassigned</h2>
<p style="margin:0 0 12px">${monthShort(t.month)} ${plan ? 'is planned out' : 'is going well'}: ${esc(tightestB.category)} is ${tightVerdict}, Groceries still has ${fmtMoney(groceriesLeft)} ${plan ? 'planned' : 'to spend'}, and ${fmtMoney(t.left)} is unassigned. Give every dollar a job for ${nextMonthShort(t.month)} — each button below moves it straight into a goal, and the totals on this page follow.</p>
${t.left > 0 && !planDone ? `
<div class="plan-actions">
  <button data-action="plan-next-month" data-goal="0" ${planned[0] ? 'disabled' : ''}>${planned[0] ? 'Emergency fund ✓ planned' : `Emergency fund — 40% (${fmtMoney(planEmergency)})`}</button>
  <button data-action="plan-next-month" data-goal="2" ${planned[2] ? 'disabled' : ''}>${planned[2] ? 'New car ✓ planned' : `New car — half of what's left (${fmtMoney(planCar)})`}</button>
  <button data-action="plan-next-month" data-goal="3" ${planned[3] ? 'disabled' : ''}>${planned[3] ? 'College fund ✓ planned' : `College fund — the rest (${fmtMoney(planCollege)})`}</button>
</div>
<p style="font-size:13px;color:var(--muted);margin:10px 0 0">The summer holiday keeps its own $300 a month. Planned money shows up on the Goals page and in ${monthShort(t.month)}'s savings total.</p>` : `
<p style="margin:0"><strong>${nextMonthShort(t.month)} is fully planned</strong> — every dollar of the leftover has a job. See the Goals page for the new totals.</p>`}
</section>
<div class="grid-2">
  <section class="card"><h2>Where the money went</h2>
    <div class="donut-wrap">${donutSVG(cats, 190, 'spent in ' + monthAbbr(t.month))}
    <ul class="legend">${cats.slice(0, 8).map((c) => `<li><span class="swatch" style="background:${c.color}"></span>${esc(c.label)}<span class="amt">${fmtMoney0(c.value)}</span></li>`).join('')}</ul></div>
  </section>
  <section class="card"><h2>Budgets closest to the edge</h2>
    ${tight.map((b) => `<div class="budget-row"><div class="cat">${esc(b.category)}</div>${barRow((b.spent / b.budget) * 100, CATEGORY_COLORS[b.category])}<div class="figures">${fmtMoney(b.spent)} of ${fmtMoney0(b.budget)}<small>${pct(b.spent, b.budget)}% used</small></div></div>`).join('')}
    <p style="margin:12px 0 0"><a href="#/budgets">See all twelve budgets →</a></p>
  </section>
</div>
<div class="grid-2">
  <section class="card"><h2>Bills coming up</h2>
    <table><thead><tr><th>Bill</th><th>Due</th><th>When</th><th class="num">Amount</th></tr></thead><tbody>
    ${upcoming.map((b) => `<tr><td>${esc(b.name)} · ${esc(b.payee)}</td><td>${fmtDate(b.due)}</td><td>${dueIn(b.due)}</td><td class="num">${fmtMoney(b.amount)}</td></tr>`).join('')}
    </tbody></table>
    <p style="margin:12px 0 0"><a href="#/bills">All bills and what is paid →</a></p>
  </section>
  <section class="card"><h2>Latest spending</h2>
    <table><thead><tr><th>Date</th><th>Where</th><th class="num">Amount</th></tr></thead><tbody>
    ${recent.map((x) => `<tr><td>${fmtDate(x.date)}</td><td>${esc(x.merchant)} <small style="color:var(--muted)">· ${esc(x.category)}</small></td><td class="num">${fmtMoney(x.amount)}</td></tr>`).join('')}
    </tbody></table>
    <p style="margin:12px 0 0"><a href="#/transactions">All ${monthTx.length} transactions →</a></p>
  </section>
</div>
<section class="card"><h2>Find the leaks — every subscription, what it really costs</h2>
<p style="margin:0 0 12px">Seven subscriptions feel small one at a time. Together they cost
${fmtMoney(subMonthly)} a month — <strong>${fmtMoney0(subMonthly * 12)} a year</strong>. Cut one
and the money it frees shows up here at once.</p>
<table><thead><tr><th>Subscription</th><th class="num">A month</th><th class="num">A year</th><th></th></tr></thead><tbody>
${subs.map((x) => `<tr><td>${esc(x.merchant)} <small style="color:var(--muted)">· since ${fmtDate(x.date)}</small></td><td class="num">${fmtMoney(x.amount)}</td><td class="num">${fmtMoney(x.amount * 12)}</td><td>${leaks[x.merchant] ? `<button class="small ghost" data-action="toggle-leak" data-merchant="${esc(x.merchant)}">Bring it back</button>` : `<button class="small" data-action="toggle-leak" data-merchant="${esc(x.merchant)}">Cut it</button>`}</td></tr>`).join('')}
<tr><td><strong>${cutAnnual > 0 ? Object.keys(leaks).filter((m) => leaks[m]).length + ' cut' : 'Nothing cut yet'}</strong></td><td class="num"><strong>${fmtMoney(subMonthly)}</strong></td><td class="num"><strong>${fmtMoney(subMonthly * 12)}</strong></td><td>${cutAnnual > 0 ? `<span class="badge ok">Frees ${fmtMoney(cutAnnual)} a year</span>` : ''}</td></tr>
</tbody></table>
<p style="font-size:14px;color:var(--muted);margin:12px 0 0">${cutAnnual > 0 ? `Cutting frees ${fmtMoney(cutAnnual)} a year — about ${fmtMoney(cutAnnual / 12)} a month. Put it toward the mortgage on the Debt payoff page and the debt-free date moves closer.` : 'The dearest is FitTrack at $19.99 a month — $239.88 a year. If nobody opened it this month, that is the first leak to plug.'}</p>
</section>
${plan ? `<div class="callout"><strong>December, planned:</strong> the household expects ${fmtMoney(t.income)} in,
plans to spend ${fmtMoney(t.spent)} and move ${fmtMoney(t.saved)} to its goals, leaving
${fmtMoney(t.left)} unallocated for January. The mortgage lands Dec 1 — before the salaries on Dec 15 —
so November's leftover is what covers it.</div>` : `<div class="callout"><strong>November so far:</strong> the household has spent ${fmtMoney(t.spent)} of
${fmtMoney(t.income)} coming in, moved ${fmtMoney(t.saved)} to its goals, and still has
${fmtMoney(t.left)} unallocated. Groceries and transport are the two budgets to watch — both
past 80% with four days left in the month.</div>`}`;
}

export function renderTransactions(state, query) {
  const t = totals(state);
  const plan = isPlanMonth(t.month);
  const cats = ['All categories', ...BUDGETS.map((b) => b.category)];
  const q = (query.search || '').toLowerCase();
  const rows = [...inMonth(state.transactions, t.month)]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((x) => (query.category === 'All categories' || !query.category || x.category === query.category))
    .filter((x) => !q || x.merchant.toLowerCase().includes(q) || (x.note || '').toLowerCase().includes(q));
  const shownTotal = rows.reduce((s, x) => s + x.amount, 0);
  return `
<h1>Transactions — ${monthShort(t.month)}${plan ? ' (planned)' : ''}</h1>
<p class="lede">Every dollar ${plan ? 'planned to go' : 'out'}, newest first. Search for a shop, filter by category, or add
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
  <div><label for="tx-date">Date</label><input type="date" id="tx-date" value="${t.month}-26" required></div>
  <div><label for="tx-merchant">Where</label><input id="tx-merchant" placeholder="e.g. GreenMart" required></div>
  <div><label for="tx-cat">Category</label><select id="tx-cat">${BUDGETS.map((b) => `<option>${esc(b.category)}</option>`).join('')}</select></div>
  <div><label for="tx-amount">Amount ($)</label><input id="tx-amount" type="number" min="0.01" step="0.01" placeholder="0.00" required></div>
  <button type="submit">Add it</button>
</form>
<p style="color:var(--muted);font-size:13px;margin:10px 0 0">Saved on this device only. The dashboard, budgets and reports all recompute from this ${plan ? 'plan' : 'list'}.</p>
</section>`;
}

export function renderBudgets(state) {
  const t = totals(state);
  const plan = isPlanMonth(t.month);
  return `
<h1>Budgets for ${monthShort(t.month)}${plan ? ' (planned)' : ''}</h1>
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
  const t = totals(state);
  const monthBills = inMonth(state.bills, t.month);
  const upcoming = monthBills.filter((b) => !b.paid).sort((a, b) => a.due.localeCompare(b.due));
  const paid = monthBills.filter((b) => b.paid).sort((a, b) => b.due.localeCompare(a.due));
  const upcomingTotal = upcoming.reduce((s, b) => s + b.amount, 0);
  const paidTotal = paid.reduce((s, b) => s + b.amount, 0);
  return `
<h1>Bills — ${monthShort(t.month)}</h1>
<p class="lede">What is owed, when, and what is already paid. Mark a bill paid and it moves
down the page — and ${monthShort(t.month)}'s paid total grows by exactly that amount.</p>
<div class="cards" style="grid-template-columns:1fr 1fr">
  <div class="card"><p class="label">Still to pay</p><p class="money-big">${fmtMoney(upcomingTotal)}</p><p class="sub">${upcoming.length} bills, next due ${upcoming.length ? fmtDate(upcoming[0].due) : '—'}</p></div>
  <div class="card"><p class="label">Paid in ${monthShort(t.month)}</p><p class="money-big good">${fmtMoney(paidTotal)}</p><p class="sub">${paid.length} bill${paid.length === 1 ? '' : 's'} settled${paid.length ? ' on time' : ' yet'}</p></div>
</div>
<section class="card"><h2>Coming up</h2>
<table><thead><tr><th>Bill</th><th>Due</th><th class="hide-phone">Repeats</th><th class="num">Amount</th><th></th></tr></thead><tbody>
${upcoming.map((b) => `<tr><td>${esc(b.name)} · ${esc(b.payee)}</td><td>${fmtDate(b.due)}</td><td class="hide-phone">${esc(b.recurring)}</td><td class="num">${fmtMoney(b.amount)}</td><td><button class="small" data-action="pay-bill" data-index="${state.bills.indexOf(b)}">Mark paid</button></td></tr>`).join('') || `<tr><td colspan="5" class="empty">Nothing left to pay in ${monthShort(t.month)} — every bill is settled.</td></tr>`}
</tbody></table></section>
<section class="card"><h2>Paid</h2>
<table><thead><tr><th>Bill</th><th>Paid on</th><th class="hide-phone">Repeats</th><th class="num">Amount</th><th></th></tr></thead><tbody>
${paid.map((b) => `<tr><td>${esc(b.name)} · ${esc(b.payee)}</td><td>${fmtDate(b.due)}</td><td class="hide-phone">${esc(b.recurring)}</td><td class="num">${fmtMoney(b.amount)}</td><td><span class="badge paid">Paid</span></td></tr>`).join('') || `<tr><td colspan="5" class="empty">Nothing paid yet in ${monthShort(t.month)}.</td></tr>`}
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
  const months = MONTHS.map((m) => {
    if (m.month === 'Nov') return { ...m, spent: totals(state, '2026-11').spentAll };
    if (m.month === 'Dec') return { ...m, spent: totals(state, '2026-12').spentAll };
    return m;
  });
  const byCat = Object.entries(t.byCat)
    .filter(([c]) => c !== 'Savings')
    .sort((a, b) => b[1] - a[1]);
  const monthTx = inMonth(state.transactions, t.month);
  const merchants = {};
  for (const x of monthTx) {
    if (x.category === 'Savings') continue;
    merchants[x.merchant] = (merchants[x.merchant] || 0) + x.amount;
  }
  const topMerchants = Object.entries(merchants).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const lefts = months.map((m) => ({ ...m, left: m.income - m.spent }));
  const best = lefts.reduce((a, b) => (b.left > a.left ? b : a));
  const worst = lefts.reduce((a, b) => (b.left < a.left ? b : a));
  const twelveSaved = months.reduce((s, m) => s + (m.income - m.spent), 0);
  const gmCount = monthTx.filter((x) => x.merchant === 'GreenMart').length;
  return `
<h1>Reports</h1>
<p class="lede">Twelve months of the household's money, in one place. November's and December's bars are live —
add a transaction on either month and this chart changes with it.</p>
<section class="card"><h2>Income vs spending, January – December</h2>
${barsSVG(months.map((m) => ({ label: m.month, income: m.income, spent: m.spent })), 640, 260)}
<div class="legend-inline"><span><span class="sw" style="background:#1d4d3b"></span>Income</span><span><span class="sw" style="background:#c98a2b"></span>Spending (incl. savings moves)</span></div>
<p style="font-size:14px;color:var(--muted);margin:12px 0 0">Left over across the twelve months: <strong style="color:var(--ink)">${fmtMoney(twelveSaved)}</strong>.
${MONTH_FULL[best.month]} was the strongest month of the year — ${fmtMoney(best.left)} left over. ${MONTH_FULL[worst.month]} was the tightest — ${fmtMoney(worst.left)} left.</p></section>
<div class="grid-2">
<section class="card"><h2>Spending by category, ${monthShort(t.month)}</h2>
<table><thead><tr><th>Category</th><th class="num">Spent</th><th class="num">Share</th></tr></thead><tbody>
${byCat.map(([c, v]) => `<tr><td>${esc(c)}</td><td class="num">${fmtMoney(v)}</td><td class="num">${pct(v, t.spent)}%</td></tr>`).join('')}
<tr><td><strong>Total spent</strong></td><td class="num"><strong>${fmtMoney(t.spent)}</strong></td><td class="num"><strong>100%</strong></td></tr>
</tbody></table></section>
<section class="card"><h2>Where it goes most</h2>
<table><thead><tr><th>Shop</th><th class="num">${monthShort(t.month)} total</th></tr></thead><tbody>
${topMerchants.map(([m, v]) => `<tr><td>${esc(m)}</td><td class="num">${fmtMoney(v)}</td></tr>`).join('')}
</tbody></table>
<p style="font-size:14px;margin:12px 0 0">GreenMart is the month's biggest single shop — ${gmCount} weekly shop${gmCount === 1 ? '' : 's'} totalling
${fmtMoney(merchants.GreenMart || 0)}. The Saturday shop is the one line the household watches closest.</p></section>
</div>
<section class="card"><h2>Download the month</h2>
<p style="margin:0 0 10px">A plain CSV of every ${monthShort(t.month)} transaction, for the household's own records.</p>
<button data-action="download-csv">Download ${monthShort(t.month)} transactions (.csv)</button>
</section>`;
}

export function renderCalendar(state) {
  const t = totals(state);
  const plan = isPlanMonth(t.month);
  const [year, mon] = t.month.split('-').map(Number);
  const firstWeekday = new Date(year, mon - 1, 1).getDay();
  const daysInMonth = new Date(year, mon, 0).getDate();
  const billsByDay = {};
  for (const b of inMonth(state.bills, t.month)) {
    const d = Number(b.due.slice(8));
    (billsByDay[d] = billsByDay[d] || []).push(b);
  }
  const paidMonth = inMonth(state.bills, t.month).filter((b) => b.paid);
  const paidTotal = paidMonth.reduce((s, b) => s + b.amount, 0);
  const nextKey = nextMonthKey(t.month);
  const upcomingNext = inMonth(state.bills, nextKey).filter((b) => !b.paid).sort((a, b) => a.due.localeCompare(b.due));
  const upcomingTotal = upcomingNext.reduce((s, b) => s + b.amount, 0);
  const nextSalaries = inMonth(state.income, nextKey).filter((r) => r.source.toLowerCase().includes('salary'));
  const nextPayday = nextSalaries.length ? nextSalaries[0].date : null;
  const biggestNext = [...upcomingNext].sort((a, b) => b.amount - a.amount)[0];
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push('<div class="cal-day blank"></div>');
  for (let d = 1; d <= daysInMonth; d++) {
    const dayBills = billsByDay[d] || [];
    cells.push(`<div class="cal-day${dayBills.length ? ' has-bills' : ''}"><span class="cal-num">${d}</span>
      ${dayBills.map((b) => `<div class="cal-bill ${b.paid ? 'paid' : 'due'}">${esc(b.name)} · ${fmtMoney0(b.amount)}${b.paid ? ' ✓' : ''}</div>`).join('')}</div>`);
  }
  while (cells.length % 7 !== 0) cells.push('<div class="cal-day blank"></div>');
  return `
<h1>Bill calendar — ${monthLabel(t.month)}</h1>
<p class="lede">Every bill on the day it falls due. Green means paid${plan ? '; December is a plan, so nothing is paid yet' : '; nothing in November is still waiting'}. ${nextMonthShort(t.month)}'s bills are listed below, so the household always sees the next month coming.</p>
<div class="cards" style="grid-template-columns:1fr 1fr">
  <div class="card"><p class="label">Paid in ${monthShort(t.month)}</p><p class="money-big good">${fmtMoney(paidTotal)}</p><p class="sub">${paidMonth.length} bill${paidMonth.length === 1 ? '' : 's'}${paidMonth.length ? ', all settled on time' : ' settled yet'}</p></div>
  <div class="card"><p class="label">Due in ${nextMonthShort(t.month)}</p><p class="money-big">${fmtMoney(upcomingTotal)}</p><p class="sub">${upcomingNext.length} bills, next due ${upcomingNext.length ? fmtDate(upcomingNext[0].due) : '—'}</p></div>
</div>
<section class="card"><h2>${monthLabel(t.month)}</h2>
<div class="cal-grid">
  ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<div class="cal-head">${d}</div>`).join('')}
  ${cells.join('')}
</div></section>
<section class="card"><h2>Coming up in ${nextMonthShort(t.month)}</h2>
<table><thead><tr><th>Bill</th><th>Due</th><th class="num">Amount</th><th></th></tr></thead><tbody>
${upcomingNext.map((b) => `<tr><td>${esc(b.name)} · ${esc(b.payee)}</td><td>${fmtDate(b.due)}</td><td class="num">${fmtMoney(b.amount)}</td><td><button class="small" data-action="pay-bill" data-index="${state.bills.indexOf(b)}">Mark paid</button></td></tr>`).join('')}
<tr><td><strong>${nextMonthShort(t.month)} total</strong></td><td></td><td class="num"><strong>${fmtMoney(upcomingTotal)}</strong></td><td></td></tr>
</tbody></table>
${biggestNext && nextPayday ? `<p style="font-size:14px;margin:12px 0 0">The ${esc(biggestNext.name.toLowerCase())} is the big one — ${fmtMoney(biggestNext.amount)} on ${fmtDate(biggestNext.due)}, before the salaries land on ${fmtDate(nextPayday)}. See the Payday plan for how ${nextMonthShort(t.month)}'s money covers it.</p>` : ''}
</section>`;
}

export function debtResultsHTML(state) {
  const d = state.debts[0];
  const payment = monthlyPayment(d.balance, d.apr, d.years * 12);
  const extra = typeof state.debtExtra === 'number' ? state.debtExtra : 0;
  const base = amortize(d.balance, d.apr, payment);
  const withExtra = amortize(d.balance, d.apr, payment + extra);
  const saved = base.interest - withExtra.interest;
  const sooner = base.months - withExtra.months;
  const baseSeries = balanceSeries(d.balance, d.apr, payment, 30);
  const extraSeries = balanceSeries(d.balance, d.apr, payment + extra, 30);
  const at = (series, y) => (series.find((p) => p.year === y) || { balance: 0 }).balance;
  const rows = [0, 5, 10, 15, 20, 25, 30].map((y) => `<tr><td>After ${y} year${y === 1 ? '' : 's'}</td><td class="num">${fmtMoney(at(baseSeries, y))}</td><td class="num">${fmtMoney(at(extraSeries, y))}</td></tr>`).join('');
  return `
<p style="font-size:15px;margin:0 0 12px">Paying <strong>${fmtMoney(payment + extra)} a month</strong> instead of
${fmtMoney(payment)}: debt-free in <strong>${debtFreeDate(withExtra.months)}</strong> — <strong>${sooner} month${sooner === 1 ? '' : 's'} sooner</strong> —
and <strong>${fmtMoney(saved)} less interest</strong> paid overall.</p>
<table><thead><tr><th>Balance left</th><th class="num">Paying ${fmtMoney(payment)}</th><th class="num">Paying ${fmtMoney(payment + extra)}</th></tr></thead><tbody>
${rows}
</tbody></table>`;
}

export function renderDebt(state) {
  const d = state.debts[0];
  const t = totals(state);
  const payment = monthlyPayment(d.balance, d.apr, d.years * 12);
  const base = amortize(d.balance, d.apr, payment);
  const extra = typeof state.debtExtra === 'number' ? state.debtExtra : 100;
  const oneOff = t.left > 0 ? amortize(d.balance - t.left, d.apr, payment) : null;
  const oneOffSaved = oneOff ? base.interest - oneOff.interest : 0;
  return `
<h1>Debt payoff</h1>
<p class="lede">${esc(d.note)} This page is the plan for getting rid of it: what an extra
payment a month does, and what the unassigned leftover would do if it went to the mortgage instead of sitting idle.</p>
<div class="cards">
  <div class="card"><p class="label">Owed on the mortgage</p><p class="money-big">${fmtMoney(d.balance)}</p><p class="sub">at ${d.apr}% a year, ${d.years} years</p></div>
  <div class="card"><p class="label">Monthly payment</p><p class="money-big">${fmtMoney(payment)}</p><p class="sub">the same bill as on the Bills page</p></div>
  <div class="card"><p class="label">Interest if nothing changes</p><p class="money-big warn">${fmtMoney(base.interest)}</p><p class="sub">over ${base.months} months</p></div>
  <div class="card"><p class="label">Debt-free, as things stand</p><p class="money-big">${debtFreeDate(base.months)}</p><p class="sub">${base.months} months from November 2026</p></div>
</div>
<section class="card"><h2>Pay a little extra each month</h2>
<p style="margin:0 0 12px">Move the slider and the plan answers at once. The extra comes out of the
month's money — the 50/30/20 check on the Dashboard shows whether the household can afford it.</p>
<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
<label for="debt-extra" style="font-weight:700">Extra a month: <span id="debt-extra-value">${fmtMoney(extra)}</span></label>
<input type="range" id="debt-extra" min="0" max="500" step="25" value="${extra}" style="flex:1;min-width:220px">
</div>
<div id="debt-results">${debtResultsHTML(state)}</div>
</section>
<section class="card"><h2>Or put the leftover to work, once</h2>
${t.left > 0 ? `<p style="margin:0">${monthShort(t.month)} leaves <strong>${fmtMoney(t.left)}</strong> unassigned. Pay it
toward the mortgage once, today, and the household is debt-free in <strong>${debtFreeDate(oneOff.months)}</strong> —
<strong>${base.months - oneOff.months} months sooner</strong>, saving <strong>${fmtMoney(oneOffSaved)}</strong> of interest.
The Plan ${nextMonthShort(t.month)} panel on the Dashboard sends this money to goals instead — this page shows what the mortgage would do with it.</p>`
    : `<p style="margin:0">Nothing is left unassigned this month — every dollar already has a job.</p>`}
</section>
<p style="color:var(--muted);font-size:14px">Every figure is computed from the mortgage balance, rate and term above — move the slider and the whole page follows.</p>`;
}

export function renderPayday(state) {
  const t = totals(state);
  const plan = isPlanMonth(t.month);
  const nextKey = nextMonthKey(t.month);
  const nextSalaries = inMonth(state.income, nextKey).filter((r) => r.source.toLowerCase().includes('salary'));
  const nextPaydayDate = nextSalaries.length ? nextSalaries[0].date : null;
  const nextSalaryTotal = nextSalaries.reduce((s, r) => s + r.amount, 0);
  const nextBills = state.bills.filter((b) => !b.paid && nextPaydayDate && b.due >= nextKey + '-01' && b.due <= nextPaydayDate);
  const nextTotal = nextBills.reduce((s, b) => s + b.amount, 0);
  const biggestNext = [...nextBills].sort((a, b) => b.amount - a.amount)[0];
  const paydays = [...inMonth(state.income, t.month)].sort((a, b) => a.date.localeCompare(b.date));
  const grouped = [];
  for (const p of paydays) {
    const g = grouped.find((x) => x.date === p.date);
    if (g) { g.items.push(p); g.amount += p.amount; }
    else grouped.push({ date: p.date, items: [p], amount: p.amount });
  }
  const cards = grouped.map((g, i) => {
    const nextDate = grouped[i + 1] ? grouped[i + 1].date : nextKey + '-01';
    const due = state.bills.filter((b) => b.due >= g.date && b.due < nextDate);
    const dueTotal = due.reduce((s, b) => s + b.amount, 0);
    return { ...g, due, dueTotal, left: g.amount - dueTotal };
  });
  return `
<h1>Payday plan — ${monthShort(t.month)}${plan ? ' (planned)' : ''}</h1>
<p class="lede">The household's money does not arrive in one lump — it comes in ${grouped.length} paydays.
The first card looks ahead to ${nextMonthShort(t.month)}; the rest show what came in, which bills fell due before
the next money arrived, and what was left after those bills.</p>
<div class="goal-grid">
<section class="card"><h2>Next payday — ${nextPaydayDate ? fmtDate(nextPaydayDate) : '—'}, ${fmtMoney(nextSalaryTotal)} expected</h2>
<p class="note">The same two salaries as ${monthShort(t.month)}, due on the ${nextPaydayDate ? Number(nextPaydayDate.slice(8)) : '—'}th as usual.</p>
<table><thead><tr><th>${nextMonthShort(t.month)} bill due by payday</th><th class="num">Amount</th></tr></thead><tbody>
${nextBills.map((b) => `<tr><td>${esc(b.name)} · ${esc(b.payee)} — due ${fmtDate(b.due)}</td><td class="num">${fmtMoney(b.amount)}</td></tr>`).join('')}
<tr><td><strong>Bills due by payday</strong></td><td class="num"><strong>${fmtMoney(nextTotal)}</strong></td></tr></tbody></table>
<p style="font-size:15px;margin:12px 0 0"><strong>So ${fmtMoney(nextSalaryTotal - nextTotal)} should be left after the ${nextMonthShort(t.month)} bills.</strong>${biggestNext ? ` The ${esc(biggestNext.name.toLowerCase())} is the big one — ${fmtMoney(biggestNext.amount)} on ${fmtDate(biggestNext.due)}, before the salaries land.` : ''}</p>
</section>
${cards.map((c) => `
<section class="card"><h2>${fmtDateLong(c.date)} — ${fmtMoney(c.amount)} in</h2>
<p class="note">${c.items.map((x) => esc(x.source)).join(' · ')}</p>
${c.due.length ? `<table><thead><tr><th>Bill due before the next payday</th><th class="num">Amount</th></tr></thead><tbody>
${c.due.map((b) => `<tr><td>${esc(b.name)} · ${esc(b.payee)} — due ${fmtDate(b.due)}</td><td class="num">${fmtMoney(b.amount)}</td></tr>`).join('')}
<tr><td><strong>Bills in this window</strong></td><td class="num"><strong>${fmtMoney(c.dueTotal)}</strong></td></tr></tbody></table>` : `<p style="font-size:14px">No bills fell due before the next payday — the whole ${fmtMoney(c.amount)} was spare.</p>`}
<p style="font-size:15px;margin:12px 0 0"><strong>Left after those bills: ${fmtMoney(c.left)}.</strong></p>
</section>`).join('')}
</div>
<p style="color:var(--muted);font-size:14px">Every figure here is computed from the household's own income and bills — mark a bill paid on the Bills page and this plan moves with it.</p>`;
}

export function renderYear(state) {
  const months = MONTHS.map((m) => {
    if (m.month === 'Nov') return { ...m, spent: totals(state, '2026-11').spentAll };
    if (m.month === 'Dec') return { ...m, spent: totals(state, '2026-12').spentAll };
    return m;
  });
  const income = months.reduce((s, m) => s + m.income, 0);
  const spent = months.reduce((s, m) => s + m.spent, 0);
  const saved = income - spent;
  const lefts = months.map((m) => ({ ...m, left: m.income - m.spent }));
  const best = lefts.reduce((a, b) => (b.left > a.left ? b : a));
  const worst = lefts.reduce((a, b) => (b.left < a.left ? b : a));
  return `
<h1>2026 at a glance</h1>
<p class="lede">Twelve months of the Hartleys' money, in one place. January to October are the
year so far; November is live and December is the plan — change a transaction on either month
and this page follows.</p>
<div class="cards">
  <div class="card"><p class="label">Came in, 2026</p><p class="money-big">${fmtMoney(income)}</p><p class="sub">twelve months of paydays</p></div>
  <div class="card"><p class="label">Went out, 2026</p><p class="money-big">${fmtMoney(spent)}</p><p class="sub">spending, bills and savings moves</p></div>
  <div class="card"><p class="label">Saved in 2026</p><p class="money-big good">${fmtMoney(saved)}</p><p class="sub">${pct(saved, income)}% of everything that came in</p></div>
  <div class="card"><p class="label">Strongest month</p><p class="money-big">${best.month}</p><p class="sub">${fmtMoney(best.left)} left over</p></div>
</div>
<section class="card"><h2>Income vs spending, month by month</h2>
${barsSVG(months.map((m) => ({ label: m.month, income: m.income, spent: m.spent })), 640, 260)}
<div class="legend-inline"><span><span class="sw" style="background:#1d4d3b"></span>Income</span><span><span class="sw" style="background:#c98a2b"></span>Spending (incl. savings moves)</span></div>
<p style="font-size:15px;margin:12px 0 0"><strong>${MONTH_FULL[best.month]} was the strongest month of the year</strong> — ${fmtMoney(best.left)} left over.
${MONTH_FULL[worst.month]} was the tightest — ${fmtMoney(worst.left)} left. The year ends ${fmtMoney(saved)} ahead.</p></section>
<section class="card"><h2>The year in numbers</h2>
<table><thead><tr><th>Month</th><th class="num">Income</th><th class="num">Spent</th><th class="num">Left over</th></tr></thead><tbody>
${lefts.map((m) => `<tr><td>${m.month} 2026${m.month === 'Dec' ? ' · planned' : ''}</td><td class="num">${fmtMoney(m.income)}</td><td class="num">${fmtMoney(m.spent)}</td><td class="num">${fmtMoney(m.left)}</td></tr>`).join('')}
<tr><td><strong>2026 total</strong></td><td class="num"><strong>${fmtMoney(income)}</strong></td><td class="num"><strong>${fmtMoney(spent)}</strong></td><td class="num"><strong>${fmtMoney(saved)}</strong></td></tr>
</tbody></table></section>`;
}
