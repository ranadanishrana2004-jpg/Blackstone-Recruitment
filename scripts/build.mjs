import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
const concepts = [['01-obsidian','obsidian','Obsidian'],['02-signal','signal','Signal'],['03-atelier','atelier','Atelier']];
for (const [folder,theme,name] of concepts) {
  await mkdir(folder,{recursive:true});
  await mkdir(`${folder}/assets`,{recursive:true});
  if(theme!=='signal') await copyFile(`source/assets/${theme==='obsidian'?'architecture':'office'}.jpg`,`${folder}/assets/${theme==='obsidian'?'architecture':'office'}.jpg`);
  for (const file of ['app.js','base.css']) await copyFile(`source/${file}`,`${folder}/${file}`);
  await copyFile(`source/${theme}.css`,`${folder}/theme.css`);
  const html=(await readFile('source/shell.html','utf8')).replaceAll('__THEME__',theme).replaceAll('__NAME__',name);
  await writeFile(`${folder}/index.html`,html);
  await writeFile(`${folder}/netlify.toml`,'[build]\n  publish = "."\n\n[[headers]]\n  for = "/*"\n  [headers.values]\n    X-Content-Type-Options = "nosniff"\n    Referrer-Policy = "strict-origin-when-cross-origin"\n');
}
console.log('Built three independent Netlify-ready design folders.');
