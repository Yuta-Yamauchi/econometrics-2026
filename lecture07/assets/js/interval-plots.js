(function(root){
  'use strict';
  const C=root.IntervalCore;
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
  function candidateNull(id,state){
    const p=setup(id);if(!p)return;const extent=state.span+.5,c=state.critical;
    axes(p,[-extent,extent],[0,.49],'検定統計量 T(b₀)','密度');
    function fill(lo,hi,color){const ctx=p.ctx;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(p.x(lo),p.y(0));for(let i=0;i<=100;i++){const x=lo+(hi-lo)*i/100;ctx.lineTo(p.x(x),p.y(C.tPdf(x,state.df)));}ctx.lineTo(p.x(hi),p.y(0));ctx.closePath();ctx.fill();}
    clip(p,()=>{
      fill(-extent,-c,'#f3dacc');fill(c,extent,'#f3dacc');fill(-c,c,'#e7f0f5');
      path(p,x=>C.tPdf(x,state.df),-extent,extent);
      for(const value of[-c,c])line(p,p.x(value),p.y(0),p.x(value),p.y(.44),colors.blue,1.5,[4,4]);
      if(!state.complete){const color=state.rejected?colors.orange:colors.blue;line(p,p.x(state.statistic),p.y(0)-5,p.x(state.statistic),p.y(.43),color,2.5);dot(p,p.x(state.statistic),p.y(0)-5,color,5);}
    });
    text(p,`−${c.toFixed(3)}`,p.x(-c),p.y(.46),colors.blue,'center',11);text(p,c.toFixed(3),p.x(c),p.y(.46),colors.blue,'center',11);
    text(p,'棄却域',p.x((-extent-c)/2),p.y(.055),colors.orange,'center',11);text(p,'棄却域',p.x((extent+c)/2),p.y(.055),colors.orange,'center',11);
  }
  function candidateResults(id,s,state,view='statistic'){
    const p=setup(id);if(!p)return;
    const domain=[state.domain[0]-.25*s.se,state.domain[1]+.25*s.se],bottom=p.h-125;
    const isP=view==='pvalue',boundary=isP?state.alpha:state.critical;
    axes(p,domain,[0,isP?1.15:state.span+.55],'候補 b₀',isP?'p(b₀)':'|T(b₀)|',{bottom,axisLabelY:bottom+42});
    const statistic=b=>isP?C.tP((s.slope-b)/s.se,state.df):Math.abs((s.slope-b)/s.se),cursor=state.candidate;
    clip(p,()=>{
      path(p,statistic,...state.domain,'#b9c4cb',1.5,[4,4]);
      const parts=[[state.domain[0],Math.min(cursor,state.lower),colors.orange],[state.lower,Math.min(cursor,state.upper),colors.blue],[state.upper,cursor,colors.orange]];
      for(const[lo,hi,color]of parts)if(hi>lo)path(p,statistic,lo,hi,color,3);
      line(p,p.bounds.left,p.y(boundary),p.bounds.right,p.y(boundary),colors.blue,1.5,[5,4]);
      if(!state.complete){const color=state.rejected?colors.orange:colors.blue;line(p,p.x(cursor),p.y(statistic(cursor)),p.x(cursor),p.y(0),color,1.2,[3,4]);dot(p,p.x(cursor),p.y(statistic(cursor)),color,5);}
    });
    text(p,isP?`有意水準 ${number(state.alpha,2)}`:`臨界値 ${state.critical.toFixed(3)}`,p.bounds.right-4,p.y(boundary)-13,colors.blue,'right',11);
    const y=bottom+79;
    line(p,p.bounds.left,y,p.bounds.right,y,colors.line,1);
    if(state.accepted){
      const [lower,upper]=state.accepted,l=p.x(lower),r=p.x(upper);
      line(p,l,y,r,y,colors.blue,5);dot(p,l,y,colors.blue,3.5);dot(p,r,y,colors.blue,3.5);
      if(state.progress>=3){for(const x of[l,r])line(p,x,y-8,x,y+8,colors.blue,1.5);text(p,number(lower,3),l-3,y+23,colors.blue,'right',11);text(p,number(upper,3),r+3,y+23,colors.blue,'left',11);}
    }
    text(p,'棄却されない候補',p.bounds.left,y-20,colors.blue,'left',11);
  }
  function scatter(id,s,mode='residual',ylim=[-6,16]){
    const p=setup(id);if(!p)return;
    axes(p,[-.2,4.2],ylim,'説明変数 X','Y');
    clip(p,()=>{
      if(mode!=='none')s.x.forEach((x,i)=>line(p,p.x(x),p.y(s.y[i]),p.x(x),p.y(mode==='error'?2+1.5*x:s.intercept+s.slope*x),mode==='error'?'#8aaec366':'#db9c7866',1));
      s.x.forEach((x,i)=>dot(p,p.x(x),p.y(s.y[i]),'#6c818e99',s.n>100?2:2.7));
      path(p,x=>2+1.5*x,0,4,colors.blue,2.5,[6,5]);
      path(p,x=>s.intercept+s.slope*x,0,4,colors.orange,2.5);
      dot(p,p.x(s.mx),p.y(s.my),colors.ink,3.5);
    });
  }
  function history(id,results,level,selected,domain,kind){
    const p=setup(id);if(!p)return;
    const start=Math.max(0,Math.min(results.length-30,selected-14)),end=Math.min(results.length,start+30),rows=30;
    axes(p,domain,[0,rows+1],kind==='test'?'T(1.5)':'傾き β₁','標本',{noY:true,left:49});
    const band=(p.bounds.bottom-p.bounds.top)/(rows+1),selectedY=p.bounds.top+band*(selected-start+1),c=C.critical(level,results[0].n);
    p.ctx.fillStyle='#eef4f7';p.ctx.fillRect(p.bounds.left,selectedY-band*.47,p.bounds.right-p.bounds.left,band*.94);
    if(kind==='test'){
      p.ctx.fillStyle='#e5eef366';p.ctx.fillRect(p.x(-c),p.bounds.top,p.x(c)-p.x(-c),p.bounds.bottom-p.bounds.top);
      for(const v of [-c,c])line(p,p.x(v),p.bounds.top,p.x(v),p.bounds.bottom,colors.blue,1.5,[5,4]);
    }else line(p,p.x(1.5),p.bounds.top,p.x(1.5),p.bounds.bottom,colors.blue,1.7,[5,4]);
    results.slice(start,end).forEach((s,i)=>{
      const ci=C.interval(s,level),y=p.bounds.top+band*(i+1),color=ci.covered?colors.covered:colors.orange;
      if(kind==='test')dot(p,p.x((s.slope-1.5)/s.se),y,color,s.index===selected?4.5:3);
      else{line(p,p.x(ci.lower),y,p.x(ci.upper),y,color,s.index===selected?3:1.7);dot(p,p.x(s.slope),y,color,s.index===selected?4:2.2);}
      if(i===0||i===end-start-1||(s.index+1)%5===0||s.index===selected)text(p,String(s.index+1),p.bounds.left-10,y,s.index===selected?colors.ink:colors.muted,'right',12);
    });
  }
  function width(id,s){
    const p=setup(id);if(!p)return;
    const bottom=p.h-175;axes(p,[-2.5,6.5],[-6,16],'説明変数 X','Y',{bottom,axisLabelY:bottom+42});
    clip(p,()=>{
      s.x.forEach((x,i)=>dot(p,p.x(x),p.y(s.y[i]),'#6c818e88',s.n>100?2:2.5));
      for(const slope of[s.lower,s.upper])path(p,x=>s.my+slope*(x-s.mx),-2,6,colors.blue,1.8,[6,4]);
      path(p,x=>s.intercept+s.slope*x,-2,6,colors.orange,2.5);dot(p,p.x(s.mx),p.y(s.my),colors.ink,3.5);
    });
    const b=value=>p.bounds.left+(value-.7)/1.6*(p.bounds.right-p.bounds.left),y=p.h-52;
    text(p,`${s.level}%信頼区間 [${number(s.lower,3)}, ${number(s.upper,3)}]`,(p.bounds.left+p.bounds.right)/2,y-44,colors.blue,'center',12);
    line(p,p.bounds.left,y,p.bounds.right,y,colors.line,1);
    for(const v of[1,1.5,2]){line(p,b(v),y-4,b(v),y+4,colors.line,1);text(p,number(v),b(v),y+20);}
    line(p,b(s.lower),y-15,b(s.upper),y-15,colors.blue,3);
    for(const v of[s.lower,s.upper])line(p,b(v),y-22,b(v),y-8,colors.blue,1.5);
    dot(p,b(s.slope),y-15,colors.orange,4);text(p,'傾き β₁',(p.bounds.left+p.bounds.right)/2,p.h-9,colors.ink);
  }
  function effects(id,full){
    const p=setup(id);if(!p)return;
    axes(p,full?[-.08,1.1]:[-.04,.06],[0,3],'1時間当たりの得点の変化','',{noY:true,left:68});
    line(p,p.x(0),p.bounds.top,p.x(0),p.bounds.bottom,colors.muted,1.5,[5,4]);
    if(full){line(p,p.x(1),p.bounds.top,p.x(1),p.bounds.bottom,colors.orange,1.5,[5,4]);text(p,'基準1点',p.x(1),p.bounds.top+5,colors.orange,'center',11);}
    C.effects.forEach((s,i)=>{
      const y=p.y(2-i),color=i?colors.blue:colors.covered;
      line(p,p.x(s.lower),y,p.x(s.upper),y,color,4);
      for(const v of[s.lower,s.upper])line(p,p.x(v),y-9,p.x(v),y+9,color,1.5);
      dot(p,p.x(.01),y,colors.orange,4);
      text(p,s.n===100?'100人':'10,000人',p.bounds.left-7,y,colors.ink,'right',12);
      text(p,`[${number(s.lower,3)}, ${number(s.upper,3)}]`,(p.bounds.left+p.bounds.right)/2,y+30,color,'center',12);
    });
  }
  root.IntervalPlots={scatter,candidateNull,candidateResults,history,width,effects};
})(globalThis);
