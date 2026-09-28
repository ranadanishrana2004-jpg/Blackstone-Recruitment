import { createApp } from './app.mjs';
import {createBackup} from './backup.mjs';
import path from 'node:path';
const {app,db}=await createApp({demo:process.argv.includes('--demo')});
const port=Number(process.env.PORT)||4174,host=process.env.HOST||'127.0.0.1';
const server=app.listen(port,host,()=>console.log(`Blackstone Recruitment running at http://${host}:${port}${process.argv.includes('--demo')?' (local demo workspace)':''}`));
server.requestTimeout=30000;server.headersTimeout=35000;
// Consistent SQLite online backups, separate from filesystem snapshots.
// Off-host backup replication is still required for disaster recovery.
let backingUp=false;
async function scheduledBackup(){if(backingUp)return;backingUp=true;try{await createBackup(db,path.resolve(process.env.DATA_DIR||'platform/data'));console.log('Daily database backup completed and verified.')}catch(error){console.error('Database backup failed:',error.message)}finally{backingUp=false}}
if(process.env.NODE_ENV==='production'){setTimeout(scheduledBackup,30000).unref();setInterval(scheduledBackup,86400000).unref();}
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{server.close(()=>{db.close();process.exit(0)});setTimeout(()=>process.exit(1),10000).unref()});
