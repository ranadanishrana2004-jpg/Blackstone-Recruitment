// Home page hero: an image carousel with a live "now hiring" ticker of the newest published roles.
const heroSlides=[
 {image:'/assets/hero/slide-luminous.jpg',alt:'Sunlit ivory architecture and champagne bronze details framing a contemporary glass tower',eyebrow:'A different perspective on recruitment',title:'Built on people.<br>Defined by possibility.',link:['/approach','Discover our approach']},
 {image:'/assets/hero/slide-lounge.jpg',alt:'An elegant boardroom with a walnut table overlooking a city skyline',eyebrow:'Executive & leadership search',title:'Leaders who shape<br>what comes next.',link:['/employers','Hire with Blackstone']},
 {image:'/assets/hero/slide-architecture.jpg',alt:'A glass skyscraper rising into a dark sky',eyebrow:'Worldwide opportunities',title:'Ambition<br>without borders.',link:['/jobs','Explore live roles']},
 {image:'/assets/hero/slide-office.jpg',alt:'A bright, calm office with leather chairs and a city view',eyebrow:'Your next chapter',title:'Careers built<br>around you.',link:['/register?next=%2Fdashboard%2Fcv','Submit your CV']}
];
const heroInterval=6500;

function postedLabel(value){
 const days=Math.floor((Date.now()-new Date(value).getTime())/86400000);
 return days<=0?'Posted today':days===1?'Posted yesterday':days<14?`Posted ${days} days ago`:'';
}
function tickerItem(j,sample){
 const href=sample?`/sample-jobs/${j.id}`:`/jobs/${j.id}`,where=`${j.location}, ${countryName(j.country)}`;
 const meta=sample?'Example role':[j.workplace,postedLabel(j.created_at)].filter(Boolean).join(' · ');
 const fresh=!sample&&(Date.now()-new Date(j.created_at).getTime())<14*86400000;
 return `<li><a class="ticker-job" href="${href}"><span class="ticker-sector">${e(j.sector)}${fresh?'<em>New</em>':''}</span><strong>${e(j.title)}</strong><span class="ticker-meta">${e(where)}${meta?` · ${e(meta)}`:''}</span></a></li>`;
}
function heroShowcase(jobs){
 const live=jobs.slice(0,8),sample=!live.length,items=(sample?sampleRoles:live).map(j=>tickerItem(j,sample)).join('');
 const moving=(sample?sampleRoles:live).length>2;
 return `<div class="hero-image hero-showcase" role="region" aria-roledescription="carousel" aria-label="Blackstone highlights" data-hero-showcase>
 <div class="showcase-slides">${heroSlides.map((s,i)=>`<figure class="showcase-slide${i===0?' is-active':''}" role="group" aria-roledescription="slide" aria-label="${i+1} of ${heroSlides.length}" ${i?'aria-hidden="true"':''}><img ${i===0?`src="${s.image}" fetchpriority="high"`:`data-src="${s.image}"`} alt="${e(s.alt)}" decoding="async"><figcaption class="image-caption"><small>${e(s.eyebrow)}</small><strong>${s.title}</strong><a class="showcase-link" href="${s.link[0]}" ${i?'tabindex="-1"':''}>${e(s.link[1])} ${icon('arrow')}</a></figcaption></figure>`).join('')}</div>
 <div class="image-corner"></div><div class="hero-seal">B<small>GO FURTHER</small></div>
 <aside class="hiring-ticker${moving?' is-moving':''}" aria-label="${sample?'Example roles':'Newest vacancies'}"><div class="ticker-head"><span class="live-dot" aria-hidden="true"></span>${sample?'Roles we recruit for':'Now hiring'}<a href="/jobs">View all</a></div><div class="ticker-window"><ul class="ticker-track" style="--ticker-duration:${Math.max(12,(sample?sampleRoles:live).length*3.6)}s">${items}</ul>${moving?`<ul class="ticker-track" aria-hidden="true" style="--ticker-duration:${Math.max(12,(sample?sampleRoles:live).length*3.6)}s">${items.replaceAll('<a ','<a tabindex="-1" ')}</ul>`:''}</div></aside>
 <div class="showcase-controls"><div class="showcase-dots">${heroSlides.map((s,i)=>`<button type="button" class="showcase-dot${i===0?' is-active':''}" data-slide="${i}" aria-label="Show slide ${i+1}: ${e(s.eyebrow)}" ${i===0?'aria-current="true"':''}><span></span></button>`).join('')}</div><div class="showcase-arrows"><button type="button" class="showcase-arrow" data-step="-1" aria-label="Previous slide">${icon('arrow')}</button><button type="button" class="showcase-pause" aria-label="Pause slideshow" aria-pressed="false"><span aria-hidden="true"></span></button><button type="button" class="showcase-arrow" data-step="1" aria-label="Next slide">${icon('arrow')}</button></div></div>
</div>`;
}

function initHeroShowcase(root){
 if(root.dataset.ready)return;root.dataset.ready='1';
 const slides=[...root.querySelectorAll('.showcase-slide')],dots=[...root.querySelectorAll('.showcase-dot')],pause=root.querySelector('.showcase-pause');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let index=0,timer=null,paused=reduced,hovering=false;
 const load=i=>{const img=slides[i]?.querySelector('img[data-src]');if(img){img.src=img.dataset.src;img.removeAttribute('data-src');}};
 load(1);
 function show(next){
  next=(next+slides.length)%slides.length;if(next===index)return;load(next);load((next+1)%slides.length);
  slides[index].classList.remove('is-active');slides[index].classList.add('is-leaving');const leaving=slides[index];setTimeout(()=>leaving.classList.remove('is-leaving'),1300);
  slides.forEach((s,i)=>{const on=i===next;s.toggleAttribute('aria-hidden',!on);s.querySelector('.showcase-link').tabIndex=on?0:-1;});
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
 root.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovering=true;root.classList.add('is-hovered');restart();}});
 root.addEventListener('pointerleave',()=>{hovering=false;root.classList.remove('is-hovered');restart();});
 root.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){if(event.target.closest('.hiring-ticker'))return;event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1));}});
 let startX=null;
 root.addEventListener('pointerdown',event=>{if(!event.target.closest('.hiring-ticker,.showcase-controls'))startX=event.clientX;});
 root.addEventListener('pointerup',event=>{if(startX===null)return;const dx=event.clientX-startX;startX=null;if(Math.abs(dx)>45)show(index+(dx<0?1:-1));});
 document.addEventListener('visibilitychange',()=>{if(document.contains(root))restart();});
 setPaused(paused);
}
// Pages are rendered by replacing #app, so watch for the hero appearing and wire it up once.
new MutationObserver(()=>document.querySelectorAll('[data-hero-showcase]:not([data-ready])').forEach(initHeroShowcase)).observe(document.documentElement,{childList:true,subtree:true});
document.querySelectorAll('[data-hero-showcase]').forEach(initHeroShowcase);
