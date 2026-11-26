// HomeLedger shell: routing, state and wiring. One job: keep the page on
// screen, keep the household's edits on this device, and re-render when
// anything changes. State lives in localStorage; the seed comes from data.js.

import { BILLS, BUDGETS, GOALS, INCOME, TRANSACTIONS } from './data.js';
import { fmtMoney } from './format.js';
import { renderBills, renderBudgets, renderDashboard, renderGoals, renderReports, renderTransactions } from './views.js';

const STORE_KEY = 'homeledger-v1';

function seedState() {
  return {
    income: INCOME.map((r) => ({ ...r })),
    transactions: TRANSACTIONS.map((r) => ({ ...r })),
    budgets: BUDGETS.map((r) => ({ ...r })),
    bills: BILLS.map((r) => ({ ...r })),
    goals: GOALS.map((r) => ({ ...r })),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.bills)) return seedState();
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
  if (path === 'transactions') app.innerHTML = renderTransactions(state, txQuery);
  else if (path === 'budgets') app.innerHTML = renderBudgets(state);
  else if (path === 'bills') app.innerHTML = renderBills(state);
  else if (path === 'goals') app.innerHTML = renderGoals(state);
  else if (path === 'reports') app.innerHTML = renderReports(state);
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
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((x) => [x.date, esc(x.merchant), esc(x.category), x.amount.toFixed(2), esc(x.note || '')].join(','))
    .join('\n');
  const blob = new Blob([head + body + '\n'], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hartley-november-2026-transactions.csv';
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
  rerender();
  const note = document.createElement('p');
  note.textContent = 'Added ' + merchant + ' — ' + fmtMoney(amount) + ' to ' + category + '.';
  note.style.cssText = 'color:#2e7d32;font-weight:600';
  const form = document.getElementById('add-tx');
  if (form) form.after(note);
});

app.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  if (action === 'pay-bill') {
    const idx = Number(btn.getAttribute('data-index'));
    if (state.bills[idx]) {
      state.bills[idx].paid = true;
      rerender();
    }
  } else if (action === 'add-goal') {
    const idx = Number(btn.getAttribute('data-index'));
    const input = document.querySelector(`[data-goal-input="${idx}"]`);
    const amount = input ? Number(input.value) : 0;
    const goal = state.goals[idx];
    if (goal && amount > 0) {
      goal.saved = Math.min(goal.target, Math.round((goal.saved + amount) * 100) / 100);
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
  } else if (action === 'download-csv') {
    downloadCSV();
  }
});

window.addEventListener('hashchange', route);
route();
