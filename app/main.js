// HomeLedger shell: routing, state and wiring. One job: keep the page on
// screen, keep the household's edits on this device, and re-render when
// anything changes. State lives in localStorage; the seed comes from data.js.
//
// Two months live here: November 2026 (actuals) and December 2026 (a plan).
// state.month picks which one every view shows; the switcher sits in the
// header, so clicks are listened to on the document, not on #app.

import { BILLS, BUDGETS, DEBTS, GOALS, INCOME, TRANSACTIONS } from './data.js';
import { fmtMoney } from './format.js';
import { debtResultsHTML, isPlanMonth, monthLabel, nextMonthShort, renderBills, renderBudgets, renderCalendar, renderDashboard, renderDebt, renderGoals, renderPayday, renderReports, renderTransactions, renderYear, totals } from './views.js';

const STORE_KEY = 'homeledger-v4';
const MONTHS = ['2026-11', '2026-12'];

function seedState() {
  return {
    month: '2026-11',
    income: INCOME.map((r) => ({ ...r })),
    transactions: TRANSACTIONS.map((r) => ({ ...r })),
    budgets: BUDGETS.map((r) => ({ ...r })),
    bills: BILLS.map((r) => ({ ...r })),
    goals: GOALS.map((r) => ({ ...r })),
    debts: DEBTS.map((r) => ({ ...r })),
    planned: { '2026-11': [false, false, false, false], '2026-12': [false, false, false, false] },
    started: { tx: false, bill: false, goal: false, debt: false },
    leaks: {},
    debtExtra: 100,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.bills)) return seedState();
    if (!MONTHS.includes(parsed.month)) parsed.month = '2026-11';
    if (Array.isArray(parsed.planned)) parsed.planned = { '2026-11': parsed.planned };
    if (!parsed.planned || typeof parsed.planned !== 'object') parsed.planned = {};
    for (const m of MONTHS) {
      if (!Array.isArray(parsed.planned[m]) || parsed.planned[m].length !== 4) parsed.planned[m] = [false, false, false, false];
    }
    if (!parsed.started || typeof parsed.started !== 'object') parsed.started = { tx: false, bill: false, goal: false, debt: false };
    for (const k of ['tx', 'bill', 'goal', 'debt']) {
      if (typeof parsed.started[k] !== 'boolean') parsed.started[k] = false;
    }
    if (!Array.isArray(parsed.debts) || !parsed.debts.length) parsed.debts = DEBTS.map((r) => ({ ...r }));
    if (!parsed.leaks || typeof parsed.leaks !== 'object') parsed.leaks = {};
    if (typeof parsed.debtExtra !== 'number') parsed.debtExtra = 100;
    return parsed;
  } catch {
    return seedState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or full storage: the page still works for this visit.
  }
}

let state = loadState();
let txQuery = { search: '', category: 'All categories' };

const app = document.getElementById('app');

function route() {
  const hash = location.hash || '#/';
  const path = hash.slice(2).split('?')[0];
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const name = a.getAttribute('data-nav');
    a.classList.toggle('active', (path === '' && name === 'dashboard') || path === name);
  });
  document.querySelectorAll('[data-month]').forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-month') === state.month);
  });
  const line = document.getElementById('household-line');
  if (line) line.textContent = 'The Hartley Household · ' + monthLabel(state.month) + (isPlanMonth(state.month) ? ' (planned)' : '');
  if (path === 'transactions') app.innerHTML = renderTransactions(state, txQuery);
  else if (path === 'budgets') app.innerHTML = renderBudgets(state);
  else if (path === 'bills') app.innerHTML = renderBills(state);
  else if (path === 'calendar') app.innerHTML = renderCalendar(state);
  else if (path === 'payday') app.innerHTML = renderPayday(state);
  else if (path === 'debt') app.innerHTML = renderDebt(state);
  else if (path === 'goals') app.innerHTML = renderGoals(state);
  else if (path === 'reports') app.innerHTML = renderReports(state);
  else if (path === 'year') app.innerHTML = renderYear(state);
  else app.innerHTML = renderDashboard(state);
  window.scrollTo(0, 0);
}

function rerender() {
  saveState(state);
  route();
}

function downloadCSV() {
  const head = 'date,merchant,category,amount,note\n';
  const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const body = [...state.transactions]
    .filter((x) => x.date.startsWith(state.month))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((x) => [x.date, esc(x.merchant), esc(x.category), x.amount.toFixed(2), esc(x.note || '')].join(','))
    .join('\n');
  const blob = new Blob([head + body + '\n'], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hartley-' + state.month + '-transactions.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

app.addEventListener('input', (event) => {
  const el = event.target;
  if (el.id === 'tx-search') {
    txQuery.search = el.value;
    const pos = el.selectionStart;
    app.innerHTML = renderTransactions(state, txQuery);
    const again = document.getElementById('tx-search');
    if (again) {
      again.focus();
      again.setSelectionRange(pos, pos);
    }
  } else if (el.id === 'debt-extra') {
    // Live-update the payoff figures without rebuilding the page, so the
    // slider keeps dragging smoothly.
    state.debtExtra = Number(el.value);
    state.started.debt = true;
    saveState(state);
    const label = document.getElementById('debt-extra-value');
    if (label) label.textContent = fmtMoney(state.debtExtra);
    const results = document.getElementById('debt-results');
    if (results) results.innerHTML = debtResultsHTML(state);
  }
});

app.addEventListener('change', (event) => {
  const el = event.target;
  if (el.id === 'tx-category') {
    txQuery.category = el.value;
    route();
  }
});

app.addEventListener('submit', (event) => {
  if (event.target.id !== 'add-tx') return;
  event.preventDefault();
  const date = document.getElementById('tx-date').value;
  const merchant = document.getElementById('tx-merchant').value.trim();
  const category = document.getElementById('tx-cat').value;
  const amount = Number(document.getElementById('tx-amount').value);
  if (!date || !merchant || !(amount > 0)) return;
  state.transactions.push({ date, merchant, category, amount: Math.round(amount * 100) / 100, note: 'Added by the household' });
  state.started.tx = true;
  rerender();
  const note = document.createElement('p');
  note.textContent = 'Added ' + merchant + ' — ' + fmtMoney(amount) + ' to ' + category + '.';
  note.style.cssText = 'color:#2e7d32;font-weight:600';
  const form = document.getElementById('add-tx');
  if (form) form.after(note);
});

// The month switcher lives in the header, outside #app, so this listener
// sits on the document. Every button it catches carries data-action.
document.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  if (action === 'switch-month') {
    const month = btn.getAttribute('data-month');
    if (MONTHS.includes(month) && month !== state.month) {
      state.month = month;
      rerender();
    }
  } else if (action === 'pay-bill') {
    const idx = Number(btn.getAttribute('data-index'));
    if (state.bills[idx]) {
      state.bills[idx].paid = true;
      state.started.bill = true;
      rerender();
    }
  } else if (action === 'add-goal') {
    const idx = Number(btn.getAttribute('data-index'));
    const input = document.querySelector(`[data-goal-input="${idx}"]`);
    const amount = input ? Number(input.value) : 0;
    const goal = state.goals[idx];
    if (goal && amount > 0) {
      goal.saved = Math.min(goal.target, Math.round((goal.saved + amount) * 100) / 100);
      state.started.goal = true;
      rerender();
    }
  } else if (action === 'save-budget') {
    const category = btn.getAttribute('data-category');
    const input = document.querySelector(`[data-budget-input="${CSS.escape(category)}"]`);
    const amount = input ? Number(input.value) : NaN;
    const budget = state.budgets.find((b) => b.category === category);
    if (budget && Number.isFinite(amount) && amount >= 0) {
      budget.budget = Math.round(amount * 100) / 100;
      rerender();
    }
  } else if (action === 'plan-next-month') {
    // Move a share of the unassigned leftover into a goal, as a Savings
    // transaction, so the dashboard, budgets and goals all recompute together.
    const gi = Number(btn.getAttribute('data-goal'));
    const goal = state.goals[gi];
    const planned = state.planned[state.month];
    if (!goal || !planned || planned[gi]) return;
    const t = totals(state);
    const left = t.left;
    if (left <= 0) return;
    let amount;
    if (gi === 0) amount = Math.round(left * 0.4 * 100) / 100;
    else if (gi === 2) amount = Math.round(left * 0.5 * 100) / 100;
    else amount = Math.round(left * 100) / 100;
    amount = Math.min(amount, Math.round((goal.target - goal.saved) * 100) / 100);
    if (!(amount > 0)) return;
    goal.saved = Math.round((goal.saved + amount) * 100) / 100;
    state.transactions.push({ date: state.month + '-27', merchant: nextMonthShort(state.month) + ' plan — ' + goal.name, category: 'Savings', amount, note: 'Planned from the leftover' });
    planned[gi] = true;
    state.started.goal = true;
    rerender();
  } else if (action === 'toggle-leak') {
    const merchant = btn.getAttribute('data-merchant');
    if (merchant) {
      state.leaks[merchant] = !state.leaks[merchant];
      if (!state.leaks[merchant]) delete state.leaks[merchant];
      rerender();
    }
  } else if (action === 'download-csv') {
    downloadCSV();
  }
});

window.addEventListener('hashchange', route);
route();
