(function (root) {
  'use strict';
  const core = root.CICore || (typeof require === 'function' ? require('./ci-core.js') : null);
  function model(n, level, index = 0) {
    const mean=core.sample('mean',n,index).estimate,anchor=core.sample('mean',n,0).estimate;
    const sigma=10,se=sigma/Math.sqrt(n),c=core.critical(level),halfWidth=c*se;
    // The construction receives observed statistics and known sigma, without the simulation truth.
    return {n,level,index,mean,anchor,sigma,se,c,halfWidth,lower:mean-halfWidth,upper:mean+halfWidth};
  }
  function timeline(options) {
    const request = options.requestFrame || requestAnimationFrame, cancel = options.cancelFrame || cancelAnimationFrame;
    const lastPosition=options.lastPosition??9;
    let position = 0, speed = 1, running = false, target = lastPosition, frame = null, last = null, generation = 0;
    let holding = false, holdElapsed = 0, singleStep = false;
    const view = () => ({position, running, speed, target, holding, holdElapsed});
    const repeat = () => !singleStep && Boolean(options.shouldRepeat?.());
    const notify = () => options.onState?.(view());
    function pause() { running = false; generation++; last = null; if (frame !== null) cancel(frame); frame = null; notify(); }
    function paint() { options.render(position); notify(); }
    function seek(value) { pause(); holding = false; holdElapsed = 0; position = Math.max(0, Math.min(lastPosition, value)); paint(); }
    function schedule() {
      const ticket = generation;
      frame = request(time => {
        if (!running || ticket !== generation) return;
        frame = null;
        const dt = last === null ? 0 : Math.min(250, Math.max(0, time - last)); last = time;
        if (holding) {
          if (!repeat()) { holding = false; holdElapsed = 0; pause(); return; }
          holdElapsed += dt * speed;
          if (holdElapsed >= (options.holdDuration ?? 2000)) {
            // Change the sample before painting the first frame of the next derivation.
            options.onAdvance?.();
            position = 0; target = lastPosition; holding = false; holdElapsed = 0; paint();
          }
          schedule(); return;
        }
        position = Math.min(target, position + dt * speed / (options.duration || 2200));
        paint();
        if (position >= target) {
          if (target === lastPosition && repeat()) { holding = true; holdElapsed = 0; notify(); schedule(); }
          else pause();
        } else schedule();
      });
    }
    function start(one) {
      pause();
      singleStep = one;
      if (one || !repeat()) { holding = false; holdElapsed = 0; }
      if (position >= lastPosition && !holding) { if (one) return; position = 0; paint(); }
      target = one ? Math.min(lastPosition, Math.floor(position + 1e-9) + 1) : lastPosition;
      options.onPlay?.(); running = true; notify(); schedule();
    }
    return {view, pause, seek, play: () => start(false), next: () => start(true),
      back: () => seek(Math.max(0, Math.ceil(position - 1e-9) - 1)), reset: () => seek(0),
      setSpeed(value) { if (!(Number.isFinite(value) && value > 0)) throw new Error('Invalid speed.'); speed = value; notify(); }};
  }
  function create(options = {}) {
    return root.CIDerivationView.create({...options, model, timeline});
  }
  const api={model,timeline,create};
  root.CIDerivation=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
