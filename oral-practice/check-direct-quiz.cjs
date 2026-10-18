const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('oral-practice/index.html','utf8'),app=fs.readFileSync('oral-practice/app.js','utf8'),data=fs.readFileSync('oral-practice/quiz-data.js','utf8');
const storage=new Map();let now=2000000;
class Element{constructor(){this.children=[];this.value='';this.hidden=true;this.style={};this.dataset={};this.classList={add(){},toggle(){}}}append(...e){this.children.push(...e)}replaceChildren(...e){this.children=e}setAttribute(){}scrollIntoView(){}focus(){}setCustomValidity(){}reportValidity(){}addEventListener(t,f){this[t]=f}}
function boot(){const e={};for(const m of html.matchAll(/id="([^"]+)"/g))e[m[1]]=new Element();e.studentEntry.hidden=false;const doc={body:new Element(),addEventListener(){},getElementById(id){assert(e[id],id);return e[id]},querySelectorAll(){return[]},createElement(){return new Element()},createTextNode(t){return t}};const c=vm.createContext({document:doc,window:{addEventListener(){}},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{protocol:'http:'},Date:class extends Date{static now(){return now}},setInterval:()=>1,clearInterval(){},confirm:()=>true,fetch:async()=>({ok:true,json:async()=>({scoreRecording:true,saved:true})}),Blob,URL,setTimeout});vm.runInContext(data,c);vm.runInContext(app,c);return {e,c,run:s=>vm.runInContext(s,c)}}
function start(b){b.run("identifiedName='Ana Cruz';quizUnlocked=true");b.e.student.value='Ana Cruz';b.run('startQuiz()')}


(async()=>{
 const b=boot();b.c.fetch=async(path,options)=>({ok:true,json:async()=>path==='/api/status'?{scoreRecording:true}:path.endsWith('study-finish')?{name:'Ana',deadline:now,studyFinished:true}:{name:'Ana',deadline:now+300000,studyFinished:false}});
 await b.run("enterNamedStudent('Ana')");assert.equal(b.e.study.hidden,false);assert.equal(b.run('quizActive'),false);
 await b.e.proceedQuiz.onclick();await new Promise(r=>setImmediate(r));assert.equal(b.run('quizActive'),true);assert.equal(b.e.game.hidden,false);assert.equal(b.run('questions.length'),10);assert(!html.includes('id="quizGate"'));assert(!html.includes('id="setup"'));assert(!html.includes('id="quizTab"'));
 b.e.quit.onclick();assert.equal(b.e.studentEntry.hidden,false);
 await b.run("enterNamedStudent('Ana')");b.run('studyDeadline=Date.now()-1;updateStudyTimer()');await new Promise(r=>setImmediate(r));assert.equal(b.run('quizActive'),true);assert.equal(b.e.game.hidden,false);
 console.log('PASS: no password/setup screens, proceed and study expiry automatically open question 1, fixed 10 questions, exit returns to welcome.');
})().catch(e=>{console.error(e);process.exitCode=1});

