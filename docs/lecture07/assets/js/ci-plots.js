(function (root) {
  'use strict';
  const C = {ink: '#182632', muted: '#52636f', blue: '#005a85', orange: '#be5827', green: '#28796a', line: '#dbe2e6', gray: '#8b9da8'};
  const font = "'Yu Gothic',Meiryo,sans-serif";
  const clamp = x => Math.max(0, Math.min(1, x));
  const fmt = (x, d = 2) => x.toFixed(d).replace(/^-0\.00$/, '0.00');
  function setup(canvas) {
    const box = canvas.getBoundingClientRect(), w = Math.max(240, box.width), h = Math.max(200, box.height);
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    return {ctx, w, h};
  }
  function text(ctx, value, x, y, color = C.muted, size = 11, align = 'center', weight = 400) {
    ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    const width = ctx.measureText(value).width, left = align === 'left' ? x : align === 'right' ? x - width : x - width / 2;
    ctx.fillStyle = '#fff'; ctx.fillRect(left - 2, y - size * .65, width + 4, size * 1.3);
    ctx.fillStyle = color; ctx.fillText(value, x, y);
  }
  function line(ctx, x1, y1, x2, y2, color = C.line, width = 1, dash = []) {
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
  }
  function dot(ctx, x, y, color = C.orange, radius = 4) { ctx.beginPath(); ctx.fillStyle = color; ctx.arc(x, y, radius, 0, 2 * Math.PI); ctx.fill(); }
  function ticks(min, max, target = 4) {
    const raw = (max - min) / target, power = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].find(v => v * power >= raw) * power, values = [];
    for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-8; v += step) values.push(Math.abs(v) < step * 1e-8 ? 0 : v);
    return values;
  }
  function horizontalAxis(ctx, scale, domain, y, label, width) {
    line(ctx, scale(domain[0]), y, scale(domain[1]), y, C.gray);
    for (const tick of ticks(...domain, width < 350 ? 3 : 5)) {
      const x = scale(tick); line(ctx, x, y, x, y + 5, C.gray);
      text(ctx, Number(tick.toFixed(3)).toString(), x, y + 18);
    }
    text(ctx, label, (scale(domain[0]) + scale(domain[1])) / 2, y + 39, C.muted, 11);
  }
  function range(intervals, kind, extra) {
    let lo = kind === 'mean' ? 30 : 0, hi = kind === 'mean' ? 70 : 3;
    const all = extra ? intervals.concat([extra]) : intervals;
    for (const v of all) { lo = Math.min(lo, v.lower); hi = Math.max(hi, v.upper); }
    const unit = kind === 'mean' ? 5 : .5;
    return [Math.floor(lo / unit) * unit, Math.ceil(hi / unit) * unit];
  }
  function intervalLine(ctx, lo, hi, y, color, width = 2, missed = false, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha;
    line(ctx, lo, y, hi, y, color, width, missed ? [4, 3] : []);
    line(ctx, lo, y - 5, lo, y + 5, color, width); line(ctx, hi, y - 5, hi, y + 5, color, width);
    ctx.restore();
  }
  function samplePlot(canvas, sample, progress) {
    const {ctx, w, h} = setup(canvas), {kind, n, y, truth, estimate} = sample;
    const shown = Math.round(n * clamp(progress / .34)), left = 38, right = w - 20, top = 30, base = h - 52;
    if (kind === 'mean') {
      const lo = Math.min(20, Math.floor(Math.min(...y) / 10) * 10), hi = Math.max(80, Math.ceil(Math.max(...y) / 10) * 10);
      const x = v => left + (v - lo) / (hi - lo) * (right - left), sy = i => top + i / Math.max(1, n - 1) * (base - top - 8);
      line(ctx, x(truth), top - 6, x(truth), base, C.blue, 1.2, [4, 4]);
      text(ctx, 'μ = 50', x(truth), 14, C.blue, 12);
      for (let i = 0; i < shown; i++) dot(ctx, x(y[i]), sy(i), '#8b9da8', n > 100 ? 2 : 3);
      if (progress >= .34) { line(ctx, x(estimate), top, x(estimate), base, C.orange, 2); dot(ctx, x(estimate), base, C.orange, 4); }
      text(ctx, '1', left - 14, top); text(ctx, String(n), left - 14, sy(n - 1)); text(ctx, 'i', left - 14, 13, C.muted, 12);
      horizontalAxis(ctx, x, [lo, hi], base, 'Yᵢ', w);
    } else {
      const lo = Math.min(-3, Math.floor(Math.min(...y))), hi = Math.max(12, Math.ceil(Math.max(...y)));
      const x = v => left + (v + .2) / 4.4 * (right - left), sy = v => base - (v - lo) / (hi - lo) * (base - top);
      for (const v of ticks(lo, hi)) { line(ctx, left, sy(v), right, sy(v), '#edf1f3'); text(ctx, String(v), left - 10, sy(v), C.muted, 10, 'right'); }
      line(ctx, x(0), sy(2), x(4), sy(8), C.blue, 1.5, [5, 4]);
      for (let i = 0; i < shown; i++) dot(ctx, x(sample.x[i]), sy(y[i]), '#8b9da8', n > 100 ? 2 : 2.8);
      if (progress >= .34) line(ctx, x(0), sy(sample.intercept), x(4), sy(sample.intercept + 4 * estimate), C.orange, 2.5);
      text(ctx, 'Y', left - 15, 14, C.muted, 12);
      horizontalAxis(ctx, x, [0, 4], base, 'X', w);
    }
  }
  function intervalPlot(canvas, value, progress, domain) {
    const {ctx, w, h} = setup(canvas), {sample, halfWidth, covered} = value;
    const left = 31, right = w - 23, base = h - 52, middle = h * .49, x = v => left + (v - domain[0]) / (domain[1] - domain[0]) * (right - left);
    const truthLabel = sample.kind === 'mean' ? 'μ = 50' : 'β₁ = 1.5', color = covered ? C.green : C.orange;
    line(ctx, x(sample.truth), 34, x(sample.truth), base, C.blue, 1.5);
    text(ctx, truthLabel, x(sample.truth), 15, C.blue, 12);
    const fraction = clamp((progress - .40) / .34);
    if (progress >= .34) {
      const lo = sample.estimate - halfWidth * fraction, hi = sample.estimate + halfWidth * fraction;
      if (fraction > 0) intervalLine(ctx, x(lo), x(hi), middle, color, 3, !covered);
      dot(ctx, x(sample.estimate), middle, C.orange, 5);
      text(ctx, sample.kind === 'mean' ? 'Ȳ' : 'β̂₁', x(sample.estimate), middle + 27, C.orange, 14);
      if (fraction >= 1) {
        text(ctx, fmt(value.lower, 2), x(lo) - 3, middle - 22, color, 12, x(lo) < 60 ? 'left' : 'right');
        text(ctx, fmt(value.upper, 2), x(hi) + 3, middle - 22, color, 12, x(hi) > w - 60 ? 'right' : 'left');
      }
    }
    horizontalAxis(ctx, x, domain, base, sample.kind === 'mean' ? 'μ' : 'β₁', w);
  }
  function historyPlot(canvas, intervals, selected, pending, progress, domain) {
    const {ctx, w, h} = setup(canvas), left = 35, right = w - 28, top = 38, base = h - 52;
    const data = pending && progress >= .8 ? intervals.concat([pending]) : intervals;
    const focus = pending && progress >= .8 ? data.length - 1 : selected;
    const end = Math.min(data.length, Math.max(30, focus + 16)), start = Math.max(0, end - 30);
    const visible = data.slice(start, end), truth = data[0]?.sample.truth ?? 50;
    const x = v => left + (v - domain[0]) / (domain[1] - domain[0]) * (right - left);
    const gap = (base - top - 7) / 30;
    text(ctx, truth === 50 ? 'μ = 50' : 'β₁ = 1.5', x(truth), 15, C.blue, 12);
    text(ctx, '回', left - 16, 15, C.muted, 11);
    visible.forEach((v, i) => {
      const y = top + (i + .5) * gap, index = start + i, active = index === focus, color = v.covered ? C.green : C.orange;
      if (active) { ctx.fillStyle = '#f0f4f6'; ctx.fillRect(left - 3, y - gap / 2, right - left + 6, gap); }
      const alpha = pending && index === intervals.length ? clamp((progress - .8) / .18) : active ? 1 : .67;
      ctx.save(); ctx.globalAlpha = alpha;
      line(ctx, x(v.lower), y, x(v.upper), y, color, active ? 2.6 : 1.6, v.covered ? [] : [3, 2]);
      dot(ctx, x(v.sample.estimate), y, C.orange, active ? 3 : 1.7);
      if (!v.covered) text(ctx, '×', right + 12, y, C.orange, 12);
      ctx.restore();
      if (active || ((index + 1) % 5 === 0 && Math.abs(index - focus) > 1) || (i === 0 && Math.abs(index - focus) > 1)) text(ctx, String(index + 1), left - 11, y, active ? C.orange : C.muted, 10, 'right');
    });
    line(ctx, x(truth), 30, x(truth), base, C.blue, 1);
    horizontalAxis(ctx, x, domain, base, truth === 50 ? 'μ' : 'β₁', w);
    return {start: start + 1, end, shown: visible.length};
  }
  root.CIPlots = {samplePlot, intervalPlot, historyPlot, range};
})(typeof globalThis !== 'undefined' ? globalThis : this);
