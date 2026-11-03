(()=>{
  'use strict';
  const C=DemoCore,D=DEMO_DATA,P=DemoPlots,$=id=>document.getElementById('mean-'+id),limit=D.repetitions;
  C.configure(D);
  const state={model:'skew',n:20,mode:'saved'};
  const truth=D.parameters.beta0,sd=()=>D.parameters.sigma/Math.sqrt(state.n);
  const scenario=()=>D.means[`${state.model}_${state.n}`];
  const fmt=v=>Number.isFinite(v)?v.toFixed(3).replace('-','−'):'—';
  let records=[],current=null,currentIndex=null,progress=1,random,animator,dataLimits,meanLimits;
  function resetLimits(){dataLimits=[truth-4*D.parameters.sigma,truth+4*D.parameters.sigma];meanLimits=P.bounds(scenario().values,truth,sd());}
  function include(sample){
    for(const v of sample.y){dataLimits[0]=Math.min(dataLimits[0],Math.floor(v));dataLimits[1]=Math.max(dataLimits[1],Math.ceil(v));}
    meanLimits[0]=Math.min(meanLimits[0],sample.mean-.1*sd());meanLimits[1]=Math.max(meanLimits[1],sample.mean+.1*sd());
  }
  function saved(){
    animator?.reset();resetLimits();records=scenario().values.slice();current=scenario().examples[0];currentIndex=0;progress=1;
    state.mode='saved';random=C.rng(scenario().seed+50000);include(current);render();
  }
  function clear(){
    animator.reset();resetLimits();records=[];current=null;currentIndex=null;progress=1;state.mode='live';random=C.rng(scenario().seed+50000);render();
  }
  function commit(sample){records.push(sample.mean);currentIndex=records.length-1;}
  function drawSample(){
    const p=P.frame($('sample'),[0,state.n+1],dataLimits,'観測の番号','観測値 Y'),visible=current&&progress>.42;
    for(let i=0;i<records.length;i++)if(i!==currentIndex)P.line(p,[[1,records[i]],[state.n,records[i]]],'rgba(85,111,126,.06)',false,1);
    P.line(p,[[1,truth],[state.n,truth]],P.blue);
    if(visible){const end=1+(state.n-1)*Math.min(1,(progress-.42)/.33);P.line(p,[[1,current.mean],[end,current.mean]],P.orange,true,2.5);}
    const shown=current?Math.ceil(state.n*Math.min(1,progress/.42)):0;
    for(let k=0;k<shown;k++){const i=k*37%state.n;P.dot(p,i+1,current.y[i],state.n===2000?'rgba(190,88,39,.4)':P.orange,state.n===2000?1.5:3);}
    $('sample').setAttribute('aria-label',`今回の${state.n}点のうち${shown}点を描画。観測値と標本平均。`);
  }
  function drawRecord(){
    const pending=currentIndex===null&&current, xmax=Math.max(20,Math.ceil((records.length+(pending?1:0))/25)*25);
    const p=P.frame($('record'),[0,xmax+1],meanLimits,'試行','標本平均');
    P.line(p,[[0,truth],[xmax+1,truth]],P.blue);
    for(let i=0;i<records.length;i++)if(i!==currentIndex)P.dot(p,i+1,records[i],'rgba(85,111,126,.5)',2.3);
    const visible=current&&progress>=.42;
    if(visible){const x=(currentIndex??records.length)+1;P.dot(p,x,current.mean,P.orange,4);}
    $('value').textContent=current&&progress>=.75?fmt(current.mean):'—';
    $('record').setAttribute('aria-label',`${records.length+(pending&&visible?1:0)}試行の標本平均を記録。`);
  }
  function drawDistribution(){
    const marker=current&&progress>=.75?current.mean:undefined;
    P.histogram($('sampling'),records,truth,sd(),{xlim:meanLimits,marker,drop:Math.min(1,Math.max(0,(progress-.75)/.25))});
    const m=C.moments(records);$('estimate-mean').textContent=fmt(m.mean);$('estimate-sd').textContent=fmt(m.sd);
    $('count').textContent=`${records.length} / ${limit} 回`;
    $('sampling').setAttribute('aria-label',`${records.length}試行の標本平均の分布。正規密度は平均2，標準偏差${fmt(sd())}。`);
  }
  function playback(){
    const view=animator?.view()||{running:false,pending:false},full=state.mode==='live'&&records.length>=limit;
    $('play').textContent=view.running?'一時停止':view.pending?'再開':'再生';$('play').setAttribute('aria-pressed',String(view.running));
    $('play').disabled=full;$('step').disabled=full;$('add-hundred').disabled=records.length>=limit;
    const phase=progress<.42?'points':progress<.75?'average':'collect';
    for(const part of ['points','average','collect'])$('phase-'+part).classList.toggle('active',state.mode==='live'&&!!current&&phase===part);
  }
  function paint(){drawSample();drawRecord();drawDistribution();playback();}
  function render(){
    for(const model of ['normal','skew','strong'])$('error-'+model).hidden=state.model!==model;
    P.errorShape($('error-shape'),state.model);paint();
  }
  animator=createTrialAnimator({sample:()=>C.meanSample(state.model,state.n,random),
    onStart:sample=>{current=sample;currentIndex=null;include(sample);},
    paint:(sample,p)=>{progress=p;paint();},commit,onState:playback,canContinue:()=>records.length<limit});
  $('play').addEventListener('click',()=>{if(animator.view().running){animator.pause();return;}if(state.mode==='saved')clear();window.dispatchEvent(new CustomEvent('demo-play',{detail:'mean'}));animator.play();});
  $('step').addEventListener('click',()=>{if(state.mode==='saved')clear();animator.step();});
  $('reset').addEventListener('click',clear);
  $('speed').addEventListener('change',()=>animator.setSpeed(Number($('speed').value)));
  $('size').addEventListener('change',()=>{state.n=Number($('size').value);saved();});
  document.querySelectorAll('input[name="mean-model"]').forEach(el=>el.addEventListener('change',()=>{state.model=el.value;saved();}));
  $('add-hundred').addEventListener('click',()=>{
    animator.pause();if(records.length>=limit)return;const target=Math.min(limit,records.length+100);state.mode='live';
    if(animator.view().pending)animator.step();
    while(records.length<target){current=C.meanSample(state.model,state.n,random);include(current);progress=1;commit(current);}paint();
  });
  $('restore').addEventListener('click',saved);
  window.addEventListener('demo-play',e=>{if(e.detail!=='mean')animator.pause();});
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(render,100);});
  saved();document.fonts.ready.then(render);
})();
