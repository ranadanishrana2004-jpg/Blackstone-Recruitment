import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../app.mjs';
import {hashPassword,now} from '../db.mjs';

test('production accounts persist, use secure sessions and expose only real dashboard records',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'blackstone-production-'));
 const origin='https://bsukrecruitment.com';let db,server;
 async function start(){const setup=await createApp({production:true,origin,dataDir:dir,testing:true});db=setup.db;server=setup.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));}
 async function stop(){await new Promise(r=>server.close(r));db.close();server=null;db=null;}
 async function call(route,{method='GET',body,cookie}={}){const response=await fetch(`http://127.0.0.1:${server.address().port}/api${route}`,{method,headers:{Origin:origin,'X-Forwarded-Proto':'https','X-Blackstone-Request':'1','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});return {response,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};}
 try{
  await start();
  assert.equal((await call('/config')).data.demo,false);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM users').get().n,0);
  assert.deepEqual((await call('/jobs')).data.jobs,[]);
  const registered=await call('/auth/register',{method:'POST',body:{name:'Production Test',email:'production@example.test',password:'ProductionTestPassword!123',consent:true,role:'admin'}});
  assert.equal(registered.response.status,201);assert.equal(registered.data.user.role,'candidate');
  assert.match(registered.response.headers.get('set-cookie'),/Secure/);
  assert.match(registered.response.headers.get('set-cookie'),/HttpOnly/);
  assert.equal((await call('/staff/overview',{cookie:registered.cookie})).response.status,403);
  assert.deepEqual((await call('/applications',{cookie:registered.cookie})).data.applications,[]);
  await stop();await start();
  assert.equal((await call('/auth/me',{cookie:registered.cookie})).data.user.email,'production@example.test');
  const login=await call('/auth/login',{method:'POST',body:{email:'production@example.test',password:'ProductionTestPassword!123'}});
  assert.equal(login.response.status,200);
  db.prepare('INSERT INTO users(name,email,password,role,created_at) VALUES(?,?,?,?,?)').run('Staff','staff@example.test',await hashPassword('StaffTestPassword!123'),'admin',now());
  const staff=await call('/auth/login',{method:'POST',body:{email:'staff@example.test',password:'StaffTestPassword!123'}});
  assert.deepEqual((await call('/staff/overview',{cookie:staff.cookie})).data.stats,{jobs:0,applications:0,shortlisted:0,interviews:0});
  await call('/auth/logout',{method:'POST',cookie:login.cookie});
  assert.equal((await call('/applications',{cookie:login.cookie})).response.status,401);
 }finally{if(server)await stop();await rm(dir,{recursive:true,force:true});}
});
