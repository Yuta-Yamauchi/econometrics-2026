(function(root){
  'use strict';
  function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
  function normal(seed){const u=rng(seed);let spare=null;return()=>{if(spare!==null){const x=spare;spare=null;return x;}const r=Math.sqrt(-2*Math.log(1-u())),a=2*Math.PI*u();spare=r*Math.sin(a);return r*Math.cos(a);};}
  function moments(y){const n=y.length,mean=y.reduce((a,b)=>a+b,0)/n;const sd=Math.sqrt(y.reduce((s,x)=>s+(x-mean)**2,0)/(n-1));return{n,mean,sd,se:sd/Math.sqrt(n)};}
  function sample(n,i){const z=normal((20261112^Math.imul(n,2654435761)^Math.imul(i+1,1597334677))>>>0);const y=Array.from({length:n},()=>45+10*z());return{...moments(y),y,z:(moments(y).mean-45)/(10/Math.sqrt(n))};}
  function pdf(x){return Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);}
  function cdf(x){const a=Math.abs(x),t=1/(1+.2316419*a);const q=pdf(a)*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>=0?1-q:q;}
  function logGamma(z){const p=[676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);z-=1;let x=.99999999999980993;for(let i=0;i<p.length;i++)x+=p[i]/(z+i+1);const t=z+p.length-.5;return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);}
  function betaFraction(a,b,x){const tiny=1e-300;let c=1,d=1-(a+b)*x/(a+1);if(Math.abs(d)<tiny)d=tiny;d=1/d;let h=d;for(let m=1;m<=300;m++){let aa=m*(b-m)*x/((a+2*m-1)*(a+2*m));d=1+aa*d;if(Math.abs(d)<tiny)d=tiny;c=1+aa/c;if(Math.abs(c)<tiny)c=tiny;d=1/d;h*=d*c;aa=-(a+m)*(a+b+m)*x/((a+2*m)*(a+2*m+1));d=1+aa*d;if(Math.abs(d)<tiny)d=tiny;c=1+aa/c;if(Math.abs(c)<tiny)c=tiny;d=1/d;const delta=d*c;h*=delta;if(Math.abs(delta-1)<3e-14)break;}return h;}
  function ibeta(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(logGamma(a+b)-logGamma(a)-logGamma(b)+a*Math.log(x)+b*Math.log1p(-x));return x<(a+1)/(a+b+2)?bt*betaFraction(a,b,x)/a:1-bt*betaFraction(b,a,1-x)/b;}
  function tPdf(x,df){return Math.exp(logGamma((df+1)/2)-logGamma(df/2)) / Math.sqrt(df*Math.PI) * (1+x*x/df)**(-(df+1)/2);}
  function tP(x,df){return ibeta(df/(df+x*x),df/2,.5);}
  function critical(alpha,df=null){let lo=0,hi=20;for(let i=0;i<70;i++){const mid=(lo+hi)/2,p=df===null?2*cdf(-mid):tP(mid,df);if(p>alpha)lo=mid;else hi=mid;}return(lo+hi)/2;}
  function errors(c){return{one:2*cdf(-c/2),two:cdf((c-5)/2)-cdf((-c-5)/2)};}
  function test(y,candidate){const m=moments(y),t=(m.mean-candidate)/m.se;return{...m,candidate,t,p:tP(t,m.n-1)};}
  function rejectionRates(samples,n,alpha=.05){
    const zCritical=critical(alpha),tCritical=critical(alpha,n-1);
    const counts={z:0,tNormal:0,t:0};
    for(const s of samples){
      const z=(s.mean-45)/(10/Math.sqrt(n)),t=(s.mean-45)/s.se;
      if(Math.abs(z)>zCritical)counts.z++;
      if(Math.abs(t)>zCritical)counts.tNormal++;
      if(Math.abs(t)>tCritical)counts.t++;
    }
    const total=samples.length,theory={z:2*cdf(-zCritical),tNormal:tP(zCritical,n-1),t:tP(tCritical,n-1)};
    return{total,n,alpha,zCritical,tCritical,...Object.fromEntries(Object.entries(counts).map(([key,count])=>[key,{count,rate:total?count/total:null,theory:theory[key]}]))};
  }
  const api={rng,normal,moments,sample,pdf,cdf,tPdf,tP,critical,errors,test,rejectionRates};
  root.TestingCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
