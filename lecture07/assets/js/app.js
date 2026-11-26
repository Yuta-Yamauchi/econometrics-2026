(function () {
  'use strict';
  const core = window.CICore, plots = window.CIPlots, byId = id => document.getElementById(id);
  const fmt = (v, d = 3) => v.toFixed(d), controllers = [];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function pauseOthers(active) { controllers.forEach(c => { if (c !== active) c.pause(); }); }

  function simulation(kind) {
    const el = suffix => byId(`${kind}-${suffix}`), isMean = kind === 'mean';
    let n = Number(el('n').value), level = Number(el('level').value), method = isMean ? 'known' : 'estimated';
    let samples = [], intervals = [], selected = 0, displayed = null, shownProgress = 1;
    let animator, controller;
    function formula() {
      const df = isMean ? n - 1 : n - 2, known = isMean && method === 'known';
      const quantile = fmt((1 + level / 100) / 2);
      const critical = known ? `<msub><mi>z</mi><mn>${quantile}</mn></msub>` : `<msub><mi>t</mi><mrow><mn>${quantile}</mn><mo>,</mo><mn>${df}</mn></mrow></msub>`;
      if (isMean) {
        el('formula').innerHTML = `<math><mover><mi>Y</mi><mo>¯</mo></mover><mo>±</mo>${critical}<mfrac><mi>${known ? 'σ' : 's'}</mi><msqrt><mi>n</mi></msqrt></mfrac></math>`;
      } else el('formula').innerHTML = `<math><msub><mover><mi>β</mi><mo>^</mo></mover><mn>1</mn></msub><mo>±</mo>${critical}<mo>×</mo><mi mathvariant="normal">SE</mi><mo>(</mo><msub><mover><mi>β</mi><mo>^</mo></mover><mn>1</mn></msub><mo>)</mo></math>`;
    }
    function updateButtons(state = animator?.view() || {running: false}) {
      const full = samples.length >= 500;
      el('play').textContent = state.running ? '一時停止' : '再生';
      el('play').setAttribute('aria-pressed', String(state.running));
      el('play').disabled = full; el('step').disabled = full || state.running;
      el('batch').disabled = full; el('all').disabled = full;
      el('miss').disabled = !intervals.some(v => !v.covered);
    }
    function updateResults() {
      const result = core.coverage(intervals);
      el('count').textContent = result.total;
      el('coverage').textContent = result.total ? `${fmt(100 * result.fraction, 1)}%` : '—';
      el('fraction').textContent = `${result.hits} / ${result.total}`;
      el('inspect').max = Math.max(1, samples.length); el('inspect').value = selected + 1;
      el('trial-label').textContent = `${selected + 1}回目`;
      el('inspect').setAttribute('aria-valuetext', `${selected + 1}回目の標本`);
      el('inspect').disabled = samples.length <= 1;
      updateButtons();
    }
    function draw(sample, progress) {
      displayed = sample; shownProgress = progress;
      const p = reduced ? 1 : progress, value = core.interval(sample, level, method);
      const domain = plots.range(intervals, kind, value), pending = sample.index >= samples.length ? value : null;
      plots.samplePlot(el('sample'), sample, p);
      plots.intervalPlot(el('interval'), value, p, domain);
      const windowRange = plots.historyPlot(el('history'), intervals, selected, pending, p, domain);
      const stage = progress < .34 ? 0 : progress < .8 ? 1 : progress < 1 ? 2 : -1;
      for (let i = 0; i < 3; i++) el(`stage-${i}`).classList.toggle('active', !reduced && stage === i);
      el('estimate').textContent = p < .34 ? '—' : fmt(sample.estimate);
      el('interval-value').innerHTML = p < .34 ? '' : `<math><mn>${fmt(sample.estimate)}</mn><mo>±</mo><mn>${fmt(value.c)}</mn><mo>×</mo><mn>${fmt(value.se)}</mn></math>`;
      el('interval').setAttribute('aria-label', p < .74 ? `${sample.index + 1}回目の標本から，推定値の左右に誤差幅を加えて区間を作成中です。` : `${sample.index + 1}回目の${level}%信頼区間は${fmt(value.lower)}から${fmt(value.upper)}です。${value.covered ? '母数を含みます。' : '母数を含みません。'}`);
      const result = core.coverage(intervals);
      el('history').setAttribute('aria-label', `${windowRange.start}回目から${windowRange.end}回目までの区間。完成した全${result.total}区間のうち${result.hits}区間が母数を含みます。${pending && p >= .8 ? '最後の区間を作成中です。' : ''}`);
    }
    function append(sample) {
      samples.push(sample); intervals.push(core.interval(sample, level, method)); selected = samples.length - 1; updateResults();
    }
    animator = window.createCIAnimator({
      duration: reduced ? 700 : 2600,
      sample: () => core.sample(kind, n, samples.length),
      canContinue: () => samples.length < 500,
      onStart: () => { el('status').textContent = ''; },
      commit: append, paint: draw, onState: updateButtons
    });
    controller = {pause: () => animator.pause(), redraw: () => { if (displayed) draw(displayed, shownProgress); }};
    controllers.push(controller);
    function reset(message = '') {
      animator.reset(); samples = []; intervals = []; selected = 0;
      const first = core.sample(kind, n, 0); append(first); draw(first, 1); formula(); el('status').textContent = message;
    }
    function recompute() {
      animator.reset(); intervals = samples.map(s => core.interval(s, level, method));
      formula(); updateResults(); draw(samples[selected], 1);
      el('status').textContent = `${level}%信頼区間，${samples.length}回。`;
    }
    function inspect(index, message = '') {
      animator.reset(); selected = index; updateResults(); draw(samples[selected], 1); el('status').textContent = message;
    }
    function batch(target) {
      pauseOthers(controller); animator.finishPending();
      while (samples.length < target) { const s = core.sample(kind, n, samples.length); samples.push(s); intervals.push(core.interval(s, level, method)); }
      selected = samples.length - 1; updateResults(); draw(samples[selected], 1);
      el('status').textContent = `${samples.length}回。`;
    }
    el('play').addEventListener('click', () => { if (animator.view().running) animator.pause(); else { pauseOthers(controller); animator.play(); } });
    el('step').addEventListener('click', () => { pauseOthers(controller); animator.one(); });
    el('reset').addEventListener('click', () => reset('最初の標本に戻しました。'));
    el('speed').addEventListener('change', () => animator.setSpeed(Number(el('speed').value)));
    el('n').addEventListener('change', () => { n = Number(el('n').value); reset(`標本サイズを${n}に変更し，最初から始めました。`); });
    el('level').addEventListener('change', () => { level = Number(el('level').value); recompute(); });
    if (isMean) document.querySelectorAll('input[name="mean-method"]').forEach(radio => radio.addEventListener('change', () => { method = radio.value; recompute(); }));
    el('batch').addEventListener('click', () => batch(Math.min(500, samples.length + 100)));
    el('all').addEventListener('click', () => batch(500));
    el('inspect').addEventListener('input', () => inspect(Number(el('inspect').value) - 1));
    el('miss').addEventListener('click', () => {
      const indices = intervals.map((v, i) => v.covered ? -1 : i).filter(i => i >= 0);
      const next = indices.find(i => i > selected) ?? indices[0];
      if (next !== undefined) inspect(next, `${next + 1}回目，母数を含まない区間。`);
    });
    reset();
  }
  const standardization = window.CIStandardization.create({onPlay: () => pauseOthers(standardization)});
  controllers.push(standardization);
  const derivation = window.CIDerivation.create({onPlay: () => pauseOthers(derivation)});
  controllers.push(derivation);
  const parallel = window.CIParallel.create({onPlay: () => pauseOthers(parallel)});
  controllers.push(parallel);
  const estimated = window.CIEstimatedParallel.create({onPlay: () => pauseOthers(estimated)});
  controllers.push(estimated);
  const regressionWidth = window.CIRegressionWidth.create({onPlay: () => pauseOthers(regressionWidth)});
  controllers.push(regressionWidth);
  simulation('mean'); simulation('regression');
  let resizeFrame = null;
  window.addEventListener('resize', () => { if (resizeFrame !== null) cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => { resizeFrame = null; controllers.forEach(c => c.redraw()); }); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseOthers(null); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') pauseOthers(null); });
})();
