(()=>{
  'use strict';
  const blue='#005a85',orange='#be5827',ink='#182632';
  const pdf=(x,m,s)=>Math.exp(-.5*((x-m)/s)**2)/(s*Math.sqrt(2*Math.PI));
  function ticks(min,max,target=4){
    const raw=(max-min)/target,p=10**Math.floor(Math.log10(raw||1)),u=raw/p,step=(u<=1?1:u<=2?2:u<=5?5:10)*p;
    const result=[];for(let v=Math.ceil(min/step)*step;v<=max+step*1e-6;v+=step)result.push(Math.abs(v)<step*1e-8?0:v);return result;
  }
  const tick=v=>Number(v.toFixed(2)).toString().replace('-','−');
  function frame(canvas,xlim,ylim,xlabel,ylabel,xticks){
    const rect=canvas.getBoundingClientRect(),width=rect.width,height=rect.height,ratio=devicePixelRatio||1;
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);
    const margin={l:42,r:13,t:24,b:43},w=width-margin.l-margin.r,h=height-margin.t-margin.b;
    const X=x=>margin.l+(x-xlim[0])/(xlim[1]-xlim[0])*w,Y=y=>margin.t+h-(y-ylim[0])/(ylim[1]-ylim[0])*h;
    ctx.font='12px "STIX Two Math",serif';ctx.fillStyle='#52636f';
    ticks(...ylim).forEach(y=>{ctx.strokeStyle='#e5eaed';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(margin.l,Y(y));ctx.lineTo(width-margin.r,Y(y));ctx.stroke();ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(tick(y),margin.l-7,Y(y));});
    (xticks||ticks(...xlim)).forEach(x=>{ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(tick(x),X(x),margin.t+h+8);});
    ctx.strokeStyle='#8c9ca6';ctx.beginPath();ctx.moveTo(margin.l,margin.t);ctx.lineTo(margin.l,margin.t+h);ctx.lineTo(width-margin.r,margin.t+h);ctx.stroke();
    ctx.font='11px "Yu Gothic",Meiryo,sans-serif';ctx.fillStyle=ink;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(ylabel,2,2);ctx.textAlign='center';ctx.fillText(xlabel,margin.l+w/2,height-15);
    return{ctx,X,Y,width,height,margin,w,h};
  }
  function line(p,points,color=blue,dashed=false,lw=2){
    p.ctx.strokeStyle=color;p.ctx.lineWidth=lw;p.ctx.setLineDash(dashed?[5,3]:[]);p.ctx.beginPath();
    points.forEach(([x,y],i)=>i?p.ctx.lineTo(p.X(x),p.Y(y)):p.ctx.moveTo(p.X(x),p.Y(y)));p.ctx.stroke();p.ctx.setLineDash([]);
  }
  function dot(p,x,y,color=orange,r=3){p.ctx.fillStyle=color;p.ctx.beginPath();p.ctx.arc(p.X(x),p.Y(y),r,0,2*Math.PI);p.ctx.fill();}
  function bounds(v,m,s,width=.4*s){let max=4*s;for(const x of v)max=Math.max(max,Math.abs(x-m));const extent=(Math.ceil(max/width)+.5)*width;return[m-extent,m+extent];}
  function histogram(canvas,v,m,s,{xlim=bounds(v,m,s),marker,drop=1,xlabel='標本平均'}={}){
    const hist=DemoCore.histogram(v,...xlim,s*.4),ymax=Math.max(...hist.density,pdf(m,m,s))*1.1,p=frame(canvas,xlim,[0,ymax],xlabel,'密度');
    p.ctx.fillStyle='#b8c6cd';hist.density.forEach((h,i)=>{const x=p.X(hist.min+i*hist.width),w=p.X(hist.min+(i+1)*hist.width)-x;p.ctx.fillRect(x,p.Y(h),Math.max(.5,w-.6),p.Y(0)-p.Y(h));});
    line(p,Array.from({length:301},(_,i)=>{const x=xlim[0]+i/300*(xlim[1]-xlim[0]);return[x,pdf(x,m,s)];}));
    if(marker!==undefined){line(p,[[marker,0],[marker,ymax*.93]],orange,true,1.5);dot(p,marker,ymax*.85*(1-drop),orange,4);}
    return p;
  }
  function errorShape(canvas,model){
    const xlim=[-4.5,12],p=frame(canvas,xlim,[0,1.05],'誤差 U','密度',[-3,0,3,6,9,12]);
    const support=DemoCore.errorSupport(model),start=Math.max(xlim[0],support);
    const curve=Array.from({length:701},(_,i)=>{const x=start+i/700*(xlim[1]-start);return[x,DemoCore.errorDensity(model,x)];});
    if(start>xlim[0])line(p,[[xlim[0],0],[start,0]],blue);
    if(model==='skew')line(p,[[start,0],[start,DemoCore.errorDensity(model,start)]],blue);
    line(p,curve,blue,false,2.3);line(p,[[0,0],[0,1.05]],'#a4b2bb',true,1);
    const label={normal:'正規分布',skew:'右に歪む分布',strong:'強い右歪みの対数正規分布'}[model];
    canvas.setAttribute('aria-label',`${label}を平均0，標準偏差1.5に調整した誤差の密度。横軸−4.5から12，縦軸0から1.05。`);
    canvas.dataset.model=model;
  }
  window.DemoPlots={frame,line,dot,bounds,histogram,errorShape,pdf,blue,orange};
})();
