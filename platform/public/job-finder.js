// Guided "Available jobs" search: asks a candidate a few questions, then opens
// the jobs board filtered to their category, location and preferences.
const jobCategories=[
 {name:'Driving & Transport',hint:'Bus, coach, HGV and delivery drivers',example:'Bus driver',keywords:['driver','driving','bus','coach','hgv','lgv','van','courier','delivery','chauffeur','taxi','transport']},
 {name:'Healthcare',hint:'Doctors, nurses and clinical specialists',example:'Registered nurse',keywords:['nurse','nursing','doctor','physician','clinical','medical','midwife','hospital','ivf','pharmacist','dental','physician','surgeon']},
 {name:'Care & Support',hint:'Carers and support workers',example:'Care assistant',keywords:['carer','care assistant','support worker','healthcare assistant','domiciliary','senior carer','care worker']},
 {name:'Warehouse & Logistics',hint:'Pickers, packers and forklift operators',example:'Warehouse operative',keywords:['warehouse','picker','packer','logistics','forklift','stock','supply chain','distribution']},
 {name:'Construction',hint:'Trades, site and project roles',example:'Electrician',keywords:['construction','labourer','electrician','plumber','carpenter','joiner','builder','bricklayer','welder','scaffold','site manager']},
 {name:'Hospitality',hint:'Chefs, hotel and catering staff',example:'Chef',keywords:['chef','cook','kitchen','waiter','waitress','barista','hotel','housekeeping','hospitality','catering','bartender']},
 {name:'Cleaning & Facilities',hint:'Cleaners, caretakers and maintenance',example:'Cleaner',keywords:['cleaner','cleaning','janitor','facilities','maintenance','caretaker','porter']},
 {name:'Security',hint:'Security officers and door supervisors',example:'Security officer',keywords:['security','guard','door supervisor','cctv']},
 {name:'Sales & Retail',hint:'Store, sales and customer roles',example:'Sales assistant',keywords:['sales','retail','store','shop','cashier','customer service','merchandiser']},
 {name:'Office & Administration',hint:'Admin, reception and HR',example:'Receptionist',keywords:['admin','administrator','administration','receptionist','office','data entry','secretary','human resources','hr']},
 {name:'Technology',hint:'Software, data and IT',example:'Software engineer',keywords:['software','developer','engineer','it','data','cyber','network','devops','technology']},
 {name:'Finance',hint:'Accounting, payroll and analysis',example:'Accountant',keywords:['finance','financial','accountant','accounting','bookkeeper','payroll','audit','financial analyst','investment analyst']},
 {name:'Operations',hint:'Managers, supervisors and team leaders',example:'Operations manager',keywords:['operations','supervisor','team leader','operative','operations manager','operations director']},
 {name:'Education',hint:'Teachers, tutors and assistants',example:'Teaching assistant',keywords:['teacher','teaching','tutor','lecturer','education','school']}
];
const jobCategoryNames=()=>jobCategories.map(c=>c.name);
const escapeRegExp=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// A job belongs to a category when its specialism matches, or its title names one of the category's roles.
function jobMatchesCategory(job,category){
 if(!category)return true;
 if(String(job.sector||'').toLowerCase()===category.toLowerCase())return true;
 const c=jobCategories.find(x=>x.name===category);
 return Boolean(c&&c.keywords.some(k=>new RegExp(`\\b${escapeRegExp(k)}\\b`,'i').test(job.title||'')));
}
function jobMatchesPreferences(job,{city='',type=''}={}){
 return (!city||String(job.location||'').toLowerCase().includes(city.toLowerCase()))&&(!type||job.type===type);
}

const finderKey='blackstone-job-finder';
function loadFinderAnswers(){try{return JSON.parse(localStorage.getItem(finderKey))||{}}catch{return {}}}
function saveFinderAnswers(answers){try{localStorage.setItem(finderKey,JSON.stringify(answers))}catch{}}

const finder={step:0,answers:{},jobs:null};
const finderSteps=['What kind of work are you looking for?','Where would you like to work?','A couple of final details'];

function choiceGroup(name,options,value){return `<div class="finder-choices" role="radiogroup">${options.map(([v,label])=>`<label class="finder-choice"><input type="radio" name="${name}" value="${e(v)}" ${v===value?'checked':''}><span>${e(label)}</span></label>`).join('')}</div>`}

function finderStepHTML(){
 const a=finder.answers,category=jobCategories.find(c=>c.name===a.sector);
 if(finder.step===0)return `<fieldset class="finder-fieldset"><legend class="label">Choose a category</legend><div class="finder-categories">${[['','Show me everything','All categories and specialisms'],...jobCategories.map(c=>[c.name,c.name,c.hint])].map(([v,label,hint])=>`<label class="finder-category"><input type="radio" name="sector" value="${e(v)}" ${v===(a.sector||'')?'checked':''}><span><strong>${e(label)}</strong><small>${e(hint)}</small></span></label>`).join('')}</div></fieldset><div class="field"><label for="finder-title">Job title <small>(optional)</small></label><input id="finder-title" name="q" maxlength="80" value="${e(a.q||'')}" placeholder="e.g. ${e(category?category.example:'Bus driver')}"></div>`;
 if(finder.step===1)return `<div class="finder-grid">${selectField('Country','finder-country',[['','Anywhere in the world'],...countryOptions()],a.country??'UK')}<div class="field"><label for="finder-city">Preferred city or town <small>(optional)</small></label><input id="finder-city" name="city" maxlength="80" value="${e(a.city||'')}" placeholder="e.g. Manchester"></div></div><fieldset class="finder-fieldset"><legend class="label">Working arrangement</legend>${choiceGroup('workplace',[['','No preference'],['On-site','On-site'],['Hybrid','Hybrid'],['Remote','Remote']],a.workplace||'')}</fieldset>`;
 return `<fieldset class="finder-fieldset"><legend class="label">Type of contract</legend>${choiceGroup('type',[['','No preference'],['Permanent','Permanent'],['Contract','Contract'],['Temporary','Temporary']],a.type||'')}</fieldset><div class="finder-summary" aria-live="polite">${finderSummary()}</div>`;
}
function finderSummary(){
 const a=finder.answers,parts=[a.q||a.sector||'All roles',a.city?`${a.city}${a.country?', '+countryName(a.country):''}`:a.country?countryName(a.country):'anywhere',a.workplace,a.type].filter(Boolean);
 const live=finder.jobs||[],matches=live.filter(j=>finderMatches(j,a)).length;
 return `<span class="eyebrow">Your search</span><p>${parts.map(e).join(' · ')}</p><small>${!finder.jobs?'Checking current vacancies…':live.length?`${matches} matching ${matches===1?'vacancy':'vacancies'} right now`:'New vacancies are added regularly. We will show you example roles and how to register your interest.'}</small>`;
}
function finderMatches(j,a){const q=(a.q||'').toLowerCase();return jobMatchesCategory(j,a.sector)&&(!a.country||j.country===a.country)&&(!a.workplace||j.workplace===a.workplace)&&jobMatchesPreferences(j,a)&&(!q||`${j.title} ${j.company} ${j.location} ${j.requirements}`.toLowerCase().includes(q));}

function renderFinder(){
 const last=finder.step===finderSteps.length-1;
 showModal('Find available jobs',`<form id="job-finder" class="job-finder" novalidate><div class="finder-progress" aria-hidden="true">${finderSteps.map((_,i)=>`<span class="${i<=finder.step?'done':''}"></span>`).join('')}</div><p class="finder-step-count">Step ${finder.step+1} of ${finderSteps.length}</p><h3 class="finder-question">${finderSteps[finder.step]}</h3>${finderStepHTML()}<div class="form-actions">${finder.step?'<button type="button" class="btn outline" data-finder-back>Back</button>':'<button type="button" class="btn outline" data-action="close-modal">Cancel</button>'}<button class="btn" type="submit">${last?'Show matching jobs':'Continue'} ${icon('arrow')}</button></div></form>`);
 const form=$('#job-finder');
 form.addEventListener('submit',event=>{event.preventDefault();event.stopPropagation();captureFinder();if(last)finishFinder();else{finder.step++;renderFinder();}});
 form.addEventListener('change',()=>{captureFinder();const s=form.querySelector('.finder-summary');if(s)s.innerHTML=finderSummary();});
 form.querySelector('[data-finder-back]')?.addEventListener('click',()=>{captureFinder();finder.step--;renderFinder();});
 (form.querySelector('input:checked')||form.querySelector('input,select'))?.focus();
}
function captureFinder(){
 const form=$('#job-finder');if(!form)return;const a=finder.answers;
 const radio=name=>form.querySelector(`input[name=${name}]:checked`);
 if(finder.step===0){a.sector=radio('sector')?.value||'';a.q=form.querySelector('#finder-title').value.trim();}
 if(finder.step===1){a.country=form.querySelector('#finder-country').value;a.city=form.querySelector('#finder-city').value.trim();a.workplace=radio('workplace')?.value||'';}
 if(finder.step===2)a.type=radio('type')?.value||'';
}
function finishFinder(){
 saveFinderAnswers(finder.answers);
 const params=new URLSearchParams();
 for(const key of ['q','country','sector','workplace','city','type'])if(finder.answers[key])params.set(key,finder.answers[key]);
 navigate('/jobs'+(params.size?'?'+params:''));
}
async function openJobFinder(){
 document.querySelector('.nav-links.open')?.classList.remove('open');
 finder.step=0;finder.answers=loadFinderAnswers();finder.jobs=null;
 renderFinder();
 try{finder.jobs=(await api('/jobs')).jobs}catch{finder.jobs=[]}
 const s=document.querySelector('#job-finder .finder-summary');if(s)s.innerHTML=finderSummary();
}
// Capture phase so the guided search opens before the router follows the link's /jobs fallback.
document.addEventListener('click',event=>{const trigger=event.target.closest('[data-job-finder]');if(!trigger||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey)return;event.preventDefault();event.stopPropagation();openJobFinder();},true);
document.addEventListener('click',event=>{const chip=event.target.closest('[data-pref]');if(!chip)return;event.preventDefault();if(state.jobPrefs)state.jobPrefs[chip.dataset.pref]='';filterJobs();});
