(function(root){
  'use strict';
  let parameters,designs=new Map();
  function configure(data){parameters=data.parameters;designs.clear();}
  function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return(s+.5)/4294967296;};}
  function design(n,type='continuous'){
    const key=type+'_'+n;if(designs.has(key))return designs.get(key);
    const x=Array.from({length:n},(_,i)=>type==='binary'?(i<n/2?0:1):4*i/(n-1));
    const mean=x.reduce((a,b)=>a+b,0)/n,sxx=x.reduce((a,b)=>a+(b-mean)**2,0),v=parameters.sigma**2;
    const result={x,mean,sxx,min:0,max:type==='binary'?1:4,sd0:Math.sqrt(v*(1/n+mean**2/sxx)),sd1:Math.sqrt(v/sxx)};
    designs.set(key,result);return result;
  }
  function ols(x,y){
    const n=x.length,mx=x.reduce((a,b)=>a+b,0)/n,my=y.reduce((a,b)=>a+b,0)/n;
    let xx=0,xy=0;for(let i=0;i<n;i++){xx+=(x[i]-mx)**2;xy+=(x[i]-mx)*(y[i]-my);}
    const b1=xy/xx;return{b0:my-b1*mx,b1};
  }
  function normalDraw(random){return Math.sqrt(-2*Math.log(random()))*Math.cos(2*Math.PI*random());}
  function errorDraw(model,random){
    if(model==='normal')return parameters.sigma*normalDraw(random);
    if(model==='skew')return parameters.sigma*(-Math.log(random())-1);
    if(model==='strong')return parameters.sigma*(Math.exp(normalDraw(random))-Math.exp(.5))/Math.sqrt(Math.E*(Math.E-1));
    throw new Error('Unknown error distribution: '+model);
  }
  function errorDensity(model,u){
    const sigma=parameters.sigma;
    if(model==='normal')return Math.exp(-.5*(u/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));
    if(model==='skew')return u< -sigma?0:Math.exp(-(u/sigma+1))/sigma;
    if(model==='strong'){
      const scale=sigma/Math.sqrt(Math.E*(Math.E-1)),l=u/scale+Math.exp(.5);
      return l<=0?0:Math.exp(-.5*Math.log(l)**2)/(l*scale*Math.sqrt(2*Math.PI));
    }
    throw new Error('Unknown error distribution: '+model);
  }
  function errorSupport(model){return model==='normal'?-Infinity:model==='skew'?-parameters.sigma:-parameters.sigma/Math.sqrt(Math.E-1);}
  function meanSample(model,n,random){
    const u=Array.from({length:n},()=>errorDraw(model,random)),y=u.map(v=>parameters.beta0+v);
    return{y,u,mean:y.reduce((a,b)=>a+b,0)/n};
  }
  function sample(model,n,random,type='continuous'){
    const d=design(n,type),u=d.x.map(()=>errorDraw(model,random));
    const y=u.map((v,i)=>parameters.beta0+parameters.beta1*d.x[i]+v);
    return{x:d.x,y,u,...ols(d.x,y)};
  }
  function moments(v){if(!v.length)return{mean:NaN,sd:NaN};const mean=v.reduce((a,b)=>a+b,0)/v.length;
    return{mean,sd:v.length>1?Math.sqrt(v.reduce((a,b)=>a+(b-mean)**2,0)/(v.length-1)):NaN};}
  function histogram(v,min,max,width){
    const bins=Math.max(1,Math.ceil((max-min)/width));width=(max-min)/bins;
    const counts=new Array(bins).fill(0);let outside=0;
    v.forEach(t=>{if(t<min||t>max){outside++;return;}counts[Math.min(bins-1,Math.floor((t-min)/width))]++;});
    return{counts,density:counts.map(c=>c/Math.max(1,v.length)/width),min,max,width,outside};
  }
  function fittedLines(records,excludedIndex=null){return records.b0.flatMap((b0,i)=>i===excludedIndex?[]:[{b0,b1:records.b1[i]}]);}
  function fittedRange(records,xmax){
    let lo=parameters.beta0,hi=parameters.beta0+parameters.beta1*xmax;
    for(const {b0,b1} of fittedLines(records)){lo=Math.min(lo,b0,b0+b1*xmax);hi=Math.max(hi,b0,b0+b1*xmax);}
    const pad=Math.max(.2,(hi-lo)*.08);return[lo-pad,hi+pad];
  }
  root.DemoCore={configure,rng,design,ols,sample,meanSample,errorDraw,errorDensity,errorSupport,moments,histogram,fittedLines,fittedRange};
  if(typeof module!=='undefined')module.exports=root.DemoCore;
})(typeof globalThis!=='undefined'?globalThis:this);
