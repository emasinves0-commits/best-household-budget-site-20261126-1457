// SVG charts for HomeLedger, drawn by hand — no library, no network.
// One job: turn arrays of numbers into readable SVG strings.

export function donutSVG(parts, size, centreLabel) {
  // parts: [{ label, value, color }]. Returns an SVG donut with a centre total.
  const total = parts.reduce((s, p) => s + p.value, 0);
  const r = 70;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  let arcs = '';
  for (const p of parts) {
    if (p.value <= 0) continue;
    const frac = p.value / total;
    const len = frac * circ;
    arcs += `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${p.color}" stroke-width="34" stroke-dasharray="${len.toFixed(2)} ${(circ - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" />`;
    offset += len;
  }
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="Spending by category chart">` +
    `<circle cx="100" cy="100" r="${r}" fill="none" stroke="#e8e4da" stroke-width="34" />` +
    arcs +
    `<text x="100" y="96" text-anchor="middle" font-size="22" font-weight="700" fill="#1d2b23">` +
    '$' + Math.round(total).toLocaleString('en-US') + `</text>` +
    `<text x="100" y="118" text-anchor="middle" font-size="11" fill="#5c665e">${centreLabel || 'spent'}</text>` +
    `</svg>`;
}

export function barsSVG(series, width, height) {
  // series: [{ label, income, spent }]. Grouped bars, income vs spent.
  const max = Math.max(...series.map((s) => Math.max(s.income, s.spent))) * 1.08;
  const padL = 46;
  const padB = 26;
  const padT = 12;
  const plotW = width - padL - 8;
  const plotH = height - padT - padB;
  const n = series.length;
  const slot = plotW / n;
  const barW = Math.min(26, slot * 0.32);
  let out = `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="Income versus spending, last six months">`;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (plotH * i) / 4;
    const val = max * (1 - i / 4);
    out += `<line x1="${padL}" y1="${y}" x2="${width - 8}" y2="${y}" stroke="#e8e4da" stroke-width="1" />`;
    out += `<text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="#5c665e">$${Math.round(val / 1000)}k</text>`;
  }
  series.forEach((s, i) => {
    const cx = padL + slot * i + slot / 2;
    const ih = (s.income / max) * plotH;
    const sh = (s.spent / max) * plotH;
    out += `<rect x="${(cx - barW - 3).toFixed(1)}" y="${(padT + plotH - ih).toFixed(1)}" width="${barW}" height="${ih.toFixed(1)}" rx="3" fill="#1d4d3b" />`;
    out += `<rect x="${(cx + 3).toFixed(1)}" y="${(padT + plotH - sh).toFixed(1)}" width="${barW}" height="${sh.toFixed(1)}" rx="3" fill="#c98a2b" />`;
    out += `<text x="${cx.toFixed(1)}" y="${height - 8}" text-anchor="middle" font-size="11" fill="#3a443d">${s.label}</text>`;
  });
  out += `</svg>`;
  return out;
}

export function barRow(pctValue, color) {
  // A single horizontal progress bar, pctValue 0-100 (clamped for display).
  const shown = Math.max(0, Math.min(100, pctValue));
  return `<div class="bar"><div class="bar-fill" style="width:${shown.toFixed(1)}%;background:${color}"></div></div>`;
}
