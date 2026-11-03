(function (root) {
  'use strict';
  // One pending sample is committed once, after its drawing has finished.
  function createTrialAnimator(options) {
    const request=options.requestFrame || requestAnimationFrame;
    const cancel=options.cancelFrame || cancelAnimationFrame;
    let running=false,pending=null,frameId=null,lastTime=null,generation=0,speed=1;
    const notify=()=>options.onState?.({running,progress:pending?.progress ?? 1,pending:!!pending});
    function begin() {
      pending={sample:options.sample(),progress:0};
      options.onStart(pending.sample);options.paint(pending.sample,0);notify();
    }
    function finish() {
      const sample=pending.sample;
      pending=null;options.commit(sample);options.paint(sample,1);notify();
    }
    function schedule() {
      const ticket=generation;
      frameId=request(time=>{
        if(!running || ticket!==generation)return;
        frameId=null;
        if(!pending)begin();
        const delta=lastTime===null?0:Math.min(250,Math.max(0,time-lastTime));
        lastTime=time;
        pending.progress=Math.min(1,pending.progress+delta*speed/(options.duration || 1800));
        options.paint(pending.sample,pending.progress);
        if(pending.progress===1)finish();
        if(options.canContinue && !options.canContinue())pause();
        if(running)schedule();
      });
    }
    function pause() {
      running=false;generation++;lastTime=null;
      if(frameId!==null)cancel(frameId);
      frameId=null;notify();
    }
    function play() {
      if(running || (options.canContinue && !options.canContinue()))return;
      running=true;lastTime=null;
      if(!pending)begin();
      notify();schedule();
    }
    function step() {
      pause();
      if(options.canContinue && !options.canContinue())return;
      if(!pending)begin();
      finish();
    }
    function reset() {pause();pending=null;notify();}
    return {play,pause,step,reset,setSpeed:value=>{speed=value;},
      view:()=>({running,pending:!!pending,progress:pending?.progress ?? 1})};
  }
  root.createTrialAnimator=createTrialAnimator;
  if(typeof module!=='undefined')module.exports=createTrialAnimator;
})(typeof globalThis!=='undefined'?globalThis:this);
