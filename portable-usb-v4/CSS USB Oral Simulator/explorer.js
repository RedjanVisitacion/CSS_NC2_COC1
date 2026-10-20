/* Virtual file tree only. Never enumerates or changes real files. */
let explorerPath='pc',explorerHistory=[],previewISO='';
const INSTALL_TREE={
 '':[['boot','folder'],['efi','folder'],['sources','folder'],['support','folder'],['autorun.inf','file'],['bootmgr','file'],['bootmgr.efi','file'],['setup.exe','file']],
 boot:[['BCD','file'],['boot.sdi','file'],['bootsect.exe','file']],
 efi:[['boot','folder'],['microsoft','folder']],
 'efi/boot':[['bootx64.efi','file']],
 'efi/microsoft':[['boot','folder']],
 'efi/microsoft/boot':[['BCD','file']],
 sources:[['boot.wim','file'],['install.wim','file'],['setup.exe','file']],
 support:[['readme.txt','file']]
};
function openExplorer(path='pc'){if(!state)return;$('searchPanel').hidden=true;$('explorer').hidden=false;explorerHistory=[];explorerPath=path;renderExplorer()}
function navigateExplorer(path){explorerHistory.push(explorerPath);explorerPath=path;renderExplorer()}
function refreshExplorer(){if(!$('explorer').hidden)renderExplorer()}
function explorerRow(name,type,detail,action){const button=document.createElement('button');button.className='file-row '+(type==='drive'?'drive-tile':'');const icon=document.createElement('span');icon.className='file-icon '+type;icon.textContent=type==='folder'?'':type==='drive'?'':type==='iso'?'◉':'▤';const text=document.createElement('span');text.textContent=name;const meta=document.createElement('small');meta.textContent=detail||'';button.append(icon,text,meta);button.onclick=action;$('explorerItems').append(button);return button}
function explorerHeading(text){const heading=document.createElement('h3');heading.className='explorer-section-heading';heading.textContent=text;$('explorerItems').append(heading)}
function driveTile(name,detail,percent,action,isUSB=false){const row=explorerRow(name,'drive',detail,action);const bar=document.createElement('span');bar.className='drive-capacity';const fill=document.createElement('span');fill.style.width=percent+'%';bar.append(fill);row.append(bar);if(isUSB)row.oncontextmenu=event=>{event.preventDefault();showUSBMenu()};return row}
function renderExplorer(){
 if(!state)return;
 $('explorerItems').replaceChildren();$('filePreview').hidden=true;previewISO='';$('explorerBack').disabled=!explorerHistory.length;$('explorerISO').disabled=!state.isoMounted;
 $('ejectExplorer').hidden=!!state.usbEjected;$('reconnectUSB').hidden=!state.usbEjected||!!state.realUSB;$('explorerUSB').disabled=!!state.usbEjected;
 const usb=state.target+':',source=state.source+':',formatted=state.index>=7,copied=state.mode==='boot'&&state.index>=10;
 $('explorerNotice').textContent='Virtual file view. Device labels may come from your USB; all displayed folders and files are training examples.';
 const parts=explorerPath.split('/'),root=parts[0],sub=parts.slice(1).join('/');
 $('explorerItems').className=root==='pc'?'pc-grid':'';
 if(root==='pc'){
  $('explorerAddress').textContent='This PC';
  explorerHeading('Folders (7)');
  ['3D Objects','Desktop','Documents','Downloads','Music','Pictures','Videos'].forEach(name=>explorerRow(name,'folder','',()=>navigateExplorer(name==='Downloads'?'downloads':'folder/'+name)));
  explorerHeading('Devices and drives');
  driveTile('Local Disk (C:)','318 GB free of 476 GB (training)',33,()=>navigateExplorer('system'));
  if(!state.usbEjected){const used=copied?Math.min(4.2,state.size*.5):formatted?0:Math.min(.5,state.size*.1);driveTile((state.usbName||'USB Drive')+' ('+usb+')',state.index>=4&&!formatted?'Unformatted volume | Disk '+state.disk:(state.size-used).toFixed(1)+' GB free of '+state.size+' GB (training)',used/state.size*100,()=>navigateExplorer('usb'),true)}
  if(state.isoMounted)explorerRow('DVD Drive ('+source+') '+state.isoName,'drive','Mounted virtual ISO | Read-only',()=>navigateExplorer('iso'));
  else explorerRow('DVD Drive ('+source+')','drive','No image mounted',()=>{ $('explorerStatus').textContent='No disc inserted. Mount an OS image in virtual PowerISO after exiting DiskPart.' });
 }else if(root==='folder'){
  $('explorerAddress').textContent='This PC > '+sub;$('explorerStatus').textContent='This training folder is empty.';return;
 }else if(root==='downloads'){
  $('explorerAddress').textContent='This PC > Downloads';
  ['Windows 10 x64.iso','Windows 11 x64.iso','Windows 7 x64.iso'].forEach(name=>explorerRow(name,'iso','Sample installation image',()=>previewFile(name,true)));
 }else if(root==='system'){
  $('explorerAddress').textContent='This PC > Local Disk (C:)';
  ['Windows','Users','Program Files'].forEach(name=>explorerRow(name,'folder','Training system folder',()=>{ $('explorerStatus').textContent=name+' is a protected example folder in this simulator.' }));
 }else if(root==='usb'||root==='iso'){
  const isUSB=root==='usb';$('explorerAddress').textContent='This PC > '+(isUSB?'USB ('+usb+')':'DVD ('+source+')')+(sub?' > '+sub.replaceAll('/',' > '):'');
  if(isUSB&&state.usbEjected){$('explorerStatus').textContent=state.realUSB?'USB disconnected or safely ejected. Reinsert the physical flash drive to browse again.':'USB removed safely (simulation). Reconnect it to browse again.';return}
  if(!isUSB&&!state.isoMounted){$('explorerStatus').textContent='This image has been unmounted. No disc inserted.';return}
  if(isUSB&&state.index>=4&&!formatted){$('explorerStatus').textContent='No formatted volume. Continue creating and formatting the partition in virtual CMD.';return}
  let files;
  if(isUSB&&!copied)files=formatted?[]:sub==='Documents'?[['practice.txt','file']]:[['Documents','folder'],['sample.txt','file']];
  else files=INSTALL_TREE[sub]||[];
  files.forEach(([name,type])=>explorerRow(name,type,type==='folder'?'File folder':'Training file',()=>type==='folder'?navigateExplorer(root+'/'+(sub?sub+'/':'')+name):previewFile(name,false)));
  if(!files.length){$('explorerStatus').textContent=formatted&&isUSB?'This folder is empty. Use XCOPY after mounting the ISO to populate the USB.':'This training folder is empty.';return}
 }else{explorerPath='pc';renderExplorer();return}
 $('explorerStatus').textContent=$('explorerItems').children.length+' items'+(copied&&root==='usb'?' | Installation files copied successfully (simulation)':'');
}
function previewFile(name,isISO){$('filePreview').hidden=false;$('filePreviewTitle').textContent=name;previewISO=isISO?name:'';$('filePreviewText').textContent=isISO?'Sample OS installation image. Open it in virtual PowerISO, then mount it after exiting DiskPart.':'Training file preview only. This file is not read from your computer and cannot execute.';$('mountFromExplorer').hidden=!isISO}
$('thisPC').onclick=()=>openExplorer();$('taskbarExplorer').onclick=()=>openExplorer();
$('closeExplorer').onclick=$('minimizeExplorer').onclick=()=>{$('explorer').hidden=true};
$('explorerBack').onclick=()=>{if(explorerHistory.length){explorerPath=explorerHistory.pop();renderExplorer()}};
$('explorerHome').onclick=$('explorerPC').onclick=()=>navigateExplorer('pc');$('explorerDownloads').onclick=()=>navigateExplorer('downloads');$('explorerUSB').onclick=()=>navigateExplorer('usb');$('explorerISO').onclick=()=>{if(state.isoMounted)navigateExplorer('iso')};
$('mountFromExplorer').onclick=()=>{if(!previewISO)return;customISO=previewISO;openPowerISO()};
$('viewUSBFiles').onclick=()=>{$('completion').hidden=true;openExplorer('usb')};$('showResult').onclick=()=>{if(state&&state.index===USBLab.steps(state).length)complete()};
$('explorerDesktop').onclick=()=>navigateExplorer('folder/Desktop');$('explorerDocuments').onclick=()=>navigateExplorer('folder/Documents');$('explorerPictures').onclick=()=>navigateExplorer('folder/Pictures');
let usbToastTimer=null;
function notifyUSB(text){$('usbToast').textContent=text;$('usbToast').hidden=false;clearTimeout(usbToastTimer);usbToastTimer=setTimeout(()=>{$('usbToast').hidden=true},6000)}
function showUSBMenu(){if(!state)return;$('usbTrayMenu').hidden=!$('usbTrayMenu').hidden;$('usbTrayDevice').textContent=(state.usbName||'USB flash drive')+' ('+state.target+':)';$('ejectTray').hidden=!!state.usbEjected;$('reconnectTray').hidden=!state.usbEjected||!!state.realUSB;$('ejectTray').textContent=state.realUSB?'Safely eject actual USB from Windows':'Eject USB (simulation)'}
function setUSBConnection(connected){if(!state)return;if(connected&&state.realUSB&&state.physicalPresent===false){notifyUSB('Plug the same flash drive into the computer to reconnect it.');scanUSB();return}state.virtualEjected=!connected;state.usbEjected=!connected;(state.deviceEvents||=[]).push({action:connected?'reconnect':'eject',time:Date.now()});$('usbTrayMenu').hidden=true;const text=connected?'USB reconnected in the simulation.':'Safe to remove hardware. USB ejected in the simulation; the physical flash drive is unchanged.';transcript.push({text,type:'info'});line(text);draw();persist();notifyUSB(text);if(!connected&&explorerPath.startsWith('usb')){explorerPath='pc';refreshExplorer()}}
$('usbTray').onclick=showUSBMenu;$('ejectExplorer').onclick=$('ejectTray').onclick=()=>{if(state?.realUSB)ejectActualUSB();else setUSBConnection(false)};$('reconnectUSB').onclick=$('reconnectTray').onclick=()=>setUSBConnection(true);

let explorerMaximized=false;$('maximizeExplorer').onclick=()=>{explorerMaximized=!explorerMaximized;Object.assign($('explorer').style,explorerMaximized?{left:'0',top:'45px',width:'100%',height:'calc(100% - 101px)'}:{left:'',top:'',width:'',height:''})};

let ejectingUSB=false;
async function ejectActualUSB(){
 if(!state||!state.realUSB||state.physicalPresent===false||ejectingUSB)return;
 ejectingUSB=true;$('ejectExplorer').disabled=true;$('ejectTray').disabled=true;notifyUSB('Requesting safe removal from Windows...');
 try{const response=await fetch('/api/usb-eject',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:state.usbKey})});if(!response.headers?.get('Content-Type')?.includes('application/json'))throw new Error('Restart the updated server to enable actual Windows USB ejection.');const data=await response.json();if(!response.ok||!data.ejected)throw new Error(data.error||'Windows could not safely eject the USB.');state.physicalPresent=false;state.usbEjected=true;state.virtualEjected=false;state.ejectPendingUntil=Date.now()+15000;(state.deviceEvents||=[]).push({action:'windows-safe-eject',time:Date.now()});const text='Windows accepted safe removal for '+state.usbName+' ('+state.target+':). Unplug and reinsert it to reconnect.';transcript.push({text,type:'info'});line(text);$('usbTrayMenu').hidden=true;draw();persist();notifyUSB(text)}
 catch(e){notifyUSB(e.message)}finally{ejectingUSB=false;$('ejectExplorer').disabled=false;$('ejectTray').disabled=false}
}
