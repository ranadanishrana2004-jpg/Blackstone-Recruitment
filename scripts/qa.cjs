const { chromium } = require(process.env.PLAYWRIGHT_PATH||'playwright');
const fs = require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1050},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 fs.mkdirSync('qa',{recursive:true});
 for(const theme of ['01-obsidian','02-signal','03-atelier']){
  await page.goto('http://127.0.0.1:4173/'+theme+'/');
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(650);
  await page.screenshot({path:`qa/${theme}-desktop.png`,fullPage:true});
  if(await page.locator('img').evaluateAll(els=>els.some(x=>!x.complete||!x.naturalWidth)))throw Error(theme+' missing image');
  await page.getByRole('button',{name:'Switch to dark mode'}).click();
  await page.waitForTimeout(400);
  await page.screenshot({path:`qa/${theme}-dark.png`,fullPage:true});
  await page.getByRole('button',{name:'Switch to light mode'}).click();
  await page.goto('http://127.0.0.1:4173/'+theme+'/#jobs');
  await page.locator('#job-search').fill('frontend');
  await page.waitForTimeout(150);
  if(await page.locator('.job-card').count()!==1)throw Error('Search failed');
  await page.getByRole('button',{name:'Save Frontend Engineer',exact:true}).click();
  await page.getByRole('button',{name:'View Frontend Engineer',exact:true}).click();
  await page.getByRole('button',{name:'Apply for this role'}).click();
  await page.locator('#full-name').fill('Demo Candidate');
  await page.locator('#email').fill('demo@example.com');
  await page.locator('#cv-file').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nDemo CV for interface testing')});
  await page.locator('[name=consent]').check();
  await page.getByRole('button',{name:'Preview my application'}).click();
  await page.getByRole('link',{name:'View recruiter experience'}).click();
  await page.getByRole('button',{name:'Preview AI analysis'}).click();
  await page.getByText('DEMO · FILE NOT ANALYSED').waitFor();
  await page.getByRole('button',{name:'Shortlist',exact:true}).click();
  if(!(await page.locator('#candidate-detail').textContent()).includes('Shortlisted'))throw Error('Shortlist failed');
  await page.screenshot({path:`qa/${theme}-workspace.png`,fullPage:true});
  await page.goto('http://127.0.0.1:4173/'+theme+'/#employers');
  await page.locator('#hiring-name').fill('Demo Employer');await page.locator('#hiring-company').fill('Demo Company');await page.locator('#hiring-email').fill('employer@example.com');await page.locator('#hiring-needs').fill('A product designer');
  await page.getByRole('button',{name:'Preview enquiry'}).click();await page.getByText('Your enquiry preview is ready.').waitFor();
  await page.setViewportSize({width:390,height:844});
  for(const route of ['home','jobs','submit','review','employers','about','privacy']){
   await page.goto('http://127.0.0.1:4173/'+theme+'/#'+route);await page.waitForTimeout(650);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   if(overflow)throw Error(theme+' '+route+' mobile overflow');
   if(route==='home')await page.screenshot({path:`qa/${theme}-mobile.png`,fullPage:true});
  }
  await page.getByRole('button',{name:'Open menu',exact:true}).click();
  await page.locator('.nav').getByRole('link',{name:'Find a role',exact:true}).click();
  await page.locator('#job-search').waitFor();
  await page.setViewportSize({width:1440,height:1050});
  console.log(theme+': desktop, mobile routes, theme, search, save, application, review, analysis, shortlist, enquiry and navigation passed');
 }
 if(errors.length)throw Error(errors.join('\n'));
 await browser.close();console.log('All checks passed. No browser runtime errors.');
})().catch(e=>{console.error(e);process.exit(1)});
