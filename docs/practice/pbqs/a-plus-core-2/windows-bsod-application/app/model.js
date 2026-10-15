/* Offline Windows troubleshooting model. Commands never reach the host OS. */
(function (root) {
  'use strict';
  const KEY = 'hub.windows-bsod-application.v1';
  const screens = ['bsod','startup','signin','desktop','choose','troubleshoot','advanced','settings','startupChoices','startupRepair','restore','updates','device','driverUpdate','driverPackages','driverRollback','events','reliability','memory','memoryRun','hardware','apps','appOptions','portal','runtimeSetup','terminal','appError','appCrash','studyDesk','workload','off'];
  const specs = [
    {id:'A', name:'Studio workstation', ticket:'Crashes recur after a display-driver update. The normal sign-in session cannot stay running. Restore the workstation for graphics work.', service:'Windows 11 Enterprise 23H2 training image; signed Northstar display packages are cached locally. The previous driver was stable. User data is backed up.'},
    {id:'B', name:'Records workstation', ticket:'Intermittent crashes started after a memory upgrade. Identify the failing component and restore the approved memory configuration.', service:'Windows 11 Enterprise 23H2 training image; approved configuration: 16 GB, two matching 8 GB DDR4-3200 modules at JEDEC defaults, no overclock. A second module was added yesterday. A known-good test slot and replacement modules are available.'},
    {id:'C', name:'Student services workstation', ticket:'Windows starts, but StudyDesk fails after an interrupted application update and software cleanup. Restore the application and verify an export.', service:'Windows 11 Enterprise 23H2 training image; StudyDesk 3.2 is a 32-bit desktop application. Its approved full installer and Microsoft runtime packages are available through Company Portal. User documents are backed up.'}
  ];
  function pc(i) { return {id:specs[i].id, screen:i < 2 ? 'bsod' : 'signin', safe:false, inRecovery:false, memoryRead:-1, toolTab:'general', log:'System', event:'', reliability:'', evidence:{}, driver:'4.8.2', enabled:true, pendingDriver:false, revision:0, booted:-1, verified:-1, memoryScheduled:false, memoryRuns:[], modules:['M-A51','M-B84'], connected:true, isolation:[], runtimeX86:false, runtimeX64:true, appFiles:false, appInstalled:true, launched:-1, exported:-1, notes:'', message:'', transcript:[], history:[]}; }
  function initial(seed = Math.floor(Math.random()*1000000)) { return {version:1,seed:Number.isInteger(seed)&&seed>=0?seed:0,selected:0,submitted:false,pcs:[pc(0),pc(1),pc(2)]}; }
  const badSerial = s => s.seed % 2 ? 'M-A51' : 'M-B84';
  const hasBad = (s,p) => p.id === 'B' && p.modules.includes(badSerial(s));
  function healthy(s,p) { return p.id === 'A' ? p.driver === '4.7.6' && p.enabled && !p.pendingDriver : p.id === 'B' ? !hasBad(s,p) && p.modules.filter(Boolean).length === 2 : p.appInstalled && p.appFiles && p.runtimeX86; }
  function change(p) { p.revision++; p.verified=-1; p.message=''; }
  function open(s,screen) {
    if(s.submitted || !screens.includes(screen)) return;
    const p=s.pcs[s.selected];
    if(screen==='hardware'&&(p.id!=='B'||!['off','hardware'].includes(p.screen))){p.message='Shut down the workstation before opening the memory service bench.';return;}
    if(p.id==='B'&&!p.connected&&!['off','hardware'].includes(screen)){p.message='Reconnect AC power before using the computer.';return;}
    p.screen=screen; p.message='';if(screen==='device'&&!['general','driver','events'].includes(p.toolTab))p.toolTab='general'; if(screen==='choose')p.inRecovery=true;
    if(screen==='bsod') p.evidence.stop=true;
    if(screen==='device') p.evidence.device=true;
    if(screen==='appError') p.evidence.dll=true;
    if(screen==='apps') p.evidence.apps=true;
    if(screen==='hardware') p.evidence.configuration=true;
  }
  function restart(s,safe=false) {
    if(s.submitted)return;
    const p=s.pcs[s.selected];p.message='';p.safe=safe;
    if(p.id==='B'&&!p.connected){p.screen='off';p.message='Reconnect AC power before starting the workstation.';return;}
    if(p.id==='B'&&!p.modules.some(Boolean)){p.screen='off';p.message='No memory is installed. POST cannot complete. Install memory before starting.';return;}
    if(p.memoryScheduled){p.screen='memoryRun';return;}
    p.pendingDriver=false; p.screen='startup';
  }
  function signIn(s) {
    const p=s.pcs[s.selected];if(s.submitted)return;
    if(p.id==='A'&&!p.safe&&p.enabled&&p.driver==='4.8.2'){p.screen='bsod';p.evidence.stop=true;return;}
    p.inRecovery=false;p.screen='desktop'; if(p.safe)p.evidence.safe=true;
    else if(healthy(s,p))p.booted=p.revision;
  }
  function memoryComplete(s) {
    const p=s.pcs[s.selected];if(s.submitted||p.screen!=='memoryRun')return;
    p.memoryScheduled=false;p.pendingDriver=false;p.inRecovery=false;
    const result={revision:p.revision,errors:hasBad(s,p),number:(p.memoryRuns.at(-1)?.number||0)+1};
    p.memoryRuns.push(result);p.memoryRuns=p.memoryRuns.slice(-12);p.screen='signin';p.safe=false;
  }
  function events(s,p,log=p.log) {
    const bug={key:'bug',level:'Error',source:'BugCheck',id:1001,time:'10/15/2026 09:12',text:p.id==='A'?'The computer has rebooted from a bugcheck. The bugcheck was: 0x00000116. A dump was saved in: C:\\Windows\\Minidump\\101526-01.dmp.':'The computer has rebooted from a bugcheck. The bugcheck was: 0x0000001a. A dump was saved in: C:\\Windows\\Minidump\\101526-02.dmp.'};
    if(log==='System'){
      const rows=p.id==='C'?[{key:'popup',level:'Information',source:'Application Popup',id:26,time:'10/15/2026 09:18',text:'StudyDesk.exe - System Error: The code execution cannot proceed because VCRUNTIME140.dll was not found.'}]:[bug,{key:'power',level:'Critical',source:'Kernel-Power',id:41,time:'10/15/2026 09:13',text:'The system has rebooted without cleanly shutting down first. This error could be caused if the system stopped responding, crashed, or lost power unexpectedly.'}];
      if(p.id==='A')rows.push({key:'display',level:'Warning',source:'Display',id:4101,time:'10/15/2026 09:11',text:'Display driver nsdisplay stopped responding and has successfully recovered.'});
      for(const r of p.memoryRuns)rows.unshift({key:'memory-'+r.number,level:r.errors?'Error':'Information',source:'MemoryDiagnostics-Results',id:r.errors?1202:1201,time:new Date(Date.UTC(2026,9,15,10,20+r.number)).toLocaleString('en-US',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'UTC'}),text:`The Windows Memory Diagnostic ${r.errors?'tested the computer memory and detected hardware errors. To identify and repair these problems, contact the computer manufacturer.':'tested the computer memory and detected no errors.'}`});
      return rows;
    }
    const rows=[{key:'install',level:p.id==='C'?'Error':'Information',source:'MsiInstaller',id:p.id==='C'?11708:11707,time:'10/14/2026 16:40',text:p.id==='C'?'Product: StudyDesk 3.2. Installation operation failed, error 1603. Installer log: C:\\ProgramData\\StudyDesk\\update.log.':'A scheduled application maintenance operation completed successfully.'}];
    if(p.evidence.crash)rows.unshift({key:'appcrash',level:'Error',source:'Application Error',id:1000,time:'10/15/2026 10:05',text:'Faulting application name: StudyDesk.exe, version: 3.2.0.0\nFaulting module name: ReportPlugin.dll, version: 3.1.0.0\nException code: 0xc0000005\nApplication path: C:\\Program Files (x86)\\StudyDesk\\StudyDesk.exe'});
    return rows;
  }
  function selectEvent(s,key) {
    if(s.submitted)return;const p=s.pcs[s.selected], row=events(s,p).find(e=>e.key===key);if(!row)return;p.event=key;
    if(key==='bug')p.evidence.bug=true;if(key==='install')p.evidence.install=true;if(key==='popup')p.evidence.popup=true;if(key==='appcrash')p.evidence.appEvent=true;
    if(key.startsWith('memory-')){const result=p.memoryRuns.find(r=>'memory-'+r.number===key);if(result)p.memoryRead=result.revision;p.evidence.memoryResult=true;if(/hardware errors/.test(row.text))p.evidence.memoryFailure=true;}
  }
  function act(s,action,value) {
    if(s.submitted)return;const p=s.pcs[s.selected];p.message='';
    if(action==='driverDetails'){p.toolTab='driver';p.evidence.driver=true;}
    else if(action==='rollback') { if(p.id!=='A'||p.driver==='4.7.6'){p.message='No earlier driver package is available for this device.';return;}change(p);p.driver='4.7.6';p.pendingDriver=true;p.message='The previous driver has been restored. Restart the computer to apply the change.';p.screen='device';p.toolTab='driver'; }
    else if(action==='autoDriver'){if(p.id==='A'){change(p);p.driver='4.8.2';p.pendingDriver=true;}p.message='The latest cached signed driver package was installed. Restart to apply it.';}
    else if(action==='knownDriver'){if(p.id==='A'){change(p);p.driver='4.7.6';p.enabled=true;p.pendingDriver=true;}p.message='The approved previous display package was installed. Restart required.';}
    else if(action==='toggleDevice'){if(p.id==='A'){change(p);p.enabled=!p.enabled;p.pendingDriver=true;}p.message=p.enabled?'Device enabled. Restart required.':'Device disabled. Basic display is available, but the graphics workload requires the adapter.';}
    else if(action==='uninstallDriver'){if(p.id==='A'){change(p);p.driver='4.8.2';p.enabled=true;p.pendingDriver=true;}p.message='Device removed and rescanned. Windows reinstalled the cached driver package. Restart required.';}
    else if(action==='memoryNow'){p.memoryScheduled=true;p.screen='memoryRun';}
    else if(action==='memoryLater'){p.memoryScheduled=true;p.screen='desktop';p.message='Memory test scheduled for the next restart. No test result exists yet.';}
    else if(action==='disconnect'){if(p.screen!=='hardware'||p.connected===false)return;p.connected=false;p.message='AC disconnected. ESD precautions are in place. The service bench is ready.';}
    else if(action==='connect'){p.connected=true;p.message='AC power connected. Close the service bench and start Windows.';}
    else if(action==='isolate'){
      if(p.id!=='B'||p.connected){p.message='Shut down and disconnect AC power before servicing memory.';return;}
      const [index,slot]=String(value).split(':'),serial=p.modules[Number(index)];if(!serial||!['A2','B2'].includes(slot))return;
      const errors=serial===badSerial(s);p.isolation.push({serial,slot,errors});if(new Set(p.isolation.filter(r=>r.serial===badSerial(s)&&r.errors).map(r=>r.slot)).size===2)p.evidence.isolated=true;p.isolation=p.isolation.slice(-16);p.message=`OEM bench test: ${serial} in test slot ${slot}: ${errors?'FAIL · memory errors detected':'PASS · no errors detected'}.`;
    }
    else if(['reseat','removeModule','replaceModule'].includes(action)){
      if(p.id!=='B'||p.connected){p.message='Shut down and disconnect AC power before servicing memory.';return;}
      const index=Number(value);if(![0,1].includes(index))return;change(p);
      if(action==='removeModule'){p.modules[index]='';p.message='Module removed. Check the approved capacity before returning the computer.';}
      if(action==='replaceModule'){p.modules[index]=index===0?'NEW-A':'NEW-B';p.message='A compatible, known-good 8 GB DDR4-3200 module is installed.';}
      if(action==='reseat')p.message='Module reseated. Retest before deciding whether the hardware fault is resolved.';
    }
    else if(action==='repairApp'){if(!p.appInstalled){p.message='StudyDesk is not installed. Use the approved full installer.';return;}change(p);p.appFiles=true;p.appInstalled=true;p.message='StudyDesk application files repaired. Shared prerequisites are managed separately. Launch the application to test.';}
    else if(action==='reinstallApp'){change(p);p.appFiles=true;p.appInstalled=true;p.runtimeX86=true;p.message='The signed full StudyDesk installer completed, including its required x86 runtime. Launch and test the application.';}
    else if(action==='uninstallApp'){change(p);p.appInstalled=false;p.message='StudyDesk was uninstalled. User documents were retained.';}
    else if(action==='runtimeX86'||action==='runtimeX64'){if(p.safe){p.message='Windows Installer is unavailable in this Safe Mode session. Restart Windows normally to service this package.';return;}change(p);if(action==='runtimeX86')p.runtimeX86=true;else p.runtimeX64=true;p.message='Microsoft Visual C++ v14 Redistributable setup completed successfully.';}
    else if(action==='requirements'){p.evidence.requirements=true;p.message='StudyDesk 3.2: x86 application. Requires Microsoft Visual C++ v14 Redistributable (x86), even on 64-bit Windows. Publisher: Northstar Learning. Full installer includes prerequisites.';}
    else if(action==='reliability'){p.reliability=String(value);if(value==='update')p.evidence.update=true;if(value==='hardware')p.evidence.hardwareChange=true;if(value==='app')p.evidence.install=true;}
    else if(action==='calculator'){p.evidence.desktopTest=true;p.message='Calculator opened successfully. Windows remains responsive.';}
    else if(action==='launchApp'){
      if(!p.appInstalled){p.message='StudyDesk is not installed. Use the approved full installer in Company Portal.';return;}
      if(!p.runtimeX86){p.screen='appError';p.evidence.dll=true;return;}
      if(!p.appFiles){p.screen='appCrash';p.evidence.crash=true;return;}
      p.screen='studyDesk';p.launched=p.revision;
    }
    else if(action==='export'){if(healthy(s,p)){p.exported=p.revision;p.message='Export complete: student-summary.csv. The application remained responsive through the test.';}else p.message='The application is not ready for the export test.';}
    else if(action==='workload'){
      p.screen='workload';
      if(p.safe){p.message='Safe Mode does not load the full production driver set. Restart normally before the original workload test.';return;}
      if(p.id==='A'&&(!p.enabled||p.pendingDriver)){p.message='Graphics validation could not run: required adapter is unavailable or a restart is pending.';return;}
      if((p.id==='A'&&p.driver==='4.8.2')||hasBad(s,p)){p.screen='bsod';p.evidence.stop=true;return;}
      if(healthy(s,p)){p.verified=p.revision;p.message='Original workload completed three test cycles without a new crash. Review the post-repair diagnostics before closing the ticket.';}
      else p.message='The workload ran, but the installed memory capacity does not meet the approved 16 GB configuration.';
    }
    else if(action==='startupRepair') {p.screen='startupRepair';p.message='Startup Repair found no damaged boot configuration. No repairs were made.';}
    else if(action==='restore') {p.screen='restore';p.message='No restore points are available for this installation. No changes were made.';}
    else if(action==='uninstallUpdate') {p.screen='updates';p.message='No removable pending Windows quality update was found. Display-driver packages are managed separately. No changes were made.';}
  }
  const help='Supported: SFC /VERIFYONLY, SFC /SCANNOW, DISM /ONLINE /CLEANUP-IMAGE /SCANHEALTH, DISM /ONLINE /CLEANUP-IMAGE /RESTOREHEALTH, CHKDSK C:, MDSCHED.EXE, EVENTVWR.MSC, DEVMGMT.MSC, PERFMON /REL, APPWIZ.CPL, SHUTDOWN /R /T 0, CLS, EXIT. Commands are simulated.';
  function execute(s,raw){
    const p=s.pcs[s.selected];if(s.submitted||p.screen!=='terminal'||typeof raw!=='string')return '';
    const prompt=p.inRecovery?'X:\\Windows\\system32>':'C:\\Windows\\system32>', c=raw.trim().toLowerCase().replace(/\s+/g,' ');let out='';
    if(raw.length>256||/[\n\r;&|<>`$]/.test(raw))out='Command unavailable in this simulation.';
    else if(c==='help'||c.endsWith(' /?'))out=help;
    else if(p.inRecovery&&(/^(sfc|dism|mdsched|eventvwr|devmgmt|perfmon|appwiz)/.test(c)))out='This recovery image is not the installed Windows session. Return to Windows for these online system and desktop tools. No changes were made.';
    else if(/^sfc(?:\.exe)? \/(verifyonly|scannow)$/.test(c)){p.evidence.integrity=true;out='Beginning system scan. This process will take some time.\nVerification 100% complete.\nWindows Resource Protection did not find any integrity violations.';}
    else if(/^dism(?:\.exe)? \/online \/cleanup-image \/(scanhealth|restorehealth)$/.test(c)){p.evidence.dism=true;out='Deployment Image Servicing and Management tool\n[==========================100.0%==========================]\nNo component store corruption detected.\nThe operation completed successfully.';}
    else if(c==='chkdsk c:')out='The type of the file system is NTFS.\nWindows has scanned the file system and found no problems.\n0 KB in bad sectors.';
    else if(c==='mdsched.exe'){open(s,'memory');out='Windows Memory Diagnostic opened. Choose when to restart and test.';}
    else if(c==='eventvwr.msc'){open(s,'events');out='Event Viewer opened.';}
    else if(c==='devmgmt.msc'){open(s,'device');out='Device Manager opened.';}
    else if(c==='perfmon /rel'){open(s,'reliability');out='Reliability Monitor opened.';}
    else if(c==='appwiz.cpl'){open(s,'apps');out='Installed Apps opened.';}
    else if(c==='shutdown /r /t 0'){restart(s);out='Restarting...';}
    else if(c==='exit'){open(s,p.inRecovery?'advanced':'desktop');out='';}
    else if(c==='cls'){p.transcript=[];out='';}
    else out='Command unavailable or invalid syntax in this simulation. Type HELP for supported commands.';
    p.history.push(raw.slice(0,256));p.history=p.history.slice(-60);if(c!=='cls'){p.transcript.push({prompt,command:raw.slice(0,256),output:out});p.transcript=p.transcript.slice(-40);}return out;
  }
  function grade(s){
    const rows=s.pcs.map(p=>{const e=p.evidence,good=healthy(s,p),failures=p.isolation.filter(r=>r.serial===badSerial(s)&&r.errors),isolated=p.evidence.isolated||new Set(failures.map(r=>r.slot)).size===2;
      const checks=p.id==='A'?[
        [e.stop&&e.bug,'Crash evidence','Read the stop screen and BugCheck event. Kernel-Power 41 records an unexpected shutdown, not its cause.'],
        [e.driver&&e.update,'Driver correlation','Compare Device Manager driver details with the Reliability Monitor update timeline. The recent display-driver change is relevant evidence.'],
        [e.safe,'Isolation','Use Startup Settings to enter Safe Mode. Stability with minimal drivers supports investigating the full display-driver path; it does not prove every hardware component is healthy.'],
        [good,'Driver remediation','Restore the approved stable display driver and keep the adapter enabled. Reinstalling the same faulty package or disabling the adapter does not restore the required graphics function.'],
        [good&&p.booted===p.revision,'Normal startup','Restart and sign in normally after the driver change. Safe Mode alone is not a repaired production session.'],
        [good&&p.verified===p.revision&&p.booted===p.revision,'Stability verification','Run the original graphics workload in the normal session after the repair. A completed rollback dialog is not a stability test.']
      ]:p.id==='B'?[
        [e.stop&&e.bug,'Crash evidence','Read MEMORY_MANAGEMENT and the corresponding event. This stop code can involve hardware or software; it does not name a failing module.'],
        [e.memoryFailure&&e.configuration&&e.hardwareChange,'Memory investigation','Review the hardware-change timeline, installed configuration, and a failed Windows Memory Diagnostic result in Event Viewer.'],
        [isolated,'Hardware isolation','Test individual modules in both known-good test slots. An error that follows a module across slots supports replacing that module. Windows Memory Diagnostic alone does not identify which DIMM is faulty.'],
        [good,'Memory remediation','Restore two compatible, known-good 8 GB modules. Reseating a defective module or replacing the healthy module leaves the fault. Removing memory alone does not restore the required capacity.'],
        [good&&p.booted===p.revision,'Normal startup','Reconnect AC power, restart, and sign in with the repaired 16 GB configuration.'],
        [good&&p.verified===p.revision&&p.memoryRead===p.revision&&p.memoryRuns.some(r=>r.revision===p.revision&&!r.errors),'Post-repair verification','Rerun Windows Memory Diagnostic on the current hardware configuration, read the result, and test the original workload normally. An old passing result does not verify a later hardware change.']
      ]:[
        [e.dll&&(e.popup||e.appEvent),'Application evidence','Inspect the missing-DLL dialog and relevant Event Viewer details. A user-mode application error is different from a kernel stop error.'],
        [e.apps&&e.install&&e.requirements,'Dependency and update investigation','Read the failed application update, installed packages, and the app requirements. A 32-bit application needs its x86 runtime even on 64-bit Windows.'],
        [e.integrity||e.desktopTest,'Scope isolation','Confirm that Windows remains functional, or inspect SFC results. Clean protected system files do not establish that third-party dependencies are installed.'],
        [good,'Application remediation','Restore the Microsoft x86 runtime and repair the incomplete StudyDesk update, or use the signed full app installer that includes prerequisites. SFC/DISM and the x64 runtime do not replace these application repairs.'],
        [good&&p.launched===p.revision,'Launch verification','Launch StudyDesk after the final repair. Restoring the runtime can reveal a separate application plug-in crash from the interrupted update.'],
        [good&&p.exported===p.revision,'Functional verification','Complete the sample export in the repaired application. A launch alone does not verify its original function.']
      ];return{id:p.id,checks:checks.map(([pass,...rest])=>[Boolean(pass),...rest]),points:checks.filter(c=>c[0]).length};});return{rows,score:rows.reduce((n,r)=>n+r.points,0),max:18};
  }
  function restore(saved){
    if(!saved||saved.version!==1||!Number.isInteger(saved.seed)||saved.seed<0||!Array.isArray(saved.pcs)||saved.pcs.length!==3)return initial();
    const s=initial(saved.seed);s.selected=[0,1,2].includes(saved.selected)?saved.selected:0;s.submitted=saved.submitted===true;
    s.pcs.forEach((p,i)=>{const x=saved.pcs[i];if(!x||x.id!==p.id)return;
      for(const k of ['safe','inRecovery','enabled','pendingDriver','memoryScheduled','connected','runtimeX86','runtimeX64','appFiles','appInstalled'])if(typeof x[k]==='boolean')p[k]=x[k];
      for(const k of ['revision','memoryRead','booted','verified','launched','exported'])if(Number.isInteger(x[k])&&x[k]>=-1&&x[k]<100000)p[k]=x[k];
      if(screens.includes(x.screen))p.screen=x.screen;
      if(['general','driver','events','x86','x64'].includes(x.toolTab))p.toolTab=x.toolTab;if(['System','Application'].includes(x.log))p.log=x.log;if(['4.8.2','4.7.6'].includes(x.driver))p.driver=x.driver;
      for(const k of ['event','reliability','notes','message'])if(typeof x[k]==='string')p[k]=x[k].slice(0,k==='notes'?2000:1200);
      if(Array.isArray(x.modules)&&x.modules.length===2&&x.modules.every(v=>['','M-A51','M-B84','NEW-A','NEW-B'].includes(v)))p.modules=x.modules;
      const keys=['stop','device','driver','isolated','dll','apps','configuration','safe','bug','install','popup','appEvent','memoryResult','memoryFailure','update','hardwareChange','requirements','desktopTest','crash','integrity','dism'];for(const k of keys)if(x.evidence?.[k]===true)p.evidence[k]=true;
      if(Array.isArray(x.memoryRuns))p.memoryRuns=x.memoryRuns.filter(r=>r&&Number.isInteger(r.revision)&&typeof r.errors==='boolean'&&Number.isInteger(r.number)).slice(-12);
      if(Array.isArray(x.isolation))p.isolation=x.isolation.filter(r=>r&&['M-A51','M-B84','NEW-A','NEW-B'].includes(r.serial)&&['A2','B2'].includes(r.slot)&&typeof r.errors==='boolean').slice(-16);
      if(Array.isArray(x.history))p.history=x.history.filter(v=>typeof v==='string').slice(-60).map(v=>v.slice(0,256));
      if(Array.isArray(x.transcript))p.transcript=x.transcript.filter(e=>e&&['prompt','command','output'].every(k=>typeof e[k]==='string')).slice(-40).map(e=>({prompt:e.prompt.slice(0,100),command:e.command.slice(0,256),output:e.output.slice(0,3000)}));
    });return s;
  }
  const api={KEY,specs,initial,badSerial,hasBad,healthy,open,restart,signIn,memoryComplete,events,selectEvent,act,execute,grade,restore};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BsodApplication=api;
})(typeof window!=='undefined'?window:globalThis);
