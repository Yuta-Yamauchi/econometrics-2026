(function(root){
  'use strict';
  const C=root.InferenceCore,P=root.InferencePlots,$=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let experiment=new C.Experiment(),count=1,selected=0,level=.95,progress=0,running=null,timer=0,raf=0,phase=-1,busy=false,revision=0;
  let fixedSlopeDomain;
  function fixAxes(){experiment.ensure(5000);fixedSlopeDomain=P.slopeDomain(experiment.population,experiment.results,.99,true);}
  fixAxes();
  const format=x=>x.toFixed(3).replace('-','−'),integer=x=>x.toLocaleString('ja-JP'),percent=x=>(100*x).toFixed(1)+'%';
  const bhat='<msub><mover><mi>β</mi><mo>^</mo></mover><mn>1</mn></msub>',beta='<msub><mi>β</mi><mn>1</mn></msub>',se=`<mi mathvariant="normal">se</mi><mo>(</mo>${bhat}<mo>)</mo>`;
  const b0='<msub><mi>b</mi><mn>0</mn></msub>',stat=`<mrow><mi>T</mi><mo>(</mo>${b0}<mo>)</mo></mrow>`;
  const math=body=>`<math xmlns="http://www.w3.org/1998/Math/MathML">${body}</math>`;
  function records(){return experiment.results.slice(0,count);}
  function selectedSample(){return experiment.at(selected);}
  function buttons(){
    $('sampling-play').textContent=running==='sampling'?'一時停止':'再生';
    $('construction-play').textContent=running==='construction'?'一時停止':progress>=5?'もう一度見る':'候補を動かす';
    $('coverage-play').textContent=running==='coverage'?'一時停止':'区間を順に見る';
    for(const id of ['sampling-step','sampling-batch','sampling-all','sampling-play'])$(id).disabled=busy||count>=5000;
    $('construction-next').disabled=progress>=5;
    $('construction-prev').disabled=progress<=0;
    $('coverage-step').disabled=count>=5000&&selected>=count-1;
  }
  function stop(){clearTimeout(timer);cancelAnimationFrame(raf);running=null;phase=-1;buttons();for(const id of ['scatter-panel','slope-panel','z-panel'])$(id).classList.remove('active');}
  function active(index){phase=index;['scatter-panel','slope-panel','z-panel'].forEach((id,i)=>$(id).classList.toggle('active',i===index));}
  function renderConstruction(s=selectedSample()){
    const state=C.candidateSweep(s,level,progress),c=state.critical,stage=Math.min(5,Math.floor(progress));
    P.candidateNull('normal-range',state);P.candidateResults('constructed-interval',s,state);
    $('construction-step').textContent=`${stage+1} / 6 · 第${integer(selected+1)}標本`;
    $('construction-intro').textContent=`今回は標準正規分布による近似を使う。有意水準${Math.round((1-level)*100)}%の両側検定では，検定統計量の絶対値が${c.toFixed(3)}を超える候補を棄却する。`;
    $('construction-fixed').innerHTML=`<span class="math">β̂₁ = ${format(s.slope)}</span><span class="math">se(β̂₁) = ${format(s.se)}</span>`;
    $('candidate').value=Math.round(Math.min(4,progress)*1000);
    $('candidate-value').textContent=format(state.candidate);
    $('candidate').setAttribute('aria-valuetext',`候補 ${format(state.candidate)}，検定統計量 ${format(state.statistic)}，${state.rejected?'棄却する':'棄却しない'}`);
    $('candidate-test').textContent=state.complete?`|T(b₀)| ≤ ${c.toFixed(3)} となる候補を棄却しない`:`T(b₀) = ${format(state.statistic)}：${state.rejected?'棄却する':'棄却しない'}`;
    $('candidate-test').classList.toggle('rejected',!state.complete&&state.rejected);
    $('candidate-set').textContent=state.complete?`${Math.round(level*100)}%信頼区間 [${format(state.lower)}, ${format(state.upper)}]`:state.accepted?`ここまで残った範囲 [${format(state.accepted[0])}, ${format(state.accepted[1])}]`:'まだ棄却されない候補がない';
    const formulaKey=`${stage}:${selected}:${level}:${experiment.kind}:${experiment.n}`;
    if($('construction-formula').dataset.key!==formulaKey){
      const statisticFormula=math(`${stat}<mo>=</mo><mfrac><mrow>${bhat}<mo>−</mo>${b0}</mrow><mrow>${se}</mrow></mfrac>`);
      const condition=math(`<mo>|</mo>${stat}<mo>|</mo><mo>≤</mo><mn>${c.toFixed(3)}</mn>`);
      const lower=math(`${bhat}<mo>−</mo><mn>${c.toFixed(3)}</mn>${se}<mo>≤</mo>${b0}`),upper=math(`${b0}<mo>≤</mo>${bhat}<mo>+</mo><mn>${c.toFixed(3)}</mn>${se}`);
      $('construction-formula').innerHTML=state.complete?`<div class="formula-condition">${condition}</div><div class="formula-bounds">${lower}<span class="bounds-and">かつ</span>${upper}</div>`:statisticFormula;
      $('construction-formula').dataset.key=formulaKey;
    }
    // Describe the current candidate without assuming that an animation is at a checkpoint.
    let caption;
    if(state.complete)caption=`棄却されない条件を b₀ について解くと，推定値の両側に ${c.toFixed(3)} × 標準誤差の幅を取った範囲になる。この候補全体が${Math.round(level*100)}%信頼区間である。`;
    else if(state.rejected)caption=progress<1?'候補が推定値より小さく離れており，検定統計量は右の棄却域に入る。この候補は区間に残らない。':'候補が推定値より大きく離れ，検定統計量は左の棄却域に入る。ここから先の大きな候補は区間に残らない。';
    else if(Math.abs(progress-1)<1e-8)caption=`T(b₀) = ${c.toFixed(3)} となる候補に到達した。これが棄却されない範囲の下限である。`;
    else if(Math.abs(progress-3)<1e-8)caption=`T(b₀) = −${c.toFixed(3)} となる候補に到達した。これが棄却されない範囲の上限である。`;
    else if(Math.abs(progress-2)<1e-8)caption='候補が推定値に一致すると，検定統計量は0になる。この候補も棄却せず，区間に残す。';
    else caption='検定統計量が左右の棄却域の間にある候補は棄却しない。その候補を右図の下に青で残していく。';
    if($('construction-caption').textContent!==caption)$('construction-caption').textContent=caption;
    buttons();
  }
  function render(){
    const s=selectedSample(),pop=experiment.population,rs=records(),stats=C.summary(rs,level),ci=C.interval(s,level),critical=C.criticals[level];
    $('projection-equation').textContent=`L(x) = ${Number(pop.intercept.toFixed(3))} + ${Number(pop.slope.toFixed(3))}x`;
    $('sample-count').textContent=`${integer(count)}回`;
    $('sample-estimate').textContent=`第${integer(selected+1)}標本 · 傾き ${format(s.slope)}`;
    $('slope-summary').textContent=`母集団の傾き ${format(pop.slope)} · 推定値の平均 ${format(stats.mean)}`;
    $('z-value').textContent=`se = ${format(s.se)}　Z = ${format(s.z)}`;
    P.scatter('sample-scatter',s,pop);
    P.distribution('slope-distribution',rs.map(r=>r.slope),pop.slope,Math.sqrt(pop.variance/experiment.n),s.slope,{domain:fixedSlopeDomain});
    P.distribution('z-distribution',rs.map(r=>r.z),0,1,s.z,{isZ:true,critical});
    renderConstruction(s);
    P.scatter('interval-scatter',s,pop,ci);
    const window=P.history('interval-history',rs,pop,level,selected,fixedSlopeDomain);
    $('selected-interval').textContent=`${Math.round(level*100)}%信頼区間 [${format(ci.lower)}, ${format(ci.upper)}]`;
    $('history-window').textContent=`第${integer(window.start+1)}〜${integer(window.end)}標本`;
    $('selected-label').textContent=`第${integer(selected+1)} / ${integer(count)}標本`;
    $('selected-sample').max=count;$('selected-sample').value=selected+1;
    $('selected-sample').setAttribute('aria-valuetext',`第${selected+1}標本。区間 ${format(ci.lower)} から ${format(ci.upper)}。母集団の傾きを${ci.covered?'含む':'含まない'}。`);
    $('coverage-result').textContent=`母集団の傾きを含む：${integer(stats.covered)} / ${integer(count)}回（${percent(stats.rate)}）`;
    $('nominal-coverage').textContent=`設定した信頼水準 ${Math.round(level*100)}%`;
    $('coverage-explanation').textContent=`信頼水準${Math.round(level*100)}%は，標本を取り直して同じ手順で区間を作るときに，区間が母集団の傾きを含む確率に対応する。ここで使う正規近似では，標本が大きいときにこの確率が約${Math.round(level*100)}%になる。上の割合は，今回生成した${integer(count)}標本での結果である。`;
    buttons();
  }
  function delay(ms,fn){timer=setTimeout(fn,ms/Number($('speed').value));}
  function addOne(){if(count>=5000)return false;experiment.ensure(count+1);count++;selected=count-1;$('coverage-message').textContent='';return true;}
  function samplingTick(){
    if(running!=='sampling')return;
    if(!addOne()){stop();render();return;}
    render();active(0);
    if(reduced.matches){delay(1100,samplingTick);return;}
    delay(600,()=>{if(running!=='sampling')return;active(1);delay(600,()=>{if(running!=='sampling')return;active(2);delay(600,samplingTick);});});
  }
  function coverageTick(){
    if(running!=='coverage')return;
    if(selected<count-1)selected++;else if(!addOne()){stop();return;}
    render();delay(1100,coverageTick);
  }
  function constructionTick(){
    if(running!=='construction')return;
    const start=progress,target=Math.min(5,Math.floor(progress)+1),started=performance.now(),duration=(target-start)*1800/Number($('speed').value);
    function arrived(){if(target===5){stop();render();}else delay(1000,constructionTick);}
    function frame(now){if(running!=='construction')return;progress=Math.min(target,start+(target-start)*(now-started)/duration);renderConstruction();if(progress<target)raf=requestAnimationFrame(frame);else arrived();}
    if(reduced.matches)delay(1500,()=>{progress=target;renderConstruction();arrived();});
    else raf=requestAnimationFrame(frame);
  }
  async function batch(target){
    stop();const token=++revision;busy=true;buttons();$('sample-count').textContent='計算中…';
    while(count<target&&token===revision){const end=Math.min(target,count+100);experiment.ensure(end);count=end;await new Promise(resolve=>setTimeout(resolve,0));}
    if(token!==revision)return;busy=false;selected=count-1;$('coverage-message').textContent='';render();
  }
  function restart(){stop();revision++;busy=false;experiment=new C.Experiment($('population').value,Number($('sample-size').value));count=1;selected=0;progress=0;fixAxes();$('coverage-message').textContent='';render();}
  $('population').addEventListener('change',restart);$('sample-size').addEventListener('change',restart);
  $('confidence').addEventListener('change',()=>{stop();level=Number($('confidence').value);$('coverage-message').textContent='';render();});
  $('sampling-play').addEventListener('click',()=>{if(running==='sampling'){stop();return;}stop();running='sampling';buttons();samplingTick();});
  $('sampling-step').addEventListener('click',()=>{stop();addOne();render();});
  $('sampling-reset').addEventListener('click',restart);
  $('sampling-batch').addEventListener('click',()=>batch(Math.min(5000,count+100)));
  $('sampling-all').addEventListener('click',()=>batch(5000));
  $('construction-play').addEventListener('click',()=>{if(running==='construction'){stop();return;}stop();if(progress>=5)progress=0;running='construction';renderConstruction();constructionTick();});
  $('construction-next').addEventListener('click',()=>{stop();progress=Math.min(5,Math.floor(progress)+1);render();});
  $('construction-prev').addEventListener('click',()=>{stop();progress=Math.max(0,Math.ceil(progress)-1);render();});
  $('construction-reset').addEventListener('click',()=>{stop();progress=0;render();});
  $('candidate').addEventListener('input',()=>{stop();progress=Number($('candidate').value)/1000;renderConstruction();});
  $('coverage-play').addEventListener('click',()=>{if(running==='coverage'){stop();return;}stop();if(selected===count-1&&count>1)selected=-1;running='coverage';buttons();coverageTick();});
  $('coverage-step').addEventListener('click',()=>{stop();if(selected<count-1)selected++;else addOne();render();});
  $('selected-sample').addEventListener('input',()=>{stop();selected=Number($('selected-sample').value)-1;$('coverage-message').textContent='';render();});
  $('find-miss').addEventListener('click',()=>{
    stop();let index=-1;for(let i=1;i<=count;i++){const candidate=(selected+i)%count;if(!C.interval(experiment.results[candidate],level).covered){index=candidate;break;}}
    if(index>=0){selected=index;progress=5;$('coverage-message').textContent='';render();}
    else $('coverage-message').textContent=`現在の${integer(count)}区間はすべて母集団の傾きを含む。「100回追加」などで標本を増やせる。`;
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  reduced.addEventListener('change',stop);
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){const mode={sampling:'sampling',construction:'construction',coverage:'coverage'}[entry.target.id];if(running===mode&&!entry.isIntersecting)stop();}},{threshold:0});
  for(const id of ['sampling','construction','coverage'])observer.observe($(id));
  let resize=0;window.addEventListener('resize',()=>{cancelAnimationFrame(resize);resize=requestAnimationFrame(render);});
  root.InferenceApp={snapshot:()=>({kind:experiment.kind,n:experiment.n,level,count,selected,progress,running,busy,phase,axes:{scatterX:[0,10],scatterY:[40,240],slope:fixedSlopeDomain.slice()},sample:selectedSample(),candidate:C.candidateSweep(selectedSample(),level,progress),summary:C.summary(records(),level)}),stop};
  render();document.fonts.ready.then(render);
})(globalThis);
