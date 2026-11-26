/* Buildless presentation controller. Figure coordinates and statistics come from R. */
(()=>{'use strict';
const $=id=>document.getElementById(id), scenes=window.Lecture08.scenes;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let sceneIndex=0,stepIndex=0,lastFigure=null,frame=0,animations=[],morphToken=0;
const offsets=[];let total=0;scenes.forEach(s=>{offsets.push(total);total+=s.steps.length});
$('scrubber').max=String(total-1);
function parseHash(){const match=location.hash.match(/^#([a-z0-9-]+)(?:\/(\d+))?$/);if(!match)return[0,0];const i=scenes.findIndex(s=>s.id===match[1]);return i<0?[0,0]:[i,Math.max(0,Math.min(scenes[i].steps.length-1,Number(match[2]||1)-1))]}
function halt(){cancelAnimationFrame(frame);morphToken++;for(const a of animations)a.cancel();animations=[]}
function fitBoard(){const board=$('board');board.style.zoom='';board.style.width='';board.style.marginInline='auto';if(innerWidth<1050)return;const main=board.parentElement,styles=getComputedStyle(main);const width=main.clientWidth-parseFloat(styles.paddingLeft)-parseFloat(styles.paddingRight);board.style.width=width+'px';const available=innerHeight-document.querySelector('.masthead').getBoundingClientRect().height-document.querySelector('.controls').getBoundingClientRect().height-16;const natural=board.getBoundingClientRect().height;if(natural>available)board.style.zoom=String(Math.max(.5,available/natural))}
function draw(paths,delay=0){if(reduced.matches)return;paths.forEach((p,i)=>{let length;try{length=p.getTotalLength()}catch{return}if(!length)return;const a=p.animate([{strokeDasharray:`${length} ${length}`,strokeDashoffset:length},{strokeDasharray:`${length} ${length}`,strokeDashoffset:0}],{duration:650,delay:delay+Math.min(i*90,450),easing:'ease-out',fill:'backwards'});animations.push(a)})}
function renderInk(step,{instant,replay},fresh){
 const active=new Map((step.ink||[]).map(mark=>[mark.target,mark]));
 for(const target of $('writing').querySelectorAll('[data-ink]')){
  const mark=active.get(target.dataset.ink),was=target.classList.contains('ink-active');
  let svg=target.querySelector(':scope > .pen-mark');
  if(mark){const kind=mark.kind||'circle';if(!svg||svg.dataset.kind!==kind){svg?.remove();svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 60');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');svg.classList.add('pen-mark');svg.dataset.kind=kind;svg.innerHTML=window.LectureInk[kind];target.append(svg)}svg.style.color=mark.color||'var(--marker)';}
  target.classList.toggle('ink-active',!!mark);
  if(mark&&(!was||replay)&&!instant&&!reduced.matches)draw([...svg.querySelectorAll('[data-draw]')],fresh.length?250:0);
 }
}
function tweenAttrs(nodes,index,instant){const token=++morphToken;const starts=nodes.map(n=>({n,sy:Number(n.getAttribute('y')),sh:Number(n.getAttribute('height')),y:Number(n.dataset['y'+index]),h:Number(n.dataset['h'+index])}));const begin=performance.now();function tick(now){if(token!==morphToken)return;const t=instant?1:Math.min(1,(now-begin)/700),q=1-Math.pow(1-t,3);for(const p of starts){p.n.setAttribute('y',p.sy+(p.y-p.sy)*q);p.n.setAttribute('height',p.sh+(p.h-p.sh)*q)}if(t<1)frame=requestAnimationFrame(tick)}tick(begin)}
function render({instant=false,replay=false}={}){
 halt();const scene=scenes[sceneIndex],step=scene.steps[stepIndex];const sameFigure=lastFigure===scene.figure;
 $('chapter').textContent=scene.chapter;$('scene-title').textContent=scene.title;$('question').textContent=scene.question||'';
 $('board').classList.toggle('section-slide',!!scene.section);
 $('workspace').className='workspace'+(!scene.figure?' no-figure':'')+(scene.layout?' '+scene.layout:'');
 if(!sameFigure||!$('drawing').firstChild){$('drawing').innerHTML=scene.figure?window.LectureFigures[scene.figure]:'';lastFigure=scene.figure}
 if($('writing').dataset.scene!==scene.id){$('writing').innerHTML=scene.writing||'';$('writing').dataset.scene=scene.id}
 const show=new Set(step.show||[]),mute=new Set(step.mute||[]);const fresh=[];
 for(const node of $('workspace').querySelectorAll('[data-layer]')){
  const visible=show.has(node.dataset.layer),was=node.classList.contains('is-visible');
  if(visible&&(!was||replay))fresh.push(node);
  node.classList.toggle('is-hidden',!visible);node.classList.toggle('is-visible',visible);node.classList.toggle('is-muted',visible&&mute.has(node.dataset.layer));
  node.setAttribute('aria-hidden',String(!visible));
 }
 $('drawing').classList.toggle('grouped',!!step.grouped);
 for(const id of ['threshold-line','threshold-label','candidate-line','candidate-label']){const el=$(id);if(el){el.style.transition=instant||reduced.matches?'none':'transform 650ms ease';el.style.transform=`translateX(${step.shift?Number(el.dataset.shift):0}px)`}}
 if($('threshold-label'))$('threshold-label').textContent='基準 '+(scene.figure==='star-interval'?(step.shift?8:2):(step.shift?13:10));
 if($('candidate-label'))$('candidate-label').textContent='候補 '+(step.shift?4:3);
 const bars=[...$('drawing').querySelectorAll('.morph-bar')];if(bars.length)tweenAttrs(bars,step.bars||1,instant||reduced.matches);
 $('cue').textContent=step.cue;$('caption').innerHTML=step.caption;$('source').textContent=scene.source||'';
 $('notes-body').innerHTML=scene.notes||'';
 $('position-label').textContent=`${sceneIndex+1} / ${scenes.length} 場面　${stepIndex+1} / ${scene.steps.length}`;
 $('scrubber').value=String(offsets[sceneIndex]+stepIndex);
 $('prev').disabled=sceneIndex===0&&stepIndex===0;$('next').disabled=sceneIndex===scenes.length-1&&stepIndex===scene.steps.length-1;
 $('next').textContent=stepIndex===scene.steps.length-1?'次の場面':'次へ';
 document.title=`第8回｜${scene.title}`;
 for(const button of $('toc-list').querySelectorAll('[data-scene]'))button.setAttribute('aria-current',String(Number(button.dataset.scene)===sceneIndex));
 if(!instant&&!reduced.matches){for(const g of fresh){if(g.closest('svg'))draw([...g.querySelectorAll('[data-draw]')],g.classList.contains('board-mark')?200:0);else{g.classList.remove('animate-text');void g.offsetWidth;g.classList.add('animate-text')}}}
 renderInk(step,{instant,replay},fresh);
 fitBoard();
}
function go(i,j,opts={}){const changedScene=i!==sceneIndex;sceneIndex=Math.max(0,Math.min(scenes.length-1,i));stepIndex=Math.max(0,Math.min(scenes[sceneIndex].steps.length-1,j));history.replaceState(null,'',`#${scenes[sceneIndex].id}/${stepIndex+1}`);render(opts);if(changedScene&&innerWidth<=760)window.scrollTo({top:0,behavior:'instant'})}
function advance(delta){if(delta>0){if(stepIndex<scenes[sceneIndex].steps.length-1)go(sceneIndex,stepIndex+1);else if(sceneIndex<scenes.length-1)go(sceneIndex+1,0)}else{if(stepIndex>0)go(sceneIndex,stepIndex-1);else if(sceneIndex>0)go(sceneIndex-1,scenes[sceneIndex-1].steps.length-1)}}
$('next').addEventListener('click',()=>advance(1));$('prev').addEventListener('click',()=>advance(-1));$('replay').addEventListener('click',()=>render({replay:true}));
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();$('board').focus({preventScroll:true})});
$('scrubber').addEventListener('input',e=>{const n=Number(e.target.value);let i=offsets.findLastIndex(o=>o<=n);go(i,n-offsets[i],{instant:true})});
let chapter='';scenes.forEach((s,i)=>{if(s.chapter!==chapter){chapter=s.chapter;const h=document.createElement('h3');h.textContent=chapter;$('toc-list').append(h,document.createElement('ol'))}const li=document.createElement('li'),b=document.createElement('button');b.textContent=s.title;b.dataset.scene=String(i);b.addEventListener('click',()=>{$('toc').close();go(i,0,{instant:true});$('board').focus({preventScroll:true})});li.append(b);$('toc-list').lastChild.append(li)});
$('toc-open').addEventListener('click',()=>$('toc').showModal());$('sources-open').addEventListener('click',()=>$('sources').showModal());
$('sources-body').innerHTML=window.Lecture08.sources;
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
function toggleNotes(){const open=$('notes').hidden;$('notes').hidden=!open;$('notes-open').setAttribute('aria-expanded',String(open));if(open)$('notes').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'nearest'})}
$('notes-open').addEventListener('click',toggleNotes);
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('fullscreen').textContent='全画面を利用できません'}}
$('fullscreen').addEventListener('click',fullscreen);document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'全画面を終了':'全画面'});
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||e.altKey||e.ctrlKey||e.metaKey)return;if(e.target.closest('input,textarea,select'))return;if(e.key===' '&&e.target.closest('button,a'))return;if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();advance(1)}else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();advance(-1)}else if(e.key==='Home'){e.preventDefault();go(0,0)}else if(e.key.toLowerCase()==='n')toggleNotes();else if(e.key.toLowerCase()==='f')fullscreen()});
addEventListener('hashchange',()=>{[sceneIndex,stepIndex]=parseHash();render({instant:true})});
reduced.addEventListener('change',()=>render({instant:true}));
[sceneIndex,stepIndex]=parseHash();render({instant:true});
addEventListener('resize',fitBoard);document.fonts.ready.then(fitBoard);
// Read-only state makes QA and presenter integrations deterministic.
window.LectureBoard=Object.freeze({snapshot:()=>({scene:scenes[sceneIndex].id,sceneIndex,stepIndex,total,steps:scenes[sceneIndex].steps.length,reducedMotion:reduced.matches})});
})();
