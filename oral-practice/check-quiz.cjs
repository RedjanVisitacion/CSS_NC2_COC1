const fs=require('fs'),vm=require('vm'),assert=require('assert');
class Element{constructor(){this.children=[];this.value='';this.hidden=true;this.style={};this.dataset={};this.classList={add(){},toggle(){}}}append(...e){this.children.push(...e)}replaceChildren(...e){this.children=e}setAttribute(){}scrollIntoView(){}focus(){}setCustomValidity(){}reportValidity(){}addEventListener(type,fn){this[type]=fn}}
const html=fs.readFileSync('oral-practice/index.html','utf8'),elements={};for(const m of html.matchAll(/id="([^"]+)"/g))elements[m[1]]=new Element();
const document={body:new Element(),addEventListener(type,fn){this[type]=fn},getElementById(id){assert(elements[id],id);return elements[id]},querySelectorAll(){return[]},createElement(){return new Element()},createTextNode(t){return t}};
const context=vm.createContext({document,window:{addEventListener(type,fn){this[type]=fn}},setInterval:()=>1,clearInterval(){},localStorage:{getItem(){return null},setItem(){}},confirm:()=>true,location:{protocol:"http:"},fetch:async(url)=>({ok:true,json:async()=>url==="/api/status"?{scoreRecording:true}:{saved:true}}),console,Blob,URL,setTimeout});
vm.runInContext(fs.readFileSync('oral-practice/quiz-data.js','utf8'),context);vm.runInContext(fs.readFileSync('oral-practice/app.js','utf8'),context);
assert.equal(vm.runInContext('quizUnlocked',context),false);elements.start.onclick();assert.equal(vm.runInContext('quizActive',context),false);
elements.quizPassword.value='wrong';elements.passwordForm.submit({preventDefault(){}});assert.equal(vm.runInContext('quizUnlocked',context),false);
vm.runInContext("identifiedName='Test student'",context);elements.quizPassword.value='Redjan09';elements.passwordForm.submit({preventDefault(){}});assert.equal(vm.runInContext('quizUnlocked',context),true);
elements.student.value='   ';elements.start.onclick();assert.equal(vm.runInContext('quizActive',context),false);assert(elements.recordingNotice.textContent.includes('required'));
for(const category of ['All topics','Components','Connections','Cooling']){
 elements.student.value='Test student';elements.start.onclick();
 const count=vm.runInContext('questions.length',context);assert.equal(count,10);assert.equal(vm.runInContext('new Set(questions.map(q=>q.id)).size',context),10);
 for(let i=0;i<count;i++){
  const choices=elements.choices.children.map(b=>b.dataset.answer);assert.equal(choices.length,4);assert.equal(new Set(choices).size,4);
  const answer=vm.runInContext('questions[position].answer',context);assert(choices.includes(answer));
  elements.choices.children.find(b=>b.dataset.answer===answer).onclick();
  elements.choices.children[0].onclick();assert.equal(vm.runInContext('answers.length',context),i+1);
  elements.next.onclick();
 }
 assert.equal(elements.finalScore.textContent,count+' / '+count);assert.equal(elements.result.hidden,false);
}
elements.start.onclick();for(let i=0;i<10;i++){const answer=vm.runInContext('questions[position].answer',context);elements.choices.children.find(b=>b.dataset.answer!==answer).onclick();elements.next.onclick()}assert.equal(elements.finalScore.textContent,'0 / 10');
for(const q of context.window.QUIZ_ITEMS)assert(fs.existsSync('oral-practice/'+q.image));
elements.start.onclick();
assert.equal(vm.runInContext('quizActive',context),true);
assert.equal(elements.questionTimer.textContent,'02:00');
vm.runInContext("tab('study')",context);assert.equal(elements.game.hidden,false);assert.equal(elements.study.hidden,true);
vm.runInContext('deadline=Date.now()-1;updateTimer()',context);
assert.equal(elements.questionTimer.textContent,'00:00');
assert.equal(vm.runInContext('answers.length',context),1);
assert.equal(vm.runInContext('answers[0].timedOut',context),true);
assert.equal(vm.runInContext('answers[0].correct',context),false);
elements.choices.children[0].onclick();assert.equal(vm.runInContext('answers.length',context),1);
elements.next.onclick();assert.equal(elements.questionTimer.textContent,'02:00');
elements.quit.onclick();assert.equal(vm.runInContext('quizActive',context),false);assert.equal(elements.setup.hidden,false);assert.equal(vm.runInContext('timerId',context),null);
console.log('PASS: quiz navigation lock, timeout scoring, timer restart, exit cleanup.');
console.log('PASS: all categories, four unique choices, correct/wrong scoring, duplicate-click prevention, results, and image paths.');

vm.runInContext("tab('study')",context);assert.equal(elements.study.hidden,false);assert.equal(elements.studyTimer.textContent,'05:00');
const studyDeadline=vm.runInContext('studyDeadline',context);
elements.quizTab.onclick();vm.runInContext("tab('study')",context);assert.equal(vm.runInContext('studyDeadline',context),studyDeadline);
vm.runInContext('studyDeadline=Date.now()-1;updateStudyTimer()',context);
assert.equal(elements.study.hidden,true);assert.equal(elements.quizGate.hidden,false);assert.equal(elements.studyTab.disabled,true);assert.equal(vm.runInContext('quizUnlocked',context),false);
vm.runInContext("tab('study')",context);assert.equal(elements.study.hidden,true);
vm.runInContext('studyFinished=false;studyDeadline=0',context);elements.studyTab.disabled=false;vm.runInContext("tab('study')",context);vm.runInContext('proceedFromStudy()',context);
assert.equal(elements.study.hidden,true);assert.equal(elements.quizGate.hidden,false);assert.equal(vm.runInContext('studyTimerId',context),null);
console.log('PASS: five-minute study timer, deadline preserved across navigation, expiry opens password gate, early proceed, study closure.');
