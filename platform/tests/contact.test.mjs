import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const context=vm.createContext({state:{config:{}},e:String,icon:()=>''});
vm.runInContext(source.slice(source.indexOf('const contactEmail='),source.indexOf('const isStaff=')),context);
test('contact email includes encoded subject and branded plain-text footer',()=>{
 const link=new URL(context.contactMailto());assert.equal(link.protocol,'mailto:');assert.equal(link.pathname,'info@bsukrecruitment.com');assert.equal(link.searchParams.get('subject'),'Enquiry | Blackstone UK Recruitment');
 const body=link.searchParams.get('body');assert.match(body,/https:\/\/bsukrecruitment.com/);assert.match(body,/\+44 800 043 7867/);assert.ok(body.includes('\r\n'));assert.doesNotMatch(body,/<img|password|token/i);
});
test('floating contact uses native call and mail links without auto-sending',()=>{
 const markup=context.floatingContact();assert.match(markup,/tel:\+448000437867/);assert.match(markup,/mailto:info@bsukrecruitment.com\?subject=/);assert.match(markup,/aria-label="Quick contact"/);assert.doesNotMatch(markup,/data-action=/);
});
