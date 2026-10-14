import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/hero-showcase.js',import.meta.url),'utf8');
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const context=vm.createContext({e:escape,icon:()=>'',countryName:String,money:j=>`${j.currency} ${j.salary_min} – ${j.salary_max}`,document:{querySelectorAll:()=>[],documentElement:{}},MutationObserver:class{observe(){}}});
vm.runInContext(source,context);
const job=(id,title,extra={})=>({id,title,sector:'Healthcare',company:'Blackstone',location:'Leeds',country:'UK',workplace:'On-site',type:'Permanent',currency:'GBP',salary_min:30000,salary_max:36000,period:'year',requirements:'Nursing, Patient care',created_at:new Date().toISOString(),...extra});
const slides=html=>html.match(/<article class="showcase-slide banner-slide[^"]*"/g)||[];
test('each live vacancy gets its own escaped banner linking to the role',()=>{
 const html=context.heroShowcase([job(7,'Bus Driver <script>',{sector:'Driving & Transport'}),job(8,'Nurse')]);
 assert.match(html,/href="\/jobs\/7"/);assert.match(html,/Bus Driver &lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
 assert.match(html,/GBP 30000 – 36000 \/ year/);assert.match(html,/Posted today/);
 assert.equal(slides(html).length,8);
 assert.ok(html.indexOf('/jobs/7')<html.indexOf('Example role'),'live roles come before examples');
});
test('with nothing published the banners are clearly labelled example roles',()=>{
 const html=context.heroShowcase([]);
 assert.equal(slides(html).length,8);assert.match(html,/Roles we recruit for/);assert.match(html,/Example role/);
 assert.match(html,/href="\/jobs\?sector=Driving%20%26%20Transport"/);assert.doesNotMatch(html,/href="\/jobs\/\d/);assert.doesNotMatch(html,/Now hiring|Posted today/);
});
test('eight or more live roles fill the carousel without examples',()=>{
 const html=context.heroShowcase(Array.from({length:9},(_,i)=>job(i+1,'Role '+i)));
 assert.equal(slides(html).length,8);assert.doesNotMatch(html,/Example role/);
});
