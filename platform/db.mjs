import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export const now = () => new Date().toISOString();
export const digest = value => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password) { const salt=randomBytes(16).toString('hex');return `${salt}:${Buffer.from(await scrypt(password,salt,64)).toString('hex')}`; }
export async function verifyPassword(password,stored) { const [salt,key]=stored.split(':');const check=Buffer.from(await scrypt(password,salt,64));return timingSafeEqual(check,Buffer.from(key,'hex')); }
export function openDB(directory) {
 mkdirSync(directory,{recursive:true});const db=new DatabaseSync(path.join(directory,'blackstone.sqlite'));
 db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL;
 CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,email TEXT NOT NULL UNIQUE COLLATE NOCASE,name TEXT NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'candidate' CHECK(role IN ('candidate','recruiter','admin','employer')),phone TEXT NOT NULL DEFAULT '',location TEXT NOT NULL DEFAULT '',headline TEXT NOT NULL DEFAULT '',bio TEXT NOT NULL DEFAULT '',skills TEXT NOT NULL DEFAULT '',linkedin TEXT NOT NULL DEFAULT '',ai_consent INTEGER NOT NULL DEFAULT 0,talent_pool INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS resets(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS jobs(id INTEGER PRIMARY KEY,title TEXT NOT NULL,company TEXT NOT NULL,sector TEXT NOT NULL,location TEXT NOT NULL,country TEXT NOT NULL,currency TEXT NOT NULL,salary_min INTEGER NOT NULL,salary_max INTEGER NOT NULL,period TEXT NOT NULL DEFAULT 'year',workplace TEXT NOT NULL,type TEXT NOT NULL,description TEXT NOT NULL,requirements TEXT NOT NULL,benefits TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','closed')),featured INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS documents(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,mime TEXT NOT NULL,data BLOB NOT NULL,text TEXT NOT NULL DEFAULT '',parse_status TEXT NOT NULL DEFAULT 'ready',created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS applications(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,job_id INTEGER NOT NULL REFERENCES jobs(id),document_id INTEGER REFERENCES documents(id),cover TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'Applied' CHECK(status IN ('Applied','Reviewing','Shortlisted','Interview','Offer','Hired','Declined','Withdrawn')),analysis TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(user_id,job_id));
 CREATE TABLE IF NOT EXISTS saved_jobs(user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,PRIMARY KEY(user_id,job_id));
 CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY,application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,author_id INTEGER REFERENCES users(id),body TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS interviews(id INTEGER PRIMARY KEY,application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,recruiter_id INTEGER NOT NULL REFERENCES users(id),starts_at TEXT NOT NULL,duration INTEGER NOT NULL,timezone TEXT NOT NULL,location TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'Scheduled' CHECK(status IN ('Scheduled','Completed','Cancelled')),created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,body TEXT NOT NULL,link TEXT NOT NULL,read INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS enquiries(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,company TEXT NOT NULL,country TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'New',created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,action TEXT NOT NULL,entity TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id,status);
 CREATE INDEX IF NOT EXISTS idx_interviews_time ON interviews(starts_at,status);
 CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id,created_at);
 CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id,read);
`);
 const oldJobs=db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='jobs'").get().sql;
 if(oldJobs.includes("CHECK(country IN")){
  // Preserve a consistent pre-migration copy, including CVs and linked applications.
  db.prepare('VACUUM INTO ?').run(path.join(directory,'before-global-'+Date.now()+'.sqlite'));
  db.exec('PRAGMA foreign_keys=OFF');
  try{transaction(db,()=>{
   const next=oldJobs.replace(/^CREATE TABLE\s+(?:"jobs"|jobs)/i,'CREATE TABLE jobs_global').replace(/ CHECK\(country IN \([^)]*\)\)/,'').replace(/ CHECK\(currency IN \([^)]*\)\)/,'');
   db.exec(next);db.exec('INSERT INTO jobs_global SELECT * FROM jobs; DROP TABLE jobs; ALTER TABLE jobs_global RENAME TO jobs;');
   if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Global market migration failed relationship validation.');
  });}finally{db.exec('PRAGMA foreign_keys=ON');}
 }
 const userSchema=db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get().sql;
 if(!userSchema.includes("'employer'")){
  db.prepare('VACUUM INTO ?').run(path.join(directory,'before-marketplace-'+Date.now()+'.sqlite'));
  db.exec('PRAGMA foreign_keys=OFF');
  try{transaction(db,()=>{
   db.exec(userSchema.replace(/^CREATE TABLE\s+(?:"users"|users)/i,'CREATE TABLE users_marketplace').replace("'candidate','recruiter','admin'","'candidate','recruiter','admin','employer'"));
   db.exec('INSERT INTO users_marketplace SELECT * FROM users; DROP TABLE users; ALTER TABLE users_marketplace RENAME TO users;');
   if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Marketplace migration relationship check failed.');
  });}finally{db.exec('PRAGMA foreign_keys=ON');}
 }
 db.exec(`CREATE TABLE IF NOT EXISTS companies(id INTEGER PRIMARY KEY,owner_id INTEGER NOT NULL UNIQUE REFERENCES users(id),name TEXT NOT NULL,website TEXT NOT NULL DEFAULT '',description TEXT NOT NULL DEFAULT '',location TEXT NOT NULL DEFAULT '',country TEXT NOT NULL DEFAULT '',sector TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);`);
 if(!db.prepare('PRAGMA table_info(jobs)').all().some(c=>c.name==='company_id'))db.exec('ALTER TABLE jobs ADD COLUMN company_id INTEGER REFERENCES companies(id)');
 db.exec(`CREATE TABLE IF NOT EXISTS application_messages(id INTEGER PRIMARY KEY,application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,author_id INTEGER NOT NULL REFERENCES users(id),body TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS idx_messages_application ON application_messages(application_id,id);
 CREATE TABLE IF NOT EXISTS application_events(id INTEGER PRIMARY KEY,application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,status TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TRIGGER IF NOT EXISTS application_created AFTER INSERT ON applications BEGIN INSERT INTO application_events(application_id,status,created_at) VALUES(NEW.id,NEW.status,NEW.created_at); END;
 CREATE TRIGGER IF NOT EXISTS application_stage_changed AFTER UPDATE OF status ON applications WHEN OLD.status != NEW.status BEGIN INSERT INTO application_events(application_id,status,created_at) VALUES(NEW.id,NEW.status,NEW.updated_at); END;`);
 db.exec('CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id,status); PRAGMA user_version=3');
 return db;
}
export function transaction(db,fn){db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}}
export function audit(db,user,action,entity){db.prepare('INSERT INTO audit(actor_id,action,entity,created_at) VALUES(?,?,?,?)').run(user||null,action,String(entity),now());}
export function notify(db,user,title,body,link='/dashboard/applications'){db.prepare('INSERT INTO notifications(user_id,title,body,link,created_at) VALUES(?,?,?,?,?)').run(user,title,body,link,now());}
export async function seedDemo(db){
 if(db.prepare("SELECT value FROM settings WHERE key='demo_seeded'").get())return;
 if(db.prepare('SELECT id FROM users LIMIT 1').get())return;
 const password=await hashPassword('BlackstoneDemo!2026');
 const people=[['Amelia Sterling','recruiter@blackstone.demo','admin','Talent Director','London, UK'],['Alex Morgan','candidate@blackstone.demo','candidate','Senior Product Designer','Dubai, UAE'],['Sarah Mitchell','sarah@example.com','candidate','Finance Business Partner','London, UK'],['Omar Hassan','omar@example.com','candidate','Senior Software Engineer','Riyadh, Saudi Arabia'],['Priya Sharma','priya@example.com','candidate','People & Culture Manager','Dubai, UAE'],['James Wilson','james@example.com','candidate','Investment Analyst','London, UK'],['Noor Al-Fahad','noor@example.com','candidate','Marketing Manager','Riyadh, Saudi Arabia'],['Daniel Brooks','daniel@example.com','candidate','Operations Director','Manchester, UK']];
 const roles=[['Senior Product Designer','Technology','Dubai','UAE','AED',28000,35000,'month','Hybrid','Design intuitive digital products that make a measurable difference. Work with a multidisciplinary team from discovery through delivery.','Product design, Figma, User research, Design systems'],['Finance Business Partner','Finance','London','UK','GBP',65000,85000,'year','Hybrid','Partner with leadership to turn financial insight into confident decisions. Lead forecasting, business planning and commercial analysis.','Financial planning, Forecasting, Stakeholder management'],['Senior Software Engineer','Technology','Riyadh','Saudi Arabia','SAR',24000,32000,'month','Hybrid','Build reliable services for an ambitious technology business. Own technical decisions and collaborate across engineering and product.','JavaScript, TypeScript, Node.js, SQL'],['People & Culture Manager','Human Resources','Abu Dhabi','UAE','AED',22000,28000,'month','On-site','Create a workplace where people can do exceptional work. Guide the employee experience, people operations and organisational development.','People operations, Employee relations, Coaching'],['Investment Analyst','Finance','London','UK','GBP',55000,72000,'year','On-site','Support investment decisions through rigorous research, thoughtful modelling and clear communication.','Financial modelling, Research, Excel'],['Brand Marketing Manager','Marketing','Jeddah','Saudi Arabia','SAR',18000,24000,'month','Hybrid','Shape brand strategy and deliver campaigns that connect with people across the region.','Brand strategy, Campaign planning, Analytics'],['Operations Director','Operations','Manchester','UK','GBP',85000,105000,'year','Hybrid','Lead operational excellence and build the systems that make sustainable growth possible.','Leadership, Process improvement, Operations'],['Talent Acquisition Specialist','Human Resources','Dubai','UAE','AED',14000,19000,'month','On-site','Build meaningful candidate relationships and manage thoughtful, inclusive recruitment journeys.','Sourcing, Interviewing, Stakeholder management']];
 transaction(db,()=>{
 for(const [name,email,role,headline,location] of people)db.prepare('INSERT INTO users(name,email,password,role,headline,location,skills,created_at) VALUES(?,?,?,?,?,?,?,?)').run(name,email,password,role,headline,location,'Communication, Collaboration',now());
 for(const [title,sector,location,country,currency,min,max,period,workplace,description,requirements] of roles)db.prepare('INSERT INTO jobs(title,company,sector,location,country,currency,salary_min,salary_max,period,workplace,type,description,requirements,benefits,status,featured,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(title,'Confidential client',sector,location,country,currency,min,max,period,workplace,'Permanent',description,requirements,'Professional development\nCompetitive benefits\nCollaborative working environment','published',1,now(),now());
 const statuses=['Shortlisted','Reviewing','Interview','Applied','Offer','Reviewing','Applied'];
 for(let i=2;i<=8;i++){
 const text=`${people[i-1][0]}\n${people[i-1][3]}\n6 years of professional experience.\nSkills: ${roles[i-2][11]}\nWorked with cross-functional teams to deliver successful projects.\nThis is a fictional demonstration profile.`;
 const doc=db.prepare('INSERT INTO documents(user_id,name,mime,data,text,created_at) VALUES(?,?,?,?,?,?)').run(i,'sample-profile.txt','text/plain',Buffer.from(text),text,now());
 const date=new Date(Date.now()-(9-i)*86400000).toISOString();
 db.prepare('INSERT INTO applications(user_id,job_id,document_id,cover,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(i,i-1,Number(doc.lastInsertRowid),'I would welcome a conversation about this opportunity.',statuses[i-2],date,date);
 }
 db.prepare('INSERT INTO interviews(application_id,recruiter_id,starts_at,duration,timezone,location,created_at) VALUES(?,?,?,?,?,?,?)').run(3,1,new Date(Date.now()+86400000).toISOString(),45,'Asia/Riyadh','Video call — link to be arranged',now());
 notify(db,2,'You’re on the shortlist','Your Senior Product Designer application has moved to Shortlisted.');
 db.prepare("INSERT INTO settings VALUES('demo_seeded','true')").run();
 audit(db,1,'Demo workspace created','Fictional sample records');
 });
}
