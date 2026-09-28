import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';
import os from 'node:os';
import {openDB} from '../db.mjs';
import {createBackup} from '../backup.mjs';
test('online backup produces a verified, restorable database',async()=>{const dir=await mkdtemp(path.join(os.tmpdir(),'blackstone-backup-'));const db=openDB(dir);try{db.prepare('INSERT INTO settings VALUES(?,?)').run('backup-test','retained');const filename=await createBackup(db,dir);const recovered=new DatabaseSync(filename,{readOnly:true});try{assert.equal(recovered.prepare("SELECT value FROM settings WHERE key='backup-test'").get().value,'retained');assert.equal(recovered.prepare('PRAGMA integrity_check').get().integrity_check,'ok')}finally{recovered.close()}}finally{db.close();await rm(dir,{recursive:true,force:true})}});
