import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const sample=app.slice(app.indexOf('const sampleRoles='),app.indexOf('async function homePage()'));
const context=vm.createContext({e:String,icon:()=>'',countryName:String,publicShell:x=>x,state:{user:null},isStaff:()=>false});
const finder=readFileSync(new URL('../public/job-finder.js',import.meta.url),'utf8');
vm.runInContext(finder.slice(0,finder.indexOf('const finderKey=')),context);
vm.runInContext(sample,context);
test('live samples filter correctly and never present an application action',()=>{
 const roles=context.sampleJobsForFilters();assert.equal(roles.length,6);
 assert.equal(context.sampleJobsForFilters('','','Healthcare').length,3);
 assert.equal(context.sampleJobsForFilters('','UK','Technology').length,1);
 assert.equal(context.sampleJobsForFilters('','','','Remote').length,0);
 assert.equal(context.sampleJobsForFilters('','','','',{city:'dubai'}).length,2);
 assert.equal(context.sampleJobsForFilters('','','','',{type:'Contract'}).length,0);
 for(const role of roles){const page=context.sampleRoleDetail(role.id);assert.match(page,/fictional example/);assert.doesNotMatch(page,/data-action="apply"/);assert.match(page,/register\?next=/);assert.match(context.sampleRoleCard(role),/Sample role/);}
 assert.throws(()=>context.sampleRoleDetail('missing'),/could not be found/);
});
test('downloadable CV samples are explicitly fictional',()=>{
 for(const name of ['nurse','engineer','finance'])assert.match(readFileSync(new URL(`../public/assets/sample-cvs/${name}.txt`,import.meta.url),'utf8'),/FICTIONAL SAMPLE CV - NOT A REAL CANDIDATE/);
});
test('guided job search matches categories by specialism or job title',()=>{
 assert.equal(context.jobMatchesCategory({sector:'Operations',title:'Bus Driver'},'Driving & Transport'),true);
 assert.equal(context.jobMatchesCategory({sector:'driving & transport',title:'Coach captain'},'Driving & Transport'),true);
 assert.equal(context.jobMatchesCategory({sector:'Finance',title:'Business Partner'},'Driving & Transport'),false);
 assert.equal(context.jobMatchesCategory({sector:'Technology',title:'IT Support Analyst'},'Technology'),true);
 assert.equal(context.jobMatchesCategory({sector:'Finance',title:'Kitchen Porter'},''),true);
 assert.equal(context.jobMatchesPreferences({location:'Greater Manchester',type:'Permanent'},{city:'manchester',type:'Permanent'}),true);
 assert.equal(context.jobMatchesPreferences({location:'Leeds',type:'Permanent'},{city:'Manchester'}),false);
});
