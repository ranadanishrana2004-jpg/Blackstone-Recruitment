import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/hero-showcase.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const context=vm.createContext({e:escape,icon:()=>'',countryName:String,document:{querySelectorAll:()=>[],documentElement:{}},MutationObserver:class{observe(){}}});
vm.runInContext(app.slice(app.indexOf('const sampleRoles='),app.indexOf('function sampleRoleCard')),context);
vm.runInContext(source,context);
test('hero ticker lists live roles, escapes them and links to each vacancy',()=>{
 const html=context.heroShowcase([{id:7,title:'Bus Driver <script>',sector:'Driving & Transport',location:'Leeds',country:'UK',workplace:'On-site',created_at:new Date().toISOString()},{id:8,title:'Nurse',sector:'Healthcare',location:'Dubai',country:'UAE',workplace:'On-site',created_at:'2020-01-01T00:00:00Z'},{id:9,title:'Chef',sector:'Hospitality',location:'York',country:'UK',workplace:'On-site',created_at:new Date().toISOString()}]);
 assert.match(html,/href="\/jobs\/7"/);assert.match(html,/Bus Driver &lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
 assert.match(html,/Now hiring/);assert.match(html,/is-moving/);assert.match(html,/<em>New<\/em>/);
 assert.equal((html.match(/class="showcase-slide[ "]/g)||[]).length,4);
});
test('hero ticker falls back to clearly labelled example roles when nothing is published',()=>{
 const html=context.heroShowcase([]);
 assert.match(html,/Roles we recruit for/);assert.match(html,/Example role/);assert.match(html,/href="\/sample-jobs\//);assert.doesNotMatch(html,/href="\/jobs\/\d/);
});
