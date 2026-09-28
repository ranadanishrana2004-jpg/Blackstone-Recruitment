// Small journey helpers shared by the existing page and form handlers.
function intendedDestination() {
  const next=new URLSearchParams(location.search).get('next');
  if(!next||!next.startsWith('/')||next.startsWith('//')||next.includes('\\'))return null;
  const url=new URL(next,location.origin);
  return url.origin===location.origin&&!url.pathname.startsWith('/api/')?url.pathname+url.search:null;
}

function bindJourney(path) {
  document.querySelectorAll('.nav-links a,.side-nav a').forEach(a=>{
    const active=new URL(a.href).pathname===path;
    if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    if(a.closest('.nav-links'))a.classList.toggle('active',active);
  });
  const next=intendedDestination();
  if(next&&['/login','/register','/forgot'].includes(path)) {
    document.querySelectorAll('.auth-bottom a,.auth-form a[href="/forgot"]').forEach(a=>{
      a.href=new URL(a.href).pathname+'?next='+encodeURIComponent(next);
    });
    if(/^\/jobs\/\d+$/.test(next)){
      const note=document.createElement('p');note.className='notice';
      note.textContent='Your selected role is saved for this step. After signing in, you’ll return to it to complete your application.';
      document.querySelector('.auth-form form')?.before(note);
    }
  }
  document.querySelectorAll('input[type="password"]').forEach(input=>{
    const row=document.createElement('div');row.className='password-control';input.before(row);row.append(input);
    const button=document.createElement('button');button.type='button';button.textContent='Show';button.setAttribute('aria-label','Show '+(document.querySelector(`label[for="${input.id}"]`)?.textContent||'password'));button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>{const show=input.type==='password';input.type=show?'text':'password';button.textContent=show?'Hide':'Show';button.setAttribute('aria-pressed',String(show));button.setAttribute('aria-label',(show?'Hide ':'Show ')+(document.querySelector(`label[for="${input.id}"]`)?.textContent||'password'));});row.append(button);
  });
}

function meetingLocation(value){
  try{const url=new URL(value);if(['https:','http:'].includes(url.protocol))return `<a class="mini-link" href="${e(url.href)}" target="_blank" rel="noopener noreferrer">Open meeting ${icon('diagonal')}</a><p class="fine">${e(value)}</p>`;}catch{}
  return e(value);
}

async function uploadApplicationCV(input){
  const form=input.closest('form'),status=form.querySelector('[data-upload-status]'),select=form.querySelector('[name=document_id]'),submit=form.querySelector('[type=submit]');
  const file=input.files[0];if(!file)return;
  status.textContent='';
  if(!/\.(pdf|docx|txt)$/i.test(file.name)||!file.size||file.size>5*1024*1024){status.textContent='Choose a PDF, DOCX or TXT file, up to 5 MB.';input.value='';return;}
  input.disabled=true;submit.disabled=true;status.textContent='Uploading securely and reading your CV…';
  try{
    const body=new FormData();body.append('cv',file);const doc=await api('/documents',{method:'POST',body});
    select.add(new Option(doc.name,doc.id,true,true));select.disabled=false;
    form.querySelector('label[for="application-cv"]').textContent='Upload a different CV (optional)';
    status.textContent=doc.parse_status==='ready'?'CV added and selected. Review your introduction, then submit.':'CV added and selected. Our team will review the original document manually.';
  }catch(error){status.textContent=error.message;}
  finally{input.disabled=false;input.value='';submit.disabled=!select.value;}
}

function applicationForm(documents,id,title){
  return `<p>Apply for <strong>${e(title)}</strong>.</p><p class="fine">1. Choose or upload your CV &nbsp; · &nbsp; 2. Review and submit</p><form data-form="application" data-id="${id}">
  ${selectField('Choose your CV','document_id',documents.length?documents.map(d=>[d.id,d.name]):[['','Upload a CV below to continue']],documents[0]?.id||'','required'+(documents.length?'':' disabled'))}
  <div class="field application-upload"><label for="application-cv">${documents.length?'Or upload a different CV':'Upload your CV'}</label><input type="file" id="application-cv" accept=".pdf,.docx,.txt"><small>PDF, DOCX or TXT · Up to 5 MB · Saved privately to your CV library.</small><p class="fine" data-upload-status role="status" aria-live="polite"></p></div>
  <div class="field"><label for="cover">Your introduction (optional)</label><textarea name="cover" id="cover" maxlength="5000" placeholder="What interests you about this opportunity?"></textarea></div>
  <label class="check-label"><input type="checkbox" name="consent" required><span>I agree to share this CV and application with Blackstone’s recruitment team for this role.</span></label><p class="error-inline" data-error role="alert"></p>
  <button class="btn full" type="submit" ${documents.length?'':'disabled'}>Submit application ${icon('arrow')}</button><p class="fine">You can track updates in My applications. A copy of your selected CV stays with this application.</p></form>`;
}

function candidateNextSteps(documentCount,applicationCount){
  const steps=[
    [Boolean(state.user.headline&&state.user.skills),'Introduce yourself','Add your role and skills.','/dashboard/profile'],
    [documentCount>0,'Add your CV','Keep a document ready to apply.','/dashboard/cv'],
    [applicationCount>0,'Find your next role','Explore roles and make an introduction.','/jobs']
  ];
  if(steps.every(step=>step[0]))return '';
  return `<section class="panel setup-panel" aria-label="Getting started"><div class="panel-header"><div><h3>Your next steps</h3><p>Start wherever you like. A complete profile helps our team get to know you.</p></div><span class="tag">${steps.filter(s=>s[0]).length} / 3 complete</span></div><div class="setup-steps">${steps.map(([done,title,copy,href],i)=>`<a href="${href}" class="setup-step"><span class="setup-number">${done?icon('check'):i+1}</span><span><strong>${title}${done?' · Done':''}</strong><small>${copy}</small></span>${icon('arrow')}</a>`).join('')}</div></section>`;
}
