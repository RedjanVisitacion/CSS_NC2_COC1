const $=id=>document.getElementById(id);
const items=window.QUIZ_ITEMS;
let questions=[],position=0,answers=[],locked=false,lastResult=null;
let quizActive=false,timerId=null,deadline=0,attemptId=null;
let quizUnlocked=false;
let currentChoices=[],currentScreen="entry",identifiedName="";
let studyDeadline=0,studyTimerId=null,studyFinished=false;
function stopStudyTimer(){if(studyTimerId!==null){clearInterval(studyTimerId);studyTimerId=null}}
function proceedFromStudy(){studyFinished=true;stopStudyTimer();$('studyTab').disabled=true;$('studyTab').textContent='Study completed';goToQuiz()}
function updateStudyTimer(){if(studyFinished||!studyDeadline)return;const remaining=Math.max(0,Math.ceil((studyDeadline-Date.now())/1000));$('studyTimer').textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');$('studyTimer').classList.toggle('urgent',remaining<=30);if(remaining===0)proceedFromStudy()}
function beginStudy(){if(studyFinished){goToQuiz();return}if(!studyDeadline)studyDeadline=Date.now()+300000;saveSession();updateStudyTimer();if(studyFinished)return;stopStudyTimer();studyTimerId=setInterval(updateStudyTimer,250)}

const QUESTION_TIME_MS=120000;
function stopTimer(){if(timerId!==null){clearInterval(timerId);timerId=null}}
function setQuizFocus(active){quizActive=active;document.body.classList.toggle('quiz-active',active);if(!active)stopTimer()}
function updateTimer(){if(!quizActive||locked)return;const remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));$('questionTimer').textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');$('questionTimer').classList.toggle('urgent',remaining<=20);if(remaining===0)choose(null,true)}
function startTimer(resume=false){stopTimer();if(!resume)deadline=Date.now()+QUESTION_TIME_MS;saveSession();updateTimer();if(!locked)timerId=setInterval(updateTimer,250)}
window.addEventListener('beforeunload',event=>{saveSession();if(quizActive){event.preventDefault();event.returnValue=''}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){updateTimer();if(!$('study').hidden)updateStudyTimer()}});

function shuffled(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const CREATOR_NAME='Redjan Phil S. Visitacion';
document.querySelectorAll('.creator').forEach(e=>e.textContent=CREATOR_NAME);
document.title='CSS Acronym Quiz · '+CREATOR_NAME;
function tab(name){if(quizActive||wheelSpinning)return;if((name==='quiz'||name==='study')&&!identifiedName)name='entry';if(name==='study'&&studyFinished){openQuiz();return}if(name!=='study')stopStudyTimer();currentScreen=name;['studentEntry','game','result','study','wheel'].forEach(id=>$(id).hidden=true);['study','wheel'].forEach(id=>$(id+'Tab').classList.toggle('active',id===name));if(name==='quiz'){openQuiz();return}$(name==='entry'?'studentEntry':name).hidden=false;if(name==='study'){buildStudy();beginStudy()}if(name==='wheel')loadWheel();saveSession()}
function goToQuiz(){if(quizActive||wheelSpinning)return;tab('quiz')}$('studyTab').onclick=()=>{if(quizActive||wheelSpinning)return;if(!identifiedName){tab('entry');return}enterNamedStudent(identifiedName)};
let openingQuiz=false;
async function openQuiz(){if(openingQuiz||quizActive)return;if(!identifiedName){tab('entry');return}openingQuiz=true;try{await checkRecorder();if(!recorderReady){tab('entry');$('entryStatus').textContent='The local score recorder is unavailable. Keep the launcher running and try again.';return}quizUnlocked=true;startQuiz()}finally{openingQuiz=false}}
function startQuiz(){if(quizActive||!quizUnlocked||!identifiedName)return;if(!$('student').value.trim()){$('recordingNotice').textContent='Student name is required. Please enter your full name.';$('student').setCustomValidity('Please enter your full name.');$('student').reportValidity();$('student').focus();return}$('student').setCustomValidity('');attemptId=globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(16).slice(2);setQuizFocus(true);currentScreen='game';questions=shuffled(items);position=0;answers=[];$('result').hidden=true;$('game').hidden=false;$('studentLabel').textContent=$('student').value.trim()||'Student';showQuestion();$('game').scrollIntoView({behavior:'smooth',block:'start'})}
function showQuestion(resume=false){
 const previous=resume&&locked?answers[answers.length-1]:null,q=questions[position];locked=false;
 $('acronymPrompt').textContent=q.acronym;$('topicLabel').textContent='QUIZ 2 ? ACRONYM MATCHING';$('counter').textContent='Question '+(position+1)+' of '+questions.length;$('score').textContent=answers.filter(a=>a.correct).length+' points';$('progressBar').style.width=(position/questions.length*100)+'%';$('feedback').hidden=true;$('next').hidden=true;$('answerError').textContent='';$('typedAnswer').disabled=false;$('submitAnswer').disabled=false;if(!resume)$('typedAnswer').value='';
 $('choices').replaceChildren();if(!resume||currentChoices.length!==items.length)currentChoices=items.map(q=>q.answer).sort((a,b)=>a.localeCompare(b));
 currentChoices.forEach(name=>{const b=document.createElement('button');b.className='choice';b.textContent=name;b.dataset.answer=name;b.onclick=()=>{$('typedAnswer').value=name;$('answerError').textContent='';saveSession()};$('choices').append(b)});
 if(previous){answers.pop();choose(previous.timedOut?null:previous.selected,previous.timedOut,true,previous.remainingSeconds)}else startTimer(resume);$('typedAnswer').focus({preventScroll:true});
}
function normalizeMeaning(value){return String(value).toLowerCase().replace(/disc/g,'disk').replace(/[^a-z0-9]/g,'')}
function submitMeaning(){if(locked||!quizActive)return;const text=$('typedAnswer').value.trim();if(!text){$('answerError').textContent='Enter or select a meaning before submitting.';return}const match=items.find(q=>normalizeMeaning(q.answer)===normalizeMeaning(text));choose(match?match.answer:text)}
$('submitAnswer').onclick=submitMeaning;$('typedAnswer').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();submitMeaning()}});$('typedAnswer').addEventListener('input',saveSession);
function choose(selected,timedOut=false,restoring=false,savedSeconds=null){if(locked||!quizActive)return;if(!restoring&&!timedOut&&Date.now()>=deadline){updateTimer();return}locked=true;stopTimer();$('typedAnswer').disabled=true;$('submitAnswer').disabled=true;const remainingSeconds=timedOut?0:restoring&&Number.isFinite(savedSeconds)?savedSeconds:Math.max(0,Math.ceil((deadline-Date.now())/1000));const q=questions[position],correct=selected===q.answer;answers.push({id:q.id,answer:q.answer,selected:timedOut?"Unanswered (time expired)":selected,correct,timedOut,remainingSeconds,acronym:q.acronym});[...$('choices').children].forEach(b=>{b.disabled=true;b.classList.add(b.dataset.answer===q.answer?'correct':b.dataset.answer===selected?'wrong':'dimmed');if(b.dataset.answer===q.answer)b.setAttribute('aria-label',b.dataset.answer+' — correct answer');else if(b.dataset.answer===selected)b.setAttribute('aria-label',b.dataset.answer+' — your answer, incorrect')});$('feedback').replaceChildren();const b=document.createElement('b');b.textContent=timedOut?'Time is up! The correct answer is:':correct?'Correct! Well done.':'Good try. The correct answer is:';const p=document.createElement('span');p.textContent=q.answer;$('feedback').append(b,p);$('feedback').hidden=false;$('next').hidden=false;$('next').textContent=position===questions.length-1?'See my results →':'Next acronym →';$('score').textContent=answers.filter(a=>a.correct).length+' points';$('progressBar').style.width=((position+1)/questions.length*100)+'%';$('questionTimer').textContent=String(Math.floor(remainingSeconds/60)).padStart(2,'0')+':'+String(remainingSeconds%60).padStart(2,'0');saveSession()}
$('next').onclick=()=>{if(!locked)return;if(++position<questions.length){showQuestion();$('game').scrollIntoView({behavior:'smooth',block:'start'})}else finish()};
$('quit').onclick=()=>{if(confirm('Exit the quiz? This attempt will be discarded.')){setQuizFocus(false);questions=[];answers=[];currentChoices=[];position=0;deadline=0;tab('entry')}};
function finish(){setQuizFocus(false);currentScreen="result";$('game').hidden=true;$('result').hidden=false;const score=answers.filter(a=>a.correct).length;lastResult={attempt:attemptId,student:$('student').value.trim()||'Student',creator:CREATOR_NAME,score,total:questions.length,date:new Date().toISOString(),answers:[...answers]};$('resultTitle').textContent='Nice work, '+lastResult.student+'!';$('finalScore').textContent=score+' / '+questions.length;$('resultMessage').textContent=Math.round(score/questions.length*100)+'% correct · '+(score===questions.length?'You matched every acronym correctly.':'Review the terms below and try again.');$('review').replaceChildren();answers.forEach(a=>{const row=document.createElement('div');row.className='review-row';const img=document.createElement('strong');img.className='review-acronym';img.textContent=a.acronym||items.find(q=>q.id===a.id)?.acronym||'';const text=document.createElement('div');const h=document.createElement('strong');h.textContent=(a.correct?'✓ ':'✕ ')+a.answer;const p=document.createElement('p');p.textContent='Your answer: '+a.selected;text.append(h,p);row.append(img,text);$('review').append(row)});$('result').scrollIntoView({behavior:'smooth',block:'start'});saveSession();saveScore(lastResult)}
$('again').onclick=()=>tab('quiz');
$('download').onclick=()=>{if(!lastResult)return;const r=lastResult;const text=['CSS ACRONYM QUIZ','Prepared by: '+r.creator,'Student: '+r.student,'Date: '+new Date(r.date).toLocaleString(),'Score: '+r.score+' / '+r.total,'',...r.answers.map((a,i)=>(i+1)+'. '+a.acronym+' - '+a.answer+'\nYour answer: '+a.selected+'\n'+(a.correct?'Correct':'Incorrect'))].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='CSS-picture-quiz-result.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function buildStudy(){if($('studyGrid').children.length)return;items.forEach(q=>{const card=document.createElement('article');card.className='study-card';const h=document.createElement('h3');h.textContent=q.acronym;const p=document.createElement('p');p.textContent=q.answer;card.append(h,p);$('studyGrid').append(card)})}


async function saveScore(result){
 $('saveStatus').textContent='Saving score to Excel...';$('retrySave').hidden=true;$('again').disabled=true;
 try{const response=await fetch('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({attempt:result.attempt,name:result.student,score:result.score,total:result.total})});const data=await response.json();if(!response.ok||!data.saved)throw new Error(data.error||'Could not save score.');$('saveStatus').textContent='Score recorded in Quiz Scores.xlsx.';$('again').disabled=false}
 catch(error){$('saveStatus').textContent='Excel save not confirmed. '+(error.message||'Check that the local launcher is running.')+' Keep this page open and retry.';$('retrySave').hidden=false}
}
$('retrySave').onclick=()=>{if(lastResult)saveSession();saveScore(lastResult)};
let recorderReady=false;
async function checkRecorder(){
 recorderReady=false;
 try{if(location.protocol==='file:')throw new Error();const response=await fetch('/api/status',{cache:'no-store'});const data=await response.json();if(!response.ok||!data.scoreRecording)throw new Error();$('recordingNotice').textContent='Automatic Excel recording is ready. Each completed quiz adds a Name and Score row.';recorderReady=true}
 catch{$('recordingNotice').textContent='For automatic Excel recording, double-click Start Oral Practice.bat and use http://localhost:8766. Keep its server window open.'}
}
checkRecorder();

$('student').addEventListener('input',()=>{$('student').setCustomValidity('')});


$('proceedQuiz').onclick=async()=>{if(!identifiedName)return;$('proceedQuiz').disabled=true;try{await studentRequest('/api/student/study-finish',identifiedName);proceedFromStudy()}catch{$('studyAccessStatus').textContent='Could not save study completion. Check the local launcher, then try again.'}finally{$('proceedQuiz').disabled=false}};

let wheelState={remaining:[],called:[],total:0},wheelSpinning=false,wheelLoading=false;
const WHEEL_COLORS=['#315c43','#71905c','#b0bd7d','#d6b566','#497b74','#a0b9a2','#be9265','#647e53'];
function drawWheel(names){
 const canvas=$('nameWheel'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,800,800);const list=names.length?names:[{name:'No students yet'}],slice=Math.PI*2/list.length;
 list.forEach((student,i)=>{const start=-Math.PI/2+i*slice;ctx.beginPath();ctx.moveTo(400,400);ctx.arc(400,400,385,start,start+slice);ctx.closePath();ctx.fillStyle=WHEEL_COLORS[i%WHEEL_COLORS.length];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();ctx.save();ctx.translate(400,400);ctx.rotate(start+slice/2);ctx.textAlign='right';ctx.fillStyle='#fff';ctx.font='600 '+(list.length>24?15:20)+'px Segoe UI,Arial';const name=student.name.length>23?student.name.slice(0,21)+'?':student.name;ctx.fillText(name,353,7,245);ctx.restore()});
 canvas.setAttribute('aria-label','Selection wheel with '+names.length+' remaining students. Full names are listed beside it.');
}
function renderWheel(){
 $('remainingNames').replaceChildren();$('calledNames').replaceChildren();
 wheelState.remaining.forEach(s=>{const li=document.createElement('li');li.textContent=s.name;$('remainingNames').append(li)});
 wheelState.called.forEach(s=>{const li=document.createElement('li');li.textContent=s.name;$('calledNames').append(li)});
 $('remainingTitle').textContent='Waiting for a turn ('+wheelState.remaining.length+')';$('spinWheel').disabled=wheelSpinning||wheelLoading||!wheelState.remaining.length;
 $('resetWheel').disabled=wheelSpinning||wheelLoading||!wheelState.called.length;$('refreshWheel').disabled=wheelSpinning||wheelLoading;
 $('wheelStatus').textContent=wheelState.remaining.length?wheelState.remaining.length+' students ready. Spin to choose who presents next.':wheelState.total?'Everyone has been selected. Start a new round to spin again.':'No completed quizzes yet. Students appear here after finishing a quiz.';
}
async function wheelRequest(path,post=false){const response=await fetch(path,post?{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}:{cache:'no-store'});if(!response.ok)throw new Error('Could not load the oral roster.');const data=await response.json();if(post&&path.endsWith('/spin')){if(!data.state||!Array.isArray(data.state.remaining))throw new Error('Restart the local launcher to enable the wheel.')}else if(!Array.isArray(data.remaining)||!Array.isArray(data.called))throw new Error('Restart the local launcher to enable the wheel.');return data}
async function loadWheel(){if(wheelSpinning||wheelLoading)return;wheelLoading=true;$('spinWheel').disabled=true;$('refreshWheel').disabled=true;$('wheelStatus').textContent='Loading completed quiz names...';try{wheelState=await wheelRequest('/api/oral');$('nameWheel').style.transition='none';$('nameWheel').style.transform='rotate(0deg)';drawWheel(wheelState.remaining);$('wheelWinner').textContent=wheelState.called.length?'Last selected: '+wheelState.called[wheelState.called.length-1].name:'';wheelLoading=false;renderWheel()}catch(e){wheelLoading=false;$('wheelStatus').textContent=e.message+' Use the local launcher, then refresh names.';$('refreshWheel').disabled=false}}
$('wheelTab').onclick=()=>tab('wheel');$('refreshWheel').onclick=loadWheel;
$('spinWheel').onclick=async()=>{
 if(wheelSpinning||wheelLoading||!wheelState.remaining.length)return;wheelSpinning=true;renderWheel();$('wheelWinner').textContent='';$('wheelStatus').textContent='Choosing the next presenter...';
 try{const data=await wheelRequest('/api/oral/spin',true);if(!data.selected){wheelState=data.state;wheelSpinning=false;drawWheel(wheelState.remaining);renderWheel();return}
 // The server chooses and records the student; the animation lands on that same name.
 const entrants=[...wheelState.remaining];if(!entrants.some(s=>s.key===data.selected.key))entrants.push(data.selected);$('nameWheel').style.transition='none';$('nameWheel').style.transform='rotate(0deg)';drawWheel(entrants);void $('nameWheel').offsetWidth;const index=entrants.findIndex(s=>s.key===data.selected.key);const angle=360*6+360-(index+.5)*360/entrants.length;const duration=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:4200;
 $('nameWheel').style.transition='transform '+duration+'ms cubic-bezier(.12,.68,.12,1)';$('nameWheel').style.transform='rotate('+angle+'deg)';
 setTimeout(()=>{wheelState=data.state;wheelSpinning=false;renderWheel();$('wheelWinner').textContent=data.selected.name;$('wheelStatus').textContent='Presenter #'+wheelState.called.length+' ? please come to the front.'},duration);
 }catch(e){wheelSpinning=false;$('wheelStatus').textContent='Selection could not be confirmed. Refresh names to see the saved order before spinning again.';$('refreshWheel').disabled=false}
};
$('resetWheel').onclick=async()=>{if(wheelSpinning||wheelLoading||!confirm('Start a new oral round? Everyone becomes eligible again. Quiz scores stay unchanged.'))return;wheelLoading=true;$('spinWheel').disabled=true;$('resetWheel').disabled=true;try{wheelState=await wheelRequest('/api/oral/reset',true);$('nameWheel').style.transition='none';$('nameWheel').style.transform='rotate(0deg)';drawWheel(wheelState.remaining);$('wheelWinner').textContent='';wheelLoading=false;renderWheel()}catch(e){wheelLoading=false;$('wheelStatus').textContent='Could not start a new round. Refresh names and try again.';$('refreshWheel').disabled=false}};

const SESSION_KEY='css-acronym-session-v1';
function saveSession(){
 try{sessionStorage.setItem(SESSION_KEY,JSON.stringify({version:1,currentScreen,identifiedName,student:$('student').value,quizUnlocked,quizActive,questionIds:questions.map(q=>q.id),position,answers,locked,deadline,attemptId,currentChoices,draftAnswer:$('typedAnswer').value,studyDeadline,studyFinished,lastResult}))}
 catch{$('recordingNotice').textContent='Browser session storage is unavailable. Keep this tab open; refreshing may lose progress.'}
}
function restoreSession(){
 let state;try{state=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')}catch{return}
 if(!state||state.version!==1)return;
 $('student').value=typeof state.student==='string'?state.student:'';

 identifiedName=typeof state.identifiedName==='string'?state.identifiedName:state.quizActive?$('student').value:'';$('entryName').value=identifiedName;$('typedAnswer').value=typeof state.draftAnswer==='string'?state.draftAnswer:'';quizUnlocked=!!state.quizUnlocked;studyDeadline=Number(state.studyDeadline)||0;studyFinished=!!state.studyFinished;lastResult=state.lastResult||null;
 if(studyFinished){$('studyTab').disabled=true;$('studyTab').textContent='Study completed'}
 const restored=(state.questionIds||[]).map(id=>items.find(q=>q.id===id));
 if(state.quizActive&&restored.length&&restored.every(Boolean)&&Number.isInteger(state.position)&&state.position>=0&&state.position<restored.length&&Array.isArray(state.answers)&&Number.isFinite(state.deadline)&&typeof state.attemptId==='string'){
  questions=restored;position=state.position;answers=state.answers;locked=!!state.locked;deadline=state.deadline;attemptId=state.attemptId;currentChoices=Array.isArray(state.currentChoices)?state.currentChoices:[];
  quizUnlocked=true;currentScreen='game';['studentEntry','result','study','wheel'].forEach(id=>$(id).hidden=true);$('game').hidden=false;$('studentLabel').textContent=$('student').value;setQuizFocus(true);showQuestion(true);$('game').scrollIntoView({block:'start'});return;
 }
 if(state.currentScreen==='result'&&lastResult&&restored.length&&restored.every(Boolean)&&Array.isArray(state.answers)&&state.answers.length===restored.length){questions=restored;answers=state.answers;attemptId=state.attemptId;position=restored.length;finish();return}
 if(state.currentScreen==='study'&&identifiedName){enterNamedStudent(identifiedName);return}tab(['entry','quiz','study','wheel'].includes(state.currentScreen)?state.currentScreen:'entry');
}
['student'].forEach(id=>$(id).addEventListener('change',saveSession));
$('student').addEventListener('input',saveSession);
window.addEventListener('pagehide',saveSession);

async function studentRequest(path,name){const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});const data=await response.json();if(!response.ok||typeof data.studyFinished!=='boolean'||!Number.isFinite(data.deadline))throw new Error('Restart the local launcher to load student study records.');return data}
async function enterNamedStudent(name){
 if(quizActive||wheelSpinning)return;$('enterStudent').disabled=true;$('entryStatus').textContent='Checking your saved study time...';
 try{const data=await studentRequest('/api/student/start',name);identifiedName=data.name;$('student').value=data.name;$('entryName').value=data.name;studyDeadline=data.deadline;studyFinished=data.studyFinished;quizUnlocked=false;$('studyTab').disabled=studyFinished;$('studyTab').textContent=studyFinished?'Study completed':'Study references';$('entryStatus').textContent='';tab(studyFinished?'quiz':'study');saveSession()}
 catch(error){tab('entry');$('entryStatus').textContent=error.message+' Use the local launcher and try again.'}finally{$('enterStudent').disabled=false}
}
$('studentEntryForm').addEventListener('submit',event=>{event.preventDefault();const name=$('entryName').value.trim();if(!name){$('entryStatus').textContent='Please enter your full name.';return}enterNamedStudent(name)});
$('switchStudent').onclick=()=>{if(quizActive||wheelSpinning)return;stopStudyTimer();identifiedName='';quizUnlocked=false;questions=[];answers=[];currentChoices=[];lastResult=null;studyDeadline=0;studyFinished=false;$('studyTab').disabled=false;$('studyTab').textContent='Study references';$('student').value='';$('entryName').value='';tab('entry');$('entryName').focus()};
restoreSession();

let restartPending=false;
$('restartServer').onclick=()=>{if(quizActive||wheelSpinning||restartPending)return;$('restartPassword').value='';$('restartError').textContent='';$('restartDialog').showModal();$('restartPassword').focus()};
$('cancelRestart').onclick=()=>{if(!restartPending)$('restartDialog').close()};
$('restartDialog').addEventListener('cancel',event=>{if(restartPending)event.preventDefault()});
$('restartForm').addEventListener('submit',async event=>{
 event.preventDefault();if(restartPending||quizActive||wheelSpinning)return;restartPending=true;$('confirmRestart').disabled=true;$('cancelRestart').disabled=true;$('restartError').textContent='Checking password...';
 try{
  const response=await fetch('/api/restart',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('restartPassword').value})});
  if(response.status===404)throw new Error('One-time setup: close the old launcher window, then reopen Start Oral Practice.bat. Future restarts can use this button.');
  const data=await response.json();if(!response.ok||!data.restarting)throw new Error(data.error||'Restart failed.');
  saveSession();$('restartPassword').value='';$('restartError').textContent='Restarting. Please keep this page open...';$('restartStatus').textContent='Restarting server...';
  let ready=false;for(let i=0;i<30;i++){await new Promise(resolve=>setTimeout(resolve,500));try{const status=await fetch('/api/status',{cache:'no-store'});const state=await status.json();if(status.ok&&state.instance&&state.instance!==data.instance){ready=true;break}}catch{}}
  if(!ready)throw new Error('Server did not come back yet. Reopen Start Oral Practice.bat, then refresh this page. Saved records are preserved.');
  location.reload();
 }catch(error){$('restartError').textContent=error.message;$('restartStatus').textContent='Restart not completed.';restartPending=false;$('confirmRestart').disabled=false;$('cancelRestart').disabled=false}
});
