import {createRequire} from 'node:module';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createApp} from '../platform/app.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const dir=await mkdtemp(path.join(os.tmpdir(),'blackstone-browser-'));
const origin='http://127.0.0.1:4180';
const {app,db}=await createApp({dataDir:dir,demo:true,testing:true,origin});
const server=app.listen(4180,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({headless:true});
const errors=[];
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
await mkdir('qa/platform',{recursive:true});
const go=async route=>{await page.goto(origin+route);await page.locator('#content').waitFor();await page.waitForFunction(()=>!document.body.classList.contains('loading'));};
const shot=async name=>{await page.waitForTimeout(700);await page.screenshot({path:`qa/platform/${name}.png`,fullPage:true})};
try{
 await go('/');await shot('home-light');assert.equal(await page.locator('img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)),true);
 await page.getByRole('button',{name:'Switch to dark mode'}).click();await shot('home-dark');await page.getByRole('button',{name:'Switch to light mode'}).click();
 await go('/jobs');await page.locator('#job-country').selectOption('UAE');assert.equal(await page.locator('.job-card').count(),3);await page.locator('#job-search').fill('Figma');assert.equal(await page.locator('.job-card').count(),1);
 await go('/login');await page.getByRole('button',{name:'Explore recruiter workspace'}).click();await page.getByRole('heading',{name:'Welcome back, Amelia.'}).waitFor();await shot('recruiter-overview');
 await page.getByRole('button',{name:'Switch to dark mode'}).click();await shot('recruiter-dark');await page.getByRole('button',{name:'Switch to light mode'}).click();
 await go('/workspace/jobs/new');await page.locator('#title').fill('QA Experience Designer');await page.locator('#location').fill('Dubai');await page.locator('#salary_min').fill('20000');await page.locator('#salary_max').fill('30000');await page.locator('#description').fill('Work with our product team on thoughtful, accessible experiences.');await page.locator('#requirements').fill('Figma, Research, Accessibility');await page.locator('#status').selectOption('published');await page.getByRole('button',{name:'Create opportunity'}).click();await page.getByRole('heading',{name:'Your job board.'}).waitFor();
 const job=db.prepare("SELECT id FROM jobs WHERE title='QA Experience Designer'").get();assert.ok(job);
 await go('/workspace/applications');await page.getByRole('button',{name:'Pipeline',exact:true}).click();assert.equal(await page.locator('.kanban-column').count(),8);await shot('recruiter-pipeline');
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('heading',{name:'Welcome back.'}).waitFor();await go('/register');await page.locator('#name').fill('QA Candidate');await page.locator('#email').fill('qa@example.com');await page.locator('#password').fill('SecureCandidate!2026');await page.locator('[name=consent]').check();await page.getByRole('button',{name:'Create my account'}).click();await page.getByRole('heading',{name:'Hello, QA.'}).waitFor();
 await go('/dashboard/profile');await page.locator('#headline').fill('Experience Designer');await page.locator('#location').fill('Dubai, UAE');await page.locator('#skills').fill('Figma, Research, Accessibility');await page.locator('[name=talent_pool]').check();await page.getByRole('button',{name:'Save my profile'}).click();await page.waitForTimeout(400);
 await go('/dashboard/cv');await page.locator('#cv-upload').setInputFiles({name:'qa-candidate.txt',mimeType:'text/plain',buffer:Buffer.from('QA Candidate\nExperience Designer\nSix years designing digital experiences with Figma, Research and Accessibility.\nWorked collaboratively with product and engineering teams.')});await page.getByText('qa-candidate.txt',{exact:true}).waitFor();
 await go('/jobs/'+job.id);await page.getByRole('button',{name:'Save for later'}).click();await page.getByRole('button',{name:'Apply for this role'}).click();await page.locator('#cover').fill('Looking forward to discussing this opportunity.');await page.locator('#modal [name=consent]').check();await page.getByRole('button',{name:'Submit application'}).click();await page.getByRole('heading',{name:'QA Experience Designer',exact:true}).first().waitFor();
 const application=db.prepare('SELECT a.id FROM applications a JOIN users u ON u.id=a.user_id WHERE u.email=?').get('qa@example.com');assert.ok(application);await shot('candidate-application');
 await go('/dashboard');await shot('candidate-overview');await page.reload();await page.getByRole('heading',{name:'Hello, QA.'}).waitFor();
 for(const route of ['/dashboard/applications','/dashboard/saved','/dashboard/cv','/dashboard/interviews','/dashboard/profile','/dashboard/notifications']){await go(route);assert.equal(await page.getByText('Something needs a moment.').count(),0,route);}
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('button',{name:'Explore recruiter workspace'}).click();await page.getByRole('heading',{name:'Welcome back, Amelia.'}).waitFor();
 await go('/workspace/applications/'+application.id);await page.locator('#status').selectOption('Shortlisted');await page.getByRole('button',{name:'Update',exact:true}).click();await page.getByText('Application stage updated.',{exact:true}).waitFor();await page.locator('#note').fill('Strong portfolio. Discuss design process and collaboration.');await page.getByRole('button',{name:'Save note'}).click();await page.getByText('Strong portfolio. Discuss design process and collaboration.').waitFor();await page.getByRole('button',{name:'Evidence checklist'}).click();await page.getByText('The CV mentions “Figma”.').waitFor();
 await page.getByRole('button',{name:'Schedule interview'}).click();const tomorrow=new Date(Date.now()+2*86400000).toISOString().slice(0,10);await page.locator('#starts_at').fill(tomorrow+'T11:30');await page.locator('#timezone').selectOption('Asia/Dubai');await page.locator('#location').fill('https://meet.example.com/blackstone');await page.locator('#modal button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#modal').open);await shot('recruiter-review');
 const interview=db.prepare('SELECT * FROM interviews WHERE application_id=?').get(application.id);assert.equal(interview.starts_at,tomorrow+'T07:30:00.000Z');
 await go('/workspace/interviews');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Calendar',exact:true}).first().click();assert.match((await download).suggestedFilename(),/\.ics$/);
 await go('/workspace/team');await page.getByRole('button',{name:'Add team member'}).click();await page.locator('#modal #name').fill('QA Recruiter');await page.locator('#modal #email').fill('recruiter.qa@example.com');await page.locator('#modal #password').fill('RecruiterSecure!2026');await page.getByRole('button',{name:'Create staff account'}).click();await page.getByRole('heading',{name:'QA Recruiter'}).waitFor();
 for(const route of ['/workspace/talent','/workspace/jobs','/workspace/enquiries','/workspace/activity','/workspace/profile','/workspace/notifications']){await go(route);assert.equal(await page.getByText('Something needs a moment.').count(),0,route);}
 await go('/employers');await page.locator('#name').fill('QA Hiring Manager');await page.locator('#company').fill('QA Company');await page.locator('#email').fill('employer.qa@example.com');await page.locator('#message').fill('We are looking for a new product designer in Dubai.');await page.getByRole('button',{name:'Start a conversation'}).click();await page.getByRole('heading',{name:'A good conversation starts here.'}).waitFor();
 await go('/workspace/enquiries');await page.getByRole('heading',{name:'QA Company'}).waitFor();
 await page.setViewportSize({width:390,height:844});
 for(const route of ['/','/jobs','/employers','/approach','/login','/privacy','/workspace','/workspace/applications','/workspace/talent','/workspace/jobs/new','/workspace/interviews','/workspace/profile','/workspace/applications/'+application.id]){await go(route);await page.waitForTimeout(500);const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(overflow.scroll<=overflow.width+1,`${route}: ${JSON.stringify(overflow)}`);if(route==='/')await shot('home-mobile');if(route==='/workspace')await shot('recruiter-mobile');}
 await go('/workspace');await page.getByRole('button',{name:'Open workspace navigation'}).click();await page.locator('.sidebar').getByRole('link',{name:'Applications',exact:true}).click();await page.getByRole('heading',{name:'Applications, with perspective.'}).waitFor();
 assert.deepEqual(errors,[]);console.log('Browser E2E passed: public markets/search, themes, real signup/login, CV upload, save, application, persistence, recruiter review/notes/checklist, timezone scheduling, calendar download, team creation, enquiries, all key mobile routes and navigation.');
}catch(error){await page.screenshot({path:'qa/platform/failure.png',fullPage:true});console.error('Browser errors:',errors);throw error;}finally{await browser.close();await new Promise(r=>server.close(r));db.close();await rm(dir,{recursive:true,force:true});}
