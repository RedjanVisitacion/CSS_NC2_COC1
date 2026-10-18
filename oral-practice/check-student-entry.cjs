const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('oral-practice/index.html','utf8'),app=fs.readFileSync('oral-practice/app.js','utf8'),data=fs.readFileSync('oral-practice/quiz-data.js','utf8');
const storage=new Map();let now=2000000;
class Element{constructor(){this.children=[];this.value='';this.hidden=true;this.style={};this.dataset={};this.classList={add(){},toggle(){}}}append(...e){this.children.push(...e)}replaceChildren(...e){this.children=e}setAttribute(){}scrollIntoView(){}focus(){}setCustomValidity(){}reportValidity(){}addEventListener(t,f){this[t]=f}}
function boot(){const e={};for(const m of html.matchAll(/id="([^"]+)"/g))e[m[1]]=new Element();e.quizGate.hidden=false;const doc={body:new Element(),addEventListener(){},getElementById(id){assert(e[id],id);return e[id]},querySelectorAll(){return[]},createElement(){return new Element()},createTextNode(t){return t}};const c=vm.createContext({document:doc,window:{addEventListener(){}},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{protocol:'http:'},Date:class extends Date{static now(){return now}},setInterval:()=>1,clearInterval(){},confirm:()=>true,fetch:async()=>({ok:true,json:async()=>({scoreRecording:true,saved:true})}),Blob,URL,setTimeout});vm.runInContext(data,c);vm.runInContext(app,c);return {e,c,run:s=>vm.runInContext(s,c)}}
function start(b){b.run("identifiedName='Ana Cruz'");b.e.quizPassword.value='Redjan09';b.e.passwordForm.submit({preventDefault(){}});b.e.student.value='Ana Cruz';b.e.start.onclick()}

(async()=>{
 const b=boot(),records=new Map();
 b.c.fetch=async(path,options)=>{const input=options?.body?JSON.parse(options.body):{};if(path==='/api/status')return {ok:true,json:async()=>({scoreRecording:true})};const key=input.name.trim().replace(/\s+/g,' ').toLowerCase();let record=records.get(key);if(!record){record={name:input.name.trim(),deadline:now+300000,studyFinished:key==='done student',quizCompleted:key==='done student'};records.set(key,record)}if(path.endsWith('study-finish'))record.studyFinished=true;return {ok:true,json:async()=>({...record})}};
 assert.equal(b.run('identifiedName'),'');b.e.quizTab.onclick();assert.equal(b.e.studentEntry.hidden,false);assert.equal(b.e.quizGate.hidden,true);
 await b.run("enterNamedStudent('Ana Cruz')");assert.equal(b.e.study.hidden,false);assert.equal(b.e.student.value,'Ana Cruz');assert.equal(b.e.studyTimer.textContent,'05:00');
 await b.e.proceedQuiz.onclick();assert.equal(b.e.study.hidden,true);assert.equal(b.e.quizGate.hidden,false);
 b.e.switchStudent.onclick();assert.equal(b.e.studentEntry.hidden,false);
 await b.run("enterNamedStudent('Ana Cruz')");assert.equal(b.e.study.hidden,true);assert.equal(b.e.quizGate.hidden,false);assert(b.e.studentAccessStatus.textContent.includes('already been used'));
 b.e.switchStudent.onclick();await b.run("enterNamedStudent('Done Student')");assert.equal(b.e.study.hidden,true);assert(b.e.studentAccessStatus.textContent.includes('already completed'));
 b.e.switchStudent.onclick();await b.run("enterNamedStudent('New Student')");assert.equal(b.e.study.hidden,false);assert.equal(b.e.studyTimer.textContent,'05:00');
 console.log('PASS: name entry first, new student study, early proceed persists completion, returning/completed names skip study, next student flow.');
})().catch(error=>{console.error(error);process.exitCode=1});
