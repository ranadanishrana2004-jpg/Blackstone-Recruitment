function configuration(env){
 const provider=env.EMAIL_PROVIDER||(env.BREVO_API_KEY?'brevo':'resend');
 const from=env.EMAIL_FROM||'';
 const match=from.match(/^(.*?)\s*<([^<>]+)>$/);
 const sender={name:match?match[1].trim():'Blackstone UK Recruitment',email:match?match[2].trim():from.trim()};
 const key=provider==='brevo'?env.BREVO_API_KEY:provider==='resend'?env.RESEND_API_KEY:null;
 return {provider,sender,key,ready:Boolean(key&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender.email))};
}
export function emailEnabled(env=process.env){return configuration(env).ready;}
export async function sendEmail({to,subject,text}, {env=process.env,transport=fetch}={}){
 const {provider,sender,key,ready}=configuration(env);
 if(!ready)throw new Error('Email is not configured.');
 const brevo=provider==='brevo';
 const response=await transport(brevo?'https://api.brevo.com/v3/smtp/email':'https://api.resend.com/emails',{
  method:'POST',headers:{'Content-Type':'application/json',...(brevo?{'api-key':key}:{Authorization:`Bearer ${key}`})},
  body:JSON.stringify(brevo?{sender,to:[{email:to}],subject,textContent:text,replyTo:{email:sender.email}}:{from:`${sender.name} <${sender.email}>`,to:[to],subject,text}),signal:AbortSignal.timeout(15000)
 });
 if(!response.ok)throw new Error(`Email provider rejected request (${response.status}).`);
 return true;
}
