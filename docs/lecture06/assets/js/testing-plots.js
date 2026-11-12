(function(root){
  'use strict';
  const C=root.TestingCore;
  const ink='#182632',blue='#005a85',orange='#be5827',green='#38734d',gray='#8b99a2',pale='#c4dee9',warm='#f0d4c4';
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  function surface(id){
    const el=document.getElementById(id),r=el.getBoundingClientRect(),w=r.width,h=r.height,dpr=Math.min(devicePixelRatio||1,2);
    const W=Math.round(w*dpr),H=Math.round(h*dpr);if(el.width!==W||el.height!==H){el.width=W;el.height=H;}
    const g=el.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);g.font='12px "Yu Gothic",Meiryo,sans-serif';g.lineWidth=1;
    return{el,g,w,h};
  }
  function label(s,t,x,y,color=ink,align='center',size=12){s.g.fillStyle=color;s.g.font=size+'px "Yu Gothic",Meiryo,sans-serif';s.g.textAlign=align;s.g.textBaseline='middle';s.g.fillText(t,x,y);}
  function line(s,x1,y1,x2,y2,color=blue,width=1.5,dash=[]){const g=s.g;g.beginPath();g.strokeStyle=color;g.lineWidth=width;g.setLineDash(dash);g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();g.setLineDash([]);}
  function point(s,x,y,color=orange,r=3){s.g.beginPath();s.g.fillStyle=color;s.g.arc(x,y,r,0,Math.PI*2);s.g.fill();}
  function chart(id,xlim,ylim,{xt=[],yt=[],xlab='',ylab='',left=44,bottom=42}={}){
    const s=surface(id),L=left,R=s.w-20,T=30,B=s.h-bottom;
    const x=v=>L+(v-xlim[0])/(xlim[1]-xlim[0])*(R-L),y=v=>B-(v-ylim[0])/(ylim[1]-ylim[0])*(B-T);
    Object.assign(s,{L,R,T,B,x,y,xlim,ylim});
    for(const v of yt){line(s,L,y(v),R,y(v),'#edf0f2',1);label(s,String(v),L-8,y(v),gray,'right',11);}
    line(s,L,B,R,B,ink,1);
    for(const v of xt){line(s,x(v),B,x(v),B+4,ink,1);label(s,String(v),x(v),B+17,ink,'center',11);}
    if(xlab)label(s,xlab,(L+R)/2,s.h-10,ink,'center',12);
    if(ylab)label(s,ylab,L,12,gray,'left',11);
    return s;
  }
  function curve(s,f,color=blue,dash=[]){const g=s.g;g.beginPath();g.strokeStyle=color;g.lineWidth=2;g.setLineDash(dash);for(let i=0;i<=400;i++){const v=s.xlim[0]+i/400*(s.xlim[1]-s.xlim[0]);const px=s.x(v),py=s.y(f(v));i?g.lineTo(px,py):g.moveTo(px,py);}g.stroke();g.setLineDash([]);}
  function shade(s,f,a,b,color=warm){a=Math.max(s.xlim[0],a);b=Math.min(s.xlim[1],b);if(a>=b)return;const g=s.g;g.beginPath();g.moveTo(s.x(a),s.y(0));for(let i=0;i<=200;i++){const v=a+i/200*(b-a);g.lineTo(s.x(v),s.y(f(v)));}g.lineTo(s.x(b),s.y(0));g.closePath();g.fillStyle=color;g.fill();}
  function vertical(s,x,color=orange,top=.32,dash=[]){const cx=clamp(x,s.xlim[0],s.xlim[1]);line(s,s.x(cx),s.y(0),s.x(cx),s.y(top),color,1.5,dash);if(cx!==x)label(s,x<cx?'←':'→',s.x(cx),s.y(top)+10,color,'center',16);}
  function histogram(s,values,bin=.4){if(!values.length)return;const lo=s.xlim[0],N=Math.ceil((s.xlim[1]-lo)/bin),bins=Array(N).fill(0);for(const v of values){const k=Math.floor((v-lo)/bin);if(k>=0&&k<N)bins[k]++;}s.g.fillStyle='#c4dee980';bins.forEach((n,k)=>{const x=s.x(lo+k*bin),top=s.y(Math.min(s.ylim[1],n/values.length/bin));s.g.fillRect(x,top,s.x(lo+(k+1)*bin)-x-1,s.B-top);});}
  function samplePoints(id,sample,progress,center=45){
    const n=sample.n,lo=Math.min(10,10*Math.floor(Math.min(...sample.y)/10)),hi=Math.max(80,10*Math.ceil(Math.max(...sample.y)/10));
    const s=chart(id,[0,n+1],[lo,hi],{xt:n<=5?[1,2,3,4,5]:[1,Math.round(n/2),n],yt:[20,40,60,80],xlab:'観測番号',ylab:'得点'});
    line(s,s.L,s.y(center),s.R,s.y(center),blue,1,[4,4]);
    const reveal=Math.max(1,Math.ceil(n*Math.min(1,progress/.32)));
    sample.y.slice(0,reveal).forEach((v,i)=>point(s,s.x(i+1),s.y(v),orange,n>25?2.2:3.3));
    if(progress>=.35){line(s,s.L,s.y(sample.mean),s.R,s.y(sample.mean),orange,2);label(s,sample.mean.toFixed(2),s.R,s.y(sample.mean)-13,orange,'right',12);}
  }
  function sampling(sample,progress,history,alpha){
    samplePoints('sample-points',sample,progress);
    let s=chart('sample-average',[35,55],[0,.24],{xt:[35,40,45,50,55],yt:[0,.1,.2],xlab:'標本平均',ylab:'密度'});
    curve(s,x=>C.pdf((x-45)/2)/2);line(s,s.x(45),s.B,s.x(45),s.T+5,blue,1,[3,4]);
    for(const h of history.slice(-80))point(s,s.x(clamp(h.mean,35,55)),s.B-4,pale,2.1);
    if(progress>=.35)vertical(s,sample.mean,orange,.17*Math.min(1,(progress-.35)/.2));
    const limit=6,c=C.critical(alpha),stats=history.map(h=>h.z),counts=Array(30).fill(0);
    stats.forEach(v=>{const k=Math.floor((v+limit)/.4);if(k>=0&&k<counts.length)counts[k]++;});
    const ymax=Math.max(.47,1.08*Math.max(...counts)/Math.max(1,stats.length)/.4);
    const tick=ymax>1?1:ymax>.6?.5:.2,yt=Array.from({length:Math.floor(ymax/tick)+1},(_,i)=>+(i*tick).toFixed(1));
    s=chart('sample-statistic',[-limit,limit],[0,ymax],{xt:[-6,-3,0,3,6],yt,xlab:'Z',ylab:'密度'});
    shade(s,C.pdf,-limit,-c);shade(s,C.pdf,c,limit);histogram(s,stats);curve(s,C.pdf);
    [-c,c].forEach(v=>vertical(s,v,orange,ymax*.72,[4,4]));
    label(s,(-c).toFixed(3),s.x(-c)-5,s.y(ymax*.80),orange,'right',11);label(s,c.toFixed(3),s.x(c)+5,s.y(ymax*.80),orange,'left',11);
    if(progress>=.65)vertical(s,sample.z,orange,ymax*.92*Math.min(1,(progress-.65)/.25));
  }
  function errorPlots(boundary){
    for(const [id,mean,type] of [['error-one',0,1],['error-two',5,2]]){
      const f=x=>C.pdf((x-mean)/2)/2,s=chart(id,[-8,13],[0,.25],{xt:[-8,-4,0,4,8,12],yt:[0,.1,.2],xlab:'推定された傾き',ylab:'密度'});
      if(type===1){shade(s,f,-8,-boundary);shade(s,f,boundary,13);}else shade(s,f,-boundary,boundary);
      curve(s,f);[-boundary,boundary].forEach(v=>vertical(s,v,orange,.21,[4,4]));
      label(s,(-boundary).toFixed(1),s.x(-boundary),s.y(.235),orange);label(s,boundary.toFixed(1),s.x(boundary),s.y(.235),orange);
      line(s,s.x(mean),s.B,s.x(mean),s.y(.20),blue,1,[2,4]);
    }
  }
  function student(sample,progress,history,alpha=.05){
    samplePoints('student-sample',sample,progress);
    const known=10/Math.sqrt(sample.n),max=Math.max(6,known*1.5,sample.se*1.2);
    let s=chart('student-scale',[0,max],[0,3],{xt:[0,2,4,6].filter(x=>x<=max),xlab:'標本平均の標準偏差',left:28,yt:[]});
    label(s,'母標準偏差10を使う',s.L,s.y(2.65),blue,'left',12);
    line(s,s.x(0),s.y(2.2),s.x(known),s.y(2.2),blue,5);point(s,s.x(known),s.y(2.2),blue,4);
    label(s,known.toFixed(3),s.x(known),s.y(2.2)+20,blue,'center',12);
    label(s,'標本から推定する',s.L,s.y(1.4),orange,'left',12);
    if(progress>=.4){const v=sample.se*Math.min(1,(progress-.4)/.22);line(s,s.x(0),s.y(.95),s.x(v),s.y(.95),orange,5);point(s,s.x(v),s.y(.95),orange,4);label(s,v.toFixed(3),s.x(v),s.y(.95)+20,orange,'center',12);}
    const df=sample.n-1;
    const stats=history.map(x=>(x.mean-45)/x.se),counts=Array(30).fill(0);
    stats.forEach(v=>{const k=Math.floor((v+6)/.4);if(k>=0&&k<30)counts[k]++;});
    const ymax=Math.max(.47,1.08*Math.max(...counts)/Math.max(1,stats.length)/.4);
    s=chart('student-density',[-6,6],[0,ymax],{xt:[-6,-3,0,3,6],yt:[0,.2,.4],xlab:'T',ylab:'密度'});
    const zc=C.critical(alpha),tc=C.critical(alpha,df),f=x=>C.tPdf(x,df);
    shade(s,f,-6,-tc);shade(s,f,tc,6);
    histogram(s,stats);curve(s,C.pdf,gray,[4,4]);curve(s,f);
    [-zc,zc].forEach(v=>vertical(s,v,gray,ymax*.78,[3,4]));
    [-tc,tc].forEach(v=>vertical(s,v,blue,ymax*.90,[6,3]));
    if(progress>=.7)vertical(s,(sample.mean-45)/sample.se,orange,.36*Math.min(1,(progress-.7)/.2));
  }
  function pvalue(result){
    let s=chart('p-distance',[39,57],[0,1],{xt:[40,44,48,52,56],xlab:'得点',left:24,yt:[]});
    label(s,'標本平均 '+result.mean.toFixed(2),s.L,15,orange,'left',13);
    line(s,s.x(result.mean),s.y(.82),s.x(result.mean),s.y(.2),orange,1,[4,4]);point(s,s.x(result.mean),s.y(.82),orange,5);
    label(s,'母平均の候補 '+result.candidate.toFixed(1),s.L,s.y(.48),blue,'left',13);
    point(s,s.x(result.candidate),s.y(.28),blue,5);
    line(s,s.x(result.candidate),s.y(.28),s.x(result.mean),s.y(.28),blue,2);
    const mid=(result.mean+result.candidate)/2;
    label(s,'差 '+(result.mean-result.candidate).toFixed(2),s.x(mid),s.y(.10),blue,'center',13);
    const a=Math.abs(result.t),f=x=>C.tPdf(x,24),limit=Math.max(6,2*Math.ceil((a+1)/2));
    s=chart('p-tails',[-limit,limit],[0,.48],{xt:[-limit,-limit/2,0,limit/2,limit],yt:[0,.2,.4],xlab:'T（自由度24）',ylab:'密度'});
    shade(s,f,-limit,-a);shade(s,f,a,limit);curve(s,f);
    if(a>.1){[-a,a].forEach(v=>vertical(s,v,orange,.29,[4,4]));label(s,(-a).toFixed(3),s.x(-a)-3,s.y(.32),orange,'right',11);label(s,a.toFixed(3),s.x(a)+3,s.y(.32),orange,'left',11);}
    vertical(s,result.t,orange,.41);
  }
  root.TestingPlots={sampling,errorPlots,student,pvalue};
})(globalThis);
