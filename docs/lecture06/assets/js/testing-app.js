(function(){
  'use strict';
  const C=TestingCore,P=TestingPlots,$=id=>document.getElementById(id);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const motions=[];
  const stopAll=()=>motions.forEach(m=>m.pause());
  const pct=p=>(100*p).toFixed(1)+'%';
  class ValueMotion{
    constructor(button,from,to,duration,paint,label){Object.assign(this,{button,from,to,duration,paint,label,value:from,progress:0,running:false,raf:null});motions.push(this);button.addEventListener('click',()=>this.toggle());}
    pause(){this.running=false;if(this.raf!==null)cancelAnimationFrame(this.raf);this.raf=null;this.button.textContent=this.label;}
    set(value){this.pause();this.value=value;this.paint(value);}
    toggle(){if(this.running){this.pause();return;}stopAll();if(Math.abs(this.value-this.to)<.001)this.value=this.from;if(reduced.matches){this.value=this.to;this.paint(this.value);return;}this.start=this.value;this.started=performance.now();this.running=true;this.button.textContent='一時停止';this.tick();}
    tick(){if(!this.running)return;const p=Math.min(1,(performance.now()-this.started)/this.duration);const t=p*p*(3-2*p);this.value=this.start+(this.to-this.start)*t;this.paint(this.value);if(p===1)this.pause();else this.raf=requestAnimationFrame(()=>this.tick());}
  }
  class Trials{
    constructor(prefix,n,paint){Object.assign(this,{prefix,n,paint,history:[],progress:0,running:false,raf:null,speed:1,committed:false});this.current=C.sample(n,0);motions.push(this);
      $(prefix+'-play').addEventListener('click',()=>this.toggle());$(prefix+'-step').addEventListener('click',()=>this.step());$(prefix+'-reset').addEventListener('click',()=>this.reset());$(prefix+'-batch').addEventListener('click',()=>this.batch());}
    show(){this.paint(this);}
    pause(){this.running=false;if(this.raf!==null)cancelAnimationFrame(this.raf);this.raf=null;$(this.prefix+'-play').textContent='再生';}
    next(){this.current=C.sample(this.n,this.history.length);this.progress=0;this.committed=false;}
    commit(){if(!this.committed){this.history.push(this.current);this.committed=true;}}
    toggle(){if(this.running){this.pause();return;}stopAll();if(this.committed)this.next();this.running=true;this.last=performance.now();$(this.prefix+'-play').textContent='一時停止';this.tick();}
    tick(){if(!this.running)return;const now=performance.now(),dt=Math.min(100,now-this.last);this.last=now;this.progress+=dt*this.speed/(reduced.matches?1000:2400);if(this.progress>=1)this.commit();this.show();if(this.progress>=1.25){if(this.history.length>=10000){this.pause();return;}this.next();}this.raf=requestAnimationFrame(()=>this.tick());}
    step(){this.pause();if(this.committed)this.next();this.progress=1;this.commit();this.show();}
    batch(count=100){this.pause();for(let i=0;i<count;i++){this.current=C.sample(this.n,this.history.length);this.history.push(this.current);}this.progress=1;this.committed=true;this.show();}
    reset(){this.pause();this.history=[];this.next();this.show();}
    visualProgress(){return reduced.matches?(this.progress<.33?0:this.progress<.67?.5:1):Math.min(1,this.progress);}
  }
  let alpha=.05;
  const sampling=new Trials('sample',25,state=>{
    const p=state.visualProgress(),c=C.critical(alpha),hits=state.history.filter(v=>Math.abs(v.z)>c).length,total=state.history.length;
    P.sampling(state.current,p,state.history,alpha);
    $('sample-mean').textContent=p>=.35?'標本平均 '+state.current.mean.toFixed(2):'標本平均 —';
    $('sample-z').textContent=p>=.65?'Z = '+state.current.z.toFixed(3):'Z = —';
    $('sample-count').textContent=total.toLocaleString()+'回';
    $('sample-result').textContent='誤って棄却 '+hits+' / '+total+' 回'+(total?'（'+pct(hits/total)+'）':'');
    $('sample-rule').textContent='棄却域：Z < −'+c.toFixed(3)+' または Z > '+c.toFixed(3);
    ['sample-panel','average-panel','statistic-panel'].forEach((id,i)=>$(id).classList.toggle('active',i===(p<.35?0:p<.65?1:2)));
  });
  $('sample-speed').addEventListener('change',e=>sampling.speed=+e.target.value);
  $('sample-alpha').addEventListener('change',e=>{alpha=+e.target.value;sampling.show();});
  $('sample-restore').addEventListener('click',()=>{sampling.reset();sampling.batch(500);});
  function errorPaint(c){$('error-boundary').value=c;$('boundary-value').textContent=c.toFixed(1);const e=C.errors(c);P.errorPlots(c);$('error-one-value').textContent=pct(e.one);$('error-two-value').textContent=pct(e.two);}
  const errors=new ValueMotion($('error-play'),4,6,3500,errorPaint,'4から6へ動かす');
  $('error-boundary').addEventListener('input',e=>errors.set(+e.target.value));
  $('error-reset').addEventListener('click',()=>errors.set(4));
  let studentAlpha=.05,studentRates;
  const student=new Trials('student',25,state=>{
    const p=state.visualProgress(),m=state.current;
    P.student(m,p,state.history,studentAlpha);
    $('student-count').textContent=state.history.length.toLocaleString()+'回';
    $('student-mean').textContent=p>=.35?'標本平均 '+m.mean.toFixed(2):'標本平均 —';
    $('student-se').textContent=p>=.62?'s / √n = '+m.se.toFixed(3):'s / √n = —';
    $('student-df').textContent='自由度'+(m.n-1)+(p>=.7?'　T = '+((m.mean-45)/m.se).toFixed(3):'');
    studentRates=C.rejectionRates(state.history,m.n,studentAlpha);
    const zc=studentRates.zCritical.toFixed(3),tc=studentRates.tCritical.toFixed(3);
    $('student-critical').textContent='両側'+pct(studentAlpha)+'の臨界値：t分布 '+tc+'　標準正規分布 '+zc;
    for(const [id,key,stat,cutoff] of [['z','z','Z',zc],['t-normal','tNormal','T',zc],['t','t','T',tc]]){
      const result=studentRates[key];
      $('student-'+id+'-rule').textContent='棄却域：|'+stat+'| > '+cutoff;
      $('student-'+id+'-rate').textContent=result.rate===null?'—':pct(result.rate);
      $('student-'+id+'-count').textContent='誤って棄却 '+result.count.toLocaleString()+' / '+studentRates.total.toLocaleString()+' 回';
      $('student-'+id+'-theory').textContent='理論上の棄却率 '+pct(result.theory);
    }
    $('student-comparison-title').textContent='同じ標本で比べる誤って棄却した割合（有意水準'+pct(studentAlpha)+'）';
  });
  $('student-size').addEventListener('change',e=>{student.n=+e.target.value;student.reset();});
  $('student-alpha').addEventListener('change',e=>{studentAlpha=+e.target.value;student.show();});
  $('student-restore').addEventListener('click',()=>{student.reset();student.batch(10000);});
  const originalMean=C.moments(TestingData.meanY).mean;
  let pAlpha=.05,pResult,observedMean=originalMean;
  function candidatePaint(value){$('candidate').value=value;$('candidate-value').textContent=value.toFixed(1);
    // Translate every observation equally so n, sample variance, and standard error stay fixed.
    const shifted=TestingData.meanY.map(y=>y+observedMean-originalMean);
    pResult=C.test(shifted,value);P.pvalue(pResult);
    $('observed-mean').value=observedMean;
    $('observed-mean').setAttribute('aria-valuetext','標本平均 '+observedMean.toFixed(2));
    $('observed-mean-value').textContent=observedMean.toFixed(2);
    $('p-sample-summary').textContent='標本数'+pResult.n+'，標準誤差'+pResult.se.toFixed(3)+'を固定して，標本平均の位置を変える。';
    $('p-statistic').textContent='T = '+pResult.t.toFixed(3);
    $('p-comparison').textContent=(pResult.p<.001?'p < 0.001':'p = '+pResult.p.toFixed(3))+(pResult.p<pAlpha?' < ':' ≥ ')+pAlpha.toFixed(2);
    $('p-level').textContent=pct(pAlpha);
    $('p-null').textContent=value.toFixed(1);
    $('p-verdict').textContent=pResult.p<pAlpha?'棄却する。':'棄却しない。';
  }
  const candidate=new ValueMotion($('candidate-play'),45,50,4000,candidatePaint,'45から50へ動かす');
  $('candidate').addEventListener('input',e=>candidate.set(+e.target.value));
  $('candidate-reset').addEventListener('click',()=>candidate.set(45));
  $('observed-mean').addEventListener('input',e=>{candidate.pause();observedMean=+e.target.value;candidatePaint(candidate.value);});
  $('observed-mean-reset').addEventListener('click',()=>{candidate.pause();observedMean=originalMean;candidatePaint(candidate.value);});
  $('p-alpha').addEventListener('change',e=>{pAlpha=+e.target.value;candidatePaint(candidate.value);});
  function redraw(){sampling.show();errorPaint(errors.value);student.show();candidatePaint(candidate.value);}
  document.addEventListener('keydown',e=>{if(e.key==='Escape')stopAll();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});
  const observer=new IntersectionObserver(entries=>{for(const e of entries)if(!e.isIntersecting){const map={sampling,errors,student,pvalue:candidate};map[e.target.id]?.pause();}},{threshold:0});
  ['sampling','errors','student','pvalue'].forEach(id=>observer.observe($(id)));
  let resizePending=false;window.addEventListener('resize',()=>{if(!resizePending){resizePending=true;requestAnimationFrame(()=>{resizePending=false;redraw();});}});
  document.fonts.ready.then(redraw);redraw();
  rootExpose();
  function rootExpose(){globalThis.TestingApp={stopAll,redraw,snapshot:()=>({sampling:{count:sampling.history.length,running:sampling.running,alpha},student:{count:student.history.length,n:student.n,running:student.running,alpha:studentAlpha,rejections:studentRates},boundary:errors.value,candidate:candidate.value,observedMean,originalMean,se:pResult.se,p:pResult.p,t:pResult.t,pAlpha,reduced:reduced.matches})};}
})();
