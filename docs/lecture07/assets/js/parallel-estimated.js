(function(root){
  'use strict';
  const core=root.CICore||(typeof require==='function'?require('./ci-core.js'):null);
  const motion=root.CIDerivationMotion||(typeof require==='function'?require('./derivation-motion.js'):null);
  const {ease,mix}=motion,LAST=4,TOTAL=500;
  function model(n,level,count=6,group=0){
    if(![3,6,10].includes(count)||!Number.isInteger(group)||group<0||group>=Math.ceil(TOTAL/count))throw new Error('Invalid sample group.');
    const start=group*count,sd=10/Math.sqrt(n),c=core.critical(level),t=core.critical(level,n-1),knownHalfWidth=c*sd;
    const rows=Array.from({length:Math.min(count,TOTAL-start)},(_,i)=>{
      const sample=core.sample('mean',n,start+i),ci=core.interval(sample,level,'estimated');
      return {index:start+i,values:sample.y,mean:sample.estimate,sampleSD:sample.sd,se:sample.estimatedSE,
        knownLower:sample.estimate-knownHalfWidth,knownUpper:sample.estimate+knownHalfWidth,
        halfWidth:ci.halfWidth,lower:ci.lower,upper:ci.upper};
    });
    const anchor=core.sample('mean',n,0).estimate;
    const radius=Math.max(8,4*knownHalfWidth,...rows.map(r=>Math.abs(r.mean-anchor)+Math.max(knownHalfWidth,r.halfWidth)+4));
    let lo=0,hi=100;
    for(const row of rows)for(const value of row.values){lo=Math.min(lo,Math.floor(value/10)*10);hi=Math.max(hi,Math.ceil(value/10)*10);}
    return {n,level,count,group,start,groups:Math.ceil(TOTAL/count),sd,c,t,knownHalfWidth,rows,
      rawDomain:[lo,hi],intervalDomain:[anchor-radius,anchor+radius]};
  }
  function frame(m,p){
    const collapse=ease(p),extend=ease(p-1),estimate=ease(p-2),replace=ease(p-3);
    return {collapse,extend,estimate,replace,domain:m.rawDomain.map((v,i)=>mix(v,m.intervalDomain[i],collapse)),
      rows:m.rows.map(r=>{
        const halfWidth=extend*mix(m.knownHalfWidth,r.halfWidth,replace);
        return {...r,points:r.values.map(v=>mix(v,r.mean,collapse)),currentHalfWidth:halfWidth,
          currentLower:r.mean-halfWidth,currentUpper:r.mean+halfWidth};
      })};
  }
  function create(options={}){
    const el=name=>document.getElementById(`estimated-${name}`),fmt=(v,d=3)=>v.toFixed(d);
    const C={ink:'#182632',muted:'#52636f',blue:'#005a85',orange:'#be5827',green:'#28796a',line:'#dbe2e6',gray:'#889ba6'};
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let group=0,position=0,current,player;
    function rebuild(){current=model(Number(el('n').value),Number(el('level').value),Number(el('size').value),group);updateFormulas();}
    function updateFormulas(){
      const m=current,probability=((1+m.level/100)/2).toFixed(3);
      el('known-c').textContent=fmt(m.c);el('known-sd').textContent=fmt(m.sd);el('known-width').textContent=fmt(m.knownHalfWidth);
      el('t').textContent=fmt(m.t);el('probability').textContent=probability;el('df').textContent=m.n-1;
    }
    function text(ctx,value,x,y,color=C.muted,size=12,align='center'){
      ctx.font=`${size}px 'STIX Two Math','Yu Gothic',Meiryo,serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(value,x,y);
    }
    function line(ctx,x1,y1,x2,y2,color=C.line,width=1,dash=[]){
      ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
    }
    function dot(ctx,x,y,color,r){ctx.beginPath();ctx.fillStyle=color;ctx.arc(x,y,r,0,2*Math.PI);ctx.fill();}
    function bounds(ctx,x,lower,upper,y,color,width=2,dash=[],tick=6){
      line(ctx,x(lower),y,x(upper),y,color,width,dash);
      for(const v of [lower,upper])line(ctx,x(v),y-tick,x(v),y+tick,color,1.5);
    }
    function render(p){
      position=p;
      const m=current,f=frame(m,p),canvas=el('plot'),w=canvas.getBoundingClientRect().width,compact=w<700;
      const rowHeight=compact?98:76,height=112+rowHeight*m.rows.length;
      canvas.style.height=`${height}px`;
      const dpr=Math.min(3,window.devicePixelRatio||1);
      if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(height*dpr);}
      const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,height);ctx.lineCap='round';
      const left=compact?35:52,right=w-(compact?18:292),base=height-49;
      const x=v=>left+(v-f.domain[0])/(f.domain[1]-f.domain[0])*(right-left);
      const columns=[w-224,w-132,w-43],showTruth=el('truth').checked;
      line(ctx,left,base,right,base);
      const raw=(f.domain[1]-f.domain[0])/Math.max(4,Math.floor((right-left)/80)),power=10**Math.floor(Math.log10(raw));
      const step=[1,2,2.5,5,10].find(v=>v*power>=raw)*power;
      for(let v=Math.ceil(f.domain[0]/step)*step;v<=f.domain[1];v+=step){line(ctx,x(v),base,x(v),base+5);text(ctx,Number(v.toFixed(2)).toString(),x(v),base+20);}
      text(ctx,'得点（点）',(left+right)/2,base+42,C.muted,12);
      if(showTruth){line(ctx,x(50),31,x(50),base,C.blue,1.3,[4,4]);text(ctx,'μ = 50',x(50),16,C.blue,14);}
      const moving=f.replace>0&&f.replace<1;
      if(!compact){
        text(ctx,'標本',19,17,C.muted,12);
        text(ctx,'sY',columns[0],17);text(ctx,'標準誤差',columns[1],17);text(ctx,moving?'半幅（移動中）':'半幅',columns[2],17,C.muted,11);
        line(ctx,right+23,34,right+23,base,C.line);
      }
      f.rows.forEach((r,i)=>{
        const y=58+i*rowHeight;
        text(ctx,String(r.index+1),compact?12:19,y,C.muted,12);
        if(f.collapse<1){
          ctx.save();ctx.globalAlpha=1-.8*f.collapse;
          r.points.forEach((value,j)=>dot(ctx,x(value),y+(((j*7)%13)-6)*1.7*(1-f.collapse),C.gray,m.n>100?1.6:2.5));ctx.restore();
        }
        if(el('reference').checked&&f.replace>0){
          ctx.save();ctx.globalAlpha=f.replace;
          bounds(ctx,x,r.knownLower,r.knownUpper,y,C.gray,1.6,[4,4],10);ctx.restore();
        }
        if(f.extend>0){
          const complete=p>=LAST,covered=r.lower<=50&&50<=r.upper;
          const color=showTruth&&complete?(covered?C.green:C.orange):(f.replace>0?C.orange:C.blue);
          bounds(ctx,x,r.currentLower,r.currentUpper,y,color,2.5,showTruth&&complete&&!covered?[5,3]:[]);
          if(f.extend===1){
            const close=x(r.currentUpper)-x(r.currentLower)<44;
            text(ctx,fmt(r.currentLower,2),x(r.currentLower)-(close?3:0),y-20,color,compact?11:12,close?'right':'center');
            text(ctx,fmt(r.currentUpper,2),x(r.currentUpper)+(close?3:0),y-20,color,compact?11:12,close?'left':'center');
            if(showTruth&&complete&&!covered)text(ctx,'×',right+11,y,C.orange,16);
          }
        }
        if(f.collapse>0){ctx.save();ctx.globalAlpha=f.collapse;dot(ctx,x(r.mean),y,C.orange,4.5);text(ctx,fmt(r.mean,2),x(r.mean),y+20,C.orange,12);ctx.restore();}
        if(compact){
          if(f.estimate>0){ctx.save();ctx.globalAlpha=f.estimate;text(ctx,`sY = ${fmt(r.sampleSD,2)}　se = ${fmt(r.se)}　半幅 = ${fmt(r.currentHalfWidth)}`,(left+right)/2,y+43,C.ink,11);ctx.restore();}
          else if(f.extend===1)text(ctx,`σ / √n = ${fmt(m.sd)}　半幅 = ${fmt(m.knownHalfWidth)}`,(left+right)/2,y+43,C.blue,11);
        }else{
          for(const [j,v]of[[0,r.sampleSD],[1,r.se]]){
            ctx.save();ctx.globalAlpha=f.estimate;
            text(ctx,fmt(v,j===0?2:3),columns[j],y,C.ink,13);ctx.restore();
          }
          if(f.estimate===0)for(const j of [0,1])text(ctx,'—',columns[j],y,C.gray,12);
          text(ctx,f.extend>0?fmt(r.currentHalfWidth):'—',columns[2],y,f.replace>0?C.orange:C.blue,13);
        }
      });
      const stage=Math.min(LAST,Math.ceil(p-1e-8));
      const phases=['標本','標本平均へ集約','母標準偏差 σ で計算した共通の幅','各標本の標準誤差を計算','標準誤差を使って区間幅を取り直す'];
      el('phase').textContent=phases[stage];el('position').textContent=stage+1;
      el('seek').value=String(p);el('seek').setAttribute('aria-valuetext',phases[stage]);
      el('group').textContent=`標本 ${m.start+1}–${m.start+m.rows.length}`;
      el('group-back').disabled=group===0;el('group-next').disabled=group===m.groups-1;
      el('known-formula').classList.toggle('active',p<=3);el('estimated-formula').classList.toggle('active',p>3);
      el('operation').textContent=[
        '同じ母集団から取り出した複数の標本を並べます。',
        '各標本の観測値を，その標本の平均へ集約します。',
        `σ = 10 を使うと，どの標本でも半幅は ${fmt(m.knownHalfWidth)} になります。`,
        '各標本から sY を求め，標準誤差 se(Ȳ) = sY / √n を計算します。',
        `中心を固定し，半幅を ${fmt(m.t)} × se(Ȳ) に取り直します。標準誤差に応じて，区間が広がる標本も狭まる標本もあります。`
      ][stage];
      canvas.setAttribute('aria-label',`${m.rows.length}標本。${phases[stage]}。`+f.rows.map(r=>
        `標本${r.index+1}：平均${fmt(r.mean)}，標準誤差${fmt(r.se)}，現在の半幅${fmt(r.currentHalfWidth)}，端点${fmt(r.currentLower)}から${fmt(r.currentUpper)}`).join('。'));
    }
    function buttons(state){
      el('play').textContent=state.running?'一時停止':'再生';el('play').setAttribute('aria-pressed',String(state.running));
      el('back').disabled=state.position<=0;el('next').disabled=state.position>=LAST;
      if(!state.running)el('status').textContent=el('phase').textContent;
    }
    rebuild();if(reduced)el('repeat').checked=false;
    player=root.CIDerivation.timeline({lastPosition:LAST,duration:2400,holdDuration:2000,render,onState:buttons,onPlay:options.onPlay,
      shouldRepeat:()=>el('repeat').checked&&!reduced,onAdvance:()=>{group=(group+1)%current.groups;rebuild();}});
    player.reset();
    el('play').addEventListener('click',()=>{
      if(reduced){options.onPlay?.();player.seek(position>=LAST?0:LAST);}
      else if(player.view().running)player.pause();else player.play();
    });
    el('next').addEventListener('click',()=>{
      if(reduced){options.onPlay?.();player.seek(Math.min(LAST,Math.floor(position+1e-9)+1));}else player.next();
    });
    el('back').addEventListener('click',()=>player.back());
    el('reset').addEventListener('click',()=>{player.pause();group=0;rebuild();player.reset();});
    el('seek').addEventListener('input',()=>player.seek(Number(el('seek').value)));
    el('speed').addEventListener('change',()=>player.setSpeed(Number(el('speed').value)));
    el('repeat').addEventListener('change',()=>{if(!el('repeat').checked&&player.view().holding)player.seek(LAST);});
    for(const id of ['truth','reference'])el(id).addEventListener('change',()=>render(position));
    for(const id of ['n','size'])el(id).addEventListener('change',()=>{player.pause();group=0;rebuild();player.reset();});
    el('level').addEventListener('change',()=>{player.pause();rebuild();player.seek(position);});
    function changeGroup(offset){player.pause();options.onPlay?.();group=Math.max(0,Math.min(current.groups-1,group+offset));rebuild();player.seek(position);}
    el('group-back').addEventListener('click',()=>changeGroup(-1));el('group-next').addEventListener('click',()=>changeGroup(1));
    document.fonts.ready.then(()=>render(position));
    const controller={pause:()=>player.pause(),redraw:()=>render(position),view:()=>({...player.view(),group})};
    root.CIEstimatedParallel.controller=controller;return controller;
  }
  const api={LAST,TOTAL,model,frame,create};root.CIEstimatedParallel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
