(function(root){
  'use strict';
  function create(options){
    const motion=root.CIDerivationMotion,{ease,mix,Y,S,LAST}=motion;
    const observedY='<mover><mi>y</mi><mo>¯</mo></mover>';
    const el=name=>document.getElementById(`derive-${name}`),math=s=>`<math>${s}</math>`,fmt=(x,d=3)=>x.toFixed(d);
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
      const widest=motion.layout(motion.equation(4,m),measure).width;
      const fit=Math.min(1,(el('equation-stage').clientWidth-18)/Math.max(widest,a.width,b.width));
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
      const operation=['',`<mi>h</mi><mo>=</mo><mi>c</mi>${S}`,'<mo>↓</mo>',
        '<mo>×</mo><mo>(</mo><mo>−</mo><mn>1</mn><mo>)</mo>',`<mo>+</mo>${observedY}`,'<mo>⇔</mo>',`${observedY}<mo>=</mo><mn>${fmt(m.mean)}</mn>`];
      setMath(el('operation'),operation[t>0?next:stage]);
      const spoken=['母平均 = 標本平均 − 推定誤差',`P(−h ≤ E ≤ h) = ${m.level/100}`,'−h ≤ E ≤ h',
        'h ≥ −E ≥ −h','標本平均 + h ≥ 母平均 ≥ 標本平均 − h','標本平均 − h ≤ 母平均 ≤ 標本平均 + h',
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
      const {ctx,w,h}=canvas('density'),d=motion.distribution(m,p),left=28,right=w-24,r=4.5*m.se,domain=[-r,r];
      const x=v=>left+(v+r)/(2*r)*(right-left),base=173,copyBase=h-58;
      axis(ctx,x,domain,base,w-52);
      curve(ctx,x,domain,base,0,m.se,112*m.se*Math.sqrt(2*Math.PI),colors.blue,2,
        d.shade>0?[d.lower,d.upper,`rgba(0,90,133,${.18*d.shade})`]:null);
      line(ctx,x(0),36,x(0),base,colors.blue,1,[3,4]);
      text(ctx,'E',right,base+35,colors.ink,17,'right');
      if(d.shade>0){
        ctx.save();ctx.globalAlpha=d.shade;
        line(ctx,x(d.lower),base,x(d.upper),base,colors.ink,2.5);
        dot(ctx,x(d.lower),base,colors.blue,4);dot(ctx,x(d.upper),base,colors.green,4);
        text(ctx,'−h',x(d.lower)-5,base-18,colors.blue,15,'right');text(ctx,'+h',x(d.upper)+5,base-18,colors.green,15,'left');
        text(ctx,`${m.level}%`,x(0),base-48,colors.blue,16);ctx.restore();
      }
      ctx.save();ctx.globalAlpha=d.extract;axis(ctx,x,domain,copyBase,w-52);ctx.restore();
      if(p>1){
        const y=mix(base,copyBase,d.extract);
        ctx.save();ctx.globalAlpha=d.extract;
        arrow(ctx,x(0),base+46,x(0),copyBase-32,colors.muted);
        line(ctx,x(d.lower),y,x(d.upper),y,colors.ink,2.5);
        dot(ctx,x(d.lower),y,colors.blue,5);dot(ctx,x(d.upper),y,colors.green,5);
        text(ctx,fmt(d.lower,3),x(d.lower)-5,y-18,colors.blue,12,'right');text(ctx,fmt(d.upper,3),x(d.upper)+5,y-18,colors.green,12,'left');
        ctx.restore();
      }
      if(p>0)setMath(el('error-width'),`<mi>h</mi><mo>=</mo><mi>c</mi>${S}<mo>=</mo><mn>${fmt(m.halfWidth)}</mn>`);
      else el('error-width').innerHTML='';
      el('density').setAttribute('aria-label',`推定誤差の理論分布。平均0，標準偏差${fmt(m.se)}。中央${m.level}%の範囲は${fmt(d.lower)}から${fmt(d.upper)}。`);
    }
    function inverse(p,m){
      const {ctx,w,h}=canvas('interval'),f=motion.inverse(m,p),left=28,right=w-24,base=h-54,cy=83;
      const x=v=>left+(v-f.domain[0])/(f.domain[1]-f.domain[0])*(right-left);
      axis(ctx,x,f.domain,base,w-52);
      const meanY=mix(base,cy,f.translation);
      line(ctx,x(m.mean),meanY,x(m.mean),base,colors.orange,1,[3,4]);
      dot(ctx,x(m.mean),meanY,colors.orange,4);
      text(ctx,'ȳ',x(m.mean),meanY+(f.translation>.99?27:-19),colors.orange,18);
      ctx.save();ctx.globalAlpha=f.visible;
      const lift=20*(1-f.visible),arcHeight=Math.abs(x(m.halfWidth)-x(0));
      const ay=cy-lift-arcHeight*f.arc,by=cy-lift+arcHeight*f.arc;
      if(p>2&&p<3){
        line(ctx,x(-m.halfWidth),cy,x(m.halfWidth),cy,colors.ghost,1.5,[3,4]);
        for(const direction of [-1,1]){
          ctx.beginPath();ctx.strokeStyle=colors.ghost;ctx.lineWidth=1;ctx.setLineDash([3,4]);
          ctx.ellipse(x(0),cy,Math.abs(x(m.halfWidth)-x(0)),arcHeight,0,direction<0?Math.PI:0,direction<0?2*Math.PI:Math.PI);
          ctx.stroke();ctx.setLineDash([]);
        }
      }
      if(p>3&&p<4)arrow(ctx,x(0),cy-49,x(f.center),cy-49,colors.orange);
      line(ctx,x(f.a),ay,x(f.b),by,colors.ink,2.5);
      dot(ctx,x(f.a),ay,colors.blue,5);dot(ctx,x(f.b),by,colors.green,5);
      const aLeft=f.a<f.b;
      if(!(p>2&&p<3)){
        text(ctx,fmt(f.a,2),x(f.a)+(aLeft?-5:5),ay-20,colors.blue,12,aLeft?'right':'left');
        text(ctx,fmt(f.b,2),x(f.b)+(aLeft?5:-5),by-20,colors.green,12,aLeft?'left':'right');
      }
      ctx.restore();
      if(p>=4)text(ctx,'μ',w/2,h-8,colors.ink,16);
      if(p>=LAST)setMath(el('result'),`<mstyle mathcolor="${colors.orange}"><mn>${fmt(m.mean)}</mn></mstyle><mo>±</mo><mn>${fmt(m.halfWidth)}</mn>`);
      else if(p>=4)setMath(el('result'),`${observedY}<mo>±</mo><mi>h</mi>`);
      else el('result').innerHTML='';
      el('interval').setAttribute('aria-label',p<2?`観測された標本平均${fmt(m.mean)}。`:
        p<3?'誤差範囲の両端を反転しています。下側の端点が上側へ，上側の端点が下側へ移動します。':
        p<4?`反転した誤差範囲に，観測された標本平均${fmt(m.mean)}を加えます。`:
        `標本${index+1}。標本平均${fmt(m.mean)}から構成した${m.level}%信頼区間は${fmt(m.lower)}から${fmt(m.upper)}。`);
    }
    const phases=['推定誤差の分布','中央の確率範囲','誤差の範囲を取り出す','両端を反転する','標本平均を加える','下限と上限を並べる','観測値を代入する'];
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
  root.CIDerivationView={create};
})(typeof globalThis!=='undefined'?globalThis:this);
