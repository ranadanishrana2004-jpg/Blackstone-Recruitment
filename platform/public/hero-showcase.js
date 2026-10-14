// Home page hero: a carousel of job banners, one role per slide. Published vacancies lead;
// clearly labelled example roles fill the carousel until enough are live.
const heroInterval=6500;
const exampleRoles=[
 ['Bus Driver','Driving & Transport','Manchester','UK','PCV licence · Customer care · Route knowledge','Full-time'],
 ['Care Assistant','Care & Support','Birmingham','UK','Personal care · Compassion · Teamwork','Full-time'],
 ['Registered Nurse','Healthcare','Riyadh','Saudi Arabia','NMC registration · Acute care · Patient safety','Permanent'],
 ['HGV Class 1 Driver','Driving & Transport','Leeds','UK','C+E licence · CPC · Tachograph','Full-time'],
 ['Chef de Partie','Hospitality','Dubai','UAE','Fine dining · Food safety · Section lead','Permanent'],
 ['Warehouse Operative','Warehouse & Logistics','Bolton','UK','Pick & pack · Forklift · Stock control','Full-time'],
 ['Senior Support Worker','Care & Support','Liverpool','UK','Supported living · Care plans · Team lead','Permanent'],
 ['Security Officer','Security','London','UK','SIA licence · CCTV · Access control','Shift-based'],
 ['Electrician','Construction','Doha','Qatar','18th Edition · Commercial fit-out · Testing','Contract'],
 ['Consultant Physician','Healthcare','Jeddah','Saudi Arabia','Internal medicine · Clinical leadership · MRCP','Permanent']
].map(([title,sector,location,country,skills,type])=>({title,sector,location,country,skills,type,example:true}));
// Each sector gets its own accent and monogram so consecutive banners feel distinct.
const bannerThemes={'Healthcare':['#2f6f73','Hc'],'Care & Support':['#7a4e64','Cs'],'Driving & Transport':['#8a6a2c','Dt'],'Warehouse & Logistics':['#4f5d73','Wl'],'Construction':['#8a5a35','Co'],'Hospitality':['#7c3f3a','Ho'],'Security':['#3d4a5c','Se'],'Technology':['#3c5a7a','Te'],'Finance':['#4a6b4f','Fi'],'Operations':['#5d5a46','Op'],'Human Resources':['#6a4f7a','Hr'],'Marketing':['#7a5a3c','Mk']};
const bannerTheme=sector=>bannerThemes[sector]||['#6d5a33',String(sector||'B').slice(0,2)];

function postedLabel(value){
 const days=Math.floor((Date.now()-new Date(value).getTime())/86400000);
 return days<=0?'Posted today':days===1?'Posted yesterday':days<14?`Posted ${days} days ago`:'';
}
function bannerSlide(j,i,total){
 const [accent,mark]=bannerTheme(j.sector),live=!j.example;
 const href=live?`/jobs/${j.id}`:`/jobs?sector=${encodeURIComponent(j.sector)}`;
 const skills=live?String(j.requirements||'').split(/[,\n]/).map(s=>s.trim()).filter(Boolean).slice(0,3).join(' · '):j.skills;
 const chips=(live?[j.workplace,j.type,`${money(j)} / ${j.period==='month'?'month':'year'}`]:[j.type]).filter(Boolean);
 const badge=live?`<span class="banner-badge live"><span class="live-dot" aria-hidden="true"></span>${e(postedLabel(j.created_at)||'Now hiring')}</span>`:'<span class="banner-badge">Example role</span>';
 const tab=i?'tabindex="-1"':'';
 return `<article class="showcase-slide banner-slide${i===0?' is-active':''}" style="--accent:${accent}" role="group" aria-roledescription="slide" aria-label="${i+1} of ${total}: ${e(j.title)}" ${i?'aria-hidden="true"':''}>
 <div class="banner-art" aria-hidden="true"><span class="banner-mark">${e(mark)}</span><svg class="banner-arcs" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice"><circle cx="330" cy="70" r="120"/><circle cx="330" cy="70" r="180"/><circle cx="330" cy="70" r="240"/><path d="M-20 330 C 120 250, 260 420, 420 300"/></svg></div>
 <div class="banner-top">${badge}<span class="banner-count">${String(i+1).padStart(2,'0')} <i>/</i> ${String(total).padStart(2,'0')}</span></div>
 <div class="banner-body">
  <p class="banner-sector">${e(j.sector)}</p>
  <h2 class="banner-title">${e(j.title)}</h2>
  <p class="banner-where">${icon('location')}<span>${live&&j.company?`${e(j.company)} · `:''}${e(j.location)}, ${e(countryName(j.country))}</span></p>
  <div class="banner-chips">${chips.map(c=>`<span>${e(c)}</span>`).join('')}</div>
  ${skills?`<p class="banner-skills">${e(skills)}</p>`:''}
  <div class="banner-actions"><a class="banner-cta" href="${href}" ${tab}>${live?'View role':'Explore similar roles'} ${icon('arrow')}</a>${live?'':`<a class="banner-secondary" href="/register?next=%2Fdashboard%2Fcv" ${tab}>Register your CV</a>`}</div>
 </div>
</article>`;
}
function heroShowcase(jobs){
 const live=jobs.slice(0,8),roles=[...live,...exampleRoles.slice(0,Math.max(0,8-live.length))];
 return `<div class="hero-image hero-showcase job-banners" role="region" aria-roledescription="carousel" aria-label="${live.length?'Latest vacancies':'Roles we recruit for'}" data-hero-showcase>
 <div class="showcase-slides">${roles.map((j,i)=>bannerSlide(j,i,roles.length)).join('')}</div>
 <div class="image-corner"></div>
 <div class="showcase-controls"><div class="showcase-dots">${roles.map((j,i)=>`<button type="button" class="showcase-dot${i===0?' is-active':''}" data-slide="${i}" aria-label="Show ${e(j.title)}" ${i===0?'aria-current="true"':''}><span></span></button>`).join('')}</div><div class="showcase-arrows"><button type="button" class="showcase-arrow" data-step="-1" aria-label="Previous role">${icon('arrow')}</button><button type="button" class="showcase-pause" aria-label="Pause slideshow" aria-pressed="false"><span aria-hidden="true"></span></button><button type="button" class="showcase-arrow" data-step="1" aria-label="Next role">${icon('arrow')}</button></div></div>
</div>`;
}

function initHeroShowcase(root){
 if(root.dataset.ready)return;root.dataset.ready='1';
 const slides=[...root.querySelectorAll('.showcase-slide')],dots=[...root.querySelectorAll('.showcase-dot')],pause=root.querySelector('.showcase-pause');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let index=0,timer=null,paused=reduced,hovering=false;
 function show(next){
  next=(next+slides.length)%slides.length;if(next===index)return;
  slides[index].classList.remove('is-active');slides[index].classList.add('is-leaving');const leaving=slides[index];setTimeout(()=>leaving.classList.remove('is-leaving'),1300);
  slides.forEach((s,i)=>{const on=i===next;s.toggleAttribute('aria-hidden',!on);s.querySelectorAll('a').forEach(a=>a.tabIndex=on?0:-1);});
  slides[next].classList.add('is-active');
  dots.forEach((d,i)=>{d.classList.toggle('is-active',i===next);d.toggleAttribute('aria-current',i===next);});
  index=next;restart();
 }
 function restart(){
  clearTimeout(timer);
  root.style.setProperty('--slide-duration',`${heroInterval}ms`);
  dots.forEach(d=>{d.classList.remove('is-timing');void d.offsetWidth;});
  if(paused||hovering||document.hidden)return;
  dots[index].classList.add('is-timing');
  timer=setTimeout(()=>{if(!document.contains(root))return;show(index+1);},heroInterval);
 }
 const setPaused=value=>{paused=value;root.classList.toggle('is-paused',paused);pause.setAttribute('aria-pressed',paused);pause.setAttribute('aria-label',paused?'Play slideshow':'Pause slideshow');restart();};
 root.addEventListener('click',event=>{
  const dot=event.target.closest('[data-slide]'),arrow=event.target.closest('[data-step]');
  if(dot)show(Number(dot.dataset.slide));else if(arrow)show(index+Number(arrow.dataset.step));else if(event.target.closest('.showcase-pause'))setPaused(!paused);
 });
 root.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovering=true;restart();}});
 root.addEventListener('pointerleave',()=>{hovering=false;restart();});
 root.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1));}});
 let startX=null;
 root.addEventListener('pointerdown',event=>{if(!event.target.closest('a,button'))startX=event.clientX;});
 root.addEventListener('pointerup',event=>{if(startX===null)return;const dx=event.clientX-startX;startX=null;if(Math.abs(dx)>45)show(index+(dx<0?1:-1));});
 document.addEventListener('visibilitychange',()=>{if(document.contains(root))restart();});
 setPaused(paused);
}
// Pages are rendered by replacing #app, so watch for the hero appearing and wire it up once.
new MutationObserver(()=>document.querySelectorAll('[data-hero-showcase]:not([data-ready])').forEach(initHeroShowcase)).observe(document.documentElement,{childList:true,subtree:true});
document.querySelectorAll('[data-hero-showcase]').forEach(initHeroShowcase);
