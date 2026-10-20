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
 $('ejectExplorer').hidden=!!state.usbEjected;$('reconnectUSB').hidden=!state.usbEjected||!!state.realUSB||!!state.requirePhysicalUSB;$('explorerUSB').disabled=!!state.usbEjected;
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
  else explorerRow('DVD Drive ('+source+')','drive','No image mounted | Click to mount',()=>{openPowerISO();state.pisoMountLetter=state.source;openPisoDialog('mount')});
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
function showUSBMenu(){if(!state)return;$('usbTrayMenu').hidden=!$('usbTrayMenu').hidden;$('usbTrayDevice').textContent=(state.usbName||'USB flash drive')+' ('+state.target+':)';$('ejectTray').hidden=!!state.usbEjected;$('reconnectTray').hidden=!state.usbEjected||!!state.realUSB||!!state.requirePhysicalUSB;$('ejectTray').textContent=state.realUSB?'Safely eject actual USB from Windows':'Eject USB (simulation)'}
function setUSBConnection(connected){if(!state)return;if(connected&&(state.realUSB||state.requirePhysicalUSB)&&state.physicalPresent===false){notifyUSB('Plug the same flash drive into the computer to reconnect it.');scanUSB();return}state.virtualEjected=!connected;state.usbEjected=!connected;(state.deviceEvents||=[]).push({action:connected?'reconnect':'eject',time:Date.now()});$('usbTrayMenu').hidden=true;const text=connected?'USB reconnected in the simulation.':'Safe to remove hardware. USB ejected in the simulation; the physical flash drive is unchanged.';transcript.push({text,type:'info'});line(text);draw();persist();notifyUSB(text);if(!connected&&explorerPath.startsWith('usb')){explorerPath='pc';refreshExplorer()}}
$('usbTray').onclick=showUSBMenu;$('ejectExplorer').onclick=$('ejectTray').onclick=()=>{if(state?.realUSB)ejectActualUSB();else setUSBConnection(false)};$('reconnectUSB').onclick=$('reconnectTray').onclick=()=>setUSBConnection(true);

let explorerMaximized=false;$('maximizeExplorer').onclick=()=>{explorerMaximized=!explorerMaximized;Object.assign($('explorer').style,explorerMaximized?{left:'0',top:'45px',width:'100%',height:'calc(100% - 101px)'}:{left:'',top:'',width:'',height:''})};

let ejectingUSB=false;
async function ejectActualUSB(){
 if(!state||!state.realUSB||state.physicalPresent===false||ejectingUSB)return;
 ejectingUSB=true;$('ejectExplorer').disabled=true;$('ejectTray').disabled=true;notifyUSB('Requesting safe removal from Windows...');
 try{const response=await fetch('/api/usb-eject',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:state.usbKey})});if(!response.headers?.get('Content-Type')?.includes('application/json'))throw new Error('Restart the updated server to enable actual Windows USB ejection.');const data=await response.json();if(!response.ok||!data.ejected)throw new Error(data.error||'Windows could not safely eject the USB.');state.physicalPresent=false;state.usbEjected=true;state.virtualEjected=false;state.ejectPendingUntil=Date.now()+15000;(state.deviceEvents||=[]).push({action:'windows-safe-eject',time:Date.now()});const text='Windows accepted safe removal for '+state.usbName+' ('+state.target+':). Unplug and reinsert it to reconnect.';transcript.push({text,type:'info'});line(text);$('usbTrayMenu').hidden=true;draw();persist();notifyUSB(text)}
 catch(e){notifyUSB(e.message)}finally{ejectingUSB=false;$('ejectExplorer').disabled=false;$('ejectTray').disabled=false}
}

/* PowerISO-style training shell. All menu operations below are virtual. */
let pisoFolder='',pisoDialogMode='open',pisoChosenFile='',pisoMaximized=false;
const PISO_IMAGES=['Windows 10 x64.iso','Windows 11 x64.iso','Windows 7 x64.iso'];
function closePisoMenus(){['pisoMenu','pisoSubmenu','pisoThirdMenu'].forEach(id=>$(id).hidden=true)}
function pisoHint(text){$('pisoHint').textContent=text}
function pisoDriveLetters(){
 if(!state)return [];
 const count=state.virtualDriveCount??1;
 if(!state.pisoDriveLetters)state.pisoDriveLetters=[state.source];state.pisoDriveLetters=state.pisoDriveLetters.filter(l=>l!==state.target);if(!state.pisoDriveLetters.length)state.pisoDriveLetters=[state.source];
 const available='DEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l=>l!==state.target&&!state.pisoDriveLetters.includes(l));
 while(state.pisoDriveLetters.length<count&&available.length)state.pisoDriveLetters.push(available.shift());
 return state.pisoDriveLetters.slice(0,count);
}
function renderPowerISOClassic(){
 if(!state)return;
 const name=state.pisoOpenedName||'';const mounted=state.isoMounted;
 $('classicISOTitle').textContent='PowerISO (Training copy) - '+(name||'New Image File');
 $('pisoPath').textContent='\\'+pisoFolder.replaceAll('/','\\');$('pisoFiles').replaceChildren();$('pisoTree').replaceChildren();
 const root=document.createElement('button');root.className='piso-tree-root';root.textContent=name?name.replace(/\.iso$/i,''):'New image';root.onclick=()=>{pisoFolder='';renderPowerISOClassic()};$('pisoTree').append(root);
 if(name){['boot','efi','sources','support'].forEach(folder=>{const b=document.createElement('button');b.className='piso-tree-folder';b.textContent=folder;b.onclick=()=>{pisoFolder=folder;renderPowerISOClassic()};$('pisoTree').append(b)})}
 const files=name?(INSTALL_TREE[pisoFolder]||[]):[];
 files.forEach(([filename,type])=>{const row=document.createElement('button');row.className='piso-file-row';const n=document.createElement('span');n.className=type==='folder'?'piso-name-folder':'piso-name-file';n.textContent=filename;const size=document.createElement('span');size.textContent=type==='folder'?'':filename==='install.wim'?'3,800 MB':filename==='boot.wim'?'420 MB':'1 KB';const t=document.createElement('span');t.textContent=type==='folder'?'File folder':filename.endsWith('.exe')?'Application':'File';const date=document.createElement('span');date.textContent='Training sample';row.append(n,size,t,date);row.onclick=()=>{if(type==='folder'){pisoFolder=(pisoFolder?pisoFolder+'/':'')+filename;renderPowerISOClassic()}else pisoHint(filename+' selected. File contents are simulated.')};$('pisoFiles').append(row)});
 $('pisoBootLabel').textContent=name?'Bootable Image (sample)':'No image opened';$('pisoVolumeText').textContent=name?'Total 4,220 MB (training)':'Total 0 MB';$('pisoObjectCount').textContent='Total '+files.length+' objects';const letters=pisoDriveLetters();$('pisoMountedStatus').textContent=mounted?'Drive '+state.source+': mounted — '+state.isoName:letters.length?letters.map(l=>l+': <No media>').join(' | '):'No virtual drive configured';
}
function menuItem(container,label,action,submenu=false,disabled=false){const b=document.createElement('button');b.className='piso-menu-item';b.textContent=label+(submenu?'  >':'');b.disabled=disabled;b.onclick=action;if(submenu)b.onmouseenter=action;container.append(b);return b}
function menuSeparator(container){const line=document.createElement('div');line.className='piso-menu-separator';container.append(line)}
function showDriveActions(letter){const menu=$('pisoThirdMenu');menu.replaceChildren();menu.hidden=false;menuItem(menu,'Mount image...',()=>{state.pisoMountLetter=letter;openPisoDialog('mount')});menuItem(menu,'Unmount',()=>{closePisoMenus();if(state.isoMounted&&state.source===letter){$('unmountISO').onclick();renderPowerISOClassic();pisoHint('Image unmounted from '+letter+':')}else pisoHint('No image is mounted on '+letter+':')});}
function showDriveCount(){const menu=$('pisoThirdMenu');menu.replaceChildren();menu.hidden=false;[0,1,2,3,4].forEach(count=>menuItem(menu,(count===0?'Disable':count+' drive'+(count===1?'':'s'))+(count===(state.virtualDriveCount??1)?' (selected)':''),()=>{if(count===0&&state.isoMounted){if(state.nativeISO){pisoHint('Unmount the real image in PowerISO before disabling its linked drive.');return}$('unmountISO').onclick()}state.virtualDriveCount=count;pisoDriveLetters();closePisoMenus();renderPowerISOClassic();persist();pisoHint(count?'Virtual drive configured. Use Tools > Virtual Drive > Drive '+pisoDriveLetters()[0]+': > Mount image...':'Virtual drives disabled.')}))}
function showVirtualDrives(){const menu=$('pisoSubmenu');menu.replaceChildren();menu.hidden=false;$('pisoThirdMenu').hidden=true;const letters=pisoDriveLetters();if(!letters.length)menuItem(menu,'<No drive>',()=>{},false,true);letters.forEach(letter=>menuItem(menu,'Drive '+letter+': '+(state.isoMounted&&state.source===letter?state.isoName:'<No media>'),()=>showDriveActions(letter),true));menuSeparator(menu);menuItem(menu,'Set number of drives',showDriveCount,true);menuItem(menu,'Unmount all drives',()=>{closePisoMenus();if(state.isoMounted)$('unmountISO').onclick();renderPowerISOClassic();pisoHint('Virtual images unmounted.');persist()});}
function openToolsMenu(){closePisoMenus();const menu=$('pisoMenu');menu.replaceChildren();menu.hidden=false;['Burn...','Append data to disc...','Erase rewritable disc...','View drive / disc information...'].forEach(label=>menuItem(menu,label,()=>pisoHint('This exercise uses Virtual Drive for ISO mounting.')));menuSeparator(menu);menuItem(menu,'Virtual Drive',showVirtualDrives,true);menuSeparator(menu);menuItem(menu,'USB tools',()=>pisoHint('Use the virtual Command Prompt for the USB preparation task.'));menuItem(menu,'Real PowerISO integration (optional)',()=>{closePisoMenus();$('powerISOAdvanced').hidden=false});}
function openPisoDialog(mode){
 closePisoMenus();pisoDialogMode=mode;
 if(mode==='mount'&&!pisoDriveLetters().length){pisoHint('Configure a virtual drive first: Tools > Virtual Drive > Set number of drives > 1 drive.');return}
 pisoChosenFile=state.pisoOpenedName||customISO||PISO_IMAGES[0];$('pisoDialogTitle').textContent=mode==='mount'?'Mount image to '+(state.pisoMountLetter||pisoDriveLetters()[0])+':':'Open image file';$('pisoDialogConfirm').textContent=mode==='mount'?'Mount':'Open';$('pisoFilename').value=pisoChosenFile;$('pisoImageList').replaceChildren();
 [...new Set([...PISO_IMAGES,...(customISO?[customISO]:[])])].forEach(name=>{const b=document.createElement('button');b.className='piso-image-choice';b.textContent=name;b.onclick=()=>{pisoChosenFile=name;$('pisoFilename').value=name;confirmPisoDialog()};$('pisoImageList').append(b)});$('pisoDialog').hidden=false;
}
function confirmPisoDialog(){
 if(!pisoChosenFile)return;
 state.pisoOpenedName=pisoChosenFile;pisoFolder='';customISO=pisoChosenFile;
 if(!pisoDriveLetters().length){state.virtualDriveCount=1;pisoDriveLetters()}
 if(state.isoMounted&&!state.nativeISO)$('unmountISO').onclick();
 state.nativeISO=false;state.isoMounted=false;state.source=state.pisoMountLetter||pisoDriveLetters()[0];
 $('mountISO').onclick();
 pisoHint('Mounted '+state.isoName+' in virtual DVD Drive '+state.source+':. Ready to browse or return to CMD.');
 $('pisoDialog').hidden=true;renderPowerISOClassic();if(state.isoMounted){$('powerISOWindow').hidden=true;closePisoMenus();notifyUSB('Mounted successfully: '+state.isoName+' on virtual DVD Drive '+state.source+':.');if(state.index>=9)openCmd()}persist();
}

$('pisoTools').onclick=openToolsMenu;$('pisoMount').onclick=()=>{openToolsMenu();showVirtualDrives()};$('pisoOpen').onclick=()=>openPisoDialog('open');$('pisoFile').onclick=()=>{closePisoMenus();const menu=$('pisoMenu');menu.replaceChildren();menu.hidden=false;menuItem(menu,'New',()=>{$('pisoNew').onclick();closePisoMenus()});menuItem(menu,'Open...',()=>openPisoDialog('open'));menuItem(menu,'Close window',()=>{$('powerISOWindow').hidden=true})};
$('pisoNew').onclick=()=>{state.pisoOpenedName='';pisoFolder='';renderPowerISOClassic();pisoHint('New image file. Existing mounted media stays mounted until you unmount it.')};$('pisoDialogConfirm').onclick=confirmPisoDialog;$('pisoDialogClose').onclick=$('pisoDialogCancel').onclick=()=>{$('pisoDialog').hidden=true};
function openNativeISOPicker(){ $('pisoDialog').hidden=false }
$('pisoBrowse').onclick=()=>{$('pisoDialog').hidden=false};
$('isoFile').addEventListener('change',()=>{const file=$('isoFile').files?.[0];if(!file)return;if(!file.name.toLowerCase().endsWith('.iso')){pisoHint('Select an OS image with the .iso extension.');return}customISO=file.name;pisoChosenFile=file.name;$('pisoFilename').value=file.name;confirmPisoDialog()});
$('classicReturnCMD').onclick=()=>{closePisoMenus();$('backToCMD').onclick()};$('classicMinimize').onclick=()=>{$('powerISOWindow').hidden=true};$('classicMaximize').onclick=()=>{pisoMaximized=!pisoMaximized;Object.assign($('powerISOWindow').style,pisoMaximized?{top:'45px',left:'0',transform:'none',width:'100%',height:'calc(100% - 101px)',maxHeight:'none'}:{top:'',left:'',transform:'',width:'',height:'',maxHeight:''})};$('pisoParent').onclick=()=>{pisoFolder=pisoFolder.split('/').slice(0,-1).join('/');renderPowerISOClassic()};
['pisoView','pisoAction','pisoOptions','pisoHelp','pisoToolbarHelp','pisoSave','pisoAdd','pisoExtract','pisoDelete','pisoCopy','pisoBurn','pisoConvert','pisoUSB'].forEach(id=>$(id).onclick=()=>{closePisoMenus();pisoHint('Training workflow: Open image, then Tools > Virtual Drive > Set number of drives. Mount or unmount through the drive submenu. Other editing tools are visual references in this exercise.')});

$('backToClassicISO').onclick=()=>{$('powerISOAdvanced').hidden=true};
