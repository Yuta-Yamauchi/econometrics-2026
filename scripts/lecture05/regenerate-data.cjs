// Run from any working directory. Requires only Node.js built-in modules.
process.chdir(require('node:path').resolve(__dirname,'../..'));
const fs=require('node:fs'),C=require('../../docs/lecture05/assets/js/demo-core.js');
const data={seed:20261103,repetitions:500,parameters:{beta0:2,beta1:1.5,sigma:1.5},scenarios:{},means:{}};
C.configure(data);
const designs=['continuous','binary'],models=['normal','skew','strong'],ns=[20,200,2000];
for(const design of designs)for(const model of models)for(const n of ns){
  // Retain the original twelve scenario seeds and results.
  const serial=model==='strong'?13+designs.indexOf(design)*3+ns.indexOf(n):1+designs.indexOf(design)*6+models.indexOf(model)*3+ns.indexOf(n);
  const seed=data.seed+serial*100000,random=C.rng(seed),s={b0:[],b1:[],examples:[],seed};
  for(let i=0;i<data.repetitions;i++){
    const fit=C.sample(model,n,random,design);s.b0.push(fit.b0);s.b1.push(fit.b1);
    if(i<5)s.examples.push({y:fit.y,b0:fit.b0,b1:fit.b1});
  }
  data.scenarios[`${design}_${model}_${n}`]=s;
}
for(const model of models)for(const n of ns){
  const seed=data.seed+(21+models.indexOf(model)*3+ns.indexOf(n))*100000,random=C.rng(seed),s={values:[],examples:[],seed};
  for(let i=0;i<data.repetitions;i++){
    const sample=C.meanSample(model,n,random);s.values.push(sample.mean);
    if(i<5)s.examples.push({y:sample.y,mean:sample.mean});
  }
  data.means[`${model}_${n}`]=s;
}
fs.writeFileSync('docs/lecture05/assets/js/demo-data.js','window.DEMO_DATA='+JSON.stringify(data)+';\n');
fs.writeFileSync('qa/lecture05/demo-generation.json',JSON.stringify({seed:data.seed,parameters:data.parameters,repetitions:data.repetitions,
  scenarios:Object.fromEntries(Object.entries(data.scenarios).map(([k,s])=>[k,{seed:s.seed,count:s.b1.length,b0:C.moments(s.b0),b1:C.moments(s.b1)}])),
  means:Object.fromEntries(Object.entries(data.means).map(([k,s])=>[k,{seed:s.seed,count:s.values.length,...C.moments(s.values)}]))},null,2)+'\n');
console.log('18 regression and 9 sample-mean scenarios generated, 500 trials each.');
