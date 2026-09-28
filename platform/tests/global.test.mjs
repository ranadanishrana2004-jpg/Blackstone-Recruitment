import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {openDB,seedDemo} from '../db.mjs';
import {createApp} from '../app.mjs';
test('legacy market migration preserves jobs, applications and saved roles',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'bs-migration-'));let db;
 try{
  db=openDB(dir);await seedDemo(db);
  const applications=db.prepare('SELECT * FROM applications').all();
  const jobs=db.prepare('SELECT * FROM jobs').all();
  const saved=db.prepare('SELECT * FROM saved_jobs').all();
  const schema=db.prepare("SELECT sql FROM sqlite_master WHERE name='jobs'").get().sql;
  db.exec('PRAGMA foreign_keys=OFF');
  db.exec(schema.replace('CREATE TABLE jobs','CREATE TABLE jobs_legacy').replace('country TEXT NOT NULL',"country TEXT NOT NULL CHECK(country IN ('UAE','UK','Saudi Arabia'))").replace('currency TEXT NOT NULL',"currency TEXT NOT NULL CHECK(currency IN ('AED','GBP','SAR'))"));
  db.exec('INSERT INTO jobs_legacy SELECT * FROM jobs; DROP TABLE jobs; ALTER TABLE jobs_legacy RENAME TO jobs');
  db.close();db=openDB(dir);
  assert.deepEqual(db.prepare('SELECT * FROM jobs').all(),jobs);
  assert.deepEqual(db.prepare('SELECT * FROM applications').all(),applications);
  assert.deepEqual(db.prepare('SELECT * FROM saved_jobs').all(),saved);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  db.prepare("UPDATE jobs SET country='Japan',currency='JPY' WHERE id=?").run(jobs[0].id);
  assert.equal((await readdir(dir)).filter(n=>n.startsWith('before-global-')).length,1);
  db.close();db=openDB(dir);assert.equal(db.prepare('SELECT currency FROM jobs WHERE id=?').get(jobs[0].id).currency,'JPY');
 }finally{try{db?.close();}catch{}await rm(dir,{recursive:true,force:true});}
});
test('worldwide jobs accept countries and explicit currencies and reject invalid values',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'bs-worldwide-'));
 const {app,db}=await createApp({dataDir:dir,demo:true,testing:true});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${server.address().port}/api`;
 try{
  const login=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json','X-Blackstone-Request':'1'},body:JSON.stringify({email:'recruiter@blackstone.demo',password:'BlackstoneDemo!2026'})});
  const headers={'Content-Type':'application/json','X-Blackstone-Request':'1',Cookie:login.headers.get('set-cookie').split(';')[0]};
  const config=await (await fetch(base+'/config')).json();assert.equal(config.countries.length,249);assert.ok(config.timezones.includes('America/New_York'));
  const sample=db.prepare('SELECT * FROM jobs LIMIT 1').get();
  for(const [country,currency] of [['Pakistan','PKR'],['Japan','JPY'],['United States','USD'],['Germany','EUR'],['Brazil','USD'],['Australia','AUD']]){
   const response=await fetch(base+'/staff/jobs',{method:'POST',headers,body:JSON.stringify({...sample,country,currency})});assert.equal(response.status,201);
   const {id}=await response.json();const {job}=await (await fetch(base+'/jobs/'+id)).json();assert.equal(job.currency,currency);assert.equal(job.country,country);
   const results=await (await fetch(base+'/jobs?country='+encodeURIComponent(country))).json();assert.ok(results.jobs.some(j=>j.id===id));
  }
  for(const invalid of [{country:'Atlantis',currency:'USD'},{country:'Japan',currency:'ZZZ'}])assert.equal((await fetch(base+'/staff/jobs',{method:'POST',headers,body:JSON.stringify({...sample,...invalid})})).status,422);
 }finally{await new Promise(r=>server.close(r));db.close();await rm(dir,{recursive:true,force:true});}
});
