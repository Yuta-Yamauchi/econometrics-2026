(function(root){
  'use strict';
  const core=root.CICore||(typeof require==='function'?require('./ci-core.js'):null);
  function model(n,level,index=0){
    const sample=core.sample('mean',n,index),interval=core.interval(sample,level,'known');
    return {n,level,index,mu:sample.truth,mean:sample.estimate,sigma:10,se:interval.se,c:interval.c,
      z:(sample.estimate-sample.truth)/interval.se,halfWidth:interval.halfWidth,lower:interval.lower,upper:interval.upper};
  }
  function create(options={}){return root.CIStandardizationView.create({...options,model,timeline:root.CIDerivation.timeline});}
  const api={model,create};root.CIStandardization=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
