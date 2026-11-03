(()=>{
  'use strict';
  const C=DemoCore,D=DEMO_DATA,$=id=>document.getElementById(id);C.configure(D);
  const blue='#005a85',orange='#be5827',ink='#182632',limit=D.repetitions;
  const state={design:'continuous',model:'skew',n:20,coef:'b1',standardized:true,trails:true,mode:'saved',serial:0};
  let current=null,records,history=[],progress=1,currentIndex=null,random,animator,scatterLimits,zoomLimits,pointCache=null;
  const lineCaches=new Map();
  const scenario=(n=state.n)=>D.scenarios[`${state.design}_${state.model}_${n}`];
  const design=(n=state.n)=>C.design(n,state.design);
  const truth=()=>D.parameters[state.coef==='b1'?'beta1':'beta0'];
  const sd=(n=state.n)=>design(n)[state.coef==='b1'?'sd1':'sd0'];
  const name=()=>state.coef==='b1'?'傾き':'切片';
  const fmt=(v,p=3)=>Number.isFinite(v)?v.toFixed(p).replace('-','−'):'—';
  const count=v=>v.toLocaleString('ja-JP');
  const values=(r,z=false,n=state.n)=>r[state.coef].map(v=>z?(v-truth())/sd(n):v);
  const pdf=(x,m,s)=>Math.exp(-.5*((x-m)/s)**2)/(s*Math.sqrt(2*Math.PI));
  const setStatus=s=>{$('status').textContent=s;};
  function clearDrawing(){
    history=[];pointCache=null;lineCaches.clear();progress=1;currentIndex=null;
    const p=D.parameters;scatterLimits=[p.beta0-4*p.sigma,p.beta0+p.beta1*design().max+4*p.sigma];
    zoomLimits=C.fittedRange(scenario(),design().max);
  }
  function include(sample){
    const lo=Math.floor(Math.min(...sample.y)),hi=Math.ceil(Math.max(...sample.y));
    if(lo<scatterLimits[0]||hi>scatterLimits[1]){scatterLimits=[Math.min(lo,scatterLimits[0]),Math.max(hi,scatterLimits[1])];pointCache=null;}
    for(const y of [sample.b0,sample.b0+sample.b1*design().max]){
      if(y<zoomLimits[0])zoomLimits[0]=y-.2;if(y>zoomLimits[1])zoomLimits[1]=y+.2;
    }
  }
  function remember(sample){history.push(sample);if(history.length>21)history.shift();pointCache=null;}
  function resetScenario(){
    animator?.reset();clearDrawing();const s=scenario();records={b0:s.b0.slice(),b1:s.b1.slice()};
    current={...s.examples[0],x:design().x};currentIndex=0;state.mode='saved';state.serial=0;
    random=C.rng(s.seed+50000);include(current);render();setStatus('500試行の結果を表示しています。');
  }
  function clearLive(){
    animator.reset();clearDrawing();records={b0:[],b1:[]};current=null;state.mode='live';state.serial=0;
    random=C.rng(scenario().seed+50000);render();
  }
  function commit(sample){records.b0.push(sample.b0);records.b1.push(sample.b1);currentIndex=records.b1.length-1;remember(sample);}
  function nextSample(){current=C.sample(state.model,state.n,random,state.design);state.serial++;progress=1;include(current);commit(current);}
  function ticks(min,max,target=4){
    const raw=(max-min)/target,p=10**Math.floor(Math.log10(raw||1)),u=raw/p,step=(u<=1?1:u<=2?2:u<=5?5:10)*p;
    const out=[];for(let v=Math.ceil(min/step)*step;v<=max+step*1e-6;v+=step)out.push(Math.abs(v)<step*1e-8?0:v);return out;
  }
  const tick=v=>Number(v.toFixed(2)).toString().replace('-','−');
  function frame(canvas,xlim,ylim,xlabel,ylabel,xticks){
    const rect=canvas.getBoundingClientRect(),width=rect.width,height=rect.height,ratio=window.devicePixelRatio||1;
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);
    const margin={l:39,r:11,t:24,b:45},w=width-margin.l-margin.r,h=height-margin.t-margin.b;
    const X=x=>margin.l+(x-xlim[0])/(xlim[1]-xlim[0])*w,Y=y=>margin.t+h-(y-ylim[0])/(ylim[1]-ylim[0])*h;
    ctx.font='12px "STIX Two Math",serif';ctx.fillStyle='#52636f';
    ticks(ylim[0],ylim[1]).forEach(y=>{ctx.strokeStyle='#e5eaed';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(margin.l,Y(y));ctx.lineTo(width-margin.r,Y(y));ctx.stroke();ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(tick(y),margin.l-7,Y(y));});
    (xticks||ticks(xlim[0],xlim[1])).forEach(x=>{ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(tick(x),X(x),margin.t+h+8);});
    ctx.strokeStyle='#8c9ca6';ctx.beginPath();ctx.moveTo(margin.l,margin.t);ctx.lineTo(margin.l,margin.t+h);ctx.lineTo(width-margin.r,margin.t+h);ctx.stroke();
    ctx.font='11px "Yu Gothic",Meiryo,sans-serif';ctx.fillStyle=ink;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(ylabel,2,2);ctx.textAlign='center';ctx.fillText(xlabel,margin.l+w/2,height-16);
    return{ctx,X,Y,width,height,margin,w,h};
  }
  function line(p,points,color,dashed=false,lw=2){
    const{ctx,X,Y}=p;ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.setLineDash(dashed?[5,3]:[]);ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(X(x),Y(y)):ctx.moveTo(X(x),Y(y)));ctx.stroke();ctx.setLineDash([]);
  }
  function pastLines(canvas,p,limits){
    if(!state.trails)return 0;const fits=C.fittedLines(records,currentIndex),xmax=design().max;
    const key=[canvas.width,canvas.height,records.b1.length,state.serial,currentIndex,...limits].join(':');let cache=lineCaches.get(canvas.id);
    if(!cache||cache.key!==key){
      const layer=document.createElement('canvas');layer.width=canvas.width;layer.height=canvas.height;
      const ctx=layer.getContext('2d');ctx.scale(window.devicePixelRatio||1,window.devicePixelRatio||1);
      const alpha=Math.max(.06,Math.min(.28,1.6/Math.sqrt(Math.max(1,fits.length))));
      for(const s of fits)line({...p,ctx},[[0,s.b0],[xmax,s.b0+s.b1*xmax]],`rgba(85,111,126,${alpha})`,false,1);
      cache={key,layer};lineCaches.set(canvas.id,cache);
    }
    p.ctx.drawImage(cache.layer,0,0,p.width,p.height);return fits.length;
  }
  function fitLine(p){
    const xmax=design().max;line(p,[[0,D.parameters.beta0],[xmax,D.parameters.beta0+D.parameters.beta1*xmax]],blue);
    if(current&&progress>.42){const end=xmax*Math.min(1,(progress-.42)/.33);line(p,[[0,current.b0],[end,current.b0+end*current.b1]],orange,true,2.5);}
  }
  function plottedX(sample,i){return sample.x[i]+(state.design==='binary'?.075*Math.sin((i+1)*2.39996):0);}
  function drawScatter(){
    const canvas=$('scatter'),xmax=design().max,p=frame(canvas,[-.13*xmax,1.13*xmax],scatterLimits,'説明変数','応答変数',state.design==='binary'?[0,1]:[0,1,2,3,4]);
    const past=state.trails?history.filter(s=>s!==current).slice(-20):[];
    if(past.length){
      const key=[canvas.width,canvas.height,past.length,state.serial,...scatterLimits].join(':');
      if(!pointCache||pointCache.key!==key){
        const layer=document.createElement('canvas');layer.width=canvas.width;layer.height=canvas.height;
        const ctx=layer.getContext('2d');ctx.scale(window.devicePixelRatio||1,window.devicePixelRatio||1);
        ctx.fillStyle=state.n===2000?'rgba(85,111,126,.018)':'rgba(85,111,126,.045)';
        for(const s of past)for(let i=0;i<s.x.length;i++){ctx.beginPath();ctx.arc(p.X(plottedX(s,i)),p.Y(s.y[i]),1.3,0,2*Math.PI);ctx.fill();}
        pointCache={key,layer};
      }
      p.ctx.drawImage(pointCache.layer,0,0,p.width,p.height);
    }
    pastLines(canvas,p,scatterLimits);fitLine(p);
    let shown=0;
    if(current){
      shown=Math.ceil(state.n*Math.min(1,progress/.42));p.ctx.fillStyle=state.n===2000?'rgba(190,88,39,.35)':orange;
      for(let k=0;k<shown;k++){const i=k*37%state.n;p.ctx.beginPath();p.ctx.arc(p.X(plottedX(current,i)),p.Y(current.y[i]),state.n===2000?1.5:3,0,2*Math.PI);p.ctx.fill();}
    }
    canvas.setAttribute('aria-label',`今回の${state.n}点のうち${shown}点を描画。${state.design==='binary'?'2群':'連続説明変数'}の散布図。`);
  }
  function drawZoom(){
    const canvas=$('regression-zoom'),xmax=design().max,p=frame(canvas,[-.08*xmax,1.08*xmax],zoomLimits,'説明変数','予測値（拡大）',state.design==='binary'?[0,1]:[0,1,2,3,4]);
    const past=pastLines(canvas,p,zoomLimits);fitLine(p);
    const visible=current&&progress>.42,drawn=past+(visible?1:0);
    if(current&&progress>=.75){p.ctx.fillStyle=orange;for(const x of [0,xmax]){p.ctx.beginPath();p.ctx.arc(p.X(x),p.Y(current.b0+current.b1*x),3.5,0,2*Math.PI);p.ctx.fill();}}
    $('line-count').textContent=`${drawn}本`;
    $('current-b1').textContent=current&&progress>=.75?fmt(current.b1):'—';$('current-b0').textContent=current&&progress>=.75?fmt(current.b0):'—';
    canvas.setAttribute('aria-label',`全${drawn}本の回帰直線。縦軸${fmt(zoomLimits[0],1)}から${fmt(zoomLimits[1],1)}。`);
  }
  function bounds(v,m,s,w){let max=4*s;for(const x of v)max=Math.max(max,Math.abs(x-m));const extent=(Math.ceil(max/w)+.5)*w;return[m-extent,m+extent];}
  function histogram(canvas,v,m,s,options={}){
    const width=options.width||s*.4,lim=options.xlim||bounds(v,m,s,width),hist=C.histogram(v,lim[0],lim[1],width);
    const ymax=options.ymax||Math.max(...hist.density,pdf(m,m,s))*1.1,p=frame(canvas,lim,[0,ymax],options.xlabel||name(),'密度');
    p.ctx.fillStyle='#b8c6cd';hist.density.forEach((h,i)=>{const x=p.X(hist.min+i*hist.width),w=p.X(hist.min+(i+1)*hist.width)-x;p.ctx.fillRect(x,p.Y(h),Math.max(.5,w-.6),p.Y(0)-p.Y(h));});
    line(p,Array.from({length:301},(_,i)=>{const x=lim[0]+i/300*(lim[1]-lim[0]);return[x,pdf(x,m,s)];}),blue);
    if(options.marker!==undefined){
      line(p,[[options.marker,0],[options.marker,ymax*.93]],orange,true,1.5);
      p.ctx.fillStyle=orange;p.ctx.beginPath();p.ctx.arc(p.X(options.marker),p.Y(ymax*.85*(1-(options.drop??1)))-4,4,0,2*Math.PI);p.ctx.fill();
    }
  }
  function drawSampling(){
    const v=values(records),stats=C.moments(v),marker=current&&progress>=.75?current[state.coef]:undefined;
    const lim=bounds([...scenario()[state.coef],...v,...(marker===undefined?[]:[marker])],truth(),sd(),sd()*.4);
    histogram($('sampling'),v,truth(),sd(),{xlim:lim,marker,drop:Math.min(1,Math.max(0,(progress-.75)/.25))});
    const label=`${count(v.length)} / ${count(limit)} 回`;if($('repetition-count').textContent!==label)$('repetition-count').textContent=label;
    $('estimate-mean').textContent=fmt(stats.mean);$('estimate-sd').textContent=fmt(stats.sd);
    $('phase-collect').querySelector('h3').textContent=`${name()}の分布`;
  }
  function drawComparison(){
    const ns=[20,200,2000],z=state.standardized,m=z?0:truth(),sds=ns.map(n=>z?1:sd(n));
    const all=ns.flatMap(n=>values(scenario(n),z,n)),width=z?.4:Math.min(...sds)*.5,lim=bounds(all,m,Math.max(...sds),width);
    const peaks=ns.flatMap(n=>C.histogram(values(scenario(n),z,n),lim[0],lim[1],width).density);
    const ymax=Math.max(...peaks,...sds.map(s=>pdf(m,m,s)))*1.1;
    ns.forEach((n,i)=>histogram($(`compare-${n}`),values(scenario(n),z,n),m,sds[i],{xlim:lim,width,ymax,xlabel:z?'標準化した係数':name()}));
  }
  function playback(){
    const view=animator?.view()||{running:false,pending:false},full=state.mode==='live'&&records?.b1.length>=limit;
    $('animation-play').textContent=view.running?'一時停止':view.pending?'再開':'再生';$('animation-play').setAttribute('aria-pressed',String(view.running));
    $('animation-play').disabled=full;$('animation-step').disabled=full;$('add-hundred').disabled=records?.b1.length>=limit;
    const phase=progress<.42?'points':progress<.75?'line':'collect';
    for(const part of ['points','line','collect'])$('phase-'+part).classList.toggle('active',state.mode==='live'&&!!current&&phase===part);
  }
  function render(){
    for(const model of ['normal','skew','strong'])$('error-'+model).hidden=state.model!==model;
    DemoPlots.errorShape($('error-shape'),state.model);
    drawScatter();drawZoom();drawSampling();drawComparison();playback();
  }
  animator=createTrialAnimator({sample:()=>C.sample(state.model,state.n,random,state.design),
    onStart:sample=>{current=sample;currentIndex=null;state.serial++;include(sample);},
    paint:(sample,p)=>{progress=p;drawScatter();drawZoom();drawSampling();playback();},commit,
    onState:playback,canContinue:()=>records.b1.length<limit});
  $('animation-play').addEventListener('click',()=>{if(animator.view().running){animator.pause();return;}if(state.mode==='saved')clearLive();window.dispatchEvent(new CustomEvent('demo-play',{detail:'regression'}));animator.play();});
  $('animation-step').addEventListener('click',()=>{if(state.mode==='saved')clearLive();animator.step();});
  $('animation-reset').addEventListener('click',()=>{clearLive();setStatus('試行をリセットしました。');});
  $('animation-speed').addEventListener('change',()=>animator.setSpeed(Number($('animation-speed').value)));
  $('show-trails').addEventListener('change',()=>{state.trails=$('show-trails').checked;drawScatter();drawZoom();});
  for(const key of ['design','model','coefficient'])document.querySelectorAll(`input[name="${key}"]`).forEach(el=>el.addEventListener('change',()=>{
    if(key==='coefficient'){state.coef=el.value;render();}else{state[key]=el.value;resetScenario();}
  }));
  $('sample-size').addEventListener('change',()=>{state.n=Number($('sample-size').value);resetScenario();});
  $('standardize').addEventListener('change',()=>{state.standardized=$('standardize').checked;drawComparison();});
  $('add-hundred').addEventListener('click',()=>{animator.pause();if(records.b1.length>=limit)return;const target=Math.min(limit,records.b1.length+100);
    state.mode='live';if(animator.view().pending)animator.step();while(records.b1.length<target)nextSample();render();});
  $('restore').addEventListener('click',resetScenario);
  window.addEventListener('demo-play',e=>{if(e.detail!=='regression')animator.pause();});
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{pointCache=null;lineCaches.clear();render();},100);});
  resetScenario();document.fonts.ready.then(render);
})();
