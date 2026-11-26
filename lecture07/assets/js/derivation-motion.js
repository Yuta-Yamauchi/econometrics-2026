(function(root){
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  const mix=(a,b,t)=>a+(b-a)*t;
  const LAST=6;
  const motionTime=(_stage,t)=>ease(t);
  function distribution(m,p){return {center:0,sd:m.se,lower:-m.halfWidth,upper:m.halfWidth,shade:ease(p),extract:ease(p-1)};}
  const density=(x,mean,sd)=>Math.exp(-.5*((x-mean)/sd)**2)/(sd*Math.sqrt(2*Math.PI));
  function inverse(m,p){
    const reflection=ease(p-2),translation=ease(p-3),focus=ease(p-4),radius=Math.max(2*m.sigma,4*m.halfWidth);
    const wide=[Math.min(-radius,m.anchor-radius),Math.max(radius,m.anchor+radius)],close=[m.anchor-radius,m.anchor+radius];
    const domain=wide.map((v,i)=>mix(v,close[i],focus));
    const center=m.mean*translation,cos=Math.cos(Math.PI*reflection),arc=Math.sin(Math.PI*reflection);
    // A starts at the lower error bound and becomes the upper confidence bound.
    return {a:center-m.halfWidth*cos,b:center+m.halfWidth*cos,arc,center,domain,
      reflection,translation,focus,visible:ease(p-1),numeric:ease(p-5)};
  }
  function blendSample(a,b,t){
    const mean=mix(a.mean,b.mean,ease(t)),lower=mean-b.halfWidth,upper=mean+b.halfWidth;
    return {...b,mean,lower,upper};
  }
  const Y='<mover><mi>Y</mi><mo>¯</mo></mover>',S='<mfrac><mi>σ</mi><msqrt><mi>n</mi></msqrt></mfrac>';
  const atom=(id,html,tone='ink')=>({type:'atom',id,html,tone});
  const row=(...children)=>({type:'row',children});
  const fraction=(top,bottom)=>({type:'fraction',id:'fraction-bar',top,bottom});
  function equation(stage,m){
    const y=id=>atom(id,Y,'orange'),mu=()=>atom('mu','<mi>μ</mi>','blue'),sign=(id,s,tone='ink')=>atom(id,`<mo>${s}</mo>`,tone);
    const h=side=>atom(`${side}-h`,'<mi>h</mi>',side==='a'?'blue':'green');
    const rel=(i,v='≤')=>sign(`rel-${i}`,v),error=()=>atom('error','<mi>E</mi>');
    const range=()=>[sign('a-sign','−','blue'),h('a'),rel(0),error(),rel(1),h('b')];
    const a=()=>[y('a-y'),sign('a-sign','+','blue'),h('a')];
    const b=()=>[y('b-y'),sign('b-sign','−','green'),h('b')];
    if(stage===0)return row(mu(),sign('equals','='),y('y'),sign('error-sign','−'),error());
    if(stage===1)return row(atom('p','<mi mathvariant="normal">P</mi>'),sign('open','('),...range(),sign('close',')'),sign('equals','='),atom('probability',`<mn>${(m.level/100).toFixed(2)}</mn>`));
    if(stage===2)return row(...range());
    if(stage===3)return row(h('a'),rel(0,'≥'),sign('error-sign','−'),error(),rel(1,'≥'),sign('b-sign','−','green'),h('b'));
    if(stage===4)return row(...a(),rel(0,'≥'),mu(),rel(1,'≥'),...b());
    if(stage===5)return row(...b(),rel(0),mu(),rel(1),...a());
    return row(sign('open','['),atom('lower',`<mn>${m.lower.toFixed(3)}</mn>`,'green'),sign('comma',','),atom('upper',`<mn>${m.upper.toFixed(3)}</mn>`,'blue'),sign('close',']'));
  }
  function layout(tree,measure){
    if(tree.type==='atom'){const size=measure(tree.html);return {width:size.width,height:size.height,tokens:[{...tree,x:0,y:0,...size}]};}
    if(tree.type==='row'){
      const parts=tree.children.map(c=>layout(c,measure)),gap=3;
      const width=parts.reduce((s,p)=>s+p.width,0)+gap*Math.max(0,parts.length-1),height=Math.max(...parts.map(p=>p.height));
      let x=-width/2;const tokens=[];
      parts.forEach(p=>{p.tokens.forEach(v=>tokens.push({...v,x:v.x+x+p.width/2}));x+=p.width+gap;});
      return {width,height,tokens};
    }
    const top=layout(tree.top,measure),bottom=layout(tree.bottom,measure),width=Math.max(top.width,bottom.width)+10,height=top.height+bottom.height+14;
    return {width,height,tokens:[...top.tokens.map(v=>({...v,y:v.y-top.height/2-6})),...bottom.tokens.map(v=>({...v,y:v.y+bottom.height/2+6})),{id:tree.id,type:'bar',x:0,y:0,width,height:1,tone:'ink',html:''}]};
  }
  const origins={'a-y':'y','b-y':'y','mu':'error','lower':'b-y','upper':'a-y'};
  function terms(from,to,t,stage){
    const a=new Map(from.tokens.map(v=>[v.id,v])),b=new Map(to.tokens.map(v=>[v.id,v]));
    const u=motionTime(stage,t),ids=new Set([...a.keys(),...b.keys()]);
    return [...ids].map(id=>{
      const original=a.get(id),target=b.get(id),source=original||a.get(origins[id])||{...target,x:0,y:-60};
      const dest=target||{...source,y:source.y+25};
      let arc=0;
      if(stage===5&&id.startsWith('a-'))arc=-48;
      else if(stage===5&&id.startsWith('b-'))arc=48;
      else if(!original&&origins[id])arc=id.startsWith('b-')?35:-35;
      const changing=original&&target&&original.html!==target.html;
      return {...(target||original),id,x:mix(source.x,dest.x,u),y:mix(source.y,dest.y,u)+arc*Math.sin(Math.PI*u),
        width:mix(source.width,dest.width,u),height:mix(source.height,dest.height,u),
        html:changing&&u<.5?original.html:dest.html,
        opacity:original&&target?1:target?ease(u*4):1-ease(u*3),
        flip:changing&&id.startsWith('rel-')?(u<.5?180*u:180*(u-1)):0};
    });
  }
  const api={LAST,clamp,ease,mix,motionTime,distribution,density,inverse,blendSample,equation,layout,terms,Y,S};
  root.CIDerivationMotion=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
