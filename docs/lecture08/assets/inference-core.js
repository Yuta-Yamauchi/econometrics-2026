/* Deterministic independent samples; HC0 standard errors as in lecture 08. */
(function(root){
  'use strict';
  const criticals={0.9:1.6448536269514722,0.95:1.959963984540054,0.99:2.5758293035489004};
  const mean=x=>60+6*x-.3*x*x;
  const normal=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
  function random(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
  function gaussian(rng){return Math.sqrt(-2*Math.log(1-rng()))*Math.cos(2*Math.PI*rng());}
  function integrate(fn){const steps=4096,h=10/steps;let s=fn(0)+fn(10);for(let i=1;i<steps;i++)s+=(i%2?4:2)*fn(i*h);return s*h/3;}
  const populations=new Map();
  function population(kind){
    if(populations.has(kind))return populations.get(kind);
    if(!['uniform','short','long'].includes(kind))throw Error('Unknown population.');
    const mu=kind==='short'?2:8,raw=kind==='uniform'?()=>.1:x=>normal((x-mu)/3)/3;
    const mass=integrate(raw),density=x=>raw(x)/mass;
    const ex=integrate(x=>x*density(x)),ey=integrate(x=>mean(x)*density(x));
    const vx=integrate(x=>(x-ex)**2*density(x));
    const slope=integrate(x=>(x-ex)*(mean(x)-ey)*density(x))/vx,intercept=ey-slope*ex;
    const variance=integrate(x=>(x-ex)**2*(100+(mean(x)-intercept-slope*x)**2)*density(x))/(vx*vx);
    const result={kind,ex,ey,vx,slope,intercept,variance,density};populations.set(kind,result);return result;
  }
  function fit(x,y){
    if(x.length!==y.length||x.length<3)throw Error('A sample needs at least three paired observations.');
    const n=x.length,mx=x.reduce((a,b)=>a+b,0)/n,my=y.reduce((a,b)=>a+b,0)/n;
    let sxx=0,sxy=0;for(let i=0;i<n;i++){sxx+=(x[i]-mx)**2;sxy+=(x[i]-mx)*(y[i]-my);}
    if(!(sxx>0))throw Error('X has no variation.');
    const slope=sxy/sxx,intercept=my-slope*mx;
    let meat=0;for(let i=0;i<n;i++){const residual=y[i]-intercept-slope*x[i];meat+=(x[i]-mx)**2*residual**2;}
    return{intercept,slope,se:Math.sqrt(meat)/sxx,mx,my};
  }
  function sample(kind,n,index,keepPoints=true){
    if(![40,240,960].includes(n)||!Number.isInteger(index)||index<0||index>=5000)throw Error('Invalid sample settings.');
    const pop=population(kind),salt={uniform:101,short:211,long:307}[kind];
    const seed=(20261126^Math.imul(n,2654435761)^Math.imul(index+1,1597334677)^salt)>>>0,rng=random(seed);
    const x=[],y=[];for(let i=0;i<n;i++){
      let xi;if(kind==='uniform')xi=10*rng();else{do{xi=(kind==='short'?2:8)+3*gaussian(rng);}while(xi<0||xi>10);}
      const yi=mean(xi)+10*(-Math.log(1-rng())-1);x.push(xi);y.push(yi);
    }
    const fitted=fit(x,y),z=(fitted.slope-pop.slope)/fitted.se;
    return{...fitted,z,index,n,kind,...(keepPoints?{x,y}:{})};
  }
  function interval(result,level){const c=criticals[level];if(!c)throw Error('Unknown confidence level.');const margin=c*result.se;return{lower:result.slope-margin,upper:result.slope+margin,margin,covered:Math.abs(result.z)<=c};}
  function testCandidate(result,candidate,level){
    const critical=criticals[level];
    if(!critical||!(result.se>0)||!Number.isFinite(candidate))throw Error('Invalid candidate test.');
    const statistic=(result.slope-candidate)/result.se;
    // Include mathematical endpoints despite floating-point cancellation.
    const tolerance=16*Number.EPSILON*Math.max(1,Math.abs(result.slope),Math.abs(candidate));
    return{candidate,statistic,critical,rejected:Math.abs(result.slope-candidate)>critical*result.se+tolerance};
  }
  function candidateSweep(result,level,progress){
    const critical=criticals[level],span=critical+1.5,knots=[-span,-critical,0,critical,span];
    const position=Math.max(0,Math.min(5,progress)),step=Math.min(3,Math.floor(position)),fraction=Math.min(1,position-step);
    const offset=knots[step]+fraction*(knots[step+1]-knots[step]);
    const candidate=result.slope+offset*result.se,lower=result.slope-critical*result.se,upper=result.slope+critical*result.se;
    return{...testCandidate(result,candidate,level),progress:position,complete:position>=5,span,
      domain:[result.slope-span*result.se,result.slope+span*result.se],lower,upper,
      accepted:position>=1?[lower,Math.min(upper,candidate)]:null};
  }
  function summary(samples,level){const count=samples.length;const covered=samples.reduce((sum,s)=>sum+Number(interval(s,level).covered),0);const meanSlope=samples.reduce((sum,s)=>sum+s.slope,0)/count;return{count,covered,rate:covered/count,mean:meanSlope};}
  class Experiment{
    constructor(kind='uniform',n=240){this.kind=kind;this.n=n;this.results=[];this.population=population(kind);}
    ensure(count){const target=Math.min(5000,Math.max(1,Math.floor(count)));while(this.results.length<target)this.results.push(sample(this.kind,this.n,this.results.length,false));return this.results;}
    at(index){this.ensure(index+1);return sample(this.kind,this.n,index,true);}
  }
  root.InferenceCore={criticals,mean,normal,random,population,fit,sample,interval,testCandidate,candidateSweep,summary,Experiment};
})(globalThis);
