import {mkdir,cp,copyFile,writeFile,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const file of ['platform/email.mjs','platform/marketplace.mjs','platform/public/marketplace.js','platform/app.mjs','platform/server.mjs','platform/db.mjs','platform/backup.mjs','platform/parse-worker.mjs','platform/public/app.js','platform/public/flows.js','platform/public/motion.js','platform/public/journey.js']){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}
await mkdir('dist/platform',{recursive:true});
await cp('platform/public','dist/platform/public',{recursive:true});
for(const file of ['email.mjs','marketplace.mjs','app.mjs','db.mjs','server.mjs','parse-worker.mjs','setup.mjs','backup.mjs'])await copyFile('platform/'+file,'dist/platform/'+file);
const pkg=JSON.parse(await readFile('package.json','utf8'));
await writeFile('dist/package.json',JSON.stringify({...pkg,scripts:{start:'node --env-file-if-exists=.env platform/server.mjs',setup:'node --env-file-if-exists=.env platform/setup.mjs',backup:'node --env-file-if-exists=.env platform/backup.mjs'}},null,2));
await copyFile('package-lock.json','dist/package-lock.json');
await copyFile('.env.example','dist/.env.example');
await copyFile('platform/DEPLOYMENT.md','dist/DEPLOYMENT.md');
await copyFile('platform/BRAND_REFERENCE.md','dist/BRAND_REFERENCE.md');
await copyFile('Dockerfile','dist/Dockerfile');
await copyFile('.dockerignore','dist/.dockerignore');
const renderConfig=(await readFile('render.yaml','utf8')).replace('buildCommand: npm ci && npm run build','buildCommand: npm ci --omit=dev');
await writeFile('dist/render.yaml',renderConfig);
console.log('Platform checked and packaged in dist/. No private database, CVs or secrets are included.');
