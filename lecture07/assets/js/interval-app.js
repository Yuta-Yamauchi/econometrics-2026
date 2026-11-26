(function(root){
  'use strict';
  const C=root.IntervalCore,P=root.IntervalPlots,$=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let n=100,level=95,pool=C.pool(n),count=1,selected=0,progress=0,running=null,timer=0,raf=0;
  const fmt=(x,d=3)=>x.toFixed(d).replace('-','−'),num=x=>x.toLocaleString('ja-JP');
  const pv=x=>{if(x>=.001)return fmt(x);const [m,e]=x.toExponential(2).split('e'),digits={'-':'⁻','+':'⁺','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};return `${m} × 10${[...e].map(d=>digits[d]).join('')}`;};
  const math=body=>`<math>${body}</math>`,bhat='<msub><mover><mi>β</mi><mo>^</mo></mover><mn>1</mn></msub>',b0='<msub><mi>b</mi><mn>0</mn></msub>',se=`<mi mathvariant="normal">se</mi><mo>(</mo>${bhat}<mo>)</mo>`;
  const sample=()=>C.sample(n,selected),records=()=>pool.results.slice(0,count);
  function buttons(){
    $('construction-play').textContent=running==='construction'?'一時停止':progress>=5?'もう一度見る':'候補を動かす';
    $('construction-prev').disabled=progress<=0;$('construction-next').disabled=progress>=5;
    $('coverage-play').textContent=running==='coverage'?'一時停止':'標本を取り直す';
    $('width-play').textContent=running==='width'?'一時停止':'変化を再生';
    for(const id of ['sample-next','coverage-step'])$(id).disabled=selected>=4999;
    for(const id of ['coverage-all','coverage-batch'])$(id).disabled=count>=5000;
  }
  function stop(){clearTimeout(timer);cancelAnimationFrame(raf);running=null;buttons();}
  function delay(ms,fn){timer=setTimeout(fn,ms/Number($('speed').value));}
  function renderConstruction(s=sample()){
    const state=C.sweep(s,level,progress),stage=Math.floor(progress),c=state.critical,alpha=100-level;
    P.candidateNull('null-distribution',state);P.candidateResults('candidate-results',s,state,$('candidate-view').value);
    $('construction-intro').textContent=`有意水準${alpha}%の両側検定では，自由度${n-2}の t 分布から臨界値 c = ${fmt(c)} を求める。|T(b₀)| がこの値を超える候補を棄却する。`;
    $('construction-fixed').innerHTML=`<span class="math">β̂₁ = ${fmt(s.slope)}</span><span class="math">se(β̂₁) = ${fmt(s.se)}</span>`;
    $('construction-step').textContent=`${stage+1} / 6 · 第${num(selected+1)}標本`;
    $('candidate').value=Math.round(Math.min(4,progress)*1000);$('candidate-value').textContent=fmt(state.candidate);
    $('candidate').setAttribute('aria-valuetext',`候補${fmt(state.candidate)}，t値${fmt(state.statistic)}，${state.rejected?'棄却する':'棄却しない'}`);
    $('candidate-test').textContent=state.complete?`|T(b₀)| ≤ ${fmt(c)} となる候補を棄却しない`:`T(b₀) = ${fmt(state.statistic)}，p = ${pv(state.p)}：${state.rejected?'棄却する':'棄却しない'}`;
    $('candidate-test').classList.toggle('rejected',!state.complete&&state.rejected);
    $('candidate-set').textContent=state.complete?`${level}%信頼区間 [${fmt(state.lower)}, ${fmt(state.upper)}]`:state.accepted?`ここまで残った範囲 [${fmt(state.accepted[0])}, ${fmt(state.accepted[1])}]`:'まだ棄却されない候補がない';
    const key=`${stage}:${n}:${level}:${selected}`;
    if($('construction-formula').dataset.key!==key){
      const condition=math(`<mo>|</mo><mi>T</mi><mo>(</mo>${b0}<mo>)</mo><mo>|</mo><mo>≤</mo><mi>c</mi>`);
      const lower=math(`${bhat}<mo>−</mo><mi>c</mi>${se}<mo>≤</mo>${b0}`),upper=math(`${b0}<mo>≤</mo>${bhat}<mo>+</mo><mi>c</mi>${se}`);
      $('construction-formula').innerHTML=state.complete?`<div class="formula-condition">${condition}</div><div class="formula-bounds">${lower}<span class="bounds-and">かつ</span>${upper}</div>`:math(`<mrow><mi>T</mi><mo>(</mo>${b0}<mo>)</mo></mrow><mo>=</mo><mfrac><mrow>${bhat}<mo>−</mo>${b0}</mrow><mrow>${se}</mrow></mfrac>`);
      $('construction-formula').dataset.key=key;
    }
    let caption;
    if(state.complete)caption=`棄却されない条件を b₀ について解くと，推定値の両側に ${fmt(c)} × 標準誤差の幅を取った範囲になる。この候補全体が${level}%信頼区間である。`;
    else if(state.rejected)caption=progress<1?'候補が推定値より小さく離れており，t値は右の棄却域に入る。この候補は区間に残らない。':'候補が推定値より大きく離れ，t値は左の棄却域に入る。ここから先の大きな候補は区間に残らない。';
    else if(Math.abs(progress-1)<1e-8)caption=`T(b₀) = ${fmt(c)} となる候補に到達した。これが棄却されない範囲の下限である。`;
    else if(Math.abs(progress-3)<1e-8)caption=`T(b₀) = −${fmt(c)} となる候補に到達した。これが棄却されない範囲の上限である。`;
    else if(Math.abs(progress-2)<1e-8)caption='候補が推定値に一致すると，t値は0，p値は1になる。この候補も棄却せず，区間に残す。';
    else caption='t値が左右の棄却域の間にある候補は棄却しない。その候補を右図の下に青で残していく。';
    $('construction-caption').textContent=caption;
    $('pvalue-explanation').textContent=`右図をp値に切り替えると，同じ範囲を p(b₀) ≥ ${fmt(alpha/100,2)} という条件で確認できる。推定値ではp値は1となり，区間の両端では${fmt(alpha/100,2)}となる。`;
    buttons();
  }
  function renderMain(){
    const s=sample(),c=C.critical(level,n),ci=C.interval(s,level),test=C.testCandidate(s,1.5,level),rs=records(),hits=rs.filter(r=>C.interval(r,level).covered).length;
    P.scatter('regression-scatter',s,$('deviation').value,pool.yDomain);
    $('sample-label').textContent=`第${num(selected+1)}標本 · n = ${n}`;
    $('fit-value').textContent=`OLS：Ŷ = ${fmt(s.intercept)} + ${fmt(s.slope)}X`;
    $('se-values').innerHTML=`<span>sᵤ = ${fmt(s.sd)}</span><span>Sₓₓ = ${fmt(s.sxx,2)}</span><span>自由度 ${n-2}</span><strong>se(β̂₁) = ${fmt(s.se)}</strong>`;
    $('two-tests-intro').textContent=`この標本で候補0と1.5を比べる。有意水準${100-level}%の両側検定では，|T(b₀)| > ${fmt(c)} なら棄却する。`;
    $('two-tests').innerHTML=[0,1.5].map(b=>{const t=C.testCandidate(s,b,level);return`<tr><td>${b}</td><td>${fmt(t.statistic)}</td><td>${pv(t.p)}</td><td class="${t.rejected?'rejected':'accepted'}">${t.rejected?'棄却する':'棄却しない'}</td></tr>`;}).join('');
    renderConstruction(s);
    P.history('test-history',rs,level,selected,pool.tDomain,'test');P.history('interval-history',rs,level,selected,pool.slopeDomain,'interval');
    $('selected-label').textContent=`第${num(selected+1)} / ${num(count)}標本`;
    $('selected-sample').max=count;$('selected-sample').value=selected+1;
    $('selected-sample').setAttribute('aria-valuetext',`第${selected+1}標本，${ci.covered?'真の傾きを含む':'真の傾きを含まない'}`);
    $('selected-test').textContent=`T(1.5) = ${fmt(test.statistic)}：${test.rejected?'棄却する':'棄却しない'}`;
    $('selected-interval').textContent=`${level}%信頼区間 [${fmt(ci.lower)}, ${fmt(ci.upper)}]`;
    for(const id of ['selected-test','selected-interval'])$(id).classList.toggle('rejected',!ci.covered);
    $('coverage-result').textContent=`真の傾きを含む：${num(hits)} / ${num(count)}回（${(100*hits/count).toFixed(1)}%）`;
    $('coverage-count').textContent=`棄却しなかった標本も ${num(hits)}回`;
    $('coverage-explanation').textContent=`この正規回帰モデルでは，真の傾きに対する検定統計量は自由度${n-2}の t 分布に従う。有意水準${100-level}%の検定で真の傾きを棄却する確率は${100-level}%なので，区間が真の傾きを含む確率は${level}%となる。上の割合は，今回生成した${num(count)}標本での結果である。`;
    $('coverage-definition').textContent=`標本 D から区間 C(D) を求める規則を，観測前に定める。真の傾きがどの値であっても，標本を取り直すときに Pr{β₁ ∈ C(D)} = ${fmt(level/100,2)} となる規則によって得られる区間が，傾きの${level}%信頼区間である。`;
    buttons();
  }
  const widthSettings={n:{min:1,max:4,step:1},noise:{min:1,max:2,step:.01},spread:{min:.4,max:2,step:.01},level:{min:0,max:2,step:1}};
  const widthActual=(mode,value)=>mode==='level'?[90,95,99][value]:value;
  function widthModels(){const mode=$('width-mode').value,value=Number($('width-value').value);return{mode,value,before:C.width(mode,widthActual(mode,widthSettings[mode].min)),after:C.width(mode,widthActual(mode,value))};}
  function renderWidth(){
    const {mode,value,before,after}=widthModels();
    P.width('width-before',before);P.width('width-after',after);
    for(const [id,s] of [['width-before-values',before],['width-after-values',after]])$(id).innerHTML=`<span>n = ${s.n}</span><span>sᵤ = ${fmt(s.sd)}</span><span>Sₓₓ = ${fmt(s.sxx,2)}</span><span>c = ${fmt(s.c)}</span><span>se = ${fmt(s.se)}</span><strong>区間幅 ${fmt(s.width)}</strong>`;
    $('width-label').textContent=mode==='n'?`標本サイズ ${after.n}`:mode==='noise'?`残差の標準偏差 ${fmt(after.sd,2)}`:mode==='spread'?`平均からの距離：基準の ${fmt(value/.4,2)}倍`:`信頼水準 ${after.level}%`;
    $('width-before-title').textContent=mode==='spread'?'狭い範囲の X':mode==='level'?'信頼水準90%':'比較の基準';
    $('width-after-title').textContent=mode==='level'?`信頼水準${after.level}%`:'条件を変えた標本';
    const copy={
      n:value===1?'sᵤ と1人当たりのばらつき Sₓₓ / n をそろえ，人数を100人から400人へ増やす。人数が4倍になると Sₓₓ も4倍になり，標準誤差は半分になる。':`sᵤ と1人当たりのばらつき Sₓₓ / n をそろえると，人数が${value}倍で Sₓₓ も${value}倍になる。標準誤差は元の 1 / √${value} となる。区間幅には，自由度による臨界値の変化も加わる。`,
      noise:value===1?'X と推定直線を固定し，残差のばらつきを広げる。残差を2倍にすると，sᵤ，標準誤差，区間幅も2倍になる。':`X と推定直線を保ち，残差を${fmt(value,2)}倍にする。sᵤ，標準誤差，区間幅がいずれも${fmt(value,2)}倍となる。`,
      spread:value===.4?'観測数と残差，傾き1.5を保ち，Xを横に広げる。平均からの距離を5倍にすると Sₓₓ は25倍となり，標準誤差と区間幅は元の1/5になる。':`観測数と残差，傾き1.5を保ち，平均からの距離を${fmt(value/.4,2)}倍にする。Sₓₓ はその二乗倍となり，標準誤差と区間幅は元の${fmt(.4/value,2)}倍となる。`,
      level:'同じ標本なので，推定値と標準誤差は変わらない。信頼水準を90%から95%，99%へ高めると臨界値が大きくなり，区間が広がる。'
    };$('width-explanation').textContent=copy[mode];buttons();
  }
  function configureWidth(){const mode=$('width-mode').value,s=widthSettings[mode];for(const key of ['min','max','step'])$('width-value')[key]=s[key];$('width-value').value=s.min;renderWidth();}
  function render(){renderMain();renderWidth();P.effects('effect-intervals',$('effect-full').checked);}
  function next(){if(selected>=4999)return false;selected++;count=Math.max(count,selected+1);$('coverage-message').textContent='';return true;}
  function constructionTick(){
    if(running!=='construction')return;
    const start=progress,target=Math.min(5,Math.floor(progress)+1),began=performance.now(),duration=(target-start)*1800/Number($('speed').value);
    function finish(){if(target===5){stop();renderConstruction();}else delay(1000,constructionTick);}
    function frame(now){if(running!=='construction')return;progress=Math.min(target,start+(target-start)*(now-began)/duration);renderConstruction();if(progress<target)raf=requestAnimationFrame(frame);else finish();}
    if(reduced.matches)delay(1500,()=>{progress=target;renderConstruction();finish();});else raf=requestAnimationFrame(frame);
  }
  function coverageTick(){if(running!=='coverage')return;if(!next()){stop();return;}renderMain();delay(1000,coverageTick);}
  function widthTick(){
    const mode=$('width-mode').value,s=widthSettings[mode],start=Number($('width-value').value),began=performance.now(),duration=6000/Number($('speed').value);
    function frame(now){if(running!=='width')return;const fraction=Math.min(1,(now-began)/duration),smooth=reduced.matches?Math.floor(fraction*4)/4:fraction;$('width-value').value=start+(s.max-start)*smooth;renderWidth();if(fraction<1)raf=requestAnimationFrame(frame);else stop();}raf=requestAnimationFrame(frame);
  }
  $('sample-next').addEventListener('click',()=>{stop();next();progress=0;renderMain();});
  $('sample-reset').addEventListener('click',()=>{stop();selected=0;progress=0;renderMain();});
  $('deviation').addEventListener('change',renderMain);
  $('sample-size').addEventListener('change',()=>{stop();n=Number($('sample-size').value);pool=C.pool(n);count=1;selected=0;progress=0;$('coverage-message').textContent='';renderMain();});
  $('confidence').addEventListener('change',()=>{stop();level=Number($('confidence').value);$('coverage-message').textContent='';renderMain();});
  $('candidate-view').addEventListener('change',()=>renderConstruction());
  $('construction-play').addEventListener('click',()=>{if(running==='construction'){stop();return;}stop();if(progress>=5)progress=0;running='construction';renderConstruction();constructionTick();});
  for(const [id,value] of [['construction-prev',()=>Math.max(0,Math.ceil(progress)-1)],['construction-next',()=>Math.min(5,Math.floor(progress)+1)],['construction-reset',()=>0]])$(id).addEventListener('click',()=>{stop();progress=value();renderConstruction();});
  $('candidate').addEventListener('input',()=>{stop();progress=Number($('candidate').value)/1000;renderConstruction();});
  $('coverage-step').addEventListener('click',()=>{stop();next();renderMain();});
  $('coverage-play').addEventListener('click',()=>{if(running==='coverage'){stop();return;}stop();if(selected===count-1&&count>1)selected=-1;running='coverage';buttons();coverageTick();});
  for(const [id,all] of [['coverage-batch',false],['coverage-all',true]])$(id).addEventListener('click',()=>{stop();count=all?5000:Math.min(5000,count+100);selected=count-1;$('coverage-message').textContent='';renderMain();});
  $('selected-sample').addEventListener('input',()=>{stop();selected=Number($('selected-sample').value)-1;$('coverage-message').textContent='';renderMain();});
  $('find-miss').addEventListener('click',()=>{stop();for(let k=1;k<=count;k++){const i=(selected+k)%count;if(!C.interval(pool.results[i],level).covered){selected=i;$('coverage-message').textContent='';renderMain();return;}}$('coverage-message').textContent=`現在の${num(count)}区間はすべて真の傾きを含む。100回追加すると，標本を増やして確認できる。`;});
  $('width-mode').addEventListener('change',()=>{stop();configureWidth();});
  $('width-value').addEventListener('input',()=>{stop();renderWidth();});
  $('width-reset').addEventListener('click',()=>{stop();configureWidth();});
  $('width-play').addEventListener('click',()=>{if(running==='width'){stop();return;}stop();const s=widthSettings[$('width-mode').value];if(Number($('width-value').value)>=s.max)$('width-value').value=s.min;running='width';buttons();widthTick();});
  $('effect-full').addEventListener('change',()=>P.effects('effect-intervals',$('effect-full').checked));
  $('effect-values').innerHTML=C.effects.map(s=>`<tr><td>${num(s.n)}</td><td>${fmt(s.se)}</td><td>${fmt(s.t,1)}</td><td>[${fmt(s.lower)}, ${fmt(s.upper)}]</td></tr>`).join('');
  document.addEventListener('keydown',e=>{if(e.key==='Escape')stop();});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});reduced.addEventListener('change',stop);
  const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.target.id===running&&!e.isIntersecting)stop();});for(const id of ['construction','coverage','width'])observer.observe($(id));
  let resize=0;window.addEventListener('resize',()=>{cancelAnimationFrame(resize);resize=requestAnimationFrame(render);});
  root.IntervalApp={snapshot:()=>({n,level,count,selected,progress,running,sample:sample(),candidate:C.sweep(sample(),level,progress),axes:{slope:pool.slopeDomain,t:pool.tDomain,y:pool.yDomain},width:widthModels()}),stop};
  configureWidth();render();document.fonts.ready.then(render);
})(globalThis);
