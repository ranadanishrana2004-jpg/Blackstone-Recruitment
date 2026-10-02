import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emailEnabled,sendEmail} from '../email.mjs';
const env={EMAIL_PROVIDER:'brevo',BREVO_API_KEY:'fictional-test-key',EMAIL_FROM:'Blackstone UK Recruitment <info@bsukrecruitment.com>'};
test('Brevo uses server API authentication and structured sender',async()=>{
 let request;await sendEmail({to:'recipient@example.com',subject:'Test',text:'Private reset link'},{env,transport:async(url,options)=>{request={url,...options};return {ok:true};}});
 assert.equal(request.url,'https://api.brevo.com/v3/smtp/email');assert.equal(request.headers['api-key'],env.BREVO_API_KEY);
 const body=JSON.parse(request.body);assert.deepEqual(body.sender,{name:'Blackstone UK Recruitment',email:'info@bsukrecruitment.com'});assert.equal(body.to[0].email,'recipient@example.com');assert.equal(body.textContent,'Private reset link');
});
test('missing config and provider failures never report successful email',async()=>{
 assert.equal(emailEnabled({}),false);assert.equal(emailEnabled({...env,EMAIL_PROVIDER:'unknown'}),false);assert.equal(emailEnabled(env),true);
 await assert.rejects(sendEmail({},{env:{}}),/not configured/);
 await assert.rejects(sendEmail({to:'recipient@example.com',subject:'Test',text:'Test'},{env,transport:async()=>({ok:false,status:401})}),/401/);
 await assert.rejects(sendEmail({to:'recipient@example.com',subject:'Test',text:'Test'},{env,transport:async()=>{throw new Error('timeout');}}),/timeout/);
});
test('legacy Resend configuration remains supported',async()=>{
 await sendEmail({to:'recipient@example.com',subject:'Test',text:'Test'},{env:{RESEND_API_KEY:'fictional',EMAIL_FROM:env.EMAIL_FROM},transport:async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');assert.equal(options.headers.Authorization,'Bearer fictional');return {ok:true};}});
});
