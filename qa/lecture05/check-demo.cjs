process.chdir(require('node:path').resolve(__dirname,'../..'));
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),C=require('../../docs/lecture05/assets/js/demo-core.js');
const context={window:{}};vm.runInNewContext(fs.readFileSync('docs/lecture05/assets/js/demo-data.js','utf8'),context);const data=context.window.DEMO_DATA;C.configure(data);
let maximumFitError=0;
for(const [key,s] of Object.entries(data.scenarios)){
  const [type,model,nn]=key.split('_'),n=Number(nn),d=C.design(n,type);
  assert.equal(s.b0.length,500);assert.equal(s.b1.length,500);
  assert.equal(C.fittedLines(s).length,500);assert.equal(C.fittedLines(s,499).length,499);
  const range=C.fittedRange(s,d.max);
  s.examples.forEach((e,i)=>{const fit=C.ols(d.x,e.y);maximumFitError=Math.max(maximumFitError,Math.abs(fit.b0-s.b0[i]),Math.abs(fit.b1-s.b1[i]));
    assert.ok(fit.b0>range[0]&&fit.b0<range[1]);assert.ok(fit.b0+fit.b1*d.max>range[0]&&fit.b0+fit.b1*d.max<range[1]);});
  for(const coef of ['b0','b1']){const vals=s[coef],lo=Math.min(...vals)-1,hi=Math.max(...vals)+1,h=C.histogram(vals,lo,hi,(hi-lo)/50);
    assert.equal(h.outside,0);assert.equal(h.counts.reduce((a,b)=>a+b,0),500);}
}
assert.ok(maximumFitError<1e-12);
const mc=[];
for(const type of ['continuous','binary'])for(const model of ['normal','skew','strong']){
  const random=C.rng(24681357),b0=[],b1=[],errorAtFirst=[],errorAtLast=[],d=C.design(20,type);
  for(let i=0;i<20000;i++){const s=C.sample(model,20,random,type);b0.push(s.b0);b1.push(s.b1);errorAtFirst.push(s.u[0]);errorAtLast.push(s.u[19]);}
  const m0=C.moments(b0),m1=C.moments(b1);
  assert.ok(Math.abs(m0.mean-2)<5*d.sd0/Math.sqrt(20000));assert.ok(Math.abs(m1.mean-1.5)<5*d.sd1/Math.sqrt(20000));
  assert.ok(Math.abs(m0.sd/d.sd0-1)<.05);assert.ok(Math.abs(m1.sd/d.sd1-1)<.05);
  // The lognormal error has a larger fourth moment, so a 20,000-draw variance estimate varies more.
  for(const v of [errorAtFirst,errorAtLast]){const m=C.moments(v);assert.ok(Math.abs(m.mean)<.06);assert.ok(Math.abs(m.sd/1.5-1)<(model==='strong'?.15:.06));}
  mc.push({design:type,model,beta0:m0,beta1:m1,theory:{sd0:d.sd0,sd1:d.sd1},errorSD:[C.moments(errorAtFirst).sd,C.moments(errorAtLast).sd]});
}
const html=fs.readFileSync('docs/lecture05/index.html','utf8');
assert.ok(html.includes('STIXTwoMath-Regular.otf'));assert.ok(html.includes('<math '));assert.ok(html.includes('<mover accent="true">'));
assert.ok(!/<a[^>]+href="(?:https?:|\/\/)/.test(html));assert.ok(!html.includes('講義スライド'));assert.ok(!html.includes('生成条件'));assert.ok(!html.includes('<details'));
assert.ok(html.indexOf('id="scatter"')<html.indexOf('id="regression-zoom"'));assert.ok(html.indexOf('id="regression-zoom"')<html.indexOf('id="sampling"'));
assert.ok(html.indexOf('id="mean-experiment"')<html.indexOf('id="experiment"'));
assert.ok(html.includes('id="mean-error-shape"')&&html.includes('id="error-shape"'));
const meanChecks=[];
for(const [key,s] of Object.entries(data.means)){
  const [model,nn]=key.split('_'),n=Number(nn),theory=data.parameters.sigma/Math.sqrt(n);
  assert.equal(s.values.length,500);
  s.examples.forEach((e,i)=>assert.equal(e.y.reduce((a,b)=>a+b,0)/n,s.values[i]));
  const random=C.rng(s.seed+1000000),values=[];
  for(let i=0;i<10000;i++)values.push(C.meanSample(model,n,random).mean);
  const moments=C.moments(values);
  assert.ok(Math.abs(moments.mean-2)<6*theory/100);
  assert.ok(Math.abs(moments.sd/theory-1)<.07);
  meanChecks.push({model,n,...moments,theoreticalSD:theory});
}
// Integrate the displayed analytic density independently of the random generator.
const densityChecks=[];
for(const model of ['normal','skew','strong']){
  const dx=.0005;let mass=0,mean=0,second=0;
  for(let u=-6+dx/2;u<300;u+=dx){const weight=C.errorDensity(model,u)*dx;mass+=weight;mean+=u*weight;second+=u*u*weight;}
  assert.ok(Math.abs(mass-1)<.001);assert.ok(Math.abs(mean)<.001);assert.ok(Math.abs(second-2.25)<.01);
  densityChecks.push({model,mass,mean,secondMoment:second});
}
const report={scenarios:Object.keys(data.scenarios).length,meanScenarios:Object.keys(data.means).length,trialsPerScenario:500,maximumFitError,homoskedasticNoiseChecked:true,monteCarlo:mc,meanChecks,densityChecks,
  mathMLAndLocalFont:true,externalAndDownloadLinksRemoved:true,plotOrder:['scatter','regression-zoom','sampling']};
fs.writeFileSync('qa/lecture05/demo-checks.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
