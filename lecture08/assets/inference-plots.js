(function(root){
  'use strict';
  const C=root.InferenceCore;
  const colors={ink:'#182632',muted:'#52636f',blue:'#005a85',orange:'#be5827',green:'#38734d',purple:'#80629a',pale:'#c4d7e2',line:'#dbe2e6',covered:'#4c849c'};
  const number=(x,d=2)=>Math.abs(x)<1e-10?'0':Number(x.toFixed(d)).toString().replace('-','−');
  function setup(id){
    const canvas=document.getElementById(id),rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),w=rect.width,h=rect.height;
    if(!w||!h)return null;
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.font='12px "Yu Gothic", Meiryo, sans-serif';ctx.lineCap='round';ctx.lineJoin='round';return{ctx,w,h,canvas};
  }
  function text(p,str,x,y,color=colors.muted,align='center',size=12){const c=p.ctx;c.save();c.font=`${size}px "Yu Gothic", Meiryo, sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(str,x,y);c.restore();}
  function line(p,x1,y1,x2,y2,color,width=1.5,dash=[]){const c=p.ctx;c.save();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();}
  function dot(p,x,y,color,r=4){const c=p.ctx;c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();}
  function ticks(min,max,target=4){const raw=(max-min)/target,power=10**Math.floor(Math.log10(raw)),part=raw/power,step=(part<=1?1:part<=2?2:part<=2.5?2.5:part<=5?5:10)*power;const result=[];for(let v=Math.ceil(min/step)*step;v<=max+step/100;v+=step)result.push(v);return result;}
  function axes(p,xlim,ylim,xlabel,ylabel,opts={}){
    const left=opts.left??47,right=p.w-17,top=28,bottom=opts.bottom??p.h-50;
    p.bounds={left,right,top,bottom};p.x=x=>left+(x-xlim[0])/(xlim[1]-xlim[0])*(right-left);p.y=y=>bottom-(y-ylim[0])/(ylim[1]-ylim[0])*(bottom-top);
    if(!opts.noY)for(const v of ticks(...ylim,4)){const y=p.y(v);line(p,left,y,right,y,'#edf0f2',1);text(p,number(v),left-9,y,'#8b99a2','right',11);}
    line(p,left,bottom,right,bottom,colors.ink,1);
    for(const v of ticks(...xlim,p.w<350?3:5)){const x=p.x(v);line(p,x,bottom,x,bottom+4,colors.ink,1);text(p,number(v),x,bottom+17,colors.ink,'center',11);}
    text(p,xlabel,(left+right)/2,opts.axisLabelY??p.h-9,colors.ink,'center',12);if(ylabel)text(p,ylabel,left,11,'#8b99a2','left',11);return p;
  }
  function clip(p,fn){const c=p.ctx,b=p.bounds;c.save();c.beginPath();c.rect(b.left,b.top,b.right-b.left,b.bottom-b.top);c.clip();fn();c.restore();}
  function path(p,fn,xmin,xmax,color=colors.blue,width=2,dash=[]){const c=p.ctx;c.save();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();for(let j=0;j<=240;j++){const x=xmin+(xmax-xmin)*j/240;const y=fn(x);j?c.lineTo(p.x(x),p.y(y)):c.moveTo(p.x(x),p.y(y));}c.stroke();c.restore();}
  function scatter(id,s,pop,ci=null){
    const p=setup(id);if(!p)return;
    // Common limits include every point in the nine available 5,000-sample sequences.
    axes(p,[0,10],[40,240],'補習時間 X','得点 Y');
    clip(p,()=>{
      s.x.forEach((x,i)=>dot(p,p.x(x),p.y(s.y[i]),s.n>240?'#80909a55':'#80909a88',s.n>240?2:2.7));
      path(p,C.mean,0,10,colors.green,2.5);
      path(p,x=>pop.intercept+pop.slope*x,0,10,colors.blue,2.5,[6,5]);
      if(ci){
        path(p,x=>s.my+ci.lower*(x-s.mx),0,10,colors.purple,2);
        path(p,x=>s.my+ci.upper*(x-s.mx),0,10,colors.purple,2);
      }
      path(p,x=>s.intercept+s.slope*x,0,10,colors.orange,2.5);
      if(ci){dot(p,p.x(s.mx),p.y(s.my),'#fff',6);dot(p,p.x(s.mx),p.y(s.my),colors.ink,3.5);}
    });
  }
  function slopeDomain(pop,results,level,includeIntervals=false){
    let half=2.5;for(const r of results){const radius=Math.abs(r.slope-pop.slope)+(includeIntervals?C.interval(r,level).margin:0);half=Math.max(half,radius*1.06);}
    half=Math.ceil(half*2)/2;return[pop.slope-half,pop.slope+half];
  }
  function distribution(id,values,center,sd,selected,{isZ=false,critical=1.96,domain=null,shade=false}={}){
    const p=setup(id);if(!p)return;
    const extent=isZ?Math.max(4,Math.ceil(Math.max(Math.abs(selected),...values.map(Math.abs)))):0;
    const xlim=domain||(isZ?[-extent,extent]:[center-4*sd,center+4*sd]);
    const bins=isZ?Math.ceil((xlim[1]-xlim[0])/.25):60,bw=(xlim[1]-xlim[0])/bins,counts=Array(bins).fill(0);
    for(const v of values){const i=Math.max(0,Math.min(bins-1,Math.floor((v-xlim[0])/bw)));counts[i]++;}
    const histogram=values.length>=15,densities=counts.map(n=>n/Math.max(1,values.length)/bw),peak=C.normal(0)/sd;
    const ymax=Math.max(peak*1.23,histogram?Math.max(...densities)*1.15:0);
    axes(p,xlim,[0,ymax],isZ?'標準化した推定誤差 Z':'OLSの傾き β̂₁','密度');
    clip(p,()=>{
      if(shade){const c=p.ctx;c.fillStyle='#dcebf2';c.beginPath();c.moveTo(p.x(-critical),p.y(0));for(let j=0;j<=150;j++){const x=-critical+2*critical*j/150;c.lineTo(p.x(x),p.y(C.normal(x)));}c.lineTo(p.x(critical),p.y(0));c.closePath();c.fill();}
      if(histogram){p.ctx.fillStyle=colors.pale;densities.forEach((d,i)=>p.ctx.fillRect(p.x(xlim[0]+i*bw)+.4,p.y(d),Math.max(1,p.x(xlim[0]+(i+1)*bw)-p.x(xlim[0]+i*bw)-.8),p.y(0)-p.y(d)));}
      else values.forEach(v=>line(p,p.x(v),p.y(0)-12,p.x(v),p.y(0),colors.pale,3));
      path(p,x=>C.normal((x-center)/sd)/sd,...xlim);
      if(isZ){for(const v of [-critical,critical])line(p,p.x(v),p.y(0),p.x(v),p.y(C.normal(v)),colors.blue,1.5,[4,4]);}
      else line(p,p.x(center),p.bounds.top+15,p.x(center),p.y(0),colors.blue,1.5,[4,4]);
      line(p,p.x(selected),p.y(0)-5,p.x(selected),p.y(Math.max(peak*.45,C.normal((selected-center)/sd)/sd)),colors.orange,2);
      dot(p,p.x(selected),p.y(0)-5,colors.orange,4);
    });
    if(shade){text(p,`${Math.round((Object.entries(C.criticals).find(([,v])=>v===critical)?.[0]||.95)*100)}%`,p.x(0),p.y(peak*.5),colors.blue,'center',20);text(p,`−${critical.toFixed(3)}`,p.x(-critical),p.y(0)-16,colors.blue,'center',11);text(p,critical.toFixed(3),p.x(critical),p.y(0)-16,colors.blue,'center',11);}
  }
  function candidateNull(id,state){
    const p=setup(id);if(!p)return;const extent=state.span+.5,c=state.critical;
    axes(p,[-extent,extent],[0,.49],'検定統計量 T(b₀)','密度');
    function fill(lo,hi,color){const ctx=p.ctx;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(p.x(lo),p.y(0));for(let i=0;i<=100;i++){const x=lo+(hi-lo)*i/100;ctx.lineTo(p.x(x),p.y(C.normal(x)));}ctx.lineTo(p.x(hi),p.y(0));ctx.closePath();ctx.fill();}
    clip(p,()=>{
      fill(-extent,-c,'#f3dacc');fill(c,extent,'#f3dacc');fill(-c,c,'#e7f0f5');
      path(p,C.normal,-extent,extent);
      for(const value of[-c,c])line(p,p.x(value),p.y(0),p.x(value),p.y(.44),colors.blue,1.5,[4,4]);
      if(!state.complete){const color=state.rejected?colors.orange:colors.blue;line(p,p.x(state.statistic),p.y(0)-5,p.x(state.statistic),p.y(.43),color,2.5);dot(p,p.x(state.statistic),p.y(0)-5,color,5);}
    });
    text(p,`−${c.toFixed(3)}`,p.x(-c),p.y(.46),colors.blue,'center',11);text(p,c.toFixed(3),p.x(c),p.y(.46),colors.blue,'center',11);
    text(p,'棄却域',p.x((-extent-c)/2),p.y(.055),colors.orange,'center',11);text(p,'棄却域',p.x((extent+c)/2),p.y(.055),colors.orange,'center',11);
  }
  function candidateResults(id,s,state){
    const p=setup(id);if(!p)return;
    const domain=[state.domain[0]-.25*s.se,state.domain[1]+.25*s.se],bottom=p.h-125;
    axes(p,domain,[0,state.span+.55],'候補 b₀','|T(b₀)|',{bottom,axisLabelY:bottom+42});
    const statistic=b=>Math.abs((s.slope-b)/s.se),cursor=state.candidate;
    clip(p,()=>{
      path(p,statistic,...state.domain,'#b9c4cb',1.5,[4,4]);
      const parts=[[state.domain[0],Math.min(cursor,state.lower),colors.orange],[state.lower,Math.min(cursor,state.upper),colors.blue],[state.upper,cursor,colors.orange]];
      for(const[lo,hi,color]of parts)if(hi>lo)path(p,statistic,lo,hi,color,3);
      line(p,p.bounds.left,p.y(state.critical),p.bounds.right,p.y(state.critical),colors.blue,1.5,[5,4]);
      if(!state.complete){const color=state.rejected?colors.orange:colors.blue;line(p,p.x(cursor),p.y(statistic(cursor)),p.x(cursor),p.y(0),color,1.2,[3,4]);dot(p,p.x(cursor),p.y(statistic(cursor)),color,5);}
    });
    text(p,`臨界値 ${state.critical.toFixed(3)}`,p.bounds.right-4,p.y(state.critical)-13,colors.blue,'right',11);
    const y=bottom+79;
    line(p,p.bounds.left,y,p.bounds.right,y,colors.line,1);
    if(state.accepted){
      const [lower,upper]=state.accepted,l=p.x(lower),r=p.x(upper);
      line(p,l,y,r,y,colors.blue,5);dot(p,l,y,colors.blue,3.5);dot(p,r,y,colors.blue,3.5);
      if(state.progress>=3){for(const x of[l,r])line(p,x,y-8,x,y+8,colors.blue,1.5);text(p,number(lower,3),l-3,y+23,colors.blue,'right',11);text(p,number(upper,3),r+3,y+23,colors.blue,'left',11);}
    }
    text(p,'棄却されない候補',p.bounds.left,y-20,colors.blue,'left',11);
  }
  function history(id,results,pop,level,selected,domain){
    const p=setup(id);if(!p)return{start:0,end:0};
    const start=Math.max(0,Math.min(results.length-30,selected-14)),end=Math.min(results.length,start+30),visible=results.slice(start,end),rows=30;
    axes(p,domain,[0,rows+1],'傾き β₁','標本',{noY:true,left:57});
    const band=(p.bounds.bottom-p.bounds.top)/(rows+1),selectedY=p.bounds.top+band*(selected-start+1);
    p.ctx.fillStyle='#eef4f7';p.ctx.fillRect(p.bounds.left,selectedY-band*.47,p.bounds.right-p.bounds.left,band*.94);
    line(p,p.x(pop.slope),p.bounds.top,p.x(pop.slope),p.bounds.bottom,colors.blue,1.7,[5,4]);
    visible.forEach((s,i)=>{
      const ci=C.interval(s,level),y=p.bounds.top+band*(i+1),color=ci.covered?colors.covered:colors.orange;
      line(p,p.x(ci.lower),y,p.x(ci.upper),y,color,s.index===selected?3:1.7);dot(p,p.x(s.slope),y,color,s.index===selected?4:2.2);
      if(i===0||i===visible.length-1||(s.index+1)%5===0||s.index===selected)text(p,String(s.index+1),p.bounds.left-10,y,s.index===selected?colors.ink:colors.muted,'right',12);
    });return{start,end};
  }
  root.InferencePlots={scatter,distribution,candidateNull,candidateResults,history,slopeDomain};
})(globalThis);
