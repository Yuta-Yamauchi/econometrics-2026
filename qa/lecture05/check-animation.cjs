process.chdir(require('node:path').resolve(__dirname,'../..'));
const assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('../../docs/lecture05/assets/js/animation.js');
let nextId=0,clock=0,draws=0,started=0,frames=new Map(),committed=[],limit=10;
const animation=create({duration:1000,sample:()=>({id:++started}),onStart:()=>{},paint:()=>draws++,
  commit:s=>committed.push(s.id),canContinue:()=>committed.length<limit,
  requestFrame:fn=>{frames.set(++nextId,fn);return nextId;},cancelFrame:id=>frames.delete(id)});
function tick(ms=100){clock+=ms;const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn(clock));}
animation.play();tick();tick();tick();
assert.equal(committed.length,0);
const partial=animation.view().progress,stale=[...frames.values()][0];
animation.pause();stale(clock+1000);assert.equal(animation.view().progress,partial);
assert.equal(committed.length,0);assert.equal(frames.size,0);
animation.play();for(let i=0;i<10;i++)tick();
assert.equal(committed.length,1);assert.equal(committed[0],1);
animation.pause();animation.step();assert.equal(committed.length,2);assert.equal(started,2);
animation.play();tick();tick();const oldCallback=[...frames.values()][0];
animation.reset();oldCallback(clock+10000);
assert.equal(committed.length,2);assert.equal(animation.view().pending,false);
animation.step();assert.deepEqual(committed,[1,2,4]);
animation.setSpeed(4);animation.play();tick();tick();tick();tick();
assert.equal(committed.length,4);
animation.pause();limit=5;animation.step();animation.play();
assert.equal(committed.length,5);assert.equal(animation.view().running,false);
assert.equal(new Set(committed).size,committed.length);
assert.ok(draws>committed.length);
animation.reset();limit=500;committed=[];started=0;animation.play();
for(let i=0;i<2500;i++)tick();
assert.equal(committed.length,500);assert.equal(started,500);
assert.equal(animation.view().running,false);assert.equal(frames.size,0);
animation.play();animation.step();assert.equal(committed.length,500);
const result={pausePreservesPendingTrial:true,resumeCommitsOnce:true,stepCompletesPendingTrial:true,
  resetDiscardsPendingTrial:true,staleCallbacksIgnored:true,speedControl:true,trialLimit:500,stopsExactlyAtLimit:true};
fs.writeFileSync('qa/lecture05/animation-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
