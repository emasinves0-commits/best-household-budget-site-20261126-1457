// Money and date formatting for HomeLedger. One job: turn numbers and
// ISO dates into the exact strings the views show. No network, no locale
// guessing: fixed en-US dollars and short month names.

export function fmtMoney(n) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return sign + '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtMoney0(n) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return sign + '$' + Math.round(abs).toLocaleString('en-US');
}

export function fmtDate(iso) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = iso.split('-');
  const day = Number(parts[2]);
  const month = months[Number(parts[1]) - 1];
  return month + ' ' + day;
}

export function fmtDateLong(iso) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const parts = iso.split('-');
  return months[Number(parts[1]) - 1] + ' ' + Number(parts[2]) + ', ' + parts[0];
}

export function pct(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}
