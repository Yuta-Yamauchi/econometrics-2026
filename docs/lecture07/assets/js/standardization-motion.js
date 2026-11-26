(function(root){
  'use strict';
  const base=root.CIDerivationMotion||(typeof require==='function'?require('./derivation-motion.js'):null);
  const {ease,mix,density,layout,Y,S}=base,LAST=9;
  function distribution(m,p){
    const shift=ease(p),scale=ease(p-1),sd=mix(m.se,1,scale);
    return {center:m.mu*(1-shift),sd:m.se,value:m.mean-m.mu*shift,
      standardizedSD:sd,standardizedValue:m.z*sd,shade:ease(p-2)};
  }
  function inverse(m,p){
    const scale=mix(1,m.se,ease(p-4)),translation=ease(p-5),reflection=ease(p-6);
    const center=-m.mean*translation,half=m.c*scale;
    const a=mix(center-half,-center+half,reflection),b=mix(center+half,-center-half,reflection);
    const radius=Math.max(15,4*m.halfWidth),focus=ease(p-7);
    const wide=[-m.mu-radius,m.mu+radius],close=[m.mu-radius,m.mu+radius];
    return {a,b,center:mix(center,-center,reflection),domain:wide.map((v,i)=>mix(v,close[i],focus)),visible:ease(p-3)};
  }
  function blendSample(a,b,t){const mean=mix(a.mean,b.mean,ease(t));return {...b,mean,z:(mean-b.mu)/b.se,lower:mean-b.halfWidth,upper:mean+b.halfWidth};}
  const atom=(id,html,tone='ink')=>({type:'atom',id,html,tone});
  const row=(...children)=>({type:'row',children});
  function equation(stage,m){
    const sign=(id,s,tone='ink')=>atom(id,`<mo>${s}</mo>`,tone),mu=()=>atom('mu','<mi>μ</mi>','blue');
    const y=(id='y')=>atom(id,Y,'orange'),se=(id='se-den')=>atom(id,S,'green');
    const c=side=>atom(`${side}-c`,'<mi>c</mi>','green'),rel=(i,s='≤')=>sign(`rel-${i}`,s);
    const difference=()=>row(y(),sign('mu-sign','−'),mu());
    const ratio=()=>({type:'fraction',id:'fraction-bar',top:difference(),bottom:se()});
    const normal=(mean,variance)=>[sign('sim','∼'),atom('normal',`<mi mathvariant="normal">N</mi><mo>(</mo>${mean}<mo>,</mo>${variance}<mo>)</mo>`,'blue')];
    const variance='<mfrac><msup><mi>σ</mi><mn>2</mn></msup><mi>n</mi></mfrac>';
    const a=()=>[y('a-y'),sign('a-sign','+'),c('a'),se('a-se')];
    const b=()=>[y('b-y'),sign('b-sign','−'),c('b'),se('b-se')];
    if(stage===0)return row(y(),...normal('<mi>μ</mi>',variance));
    if(stage===1)return row(difference(),...normal('<mn>0</mn>',variance));
    if(stage===2)return row(atom('z','<mi>Z</mi>'),sign('equals','='),ratio(),...normal('<mn>0</mn>','<mn>1</mn>'));
    if(stage===3)return row(atom('p','<mi mathvariant="normal">P</mi>'),sign('open','('),sign('a-sign','−'),c('a'),rel(0),atom('z','<mi>Z</mi>'),rel(1),c('b'),sign('close',')'),sign('equals','='),atom('probability',`<mn>${(m.level/100).toFixed(2)}</mn>`));
    if(stage===4)return row(sign('a-sign','−'),c('a'),rel(0),ratio(),rel(1),c('b'));
    if(stage===5)return row(sign('a-sign','−'),c('a'),se('a-se'),rel(0),difference(),rel(1),c('b'),se('b-se'));
    if(stage===6)return row(sign('a-y-sign','−'),y('a-y'),sign('a-sign','−'),c('a'),se('a-se'),rel(0),sign('mu-sign','−'),mu(),rel(1),sign('b-y-sign','−'),y('b-y'),sign('b-sign','+'),c('b'),se('b-se'));
    if(stage===7)return row(...a(),rel(0,'≥'),mu(),rel(1,'≥'),...b());
    if(stage===8)return row(...b(),rel(0),mu(),rel(1),...a());
    return row(sign('open','['),atom('lower',`<mn>${m.lower.toFixed(3)}</mn>`,'green'),sign('comma',','),atom('upper',`<mn>${m.upper.toFixed(3)}</mn>`,'green'),sign('close',']'));
  }
  const origins={'a-se':'se-den','b-se':'se-den','a-y':'y','b-y':'y','lower':'b-y','upper':'a-y'};
  function terms(from,to,t,stage){
    const a=new Map(from.tokens.map(v=>[v.id,v])),b=new Map(to.tokens.map(v=>[v.id,v])),u=ease(t);
    return [...new Set([...a.keys(),...b.keys()])].map(id=>{
      const original=a.get(id),target=b.get(id),source=original||a.get(origins[id])||{...target,x:0,y:-45};
      const dest=target||{...source,y:source.y+25};
      let arc=0;
      if(stage===8&&id.startsWith('a-'))arc=-48;
      else if(stage===8&&id.startsWith('b-'))arc=48;
      else if(!original&&origins[id])arc=id==='a-se'?-60:id.startsWith('a-')?-38:38;
      const changing=original&&target&&original.html!==target.html;
      return {...(target||original),id,x:mix(source.x,dest.x,u),y:mix(source.y,dest.y,u)+arc*Math.sin(Math.PI*u),
        width:mix(source.width,dest.width,u),height:mix(source.height,dest.height,u),
        html:changing&&u<.5?original.html:dest.html,
        opacity:original&&target?1:target?ease(u*4):1-ease(u*3),
        flip:changing&&id.startsWith('rel-')?(u<.5?180*u:180*(u-1)):0};
    });
  }
  const api={LAST,ease,mix,density,layout,Y,S,distribution,inverse,blendSample,equation,terms};
  root.CIStandardizationMotion=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
