(function(root){
  'use strict';
  function create(options){
    const motion=root.CIStandardizationMotion,{ease,mix,Y,S,LAST}=motion;
    const observedY='<mover><mi>y</mi><mo>¯</mo></mover>';
    const el=name=>document.getElementById(`standardize-${name}`),math=s=>`<math>${s}</math>`,fmt=(x,d=3)=>x.toFixed(d);
    const colors={blue:'#005a85',orange:'#be5827',green:'#28796a',ink:'#182632',muted:'#52636f',line:'#dbe2e6',ghost:'#c3cfd5'};
    let index=0,current=options.model(Number(el('n').value),Number(el('level').value)),position=0,player;
    let sampleFrame=null,sampleTicket=0,sampleStart=null,sampleFrom=null,displayed=current;
    const tokenNodes=new Map(),metrics=new Map();
    const measureHost=document.createElement('span');measureHost.className='derive-measure';measureHost.setAttribute('aria-hidden','true');el('equation-stage').append(measureHost);
    function setMath(node,html){const value=math(html);if(node.innerHTML!==value)node.innerHTML=value;}
    function measure(html){
      if(!metrics.has(html)){measureHost.innerHTML=math(html);const r=measureHost.firstElementChild.getBoundingClientRect();metrics.set(html,{width:Math.max(3,r.width),height:Math.max(20,r.height)});}
      return metrics.get(html);
    }
    function header(m){
      el('mean').textContent=fmt(m.mean);el('se').textContent=fmt(m.se);el('critical').textContent=fmt(m.c);el('trial').textContent=`標本 ${index+1}`;
      el('sample-back').disabled=index===0;el('sample-next').disabled=index===499;
    }
    function equation(p,m){
      const stage=Math.min(LAST,Math.floor(p)),next=Math.min(LAST,stage+1),t=p-stage;
      const a=motion.layout(motion.equation(stage,m),measure),b=motion.layout(motion.equation(next,m),measure);
      const widest=Math.max(...[2,6].map(i=>motion.layout(motion.equation(i,m),measure).width));
      const fit=Math.min(1,(el('equation-stage').clientWidth-38)/Math.max(widest,a.width,b.width));
      const terms=motion.terms(a,b,t,next),visible=new Set(terms.map(v=>v.id));
      for(const [id,node] of tokenNodes)if(!visible.has(id))node.style.opacity='0';
      for(const term of terms){
        let node=tokenNodes.get(term.id);
        if(!node){node=document.createElement('span');node.className='derive-token';node.dataset.term=term.id;node.setAttribute('aria-hidden','true');tokenNodes.set(term.id,node);el('equation-stage').append(node);}
        if(term.type==='bar'){node.style.width=`${term.width}px`;node.style.height='1px';node.style.background=colors.ink;}
        else if(node.dataset.html!==term.html){node.innerHTML=math(term.html);node.dataset.html=term.html;}
        node.style.color=colors[term.tone];node.style.left=`calc(50% + ${term.x*fit}px)`;node.style.top=`calc(50% + ${term.y*fit}px)`;
        node.style.transform=`translate(-50%,-50%) scale(${fit}) rotateY(${term.flip}deg)`;node.style.opacity=String(term.opacity);
      }
      const operation=['','<mo>−</mo><mi>μ</mi>',`<mo>÷</mo><mo>(</mo>${S}<mo>)</mo>`,'','<mo>↓</mo>',
        `<mo>×</mo>${S}`,`<mo>−</mo>${Y}`,'<mo>×</mo><mo>(</mo><mo>−</mo><mn>1</mn><mo>)</mo>',
        '<mo>⇔</mo>',`${observedY}<mo>=</mo><mn>${fmt(m.mean)}</mn>`];
      setMath(el('operation'),operation[t>0?next:stage]);
      const spoken=['標本平均の分布','母平均を引いた分布','標準化した分布',`P(−c ≤ Z ≤ c) = ${m.level/100}`,
        '−c ≤ (標本平均 − 母平均) / (σ / √n) ≤ c','−cσ / √n ≤ 標本平均 − 母平均 ≤ cσ / √n',
        '−標本平均 − cσ / √n ≤ −母平均 ≤ −標本平均 + cσ / √n',
        '標本平均 + cσ / √n ≥ 母平均 ≥ 標本平均 − cσ / √n',
        '標本平均 − cσ / √n ≤ 母平均 ≤ 標本平均 + cσ / √n',
        `${m.level}%信頼区間は${fmt(m.lower)}から${fmt(m.upper)}`];
      el('equation-stage').setAttribute('aria-label',spoken[stage]);
    }
    function canvas(name){
      const c=el(name),box=c.getBoundingClientRect(),w=Math.max(200,box.width),h=box.height,dpr=Math.min(3,window.devicePixelRatio||1);
      if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
      const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.lineCap='round';return {ctx,w,h};
    }
    function text(ctx,value,x,y,fill=colors.muted,size=12,align='center'){
      ctx.font=`${size}px 'STIX Two Math','Yu Gothic',Meiryo,serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=fill;ctx.fillText(value,x,y);
    }
    function line(ctx,x1,y1,x2,y2,color=colors.line,width=1,dash=[]){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);}
    function dot(ctx,x,y,fill=colors.orange,r=4){ctx.beginPath();ctx.fillStyle=fill;ctx.arc(x,y,r,0,2*Math.PI);ctx.fill();}
    function arrow(ctx,x1,y1,x2,y2,color=colors.orange){
      if(Math.hypot(x2-x1,y2-y1)<2)return;
      line(ctx,x1,y1,x2,y2,color,1.4);const angle=Math.atan2(y2-y1,x2-x1);
      line(ctx,x2,y2,x2-6*Math.cos(angle-.45),y2-6*Math.sin(angle-.45),color,1.4);
      line(ctx,x2,y2,x2-6*Math.cos(angle+.45),y2-6*Math.sin(angle+.45),color,1.4);
    }
    function axis(ctx,x,domain,base,width){
      line(ctx,x(domain[0]),base,x(domain[1]),base);
      const raw=(domain[1]-domain[0])/Math.max(3,Math.floor(width/75)),power=10**Math.floor(Math.log10(raw)),r=raw/power;
      const step=(r<=1?1:r<=2?2:r<=5?5:10)*power;
      for(let v=Math.ceil(domain[0]/step)*step;v<=domain[1]+1e-9;v+=step){line(ctx,x(v),base,x(v),base+4);text(ctx,Number(v.toFixed(2)).toString(),x(v),base+17,colors.muted,11);}
    }
    function curve(ctx,x,domain,base,center,sd,height,color,width=2,shade=null){
      if(shade){ctx.beginPath();ctx.moveTo(x(shade[0]),base);for(let i=0;i<=100;i++){const v=mix(shade[0],shade[1],i/100);ctx.lineTo(x(v),base-height*motion.density(v,center,sd));}ctx.lineTo(x(shade[1]),base);ctx.closePath();ctx.fillStyle=shade[2];ctx.fill();}
      ctx.beginPath();for(let i=0;i<=480;i++){const v=mix(domain[0],domain[1],i/480),y=base-height*motion.density(v,center,sd);if(i===0)ctx.moveTo(x(v),y);else ctx.lineTo(x(v),y);}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
    }
    function distributions(p,m){
      const {ctx,w,h}=canvas('density'),d=motion.distribution(m,p),left=28,right=w-24;
      const radius=Math.max(4.5*m.se,6),domain=[-radius,m.mu+radius],base=170;
      const x=v=>left+(v-domain[0])/(domain[1]-domain[0])*(right-left);
      axis(ctx,x,domain,base,w-52);
      curve(ctx,x,domain,base,m.mu,m.se,90*m.se*Math.sqrt(2*Math.PI),colors.ghost,1.2);
      curve(ctx,x,domain,base,d.center,d.sd,90*m.se*Math.sqrt(2*Math.PI),colors.blue,2);
      line(ctx,x(d.center),66,x(d.center),base,colors.blue,1,[3,4]);dot(ctx,x(d.value),base);
      text(ctx,'Ȳ',x(m.mu),17,colors.blue,17);
      if(p>0){text(ctx,'Ȳ − μ',x(0),17,colors.blue,17);arrow(ctx,x(m.mu),44,x(d.center),44);text(ctx,'− μ',(x(m.mu)+x(0))/2,29,colors.orange,16);}
      text(ctx,fmt(d.value,2),x(d.value),base+37,colors.orange,12);
      const range=4.5*Math.max(m.se,1),bottomDomain=[-range,range],bottom=h-40;
      const z=v=>left+(v+range)/(2*range)*(right-left),height=90*Math.min(m.se,1)*Math.sqrt(2*Math.PI);
      ctx.save();ctx.globalAlpha=ease(p);
      text(ctx,'Ȳ − μ  →  Z',w/2,228,colors.blue,17);
      text(ctx,'÷ (σ/√n)',w/2,254,colors.orange,16);
      axis(ctx,z,bottomDomain,bottom,w-52);
      curve(ctx,z,bottomDomain,bottom,0,m.se,height,colors.ghost,1.2);
      curve(ctx,z,bottomDomain,bottom,0,d.standardizedSD,height,colors.blue,2,
        d.shade>0?[-m.c,m.c,`rgba(0,90,133,${.18*d.shade})`]:null);
      line(ctx,z(0),bottom-109,z(0),bottom,colors.blue,1,[3,4]);dot(ctx,z(d.standardizedValue),bottom);
      if(d.shade>0){ctx.save();ctx.globalAlpha*=d.shade;line(ctx,z(-m.c),bottom,z(m.c),bottom,colors.green,3);
        text(ctx,`−${fmt(m.c,2)}`,z(-m.c)-3,bottom-15,colors.green,12,'right');text(ctx,fmt(m.c,2),z(m.c)+3,bottom-15,colors.green,12,'left');
        text(ctx,`${m.level}%`,right,bottom-105,colors.blue,14,'right');ctx.restore();}
      text(ctx,fmt(d.standardizedValue,2),z(d.standardizedValue),bottom+37,colors.orange,12);ctx.restore();
      setMath(el('standardized'),`${Y}<mo>=</mo><mn>${fmt(m.mean)}</mn>${p>=2?`<mspace width=".7em"/><mo>→</mo><mspace width=".7em"/><mi>Z</mi><mo>=</mo><mn>${fmt(m.z)}</mn>`:''}`);
      el('density').setAttribute('aria-label',`標準化。移動中の分布の平均${fmt(d.center)}，標準偏差${fmt(d.sd)}。伸縮中の分布の平均0，標準偏差${fmt(d.standardizedSD)}。標本平均${fmt(m.mean)}，Z = ${fmt(m.z)}。`);
    }
    function inverse(p,m){
      const {ctx,w,h}=canvas('interval'),f=motion.inverse(m,p),left=28,right=w-24,base=h-54,cy=88;
      const x=v=>left+(v-f.domain[0])/(f.domain[1]-f.domain[0])*(right-left);
      axis(ctx,x,f.domain,base,w-52);
      line(ctx,x(m.mu),34,x(m.mu),base,colors.blue,1);
      text(ctx,`μ = ${fmt(m.mu,0)}`,x(m.mu),18,colors.blue,13);
      ctx.save();ctx.globalAlpha=f.visible;
      const covered=m.lower<=m.mu&&m.mu<=m.upper,color=p>=7&&!covered?colors.orange:colors.green;
      line(ctx,x(f.a),cy,x(f.b),cy,color,3);
      for(const v of [f.a,f.b])line(ctx,x(v),cy-7,x(v),cy+7,color,2);
      if(!(p>6&&p<7)){
        text(ctx,fmt(Math.min(f.a,f.b),2),x(Math.min(f.a,f.b))-4,cy-21,color,12,'right');
        text(ctx,fmt(Math.max(f.a,f.b),2),x(Math.max(f.a,f.b))+4,cy-21,color,12,'left');
      }
      if(p>=6){dot(ctx,x(f.center),cy);text(ctx,p>=7?'Ȳ':'−Ȳ',x(f.center),cy+27,colors.orange,17);}
      ctx.restore();if(p>=7)text(ctx,'μ',w/2,h-8,colors.ink,16);
      if(p>=LAST)setMath(el('result'),`<mo>[</mo><mn>${fmt(m.lower)}</mn><mo>,</mo><mn>${fmt(m.upper)}</mn><mo>]</mo>`);
      else if(p>=8)setMath(el('result'),`<mo>[</mo>${Y}<mo>−</mo><mi>c</mi>${S}<mo>,</mo>${Y}<mo>+</mo><mi>c</mi>${S}<mo>]</mo>`);
      else el('result').innerHTML='';
      el('interval').setAttribute('aria-label',p<7?`不等式の変形。区間の端点${fmt(f.a)}，${fmt(f.b)}。`:
        `標本${index+1}。${m.level}%信頼区間は${fmt(m.lower)}から${fmt(m.upper)}。母平均${fmt(m.mu,0)}${m.lower<=m.mu&&m.mu<=m.upper?'を含みます。':'を含みません。'}`);
    }
    const phases=['標本平均の分布','母平均を引く','標準偏差で割る','中央の確率範囲','標準化した式を代入する','標準偏差を掛ける','標本平均を引く','符号を反転する','下限と上限を並べる','観測値を代入する'];
    function render(value,m=displayed){
      position=value;displayed=m;
      header(m);distributions(value,m);equation(value,m);inverse(value,m);
      el('position').textContent=Math.min(LAST+1,Math.floor(value+1e-8)+1);el('seek').value=String(value);el('seek').setAttribute('aria-valuetext',phases[Math.min(LAST,Math.floor(value+1e-8))]);
    }
    function finishSample(){sampleTicket++;if(sampleFrame!==null)cancelAnimationFrame(sampleFrame);sampleFrame=null;sampleStart=null;sampleFrom=null;displayed=current;el('samples').setAttribute('aria-busy','false');}
    function buttons(state){el('play').textContent=state.running?'一時停止':'再生';el('play').setAttribute('aria-pressed',String(state.running));el('back').disabled=state.position<=0;el('next').disabled=state.position>=LAST;}
    function sampleChange(nextIndex){
      player.seek(position);options.onPlay?.();const from=displayed;finishSample();index=Math.max(0,Math.min(499,nextIndex));current=options.model(Number(el('n').value),Number(el('level').value),index);
      sampleFrom=from;el('samples').setAttribute('aria-busy','true');const ticket=++sampleTicket;
      function step(time){if(ticket!==sampleTicket)return;if(sampleStart===null)sampleStart=time;const t=Math.min(1,(time-sampleStart)/850);render(position,motion.blendSample(sampleFrom,current,t));if(t<1)sampleFrame=requestAnimationFrame(step);else{finishSample();render(position,current);}}
      sampleFrame=requestAnimationFrame(step);
    }
    // Movement is the content of this demonstration and starts only after a user action.
    player=options.timeline({render,onState:buttons,onPlay:()=>{finishSample();options.onPlay?.();},duration:3000,holdDuration:2000,lastPosition:LAST,
      shouldRepeat:()=>el('repeat').checked,
      onAdvance:()=>{finishSample();index=(index+1)%500;current=options.model(Number(el('n').value),Number(el('level').value),index);displayed=current;}
    });player.reset();
    el('play').addEventListener('click',()=>player.view().running?player.pause():player.play());
    el('next').addEventListener('click',()=>player.next());el('back').addEventListener('click',()=>{finishSample();player.back();});
    el('reset').addEventListener('click',()=>{finishSample();player.reset();});
    el('seek').addEventListener('input',()=>{finishSample();player.seek(Number(el('seek').value));});
    el('speed').addEventListener('change',()=>player.setSpeed(Number(el('speed').value)));
    el('repeat').addEventListener('change',()=>{if(!el('repeat').checked&&player.view().holding)player.seek(LAST);});
    el('sample-back').addEventListener('click',()=>sampleChange(index-1));el('sample-next').addEventListener('click',()=>sampleChange(index+1));
    el('n').addEventListener('change',()=>{finishSample();index=0;current=options.model(Number(el('n').value),Number(el('level').value),index);displayed=current;player.reset();});
    el('level').addEventListener('change',()=>{player.pause();finishSample();current=options.model(Number(el('n').value),Number(el('level').value),index);displayed=current;player.seek(position);});
    document.fonts.ready.then(()=>{metrics.clear();render(position);});
    return {pause:()=>{player.pause();finishSample();render(position,current);},redraw:()=>{metrics.clear();render(position);}};
  }
  root.CIStandardizationView={create};
})(typeof globalThis!=='undefined'?globalThis:this);
