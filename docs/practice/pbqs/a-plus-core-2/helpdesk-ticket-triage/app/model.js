/* Original Northstar service desk cases. Pure workflow and grading; no network calls. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HelpDeskTriage=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='student-hub-helpdesk-ticket-triage-v1',VERSION=2;
const choices=rows=>rows.map(([id,text])=>({id,text}));
const priorities={critical:{label:'Critical',rank:0},high:{label:'High',rank:1},medium:{label:'Medium',rank:2},low:{label:'Low',rank:3}};
const tickets=[
 {id:"HD-7346",priority:"low",title:"Website text is too large",requester:"Mara Ellis",department:"Design",submitted:"08:32",device:"NS-DES-17 · Windows 11 · Microsoft Edge",scope:"One user; the website still works.",
 sections:{
  request:"The text on the project website is much too large. Other websites look normal.",
  context:"Other Windows apps look normal. Windows display scaling is set to 100%.",
  notes:"The browser toolbar screenshot shows the current page zoom. No other browser problems are reported."
 },attachments:[{"id":"toolbar","name":"edge-toolbar.svg","kind":"image","title":"Browser toolbar capture","caption":"Original simulated browser capture. The page zoom control shows 175%; Windows display scaling is unchanged.","view":"browser"}],
 issues:choices([["resolution","Incorrect Windows screen resolution"],["zoom","Saved browser page zoom"],["profile","Damaged browser profile"],["extension","Browser extension interference"]]),
 actions:choices([["reset-profile","Reset the user’s browser profile"],["display","Increase Windows display scaling"],["zoom-reset","Set this site’s page zoom to 100%"],["reinstall","Uninstall and reinstall the browser"]])},
 {id:"HD-7329",priority:"high",title:"Cannot sign in to Windows",requester:"Aiden Cole",department:"Dispatch",submitted:"09:04",device:"NS-DSP-04 · Windows 11",scope:"One user cannot sign in.",
 sections:{
  request:"Windows will not let me sign in after I entered the wrong password several times.",
  context:"The user now has the correct password. Another authorized user can sign in on this PC.",
  notes:"Identity has been verified. The account is enabled, but Windows reports that it is locked out. Use the approved account-unlock procedure."
 },attachments:[{"id":"signin-message","name":"signin-message.txt","kind":"text","title":"Windows sign-in message","content":"Windows sign-in\n“The referenced account is currently locked out and may not be logged on to.”\n\nAccount check:\nAccount enabled: Yes\nAccount locked out: Yes\nSeveral incorrect password attempts were recorded."}],
 issues:choices([["lockout","Locked user account"],["dns","Incorrect DNS setting"],["disabled","Disabled user account"],["profile","Damaged user profile"]]),
 actions:choices([["keep-trying","Have the user keep trying the same password"],["unlock","Unlock the account using the approved procedure"],["public-dns","Change the DNS server before trying to sign in"],["profile-new","Create a new profile and move the user’s files"]])},
 {id:"HD-7352",priority:"critical",title:"Files will not open",requester:"Noah Chen",department:"Records",submitted:"09:08",device:"NS-REC-08 · Windows 11",scope:"One PC; files on a shared drive are also affected.",
 sections:{
  request:"My files will not open. Their names now end in .sealed, and a note asks me to pay to recover them.",
  context:"The problem started after I opened an email attachment. More filenames are still changing.",
  notes:"The PC is still connected to the network. Follow the malware-response procedure before attempting cleanup."
 },attachments:[{"id":"file-capture","name":"records-folder.svg","kind":"image","title":"User-provided folder capture","caption":"Original simulated user image: several records have acquired the .sealed extension and a payment note has appeared.","view":"files"},{"id":"endpoint-log","name":"file-observations.txt","kind":"text","title":"File observations","content":"File check\nNew file extension: .sealed\nNew note: RECOVER_FILES.txt\nThe note says the files are encrypted and asks for payment.\nMore files are changing while the PC remains connected to the network."}],
 issues:choices([["ransomware","Suspected ransomware infection"],["efs","Normal file encryption by the user"],["corruption","One damaged document"],["sync","File synchronization conflict"]]),
 actions:choices([["scan-online","Run a scan while the PC stays on the network"],["restore","Restore a backup while the PC stays on the network"],["reboot","Restart the PC and reconnect its network drives"],["contain","Disconnect the PC from the network and report it"]])},
 {id:"HD-7318",priority:"high",title:"Access denied to a shared folder",requester:"Priya Shah",department:"Procurement",submitted:"08:56",device:"NS-PRC-06 · Windows 11",scope:"One user cannot open the Projects folder.",
 sections:{
  request:"I can sign in to Windows, but the shared Projects folder says “Access is denied.”",
  context:"Other shared folders work. The user has approval to access Projects.",
  notes:"The Projects-Users group has access to the folder. A group member can open it. This user’s account is missing from that group."
 },attachments:[],
 issues:choices([["expired","Expired account password"],["membership","Missing folder-access group membership"],["share","File-sharing service is unavailable"],["mapping","Incorrect shared-folder location"]]),
 actions:choices([["share-reset","Restart the file server to restore folder access"],["everyone","Give Everyone full control of the shared folder"],["group","Add the user to the approved access group"],["password","Reset the user’s Windows account password"]])},
 {id:"HD-7341",priority:"medium",title:"Internal website will not load",requester:"Luis Moreno",department:"Inventory planning",submitted:"08:48",device:"NS-INV-12 · Windows 11 · Ethernet",scope:"One PC; the site works on other computers.",
 sections:{
  request:"The internal catalog website will not load on my PC. It opens on other computers.",
  context:"The PC can ping the server’s IP address, but a lookup of the site’s name times out.",
  notes:"The approved DNS server is 10.44.8.10. Compare the PC’s current DNS setting with the working PC in the attachment."
 },attachments:[{"id":"dns-output","name":"network-comparison.txt","kind":"text","title":"Network settings comparison","content":"Affected PC: NS-INV-12\nC:\\> ipconfig /all\nIPv4 Address: 10.44.8.62\nSubnet Mask: 255.255.255.0\nDefault Gateway: 10.44.8.1\nDNS Server: 10.99.0.53\n\nC:\\> ping 10.44.8.25\nReply from 10.44.8.25\n\nC:\\> nslookup catalog.northstar.example\nServer address: 10.99.0.53\nDNS request timed out.\n\nWorking PC: NS-INV-10\nDefault Gateway: 10.44.8.1\nDNS Server: 10.44.8.10\nThe catalog website opens normally."}],
 issues:choices([["gateway","Incorrect default gateway"],["dns-server","Incorrect DNS server setting"],["apipa","APIPA address after a DHCP failure"],["catalog","Catalog website server is down"]]),
 actions:choices([["renew","Renew the IP address without changing DNS"],["hosts","Add a permanent hosts-file entry for this site"],["dns-config","Set the adapter to the approved DNS server"],["gateway-config","Change the adapter’s default gateway"]])},
 {id:"HD-7335",priority:"low",title:"Report app will not open",requester:"Tessa Grant",department:"Training",submitted:"08:40",device:"NS-TRN-04 · Windows 11 · Report Editor",scope:"One user; the web version is available.",
 sections:{
  request:"My report app will not open. I can use the web version for now.",
  context:"Other apps work. This app needs the Northstar Report Engine service.",
  notes:"The service should use Automatic startup and be running. Check its current settings in the Services screenshot. You are authorized to restore those settings."
 },attachments:[{"id":"service-capture","name":"service-properties.svg","kind":"image","title":"Windows Services capture","caption":"Original simulated service properties: the local report service is stopped and its startup type is Disabled.","view":"service"}],
 issues:choices([["profile","Damaged Windows user profile"],["dependency","Required app service is disabled"],["license","Expired application license"],["files","Missing Windows system files"]]),
 actions:choices([["reinstall-os","Reinstall Windows before testing the app again"],["license-reset","Reactivate the application’s license"],["service-start","Set the service to Automatic and start it"],["profile-new","Recreate the user’s Windows profile"]])}
];
// A representative valid order for feedback; matching priority labels allow either order.
const order=['HD-7352','HD-7329','HD-7318','HD-7341','HD-7335','HD-7346'];
const rubric={
 "HD-7352":{"issue":"ransomware","action":"contain","evidence":"Files have a new extension, a payment note has appeared, and more files are changing after an email attachment was opened. These are ransomware warning signs.","fix":"Disconnect the PC from wired and wireless networks and report the suspected infection. This limits spread before cleanup begins. Do not restore files while the infection is still active.","priority":"Critical priority. Process this ticket before High, Medium, or Low tickets."},
 "HD-7329":{"issue":"lockout","action":"unlock","evidence":"Windows explicitly says the account is locked out after repeated incorrect passwords. The account is enabled, and another user can sign in on the PC.","fix":"Use the approved procedure to unlock the account, then have the user sign in with the correct password. If you lack permission, refer the unlock to the administrator.","priority":"High priority. Process it after Critical and before Medium or Low. Either order with the other High ticket is accepted."},
 "HD-7318":{"issue":"membership","action":"group","evidence":"The folder works for an approved group member, but this user is missing from the access group. Other shared folders work.","fix":"Add the user to the approved access group. Have the user sign out and back in, then test folder access. Do not grant broad access to Everyone.","priority":"High priority. Process it after Critical and before Medium or Low. Either order with the other High ticket is accepted."},
 "HD-7341":{"issue":"dns-server","action":"dns-config","evidence":"The PC can reach the server by IP address, but name lookup times out. Its DNS setting differs from the approved server used by a working PC.","fix":"Restore the approved DNS server, then test name resolution and open the website. Renewing an IP address alone does not fix an incorrect manual DNS setting.","priority":"Medium priority. Process it after Critical and High tickets, and before Low tickets."},
 "HD-7335":{"issue":"dependency","action":"service-start","evidence":"The app requires this service, but the screenshot shows Disabled startup and Stopped status. The documented normal settings are Automatic and Running.","fix":"Set the service to Automatic, start it, and test the app. A disabled service must be enabled before it can start.","priority":"Low priority. Process it after Critical, High, and Medium tickets. Either order with the other Low ticket is accepted."},
 "HD-7346":{"issue":"zoom","action":"zoom-reset","evidence":"Only one website is enlarged, and the browser screenshot shows 175% page zoom. Windows display scaling and other apps are normal.","fix":"Set this site’s page zoom to 100% and check the layout. Ctrl+0 restores the browser’s default zoom. There is no need to reset the profile or reinstall the browser.","priority":"Low priority. Process it after Critical, High, and Medium tickets. Either order with the other Low ticket is accepted."}
};
const sections=['request','context','notes'];
const byId=id=>tickets.find(t=>t.id===id);
function shuffle(values,rng){const copy=values.slice();for(let i=copy.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function initial(rng=Math.random,previous=[]){
 let queue=shuffle(tickets.map(t=>t.id),rng);
 while([order.join(),order.slice().reverse().join(),previous.join()].includes(queue.join()))queue.push(queue.shift());
 const answers={},inspections={},options={};
 for(const t of tickets){answers[t.id]={issue:'',action:''};inspections[t.id]={opened:false,sections:[],attachments:[]};options[t.id]={issues:shuffle(t.issues.map(o=>o.id),rng),actions:shuffle(t.actions.map(o=>o.id),rng)};}
 return {version:VERSION,queue,selected:null,section:'request',answers,inspections,options,sequence:[],active:null,completed:[],submitted:false};
}
function reviewed(s,id){const t=byId(id),i=s.inspections[id];return Boolean(i.opened&&sections.every(x=>i.sections.includes(x))&&t.attachments.every(a=>i.attachments.includes(a.id)));}
const allReviewed=s=>tickets.every(t=>reviewed(s,t.id));
function inspect(s,id,section){if(s.submitted||!byId(id)||!sections.includes(section))return false;s.selected=id;s.section=section;const i=s.inspections[id];i.opened=true;if(!i.sections.includes(section))i.sections.push(section);return true;}
function inspectAttachment(s,id,attachment){if(s.submitted||!byId(id)?.attachments.some(a=>a.id===attachment)||!s.inspections[id].opened)return false;const a=s.inspections[id].attachments;if(!a.includes(attachment))a.push(attachment);return true;}
function begin(s,id){if(s.submitted||!byId(id)||!allReviewed(s)||s.active||s.sequence.includes(id))return false;s.sequence.push(id);s.active=id;return true;}
function answer(s,id,field,value){const t=byId(id);if(!t||s.submitted||!s.sequence.includes(id)||!['issue','action'].includes(field)||!(field==='issue'?t.issues:t.actions).some(o=>o.id===value))return false;s.answers[id][field]=value;return true;}
function complete(s,id){if(s.submitted||s.active!==id||!s.answers[id].issue||!s.answers[id].action)return false;s.completed.push(id);s.active=null;return true;}
const ready=s=>allReviewed(s)&&s.completed.length===tickets.length&&!s.active&&tickets.every(t=>s.answers[t.id].issue&&s.answers[t.id].action);
function submit(s){if(s.submitted||!ready(s))return false;s.submitted=true;return true;}
function grade(s){
 let issues=0,actions=0,correctRelationships=0,rankedRelationships=0;const pairs=[],details=[];
 for(let i=0;i<order.length;i++)for(let j=i+1;j<order.length;j++){
  const first=order[i],second=order[j],rank=id=>priorities[byId(id).priority].rank,samePriority=rank(first)===rank(second);
  const [before,after]=rank(first)<=rank(second)?[first,second]:[second,first],a=s.sequence.indexOf(before),b=s.sequence.indexOf(after),correct=a>=0&&b>=0&&(samePriority||a<b);
  if(!samePriority){rankedRelationships++;if(correct)correctRelationships++;}pairs.push({before,after,samePriority,correct});
 }
 for(const t of tickets){const r=rubric[t.id],a=s.answers[t.id]||{},issue=a.issue===r.issue?2:0,action=a.action===r.action?2:0;issues+=issue;actions+=action;details.push({id:t.id,...r,issueKey:r.issue,actionKey:r.action,issue,action});}
 const priority=rankedRelationships?Math.round(15*correctRelationships/rankedRelationships):0,score=priority+issues+actions;
 return {score,max:39,percentage:Math.round(score/39*100),priority,correctRelationships,rankedRelationships,issues,actions,pairs,details,order:order.slice()};
}
function permutation(value,expected){return Array.isArray(value)&&value.length===expected.length&&new Set(value).size===value.length&&value.every(x=>expected.includes(x));}
function restore(raw){
 if(!raw||raw.version!==VERSION||!permutation(raw.queue,tickets.map(t=>t.id)))return initial();
 const s=initial();s.queue=raw.queue.slice();s.selected=byId(raw.selected)?raw.selected:null;s.section=sections.includes(raw.section)?raw.section:'request';
 for(const t of tickets){const id=t.id,r=raw.inspections?.[id];s.inspections[id]={opened:r?.opened===true,sections:sections.filter(x=>Array.isArray(r?.sections)&&r.sections.includes(x)),attachments:t.attachments.filter(a=>Array.isArray(r?.attachments)&&r.attachments.includes(a.id)).map(a=>a.id)};
  for(const [field,options]of [['issue',t.issues],['action',t.actions]])if(options.some(o=>o.id===raw.answers?.[id]?.[field]))s.answers[id][field]=raw.answers[id][field];
  for(const [field,values]of [['issues',t.issues],['actions',t.actions]])if(permutation(raw.options?.[id]?.[field],values.map(o=>o.id)))s.options[id][field]=raw.options[id][field].slice();
 }
 const sequence=raw.sequence,completed=raw.completed;
 if(!Array.isArray(sequence)||sequence.length>6||new Set(sequence).size!==sequence.length||!sequence.every(id=>byId(id))||!Array.isArray(completed)||!completed.every((id,i)=>id===sequence[i])||completed.length>sequence.length||sequence.length-completed.length>1||(!allReviewed(s)&&sequence.length))return initial();
 if(!completed.every(id=>s.answers[id].issue&&s.answers[id].action))return initial();
 const expectedActive=sequence.length>completed.length?sequence[sequence.length-1]:null;
 if(raw.active!==expectedActive)return initial();
 s.sequence=sequence.slice();s.completed=completed.slice();s.active=expectedActive;
 for(const t of tickets)if(!sequence.includes(t.id))s.answers[t.id]={issue:'',action:''};
 s.submitted=raw.submitted===true&&ready(s);return s;
}
return {KEY,VERSION,priorities,tickets,sections,byId,initial,restore,reviewed,allReviewed,inspect,inspectAttachment,begin,answer,complete,ready,submit,grade};
});
