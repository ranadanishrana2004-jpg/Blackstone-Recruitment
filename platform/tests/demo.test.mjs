import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {openDB,seedDemo} from '../db.mjs';

test('fictional demo has usable vacancies, CVs and valid application relationships without duplicating records',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'blackstone-demo-'));
 const db=openDB(dir);
 try{
  await seedDemo(db);await seedDemo(db);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM jobs').get().n,11);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE sector='Healthcare'").get().n,3);
  const applications=db.prepare('SELECT d.text,j.requirements FROM applications a JOIN documents d ON d.id=a.document_id JOIN jobs j ON j.id=a.job_id').all();
  assert.equal(applications.length,7);
  for(const a of applications){assert.match(a.text,/fictional demonstration profile/);assert.ok(a.text.includes(a.requirements));assert.ok(!a.text.includes('undefined'));}
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
 }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
