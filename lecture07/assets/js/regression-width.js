(function (root) {
  'use strict';
  const core = root.CICore || (typeof require === 'function' ? require('./ci-core.js') : null);
  // Match the slide's controlled comparison: reuse the first sample's residuals,
  // scale their residual standard deviation to 1.5, and keep the fitted line fixed.
  const original = core.sample('regression', 100, 0);
  const residuals = original.y.map((v, i) =>
    (v - original.intercept - original.estimate * original.x[i]) * 1.5 / original.sd);
  const baselineX = original.x.slice(), centerX = core.moments(baselineX).mean;
  const domains = {
    noise: {x: [-.25, 4.25], y: [-6, 15], slope: [.8, 2.2], ticks: [0, 1, 2, 3, 4]},
    spread: {x: [-2.5, 6.5], y: [-6, 15], slope: [.8, 2.2], ticks: [-2, 0, 2, 4, 6]}
  };
  function model(mode, factor) {
    if (!Object.hasOwn(domains, mode) || !Number.isFinite(factor) || factor < 1 || factor > 2) {
      throw new Error('Invalid slope-width comparison.');
    }
    const x = baselineX.map(v => mode === 'spread' ? centerX + factor * (v - centerX) : v);
    const e = residuals.map(v => v * (mode === 'noise' ? factor : 1));
    const y = x.map((v, i) => 2 + 1.5 * v + e[i]);
    const fit = core.ols(x, y), c = core.critical(95, 98), halfWidth = c * fit.se;
    return {mode, factor, n: 100, level: 95, x, y, residuals: e, ...fit,
      xbar: core.moments(x).mean, ybar: core.moments(y).mean, c, halfWidth,
      lower: fit.slope - halfWidth, upper: fit.slope + halfWidth,
      width: 2 * halfWidth, widthRatio: mode === 'noise' ? factor : 1 / factor,
      domain: domains[mode]};
  }
  function create(options = {}) {
    const el = suffix => document.getElementById(`width-${suffix}`);
    const C = {ink: '#182632', muted: '#52636f', blue: '#005a85', orange: '#be5827',
      grid: '#e3e9ed', point: '#899ca6'};
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fmt = (v, digits = 3) => v.toFixed(digits);
    let mode = 'noise', position = 0, player;
    const copy = {
      noise: {
        operation: '説明変数の位置を固定し，推定直線からの縦方向のずれを広げます。',
        heading: '縦方向のずれ',
        explanation: '点が直線の上下に広く散らばるほど，傾きの違いを見分けにくくなります。残差の標準偏差が2倍になると，標準誤差と区間幅も2倍になります。'
      },
      spread: {
        operation: '推定直線からの縦方向のずれを保ち，中心からの横の距離を広げます。',
        heading: '中心からの横の広がり',
        explanation: '横に広がるほど，同じ傾きの違いでも両端で生じる縦のずれが大きくなり，傾きの違いを見分けやすくなります。中心からの距離が2倍になると，標準誤差と区間幅は半分になります。'
      }
    };
    function text(ctx, value, x, y, color = C.muted, size = 12, align = 'center') {
      ctx.font = `${size}px 'Yu Gothic',Meiryo,sans-serif`;
      ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
      ctx.fillText(value, x, y);
    }
    function line(ctx, x1, y1, x2, y2, color, width = 1, dash = []) {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
    }
    function point(ctx, x, y, color, radius) {
      ctx.beginPath(); ctx.fillStyle = color; ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    }
    function draw(canvas, m) {
      const w = canvas.getBoundingClientRect().width, h = 400;
      if (w <= 0) return;
      const dpr = Math.min(3, devicePixelRatio || 1);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== h * dpr) {
        canvas.width = Math.round(w * dpr); canvas.height = h * dpr;
      }
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); ctx.lineCap = 'round';
      const left = 39, right = w - 15, top = 19, bottom = 247;
      const scale = domain => v => left + (v - domain[0]) / (domain[1] - domain[0]) * (right - left);
      const x = scale(m.domain.x), b = scale(m.domain.slope);
      const y = v => bottom - (v - m.domain.y[0]) / (m.domain.y[1] - m.domain.y[0]) * (bottom - top);
      for (const v of [-5, 0, 5, 10, 15]) {
        line(ctx, left, y(v), right, y(v), C.grid);
        text(ctx, String(v), left - 9, y(v), C.muted, 12, 'right');
      }
      line(ctx, left, top, left, bottom, C.muted);
      line(ctx, left, bottom, right, bottom, C.muted);
      for (const v of m.domain.ticks) {
        line(ctx, x(v), bottom, x(v), bottom + 4, C.muted);
        text(ctx, String(v), x(v), bottom + 17);
      }
      text(ctx, 'Y', left + 10, top + 11, C.ink, 14, 'left');
      text(ctx, '説明変数 X', (left + right) / 2, bottom + 40);
      m.x.forEach((v, i) => point(ctx, x(v), y(m.y[i]), C.point, w < 400 ? 2 : 2.5));
      const a = m.x[0], z = m.x[m.n - 1];
      for (const slope of [m.lower, m.upper]) {
        line(ctx, x(a), y(m.ybar + slope * (a - m.xbar)),
          x(z), y(m.ybar + slope * (z - m.xbar)), C.blue, 1.6, [6, 5]);
      }
      line(ctx, x(a), y(m.intercept + m.slope * a), x(z), y(m.intercept + m.slope * z), C.orange, 2.1);
      text(ctx, '傾きの95%信頼区間', (left + right) / 2, 311, C.ink, 14);
      line(ctx, b(m.lower), 338, b(m.upper), 338, C.blue, 3);
      for (const v of [m.lower, m.upper]) line(ctx, b(v), 332, b(v), 344, C.blue, 1.6);
      point(ctx, b(m.slope), 338, C.orange, 4);
      line(ctx, left, 361, right, 361, C.muted);
      for (const v of [1, 1.5, 2]) {
        line(ctx, b(v), 361, b(v), 365, C.muted);
        text(ctx, fmt(v, 1), b(v), 380);
      }
      canvas.setAttribute('aria-label', `${m.n}点の散布図。推定切片${fmt(m.intercept)}，傾き${fmt(m.slope)}。残差の標準偏差${fmt(m.sd)}，SXX ${fmt(m.sxx)}，標準誤差${fmt(m.se)}。傾きの95%信頼区間は${fmt(m.lower)}から${fmt(m.upper)}。`);
    }
    function render(p) {
      position = p;
      const factor = 1 + p / 2, baseline = model(mode, 1), current = model(mode, factor);
      for (const [key, m] of [['base', baseline], ['current', current]]) {
        draw(el(`${key}-plot`), m);
        el(`${key}-interval`).textContent = `[${fmt(m.lower)}，${fmt(m.upper)}]`;
        el(`${key}-sd`).textContent = fmt(m.sd);
        el(`${key}-sxx`).textContent = fmt(m.sxx, 2);
        el(`${key}-se`).textContent = fmt(m.se);
      }
      el('current-title').textContent = `${copy[mode].heading}：${fmt(factor, 2)}倍`;
      el('operation').textContent = copy[mode].operation;
      el('explanation').textContent = copy[mode].explanation;
      el('factor').textContent = `${fmt(factor, 2)}倍`;
      el('seek-label').textContent = `${copy[mode].heading}の倍率`;
      el('seek').value = fmt(factor, 3);
      el('seek').setAttribute('aria-valuetext', `基準の${fmt(factor, 2)}倍`);
      el('ratio').textContent = fmt(current.width / baseline.width, 2);
      el('status').textContent = `${copy[mode].heading}は${fmt(factor, 2)}倍。区間幅は基準の${fmt(current.widthRatio, 2)}倍です。`;
    }
    function buttons(state) {
      el('play').textContent = state.running ? '一時停止' : state.position >= 2 ? 'もう一度再生' : '再生';
      el('play').setAttribute('aria-pressed', String(state.running));
      el('back').disabled = state.position <= 0;
      el('next').disabled = state.running || state.position >= 2;
      // Announce the result after pausing or completing, without reading every frame.
      el('status').setAttribute('aria-live', state.running ? 'off' : 'polite');
    }
    player = root.CIDerivation.timeline({lastPosition: 2, duration: 3000, render,
      onState: buttons, onPlay: options.onPlay});
    const moveWithoutMotion = target => { options.onPlay?.(); player.seek(target); };
    el('play').addEventListener('click', () => {
      if (player.view().running) player.pause();
      else if (reduced) moveWithoutMotion(player.view().position >= 2 ? 0 : 2);
      else player.play();
    });
    el('next').addEventListener('click', () => {
      if (reduced) moveWithoutMotion(Math.min(2, Math.floor(position + 1e-9) + 1));
      else player.next();
    });
    el('back').addEventListener('click', () => player.back());
    el('reset').addEventListener('click', () => player.reset());
    el('speed').addEventListener('change', () => player.setSpeed(Number(el('speed').value)));
    el('seek').addEventListener('input', () => player.seek(2 * (Number(el('seek').value) - 1)));
    document.querySelectorAll('input[name="width-mode"]').forEach(input => {
      input.addEventListener('change', () => { mode = input.value; player.reset(); });
    });
    const controller = {pause: () => player.pause(), redraw: () => render(position),
      view: () => ({...player.view(), mode, factor: 1 + position / 2})};
    api.controller = controller;
    player.reset();
    document.fonts?.ready.then(() => render(position));
    return controller;
  }
  const api = {model, create};
  root.CIRegressionWidth = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
