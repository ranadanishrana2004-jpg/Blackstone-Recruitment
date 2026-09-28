import { parentPort, workerData } from 'node:worker_threads';
try {
 const buffer=Buffer.from(workerData.buffer);let text='';
 if(workerData.type==='pdf'){const {PDFParse}=await import('pdf-parse');const parser=new PDFParse({data:buffer});try{text=(await parser.getText()).text}finally{await parser.destroy()}}
 else if(workerData.type==='docx'){const mammoth=await import('mammoth');text=(await mammoth.default.extractRawText({buffer})).value;}
 else text=buffer.toString('utf8');
 parentPort.postMessage({text:text.slice(0,60000),status:text.trim().length>30?'ready':'needs-review'});
}catch{parentPort.postMessage({text:'',status:'needs-review'});}
