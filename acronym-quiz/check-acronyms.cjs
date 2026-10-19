const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('acronym-quiz/index.html','utf8'),app=fs.readFileSync('acronym-quiz/app.js','utf8'),data=fs.readFileSync('acronym-quiz/quiz-data.js','utf8');
const storage=new Map();let now=2000000;
class Element{constructor(){this.children=[];this.value='';this.hidden=true;this.style={};this.dataset={};this.classList={add(){},toggle(){}}}append(...e){this.children.push(...e)}replaceChildren(...e){this.children=e}setAttribute(){}scrollIntoView(){}focus(){}setCustomValidity(){}reportValidity(){}addEventListener(t,f){this[t]=f}}
function boot(){const e={};for(const m of html.matchAll(/id="([^"]+)"/g))e[m[1]]=new Element();e.studentEntry.hidden=false;const doc={body:new Element(),addEventListener(){},getElementById(id){assert(e[id],id);return e[id]},querySelectorAll(){return[]},createElement(){return new Element()},createTextNode(t){return t}};const c=vm.createContext({document:doc,window:{addEventListener(){}},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{protocol:'http:'},Date:class extends Date{static now(){return now}},setInterval:()=>1,clearInterval(){},confirm:()=>true,fetch:async()=>({ok:true,json:async()=>({scoreRecording:true,saved:true})}),Blob,URL,setTimeout});vm.runInContext(data,c);vm.runInContext(app,c);return {e,c,run:s=>vm.runInContext(s,c)}}
function start(b){b.run("identifiedName='Ana Cruz';quizUnlocked=true");b.e.student.value='Ana Cruz';b.run('startQuiz()')}


let b=boot();start(b);assert.equal(b.run('questions.length'),30);assert.equal(b.e.choices.children.length,30);assert.equal(b.run('new Set(questions.map(q=>q.acronym)).size'),30);
const first=b.run('questions[0].acronym'),deadline=b.run('deadline');b.e.typedAnswer.value='draft meaning';b.e.typedAnswer.input();now+=10000;b=boot();assert.equal(b.e.acronymPrompt.textContent,first);assert.equal(b.e.typedAnswer.value,'draft meaning');assert.equal(b.run('deadline'),deadline);
for(let i=0;i<30;i++){const answer=b.run('questions[position].answer');b.e.typedAnswer.value=answer.toLowerCase().replaceAll('-',' ');b.e.submitAnswer.onclick();assert.equal(b.run('answers.length'),i+1);b.e.submitAnswer.onclick();assert.equal(b.run('answers.length'),i+1);b.e.next.onclick()}
assert.equal(b.e.finalScore.textContent,'30 / 30');assert.equal(b.e.review.children.length,30);
console.log('PASS: 30 randomized acronyms, complete word bank, typed answers, normalization, scoring, duplicate prevention, refresh and draft recovery.');
