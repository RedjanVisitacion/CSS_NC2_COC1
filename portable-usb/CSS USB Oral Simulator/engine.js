/* Pure command evaluator. This module never executes a shell command. */
const USBLab={
 create(name,size=32,mode='boot'){return {name,size,mode,index:0,score:0,attempts:[],id:globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(16).slice(2),source:'D',target:'E',disk:1}},
 steps(s){return ['Open the disk management interpreter','Inspect the available disks','Select the USB disk, not the internal disk','Remove the USB partition information','Create a primary partition','Select partition 1','Quick-format using the scenario file system',...(s.mode==='boot'?['Mark the MBR partition active']:[]),'Return to the normal command prompt',...(s.mode==='boot'?['Copy the installation files from the source to the USB']:[])]},
 prompt(s){return s.index>=1&&s.index<(s.mode==='boot'?9:8)?'DISKPART>':'C:\\Windows\\System32>'},
 expected(s){return ['diskpart','list disk',`select disk ${s.disk}`,'clean','create part pri','select part 1',`format fs=${s.size<=32?'fat32':'ntfs'} quick`,...(s.mode==='boot'?['active']:[]),'exit',...(s.mode==='boot'?[`xcopy ${s.source}:\\*.* /s/h/f ${s.target}:\\`]:[])]},
 evaluate(s,raw){
  if(s.index>=this.steps(s).length)return {done:true,correct:false,message:'This attempt is complete.'};
  const command=raw.trim().toLowerCase().replace(/\s+/g,' '),expected=this.expected(s)[s.index];
  let correct=command===expected.toLowerCase();
  if(expected==='create part pri')correct=/^create (?:part|partition) (?:pri|primary)$/.test(command);
  if(expected==='select part 1')correct=/^select (?:part|partition) 1$/.test(command);
  if(expected.startsWith('xcopy')){
   const tokens=command.split(' ');const source=`${s.source.toLowerCase()}:\\*.*`,target=`${s.target.toLowerCase()}:\\`;
   const paths=tokens.slice(1).filter(t=>!t.startsWith('/'));const switches=tokens.slice(1).filter(t=>t.startsWith('/')).join('').split('/').filter(Boolean).sort().join('');
   correct=tokens[0]==='xcopy'&&paths.length===2&&paths[0]===source&&paths[1]===target&&switches==='fhs';
  }
  const step=s.index;let message;
  if(correct){s.score++;s.index++;message=this.output(s,step)}
  else if(/^select disk 0$/.test(command))message='Disk 0 is the internal drive. Identify the USB disk by its capacity. No disk was changed.';
  else if(command.startsWith('format'))message=`Use the required file system for this scenario (${s.size<=32?'FAT32':'NTFS'}) and quick formatting. Do not type the capacity explanation.`;
  else message='Incorrect command or sequence. No point awarded. Try the current task again.';
  s.attempts.push({command:raw,step,correct});return {correct,message,done:s.index===this.steps(s).length,step};
 },
 output(s,step){
  const expected=this.expected(s)[step];
  if(step===0)return 'Microsoft DiskPart (simulation)\nNo physical disks are connected to this exercise.';
  if(step===1)return `  Disk ###  Status     Size     Type\n  Disk 0    Online     476 GB   Internal system drive\n  Disk 1    Online     ${s.size} GB    USB flash drive (MBR)`;
  if(step===2)return 'Disk 1 is now the selected disk.';
  if(step===3)return 'DiskPart succeeded in cleaning the simulated USB disk.';
  if(step===4)return 'DiskPart succeeded in creating the specified partition.';
  if(step===5)return 'Partition 1 is now the selected partition.';
  if(step===6)return `100 percent completed.\nDiskPart successfully formatted the volume as ${s.size<=32?'FAT32':'NTFS'}.\nScenario assumption: Windows assigned the USB drive letter E:.`;
  if(expected==='active')return 'DiskPart marked the current MBR partition as active.';
  if(expected==='exit')return 'Leaving DiskPart...';
  return 'Installation files copied to the simulated USB.\nCommand-sequence exercise complete; no real files were copied.';
 }
};
if(typeof module!=='undefined')module.exports=USBLab;
