const assert=require('assert'),lab=require('./engine.js');
for(const size of [16,32,64,128])for(const mode of ['boot','format']){
 const s=lab.create('Test student',size,mode);assert.equal(lab.steps(s).length,mode==='boot'?10:8);
 const commands=lab.expected(s);assert(!lab.evaluate(s,'clean').correct);assert.equal(s.index,0);
 for(const command of commands){if(command.startsWith('xcopy')){assert(!lab.evaluate(s,command).correct);s.isoMounted=true;s.isoName='Windows.iso'}const before=s.score;const result=lab.evaluate(s,command);assert(result.correct,command);assert.equal(s.score,before+1)}
 assert.equal(s.score,commands.length);assert(lab.evaluate(s,'exit').done);assert.equal(s.score,commands.length);
}
let s=lab.create('Test',64,'boot');for(const c of ['diskpart','list disk'])assert(lab.evaluate(s,c).correct);
assert(!lab.evaluate(s,'select disk 0').correct);assert.equal(s.index,2);assert(lab.evaluate(s,'select disk 1').correct);
for(const c of ['clean','CREATE PARTITION PRIMARY','select partition 1'])assert(lab.evaluate(s,c).correct);
assert(!lab.evaluate(s,'format fs=fat32 quick').correct);assert(!lab.evaluate(s,'format fs=ntfs(64 gb above) quick').correct);assert(lab.evaluate(s,'format fs=ntfs quick').correct);
for(const c of ['active','exit'])assert(lab.evaluate(s,c).correct);
assert(!lab.evaluate(s,'xcopy e:\\*.* /s/h/f d:\\').correct);assert(!lab.evaluate(s,'xcopy d:\\*.* /s /h e:\\').correct);s.isoMounted=true;assert(lab.evaluate(s,'XCOPY D:\\*.* E:\\ /f /h /s').correct);
console.log('PASS: both modes, all capacities, exact ordering, scoring, wrong disk rejection, formatting rules, aliases, XCOPY direction/switches, and completed-state locking.');

let real=lab.create('USB student',64,'boot');real.disk=3;real.target='G';real.source='D';real.usbName='USB Device';
for(const c of lab.expected(real)){if(c.startsWith('xcopy'))real.isoMounted=true;assert(lab.evaluate(real,c).correct,c)}
assert.equal(real.score,10);console.log('PASS: mounted ISO prerequisite and real USB metadata disk/drive mapping.');

let removed=lab.create('Student');lab.evaluate(removed,'diskpart');lab.evaluate(removed,'list disk');removed.usbEjected=true;assert(!lab.evaluate(removed,'select disk 1').correct);assert.equal(removed.score,2);removed.usbEjected=false;assert(lab.evaluate(removed,'select disk 1').correct);console.log('PASS: virtual ejection blocks USB operations until reconnect.');
