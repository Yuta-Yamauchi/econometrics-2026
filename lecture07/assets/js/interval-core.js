/* Student t probabilities use the same incomplete-beta calculation as lecture 06. */
(function(root){
  'use strict';
  const B=root.CICore||(typeof require==='function'?require('./ci-core.js'):null);
  function logGamma(z){const p=[676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);z-=1;let x=.99999999999980993;for(let i=0;i<p.length;i++)x+=p[i]/(z+i+1);const t=z+p.length-.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);}
  function betaFraction(a,b,x){const tiny=1e-300;let c=1,d=1-(a+b)*x/(a+1);if(Math.abs(d)<tiny)d=tiny;d=1/d;let h=d;for(let m=1;m<=300;m++){let aa=m*(b-m)*x/((a+2*m-1)*(a+2*m));d=1+aa*d;if(Math.abs(d)<tiny)d=tiny;c=1+aa/c;if(Math.abs(c)<tiny)c=tiny;d=1/d;h*=d*c;aa=-(a+m)*(a+b+m)*x/((a+2*m)*(a+2*m+1));d=1+aa*d;if(Math.abs(d)<tiny)d=tiny;c=1+aa/c;if(Math.abs(c)<tiny)c=tiny;d=1/d;const delta=d*c;h*=delta;if(Math.abs(delta-1)<3e-14)break;}return h;}
  function ibeta(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(logGamma(a+b)-logGamma(a)-logGamma(b)+a*Math.log(x)+b*Math.log1p(-x));return x<(a+1)/(a+b+2)?bt*betaFraction(a,b,x)/a:1-bt*betaFraction(b,a,1-x)/b;}
  function tPdf(x,df){return Math.exp(logGamma((df+1)/2)-logGamma(df/2)) / Math.sqrt(df*Math.PI) * (1+x*x/df)**(-(df+1)/2);}
  function tP(x,df){return ibeta(df/(df+x*x),df/2,.5);}
  const quantiles=new Map();
  function critical(level,n){
    const key=`${level}:${n}`;if(quantiles.has(key))return quantiles.get(key);
    let lo=0,hi=20;for(let i=0;i<65;i++){const mid=(lo+hi)/2;if(tP(mid,n-2)>1-level/100)lo=mid;else hi=mid;}
    const c=(lo+hi)/2;quantiles.set(key,c);return c;
  }
  function sample(n,index){
    const s=B.sample('regression',n,index);
    return{...s,slope:s.estimate,se:s.estimatedSE,mx:B.moments(s.x).mean,my:B.moments(s.y).mean};
  }
  function interval(s,level){const c=critical(level,s.n),margin=c*s.se;return{c,margin,lower:s.slope-margin,upper:s.slope+margin,covered:Math.abs(s.slope-1.5)<=margin};}
  function testCandidate(s,candidate,level){
    const c=critical(level,s.n),statistic=(s.slope-candidate)/s.se;
    const tolerance=16*Number.EPSILON*Math.max(1,Math.abs(s.slope),Math.abs(candidate));
    return{candidate,statistic,critical:c,df:s.n-2,p:tP(statistic,s.n-2),rejected:Math.abs(s.slope-candidate)>c*s.se+tolerance};
  }
  function sweep(s,level,progress){
    const c=critical(level,s.n),span=c+1.5,knots=[-span,-c,0,c,span];
    const position=Math.max(0,Math.min(5,progress)),step=Math.min(3,Math.floor(position)),fraction=Math.min(1,position-step);
    const candidate=s.slope+(knots[step]+fraction*(knots[step+1]-knots[step]))*s.se;
    const lower=s.slope-c*s.se,upper=s.slope+c*s.se;
    return{...testCandidate(s,candidate,level),progress:position,complete:position>=5,span,alpha:1-level/100,
      domain:[s.slope-span*s.se,s.slope+span*s.se],lower,upper,accepted:position>=1?[lower,Math.min(upper,candidate)]:null};
  }
  const pools=new Map();
  function pool(n){
    if(pools.has(n))return pools.get(n);
    const results=[];let half=1,extent=4,ymin=-6,ymax=16;
    for(let i=0;i<5000;i++){
      const {x,y,...s}=sample(n,i),ci=interval(s,99);
      results.push(s);half=Math.max(half,Math.abs(s.slope-1.5)+ci.margin);extent=Math.max(extent,Math.abs((s.slope-1.5)/s.se));
      for(const v of y){ymin=Math.min(ymin,v);ymax=Math.max(ymax,v);}
    }
    half=Math.ceil(half*1.06*2)/2;extent=Math.ceil(extent*1.06);
    const result={results,slopeDomain:[1.5-half,1.5+half],tDomain:[-extent,extent],yDomain:[Math.floor(ymin/2)*2,Math.ceil(ymax/2)*2]};
    pools.set(n,result);return result;
  }
  const original=sample(100,0),residual=original.y.map((v,i)=>(v-original.intercept-original.slope*original.x[i])*1.5/original.sd);
  function width(mode,value){
    const copies=mode==='n'?Number(value):1,n=100*copies;
    const scale=mode==='spread'?Number(value):1,noise=mode==='noise'?Number(value):1,level=mode==='level'?Number(value):95;
    const x=[],y=[],errors=[];
    for(let k=0;k<copies;k++){
      if(k===0)errors.push(...residual);
      else{const normal=B.normalGenerator(20261126+k),raw=original.x.map(()=>normal()),fit=B.ols(original.x,raw);errors.push(...raw.map((v,i)=>(v-fit.intercept-fit.slope*original.x[i])*1.5/fit.sd));}
      x.push(...original.x.map(v=>2+scale*(v-2)));
    }
    const adjust=Math.sqrt((n-2)/(copies*98));
    for(let i=0;i<n;i++)y.push(2+1.5*x[i]+errors[i]*noise*adjust);
    const fit=B.ols(x,y),s={...fit,n,x,y,mx:2,my:5,level};return{...s,...interval(s,level),width:2*critical(level,n)*s.se};
  }
  // Saved values in the lecture's results/effect_size_examples.csv.
  const effects=[
    {n:100,slope:.01,se:.02,t:.5,p:.618195947936797,lower:-.0296893490901728,upper:.0496893490901672},
    {n:10000,slope:.01,se:.002,t:5,p:5.83034620877677e-7,lower:.00607959742528567,upper:.013920402574713}
  ];
  const api={sample,interval,testCandidate,sweep,critical,tPdf,tP,pool,width,effects};
  root.IntervalCore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
