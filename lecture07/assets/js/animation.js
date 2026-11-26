(function (root) {
  'use strict';
  function createCIAnimator(options) {
    const request = options.requestFrame || requestAnimationFrame;
    const cancel = options.cancelFrame || cancelAnimationFrame;
    let running = false, pending = null, frame = null, lastTime = null, generation = 0, speed = 1, single = false;
    const view = () => ({running, pending: !!pending, progress: pending?.progress ?? 1, single, speed});
    const notify = () => options.onState?.(view());
    const canContinue = () => !options.canContinue || options.canContinue();
    function begin() {
      pending = {sample: options.sample(), progress: 0};
      options.onStart?.(pending.sample); options.paint(pending.sample, 0); notify();
    }
    function finish() {
      const value = pending.sample;
      pending = null; options.commit(value); options.paint(value, 1); notify();
    }
    function pause() {
      running = false; generation++; lastTime = null;
      if (frame !== null) cancel(frame);
      frame = null; notify();
    }
    function schedule() {
      const ticket = generation;
      frame = request(time => {
        if (!running || ticket !== generation) return;
        frame = null;
        if (!pending) begin();
        const delta = lastTime === null ? 0 : Math.min(250, Math.max(0, time - lastTime));
        lastTime = time;
        pending.progress = Math.min(1, pending.progress + delta * speed / (options.duration || 2600));
        options.paint(pending.sample, pending.progress);
        if (pending.progress === 1) { finish(); if (single) pause(); }
        if (!canContinue()) pause();
        if (running) schedule();
      });
    }
    function start(one) {
      if (!canContinue()) return;
      single = one;
      if (running) { notify(); return; }
      running = true; lastTime = null;
      if (!pending) begin();
      notify(); schedule();
    }
    function finishPending() { pause(); if (pending) { finish(); return true; } return false; }
    function reset() { pause(); pending = null; notify(); }
    return {play: () => start(false), one: () => start(true), pause, reset, finishPending, view,
      setSpeed(value) { if (!(value > 0 && Number.isFinite(value))) throw new Error('Invalid speed.'); speed = value; notify(); }};
  }
  root.createCIAnimator = createCIAnimator;
  if (typeof module !== 'undefined') module.exports = createCIAnimator;
})(typeof globalThis !== 'undefined' ? globalThis : this);
