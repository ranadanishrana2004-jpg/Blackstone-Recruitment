import {backup,DatabaseSync} from 'node:sqlite';
import {mkdir,readdir,unlink} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export async function createBackup(db,directory){
 const folder=path.join(directory,'backups');await mkdir(folder,{recursive:true});
 const name=`blackstone-${new Date().toISOString().replace(/[:.]/g,'-')}.sqlite`;
 const destination=path.join(folder,name);
 await backup(db,destination);
 const check=new DatabaseSync(destination,{readOnly:true});
 try{if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Backup integrity check failed.')}finally{check.close()}
 const backups=(await readdir(folder)).filter(x=>/^blackstone-[\dTZ-]+\.sqlite$/.test(x)).sort().reverse();
 for(const old of backups.slice(7))await unlink(path.join(folder,old));
 return destination;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const directory=path.resolve(process.env.DATA_DIR||'platform/data');const db=new DatabaseSync(path.join(directory,'blackstone.sqlite'));
 try{console.log(`Verified backup created: ${await createBackup(db,directory)}`)}finally{db.close()}
}
