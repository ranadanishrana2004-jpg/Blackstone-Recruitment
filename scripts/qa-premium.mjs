import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1000}});
const settled=()=>p.waitForFunction(()=>!document.body.classList.contains('loading')&&document.querySelector('#content'));
try{
 await p.goto('http://127.0.0.1:4174/');await settled();await p.waitForTimeout(1700);
 await p.screenshot({path:'qa/platform/premium-home-desktop.png'});
 console.log('Image caption opacity:',await p.locator('.image-caption').evaluate(e=>getComputedStyle(e).opacity));
 await p.locator('.public-nav').getByRole('link',{name:'Find a role',exact:true}).click();await settled();
 assert.equal(await p.locator('#job-country option').count(),250);
 await p.locator('#job-country').selectOption('Japan');assert.ok(await p.locator('.empty-state').count());
 await p.locator('#job-country').selectOption('');await p.waitForTimeout(800);
 await p.screenshot({path:'qa/platform/premium-jobs-desktop.png'});
 await p.goto('http://127.0.0.1:4174/login');await settled();
 await p.getByRole('button',{name:'Explore recruiter workspace'}).click();await p.waitForURL('**/workspace');await settled();
 await p.goto('http://127.0.0.1:4174/workspace/jobs/new');await settled();
 await p.locator('#country').selectOption('Pakistan');await p.locator('#currency').selectOption('PKR');
 assert.equal(await p.locator('#country').inputValue(),'Pakistan');assert.equal(await p.locator('#currency').inputValue(),'PKR');
 await p.screenshot({path:'qa/platform/premium-job-editor.png',fullPage:true});
 console.log('Premium worldwide UI passed: 249 countries, empty-country filter, recruiter country and independent currency selections.');
}finally{await b.close();}
