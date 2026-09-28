import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Worker} from 'node:worker_threads';
for(const type of ['pdf','docx'])test(`extracts real ${type.toUpperCase()} CV text in an isolated worker`,async()=>{const buffer=await readFile(new URL(`./fixtures/sample-cv.${type}`,import.meta.url));const result=await new Promise((resolve,reject)=>{const worker=new Worker(new URL('../parse-worker.mjs',import.meta.url),{workerData:{type,buffer},resourceLimits:{maxOldGenerationSizeMb:160}});const timeout=setTimeout(()=>{worker.terminate();reject(Error('Parsing deadline exceeded'));},15000);let result;worker.once('message',r=>{result=r});worker.once('exit',code=>{clearTimeout(timeout);if(code===0&&result)resolve(result);else reject(Error('Parser worker exited without a result'))});worker.once('error',reject);});assert.equal(result.status,'ready');assert.match(result.text,/Figma/);assert.match(result.text,/Research/);});
