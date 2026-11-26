(function(root){
  'use strict';
  const core=root.CICore||(typeof require==='function'?require('./ci-core.js'):null);
  const motion=root.CIDerivationMotion||(typeof require==='function'?require('./derivation-motion.js'):null);
  const {ease,mix}=motion,LAST=2,TOTAL=500;
  function model(n,level,count=6,group=0){
    if(![3,6,10].includes(count)||!Number.isInteger(group)||group<0||group>=Math.ceil(TOTAL/count))throw new Error('Invalid sample group.');
    const start=group*count,se=10/Math.sqrt(n),c=core.critical(level),halfWidth=c*se;
    const rows=Array.from({length:Math.min(count,TOTAL-start)},(_,i)=>{
      const sample=core.sample('mean',n,start+i),mean=sample.estimate;
      return {index:start+i,values:sample.y,mean,lower:mean-halfWidth,upper:mean+halfWidth};
    });
    const anchor=core.sample('mean',n,0).estimate,radius=Math.max(20,4*halfWidth);
    let lo=0,hi=100;
    for(const row of rows)for(const value of row.values){lo=Math.min(lo,Math.floor(value/10)*10);hi=Math.max(hi,Math.ceil(value/10)*10);}
    return {n,level,count,group,start,groups:Math.ceil(TOTAL/count),se,c,halfWidth,rows,rawDomain:[lo,hi],intervalDomain:[anchor-radius,anchor+radius]};
  }
  function frame(m,position){
    const collapse=ease(position),extend=ease(position-1);
    return {collapse,extend,domain:m.rawDomain.map((v,i)=>mix(v,m.intervalDomain[i],collapse)),
      rows:m.rows.map(row=>({...row,points:row.values.map(value=>mix(value,row.mean,collapse)),
        lower:row.mean-m.halfWidth*extend,upper:row.mean+m.halfWidth*extend}))};
  }
  function create(options={}){
    const el=name=>document.getElementById(`parallel-${name}`),fmt=(v,d=3)=>v.toFixed(d);
    const C={ink:'#182632',muted:'#52636f',blue:'#005a85',orange:'#be5827',green:'#28796a',line:'#dbe2e6',gray:'#8b9da8'};
    let group=0,position=0,current,player;
    function rebuild(){current=model(Number(el('n').value),Number(el('level').value),Number(el('size').value),group);}
    function text(ctx,value,x,y,color=C.muted,size=12,align='center'){
      ctx.font=`${size}px 'STIX Two Math','Yu Gothic',Meiryo,serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(value,x,y);
    }
    function line(ctx,x1,y1,x2,y2,color=C.line,width=1,dash=[]){
      ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
    }
    function dot(ctx,x,y,color,r){ctx.beginPath();ctx.fillStyle=color;ctx.arc(x,y,r,0,2*Math.PI);ctx.fill();}
    function render(p){
      position=p;
      const m=current,f=frame(m,p),canvas=el('plot'),height=104+68*m.rows.length;
      canvas.style.height=`${height}px`;
      const w=canvas.getBoundingClientRect().width,dpr=Math.min(3,window.devicePixelRatio||1);
      if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(height*dpr);}
      const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,height);ctx.lineCap='round';
      const left=54,right=w-24,base=height-48,x=v=>left+(v-f.domain[0])/(f.domain[1]-f.domain[0])*(right-left);
      line(ctx,left,base,right,base);
      const raw=(f.domain[1]-f.domain[0])/Math.max(3,Math.floor((right-left)/100)),power=10**Math.floor(Math.log10(raw));
      const step=[1,2,5,10].find(v=>v*power>=raw)*power;
      for(let v=Math.ceil(f.domain[0]/step)*step;v<=f.domain[1];v+=step){line(ctx,x(v),base,x(v),base+5);text(ctx,Number(v.toFixed(2)).toString(),x(v),base+20);}
      const showTruth=el('truth').checked;
      if(showTruth){line(ctx,x(50),29,x(50),base,C.blue,1.3,[4,4]);text(ctx,'μ = 50',x(50),14,C.blue,14);}
      f.rows.forEach((row,i)=>{
        const y=60+68*i;
        text(ctx,String(row.index+1),22,y,C.muted,12);
        if(f.collapse<1){
          ctx.save();ctx.globalAlpha=1-.8*f.collapse;
          row.points.forEach((value,j)=>dot(ctx,x(value),y+(((j*7)%13)-6)*1.7*(1-f.collapse),C.gray,m.n>100?1.6:2.5));ctx.restore();
        }
        if(f.collapse>0){ctx.save();ctx.globalAlpha=f.collapse;dot(ctx,x(row.mean),y,C.orange,4.5);text(ctx,fmt(row.mean,2),x(row.mean),y+22,C.orange,12);ctx.restore();}
        if(f.extend>0){
          const complete=p>=LAST,covered=row.lower<=50&&50<=row.upper;
          const color=showTruth&&complete?(covered?C.green:C.orange):C.blue;
          line(ctx,x(row.lower),y,x(row.upper),y,color,2.5,showTruth&&complete&&!covered?[4,3]:[]);
          for(const bound of [row.lower,row.upper])line(ctx,x(bound),y-6,x(bound),y+6,color,2);
          dot(ctx,x(row.mean),y,C.orange,4.5);
          if(complete){text(ctx,fmt(row.lower,2),x(row.lower)-5,y-20,color,12,'right');text(ctx,fmt(row.upper,2),x(row.upper)+5,y-20,color,12,'left');
            if(showTruth&&!covered)text(ctx,'×',right+12,y,C.orange,16);}
        }
      });
      el('phase').textContent=['標本','標本平均','信頼区間'][Math.min(LAST,Math.floor(p+1e-8))];
      el('position').textContent=Math.min(3,Math.floor(p+1e-8)+1);
      el('seek').value=String(p);el('seek').setAttribute('aria-valuetext',el('phase').textContent);
      el('group').textContent=`標本 ${m.start+1}–${m.start+m.rows.length}`;
      el('group-back').disabled=group===0;el('group-next').disabled=group===m.groups-1;
      el('width').textContent=fmt(m.halfWidth);
      canvas.setAttribute('aria-label',p<LAST?`${m.rows.length}標本を同時に表示。${el('phase').textContent}の工程。`:
        `${m.rows.length}個の${m.level}%信頼区間。`+m.rows.map(r=>`標本${r.index+1}: ${fmt(r.lower)}から${fmt(r.upper)}`).join('。')+(showTruth?'。母平均50を表示。':''));
    }
    function buttons(state){el('play').textContent=state.running?'一時停止':'再生';el('play').setAttribute('aria-pressed',String(state.running));el('back').disabled=state.position<=0;el('next').disabled=state.position>=LAST;}
    rebuild();
    player=root.CIDerivation.timeline({lastPosition:LAST,duration:2600,holdDuration:2000,render,onState:buttons,onPlay:options.onPlay,
      shouldRepeat:()=>el('repeat').checked,onAdvance:()=>{group=(group+1)%current.groups;rebuild();}});
    player.reset();
    el('play').addEventListener('click',()=>player.view().running?player.pause():player.play());
    el('next').addEventListener('click',()=>player.next());el('back').addEventListener('click',()=>player.back());
    el('reset').addEventListener('click',()=>{player.pause();group=0;rebuild();player.reset();});
    el('seek').addEventListener('input',()=>player.seek(Number(el('seek').value)));
    el('speed').addEventListener('change',()=>player.setSpeed(Number(el('speed').value)));
    el('repeat').addEventListener('change',()=>{if(!el('repeat').checked&&player.view().holding)player.seek(LAST);});
    el('truth').addEventListener('change',()=>render(position));
    for(const id of ['n','size'])el(id).addEventListener('change',()=>{player.pause();group=0;rebuild();player.reset();});
    el('level').addEventListener('change',()=>{player.pause();rebuild();player.seek(position);});
    function changeGroup(offset){player.pause();options.onPlay?.();group=Math.max(0,Math.min(current.groups-1,group+offset));rebuild();player.seek(position);}
    el('group-back').addEventListener('click',()=>changeGroup(-1));el('group-next').addEventListener('click',()=>changeGroup(1));
    document.fonts.ready.then(()=>render(position));
    return {pause:()=>player.pause(),redraw:()=>render(position)};
  }
  const api={LAST,TOTAL,model,frame,create};root.CIParallel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
