/* Pure command evaluator. This module never executes a shell command. */
const USBLab={
 create(name,size=32,mode='boot'){return {name,size,mode,index:0,score:0,attempts:[],id:globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(16).slice(2),source:'D',target:'E',disk:1,virtualDriveCount:1,isoMounted:false,isoName:'',mountEvents:[]}},
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
   correct=!!s.isoMounted&&tokens[0]==='xcopy'&&paths.length===2&&paths[0]===source&&paths[1]===target&&switches==='fhs';
  }
  if(s.usbEjected&&expected!=='diskpart'&&expected!=='list disk')correct=false;
  if(command==='list disk'&&s.index>1&&this.prompt(s)==='DISKPART>')return {correct:true,message:this.output(s,1),done:false,step:s.index,informational:true};
  const step=s.index;let message;
  if(correct){s.score++;s.index++;message=this.output(s,step)}
  else if(s.requirePhysicalUSB&&s.usbEjected)message='No USB flash drive is connected. Plug it in, then use list disk to check its detected capacity. No point awarded.';
  else if(s.usbEjected)message='The USB is ejected in this simulation. Reconnect it from File Explorer or the taskbar USB menu before continuing.';
  else if(expected.startsWith('xcopy')&&!s.isoMounted)message='No installation ISO is mounted. Open virtual PowerISO, select the OS image, and mount it before copying.';
  else if(/^select disk \d+$/.test(command))message='That is not the USB disk in your assignment. Identify the selected USB by its capacity. No disk was changed.';
  else if(command.startsWith('format'))message=`Use the required file system for this scenario (${s.size<=32?'FAT32':'NTFS'}) and quick formatting. Do not type the capacity explanation.`;
  else message='Incorrect command or sequence. No point awarded. Try the current task again.';
  s.attempts.push({command:raw,step,correct});return {correct,message,done:s.index===this.steps(s).length,step};
 },
 output(s,step){
  const expected=this.expected(s)[step];
  if(step===0)return 'Microsoft DiskPart (simulation)\nPhysical drive metadata may be used, but no commands are sent to a real drive.';
  if(step===1&&s.usbEjected)return `  Disk ###  Status     Size     Type\n  Disk ${s.disk===0?99:0}    Online     476 GB   Simulated internal drive\n  USB not connected.`;
  if(step===1)return `  Disk ###  Status     Size     Type\n  Disk ${s.disk===0?99:0}    Online     476 GB   Simulated internal drive\n  Disk ${s.disk}    Online     ${s.size} GB    ${s.usbName||'USB flash drive'} (training MBR model)`;
  if(step===2)return `Disk ${s.disk} is now the selected USB disk (simulation).`;
  if(step===3)return 'DiskPart succeeded in cleaning the simulated USB disk.';
  if(step===4)return 'DiskPart succeeded in creating the specified partition.';
  if(step===5)return 'Partition 1 is now the selected partition.';
  if(step===6)return `100 percent completed.\nDiskPart successfully formatted the simulated volume as ${s.size<=32?'FAT32':'NTFS'}.\nTraining USB drive letter: ${s.target}:`;
  if(expected==='active')return 'DiskPart marked the current MBR partition as active.';
  if(expected==='exit')return 'Leaving DiskPart...'+(s.mode==='boot'?'\nNext: open virtual PowerISO, choose an OS ISO, mount it, then return here for XCOPY.':'');
  return 'Installation files copied to the simulated USB.\nCommand-sequence exercise complete; no real files were copied.';
 }
};
if(typeof module!=='undefined')module.exports=USBLab;
