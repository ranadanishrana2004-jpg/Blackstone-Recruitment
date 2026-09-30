import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../app.mjs';
import {openDB,transaction} from '../db.mjs';

test('existing accounts, sessions and CV relationships survive employer-role migration',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'bs-market-migration-'));let db=openDB(dir);
 try{
  db.prepare("INSERT INTO users(id,email,name,password,role,created_at) VALUES(1,'legacy@test.example','Legacy Candidate','unchanged-hash','candidate','2026-01-01')").run();
  db.prepare("INSERT INTO sessions VALUES('existing-session',1,9999999999999)").run();
  db.prepare("INSERT INTO documents(user_id,name,mime,data,created_at) VALUES(1,'cv.txt','text/plain',?,'2026-01-01')").run(Buffer.from('Original private CV'));
  const schema=db.prepare("SELECT sql FROM sqlite_master WHERE name='users'").get().sql;
  db.exec('PRAGMA foreign_keys=OFF');transaction(db,()=>{db.exec(schema.replace(/^CREATE TABLE\s+(?:"users"|users)/i,'CREATE TABLE users_legacy').replace(",'employer'",''));db.exec('INSERT INTO users_legacy SELECT * FROM users; DROP TABLE users; ALTER TABLE users_legacy RENAME TO users;');});db.close();
  db=openDB(dir);assert.equal(db.prepare('SELECT password FROM users WHERE id=1').get().password,'unchanged-hash');assert.equal(db.prepare('SELECT user_id FROM sessions').get().user_id,1);assert.equal(Buffer.from(db.prepare('SELECT data FROM documents').get().data).toString(),'Original private CV');assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);assert.ok((await readdir(dir)).some(f=>f.startsWith('before-marketplace-')));
  db.prepare("INSERT INTO users(email,name,password,role,created_at) VALUES('new@test.example','Employer','hash','employer','2026-01-01')").run();
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});

test('two employers recruit independently through the complete candidate journey',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'bs-marketplace-'));
 const {app,db}=await createApp({dataDir:dir,testing:true});const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}/api`;
 const call=async(route,method='GET',body,cookie)=>{const r=await fetch(base+route,{method,headers:{'X-Blackstone-Request':'1',...(cookie?{Cookie:cookie}:{}),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body?(body instanceof FormData?body:JSON.stringify(body)):undefined});return {status:r.status,body:await r.json().catch(()=>null),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 try{
  const signup=mail=>call('/auth/register-employer','POST',{name:'Employer',company:mail,country:'UK',email:mail,password:'FictionalPassword!2026',consent:true,role:'admin'});
  const a=await signup('a@test.example'),b=await signup('b@test.example');assert.equal(a.status,201);assert.equal(b.status,201);assert.equal(a.body.user.role,'employer');
  const ca=(await call('/employer/company','GET',null,a.cookie)).body.company,cb=(await call('/employer/company','GET',null,b.cookie)).body.company;assert.notEqual(ca.id,cb.id);
  assert.equal((await signup('a@test.example')).status,409);
  assert.equal((await call('/employer/company','PATCH',{name:'Company A',country:'UK',website:'javascript:alert(1)'},a.cookie)).status,422);
  assert.equal((await call('/employer/company','PATCH',{name:'Company A',country:'UK',description:'We build useful software.',website:'https://example.com'},a.cookie)).status,200);
  const job={title:'Software Engineer',company:'Spoofed Company B',company_id:cb.id,sector:'Technology',location:'London',country:'UK',currency:'GBP',salary_min:50000,salary_max:70000,period:'year',workplace:'Hybrid',type:'Permanent',description:'Build our products.',requirements:'JavaScript, SQL',status:'draft',featured:true};
  const j=await call('/employer/jobs','POST',job,a.cookie);assert.equal(j.status,201);const id=j.body.id;
  assert.equal((await call('/jobs/'+id)).status,404);
  assert.equal((await call('/employer/jobs/'+id,'PATCH',{...job,status:'published'},b.cookie)).status,404);
  assert.equal((await call('/employer/jobs/'+id,'PATCH',{...job,status:'published'},a.cookie)).status,200);
  const published=(await call('/jobs/'+id)).body.job;assert.equal(published.company,'Company A');assert.equal(published.company_id,ca.id);assert.equal(published.featured,0);
  assert.equal((await call('/employer/jobs','GET',null,b.cookie)).body.jobs.length,0);
  const publicCompany=(await call('/companies/'+ca.id)).body;assert.equal(publicCompany.jobs.length,1);assert.equal(publicCompany.company.owner_id,undefined);
  const candidate=await call('/auth/register','POST',{name:'Candidate',email:'candidate@test.example',password:'FictionalPassword!2026',consent:true});const cc=candidate.cookie;
  assert.equal((await call('/employer/jobs','GET',null,cc)).status,403);
  await call('/profile','PATCH',{name:'Candidate',skills:'JavaScript, SQL, Go',talent_pool:true},cc);
  const matches=(await call('/matches','GET',null,cc)).body;assert.deepEqual(matches.jobs[0].matchedSkills,['javascript','sql']);
  const form=new FormData();form.append('cv',new Blob(['Fictional candidate CV. JavaScript and SQL software development experience.']),'candidate.txt');
  const doc=await call('/documents','POST',form,cc);assert.equal(doc.status,201);
  const application=await call('/applications','POST',{job_id:id,document_id:doc.body.id,consent:true},cc);assert.equal(application.status,201);const aid=application.body.id;
  assert.equal((await call('/employer/applications','GET',null,a.cookie)).body.applications.length,1);assert.equal((await call('/employer/applications','GET',null,b.cookie)).body.applications.length,0);
  for(const route of ['/applications','/applications/'+aid,'/documents/'+doc.body.id,'/interviews','/staff/talent','/staff/overview','/admin/team'])assert.equal((await call(route,'GET',null,a.cookie)).status,403,route);
  for(const route of ['/employer/applications/'+aid,'/employer/applications/'+aid+'/cv'])assert.equal((await call(route,'GET',null,b.cookie)).status,404,route);
  const download=await fetch(base+'/employer/applications/'+aid+'/cv',{headers:{Cookie:a.cookie}});assert.equal(download.status,200);assert.match(await download.text(),/Fictional candidate/);
  assert.equal((await call('/employer/applications/'+aid,'PATCH',{status:'Shortlisted'},b.cookie)).status,404);
  assert.equal((await call('/employer/applications/'+aid,'PATCH',{status:'Shortlisted'},a.cookie)).status,200);
  assert.equal((await call('/applications/'+aid,'GET',null,cc)).body.application.status,'Shortlisted');
  await call('/employer/applications/'+aid+'/notes','POST',{body:'Arrange a conversation'},a.cookie);
  assert.equal((await call('/applications/'+aid,'GET',null,cc)).body.notes.length,0);
  const interview={application_id:aid,starts_at:new Date(Date.now()+86400000).toISOString(),duration:30,timezone:'Europe/London',location:'https://example.com/meeting'};
  assert.equal((await call('/employer/interviews','POST',interview,b.cookie)).status,404);
  assert.equal((await call('/employer/interviews','POST',interview,a.cookie)).status,201);
  assert.equal((await call('/interviews','GET',null,cc)).body.interviews.length,1);
  assert.equal((await call('/employer/interviews','GET',null,b.cookie)).body.interviews.length,0);
  await call('/applications/'+aid,'PATCH',{status:'Withdrawn'},cc);
  assert.equal((await call('/employer/applications/'+aid,'PATCH',{status:'Hired'},a.cookie)).status,409);
  assert.equal((await call('/employer/interviews','GET',null,a.cookie)).body.interviews[0].status,'Cancelled');
  assert.ok((await call('/notifications','GET',null,a.cookie)).body.notifications.some(n=>n.title==='New application'));
  const fixtureHash=db.prepare('SELECT password FROM users WHERE id=?').get(a.body.user.id).password;
  db.prepare("INSERT INTO users(name,email,password,role,created_at) VALUES('Admin','admin@test.example',?,'admin','2026-01-01')").run(fixtureHash);
  const admin=await call('/auth/login','POST',{email:'admin@test.example',password:'FictionalPassword!2026'});
  assert.equal((await call('/admin/companies','GET',null,a.cookie)).status,403);
  assert.equal((await call('/admin/companies','GET',null,admin.cookie)).body.companies.length,2);
  assert.equal((await call('/admin/companies/'+ca.id,'PATCH',{active:false},admin.cookie)).status,200);
  assert.equal((await call('/employer/jobs','GET',null,a.cookie)).status,401);
  assert.equal((await call('/jobs/'+id)).status,404);
  assert.equal((await call('/auth/login','POST',{email:'a@test.example',password:'FictionalPassword!2026'})).status,401);
  assert.equal((await call('/admin/companies/'+ca.id,'PATCH',{active:true},admin.cookie)).status,200);
  assert.equal((await call('/auth/login','POST',{email:'a@test.example',password:'FictionalPassword!2026'})).status,200);
  assert.equal((await call('/jobs/'+id)).status,404,'restoring access must not republish closed jobs');
 }finally{await new Promise(r=>server.close(r));db.close();const reopened=openDB(dir);assert.equal(reopened.prepare('SELECT COUNT(*) AS n FROM companies').get().n,2);assert.equal(reopened.prepare('PRAGMA foreign_key_check').all().length,0);reopened.close();await rm(dir,{recursive:true,force:true});}
});
