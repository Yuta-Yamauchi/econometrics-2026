(function (root) {
  'use strict';
  const reference = root.CIReference || (typeof require === 'function' ? require('./reference-data.js') : null);
  const meanSizes = [5, 25, 100, 400], regressionSizes = [10, 25, 100, 400];
  function random(seed) {
    let state = seed >>> 0;
    return function () {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function normalGenerator(seed) {
    const uniform = random(seed);
    let spare = null;
    return function () {
      if (spare !== null) { const value = spare; spare = null; return value; }
      const r = Math.sqrt(-2 * Math.log(1 - uniform())), angle = 2 * Math.PI * uniform();
      spare = r * Math.sin(angle);
      return r * Math.cos(angle);
    };
  }
  function moments(values) {
    const n = values.length;
    if (n < 2) throw new Error('At least two observations are required.');
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, y) => sum + (y - mean) ** 2, 0) / (n - 1);
    return {mean, variance, sd: Math.sqrt(variance)};
  }
  function ols(x, y) {
    if (x.length !== y.length || x.length < 3) throw new Error('Invalid regression data.');
    const n = x.length, mx = moments(x).mean, my = moments(y).mean;
    const sxx = x.reduce((sum, v) => sum + (v - mx) ** 2, 0);
    if (sxx === 0) throw new Error('X must vary.');
    const slope = x.reduce((sum, v, i) => sum + (v - mx) * (y[i] - my), 0) / sxx;
    const intercept = my - slope * mx;
    const sse = y.reduce((sum, v, i) => sum + (v - intercept - slope * x[i]) ** 2, 0);
    const variance = sse / (n - 2), sd = Math.sqrt(variance);
    return {slope, intercept, sxx, variance, sd, se: sd / Math.sqrt(sxx)};
  }
  function critical(level, df = null) {
    const value = df === null ? reference.z[level] : reference.t[df]?.[level];
    if (!Number.isFinite(value)) throw new Error('Unsupported confidence level or degrees of freedom.');
    return value;
  }
  function sample(kind, n, index) {
    const sizes = kind === 'mean' ? meanSizes : kind === 'regression' ? regressionSizes : [];
    if (!sizes.includes(n) || !Number.isInteger(index) || index < 0) throw new Error('Invalid sample settings.');
    // Each trial has its own deterministic seed. Cancelling an unfinished animation
    // therefore never skips a sample; changing the confidence level reuses the data.
    const seed = ((kind === 'mean' ? 20261106 : 20261107) ^ Math.imul(n, 2654435761) ^ Math.imul(index + 1, 1597334677)) >>> 0;
    const normal = normalGenerator(seed);
    if (kind === 'mean') {
      const y = index === 0 && n === 25 ? reference.meanY.slice() : Array.from({length: n}, () => 50 + 10 * normal());
      const m = moments(y);
      return {kind, n, index, y, estimate: m.mean, sd: m.sd, variance: m.variance, estimatedSE: m.sd / Math.sqrt(n), knownSE: 10 / Math.sqrt(n), truth: 50};
    }
    const x = index === 0 && n === 100 ? reference.regressionX.slice() : Array.from({length: n}, (_, i) => 4 * i / (n - 1));
    const y = index === 0 && n === 100 ? reference.regressionY.slice() : x.map(v => 2 + 1.5 * v + 1.5 * normal());
    const fit = ols(x, y);
    return {kind, n, index, x, y, estimate: fit.slope, intercept: fit.intercept, sd: fit.sd, variance: fit.variance, sxx: fit.sxx, estimatedSE: fit.se, truth: 1.5};
  }
  function interval(sample, level, method = 'estimated') {
    if (!['known', 'estimated'].includes(method)) throw new Error('Invalid interval method.');
    const known = sample.kind === 'mean' && method === 'known';
    const df = known ? null : sample.n - (sample.kind === 'mean' ? 1 : 2);
    const c = critical(level, df), se = known ? sample.knownSE : sample.estimatedSE;
    const halfWidth = c * se, lower = sample.estimate - halfWidth, upper = sample.estimate + halfWidth;
    return {sample, level, df, c, se, halfWidth, lower, upper, covered: lower <= sample.truth && sample.truth <= upper};
  }
  function coverage(intervals) {
    const hits = intervals.filter(v => v.covered).length, total = intervals.length;
    return {hits, total, fraction: total ? hits / total : null};
  }
  const api = {meanSizes, regressionSizes, random, normalGenerator, moments, ols, critical, sample, interval, coverage};
  root.CICore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
