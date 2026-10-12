const API="/.netlify/functions/live-crew-session";
const roles = {
  command:{title:"Incident Command"}, engine:{title:"Engine 181 — First-Due"},
  truck:{title:"Truck 182 — Search"}, rit:{title:"RIT 186"}, engine2:{title:"Engine 184 — Second-Due"}
};
let sessionCode="",instructorKey="",participantId="",role="",pollTimer=null;
let injectBusy=false,lastInjectKey="",lastInjectAt=0;
let sceneImageData="",sceneImageAlt="",sceneBoardData="",sceneSidesData={},viewedSidesData=[];
document.addEventListener("DOMContentLoaded",()=>{renderRoleButtons();const q=new URLSearchParams(location.search);if(q.get("code")){showJoin();document.getElementById("joinCode").value=q.get("code").toUpperCase();}});
function renderRoleButtons(){const el=document.getElementById("roles");el.innerHTML="";Object.entries(roles).forEach(([k,v])=>{const b=document.createElement("button");b.className="btn alt";b.textContent=v.title;b.onclick=()=>joinSession(k);el.appendChild(b);});}
function showJoin(){document.getElementById("joinBox").classList.remove("hidden");}
async function api(body){const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||"Session service error");return data;}
async function createSession(){setError("");try{const d=await api({action:"create"});sessionCode=d.code;instructorKey=d.instructorKey;cacheSceneImage(d.state);document.getElementById("entry").classList.add("hidden");document.getElementById("lobby").classList.remove("hidden");document.getElementById("instructorPanel").classList.remove("hidden");document.getElementById("sessionCode").textContent=sessionCode;history.replaceState(null,"","?code="+sessionCode);renderHost(d.state);startPolling(true);}catch(e){setError(e.message);}}
async function joinSession(selectedRole){setError("");const code=document.getElementById("joinCode").value.trim().toUpperCase(),name=document.getElementById("name").value.trim();if(!code||!name){setError("Enter the session code and your name/unit first.");return;}try{const d=await api({action:"join",code,name,role:selectedRole});sessionCode=code;participantId=d.participantId;role=selectedRole;cacheSceneImage(d.state);document.getElementById("entry").classList.add("hidden");document.getElementById("sim").classList.remove("hidden");document.getElementById("roleTitle").textContent=roles[role].title;document.getElementById("roleBrief").textContent=d.state.roleBrief||"Follow your assigned role and relay important information by radio.";document.getElementById("roleIntel").textContent=d.state.roleIntel||"Your first role-specific information appears here.";document.getElementById("commandTools").classList.toggle("hidden",role!=="engine");document.getElementById("assignments").classList.remove("hidden");renderPlayer(d.state);startPolling(false);}catch(e){setError(e.message);}}
async function instructorCommand(command){try{const d=await api({action:"instructor",code:sessionCode,instructorKey,command});renderHost(d.state);}catch(e){alert(e.message);}}
async function sendInject(){
  const button=document.getElementById("sendInjectButton");
  const injectId=document.getElementById("injectType").value;
  const targetRole=document.getElementById("injectRole").value;
  const status=document.getElementById("injectResult");
  const target=roles[targetRole]?.title||targetRole;
  const key=targetRole+":"+injectId;
  const now=Date.now();
  if(injectBusy)return;
  if(key===lastInjectKey&&now-lastInjectAt<2000){
    status.textContent="That update was just sent to "+target+". Choose another update or wait before sending it again.";
    return;
  }
  injectBusy=true;
  button.disabled=true;
  button.textContent="Sending update…";
  status.textContent="Sending private update to "+target+"…";
  try {
    const d=await api({action:"inject",code:sessionCode,instructorKey,injectId,targetRole});
    lastInjectKey=key;
    lastInjectAt=Date.now();
    status.textContent="Private update sent to "+target+".";
    renderHost(d.state);
  } catch(e) {
    status.textContent="Update not sent: "+e.message;
  } finally {
    injectBusy=false;
    button.disabled=false;
    button.textContent="Send private update";
  }
}
async function choose(choice){try{const d=await api({action:"participant",code:sessionCode,participantId,choice});renderPlayer(d.state);}catch(e){alert(e.message);}}
function branchText(state,text){if(state.branch==="reinforced-attack"&&role==="engine")return text+" A second line is moving toward your division and fire growth is slowing.";if(state.branch==="withdrawal")return "Command has selected withdrawal. Use the department radio and accountability process to confirm your crew's movement and status.";return text;}
function visualFor(state,r){return state.scene || ["Incident briefing","Awaiting information","Follow your assignment and use department radios."];}
function cacheSceneImage(state){const image=state?.sceneImage;if(image?.dataUrl){sceneImageData=image.dataUrl;sceneImageAlt=image.alt||"Assigned role scene view";}if(state?.sceneBoard)sceneBoardData=state.sceneBoard;if(state?.sceneSides)sceneSidesData=state.sceneSides;viewedSidesData=state?.viewedSides||[];}
function renderScene(id,state,r){
  const el=document.getElementById(id);
  if(!el)return;
  const v=visualFor(state,r);
  const cls=state.branch==="reinforced-attack"?"branch-good":state.branch==="delayed-reinforcement"?"branch-bad":state.branch==="withdrawal"?"branch-withdraw":"";
  const photo=sceneImageData?'<img class="scene-photo" src="'+escapeHtml(sceneImageData)+'" alt="'+escapeHtml(sceneImageAlt)+'">':"";
  const sizeup=state.sceneSizeup||"Observe your assigned view and report important changes over the radio.";
  el.className="card scene "+cls;
  el.innerHTML='<div class="scene-visual">'+photo+'<div class="scene-copy"><div class="tag">Assigned role view</div><div class="scene-state">'+escapeHtml(v[0])+'</div><h2>'+escapeHtml(v[1])+'</h2></div></div><div class="scene-caption"><strong>Scene size-up</strong><p>'+escapeHtml(sizeup)+'</p><p>'+escapeHtml(v[2])+'</p></div>';
}
function renderPlayer(state){cacheSceneImage(state);document.getElementById("roleIntel").textContent=state.roleIntel||"";document.getElementById("arrivalStatus").textContent=state.onScene?"ON SCENE — role view available":"RESPONDING — dispatch and radio traffic only; scene photo unlocks on arrival";document.getElementById("playerStatus").textContent=state.status.toUpperCase();document.getElementById("syncState").textContent="Synced "+new Date().toLocaleTimeString();const e=state.event || ["Awaiting instructor","Wait for the instructor to start the scenario.",[]];renderScene("playerScene",state,role);document.getElementById("eventTitle").textContent=e[0];document.getElementById("eventText").textContent=branchText(state,e[1]);const inbox=document.getElementById("injectInbox");
inbox.innerHTML=(state.injects||[]).map(x=>'<div class="card private"><b>Instructor update</b><p>'+escapeHtml(x.text)+'</p></div>').join("");
renderCommandTools(state);renderAssignments(state);renderHandoff(state);renderRadio(state.radioTraffic);const c=document.getElementById("choices");c.innerHTML="";if(state.status==="lobby")c.innerHTML='<p class="muted">Waiting for the instructor to start the incident.</p>';else if(state.status==="paused")c.innerHTML='<p class="muted">Scenario paused by instructor.</p>';else if(state.status==="ended")c.innerHTML='<p class="muted">Scenario ended. Keep your phone available for the AAR.</p>';else if(role==="command"&&state.onScene&&!state.handoff?.accepted)c.innerHTML="<p class=\"muted\">On scene. Engine 181 is acting lead; receive and accept the radio handoff before directing units.</p>";else if(Number(state.participant?.lastAction?.phase)===Number(state.phase))c.innerHTML="<p class=\"muted\">Choice recorded. The next scene will open when the crew has made its decisions and Command completes the first-due 360.</p>";else e[2].forEach(x=>{const b=document.createElement("button");b.className="btn";b.textContent=x;b.onclick=()=>choose(x);c.appendChild(b);});renderTimeline("timeline",state.timeline);}
function renderHost(state){cacheSceneImage(state);renderArrivalTracker(state);document.getElementById("hostStatus").textContent=state.status.toUpperCase();document.getElementById("hostPhase").textContent=(Number(state.phase||0)+1)+" / 5";document.getElementById("hostBranch").textContent=state.branch;document.getElementById("hostProgress").textContent=`Crew choices: ${state.actionProgress?.acted||0}/${state.actionProgress?.total||0}. Phase transitions happen automatically after all connected roles choose; the instructor can override.`;renderHostSides(state);renderScene("hostScene",state,"command");renderCrew("hostCrew",state.participants);renderCrew("lobbyCrew",state.participants);renderTimeline("hostTimeline",state.timeline);if(state.status!=="lobby")document.getElementById("lobby").classList.add("hidden");}
function renderCommandTools(state){
  const panel=document.getElementById("commandTools");if(!panel||role!=="engine")return;
  panel.classList.remove("hidden");
  const progress=state.viewedSides||viewedSidesData;viewedSidesData=progress;
  const sides=Object.keys(state.sceneSides||sceneSidesData||{});
  renderSideButtons("sceneSides",sides,progress,side=>recordDiscovery(side));
  const image=document.getElementById("sideBoard");if(image&&sceneBoardData)image.src=sceneBoardData;
  const mode=document.getElementById("attackMode");if(mode&&state.attackMode)mode.value=state.attackMode;
  const submitted=Number(state.participant?.lastAction?.phase)===Number(state.phase);
  if(mode)mode.disabled=state.status!=="active"||Boolean(state.attackMode)||Number(state.phase)>0;
  const record=document.querySelector("#commandTools button[onclick=\"setAttackMode()\"]");if(record)record.disabled=state.status!=="active"||Boolean(state.attackMode)||Number(state.phase)>0;
  const first=sides.find(x=>progress.includes(x))||sides[0];if(first)showSideIntel("sideIntel",first,state.sceneSides||sceneSidesData,progress);
}
function renderHostSides(state){
  const sides=Object.keys(state.sceneSides||{});const image=document.getElementById("hostBoard");if(image&&sceneBoardData)image.src=sceneBoardData;
  renderSideButtons("hostSides",sides,state.viewedSides||[],side=>showSideIntel("hostSideIntel",side,state.sceneSides||{},state.viewedSides||[]));
  const first=sides[0];if(first)showSideIntel("hostSideIntel",first,state.sceneSides||{},state.viewedSides||[]);
}
function renderSideButtons(id,sides,viewed,onPick){const el=document.getElementById(id);if(!el)return;el.innerHTML="";sides.forEach(side=>{const b=document.createElement("button");b.className="btn alt side-btn";b.textContent=side+(viewed.includes(side)?" ✓":"");b.setAttribute("aria-pressed","false");b.onclick=()=>{el.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed","false"));b.setAttribute("aria-pressed","true");showSideIntel(id==="hostSides"?"hostSideIntel":"sideIntel",side,sceneSidesData,viewed);onPick(side);};el.appendChild(b);});}
function showSideIntel(id,side,data,viewed){const el=document.getElementById(id);if(el)el.innerHTML="<strong>"+escapeHtml(side)+" side · "+(viewed.includes(side)?"viewed":"not yet recorded")+"</strong><p>"+escapeHtml(data?.[side]||"Review this exterior view and report useful changes.")+"</p>";}
function renderRadio(items){const el=document.getElementById("radioTraffic");if(!el)return;el.textContent=(items||[]).slice().reverse().map(x=>new Date(x.at).toLocaleTimeString()+" — "+(roles[x.role]?.title||x.role)+": "+x.text).join("\n")||"No radio traffic has been recorded yet.";}
function renderHandoff(state){const box=document.getElementById("handoffCard"),text=document.getElementById("handoffText"),actions=document.getElementById("handoffActions");if(!box||!actions)return;const handoff=state.handoff;const show=(role==="engine"&&state.arrivals?.find(x=>x.role==="command")?.onScene)||role==="command";box.classList.toggle("hidden",!show);actions.innerHTML="";text.textContent=handoff?.text||"Incident Command is on scene. Engine 181 can now deliver its size-up, 360, strategy and assignment handoff over the radio.";if(role==="engine"&&!handoff&&show){const b=document.createElement("button");b.className="btn good";b.textContent="Transmit radio handoff to Incident Command";b.onclick=async()=>{try{const d=await api({action:"handoff",code:sessionCode,participantId});renderPlayer(d.state);}catch(e){alert(e.message);}};actions.appendChild(b);}if(role==="command"&&handoff&&!handoff.accepted){const b=document.createElement("button");b.className="btn good";b.textContent="Acknowledge and accept command";b.onclick=async()=>{try{const d=await api({action:"accept-handoff",code:sessionCode,participantId});renderPlayer(d.state);}catch(e){alert(e.message);}};actions.appendChild(b);}if(role==="command"&&handoff?.accepted)text.textContent+="\n\nYou have accepted command. Use your radio picture to direct the incident.";}
function renderArrivalTracker(state){const el=document.getElementById("arrivalTracker");if(!el)return;el.innerHTML="";(state.arrivals||[]).filter(x=>x.role!=="engine").forEach(a=>{const wrap=document.createElement("div");const b=document.createElement("button");b.className="btn "+(a.onScene?"good":"alt");b.textContent=(a.onScene?"On scene · ":"Responding · ")+a.title;if(!a.onScene&&["active","paused"].includes(state.status)){b.onclick=async()=>{try{const d=await api({action:"instructor",code:sessionCode,instructorKey,command:"arrival",targetRole:a.role});renderHost(d.state);}catch(e){alert(e.message);}};}else b.disabled=true;wrap.appendChild(b);el.appendChild(wrap);});}
async function recordDiscovery(side){try{const d=await api({action:"discover",code:sessionCode,participantId,side});renderPlayer(d.state);}catch(e){alert(e.message);}}
async function setAttackMode(){const mode=document.getElementById("attackMode").value;const status=document.getElementById("modeResult");try{const d=await api({action:"mode",code:sessionCode,participantId,mode});status.textContent="Attack mode recorded. Crew decisions will advance the scene automatically.";renderPlayer(d.state);}catch(e){status.textContent="Mode not recorded: "+e.message;}}
async function assignUnit(){const targetRole=document.getElementById("assignmentRole").value;const assignment=document.getElementById("assignmentText").value.trim();const status=document.getElementById("assignmentResult");try{const d=await api({action:"assignment",code:sessionCode,participantId,targetRole,assignment});status.textContent="Assignment sent to "+(roles[targetRole]?.title||targetRole)+". Use the radio to confirm receipt.";document.getElementById("assignmentText").value="";renderPlayer(d.state);}catch(e){status.textContent="Assignment not sent: "+e.message;}}
function renderAssignments(state){const el=document.getElementById("assignmentList");if(!el)return;const list=role==="command"?(state.assignments||[]):(state.assignments||[]).filter(x=>x.role===role);el.innerHTML=list.length?list.slice().reverse().map(x=>'<div class="assignment"><b>'+(role==="command"?escapeHtml(roles[x.role]?.title||x.role):"Your assignment")+'</b><p>'+escapeHtml(x.text)+'</p></div>').join(""):'<p class="muted">No unit assignment has been sent yet.</p>';}
function renderCrew(id,crew){const el=document.getElementById(id);if(!el)return;el.innerHTML=crew.length?crew.map(p=>'<div class="crew"><b>'+escapeHtml(p.name)+'</b> — '+escapeHtml(roles[p.role]?.title||p.role)+'</div>').join(""):'<p class="muted">Waiting for crew members to join.</p>';}
function renderTimeline(id,items){const el=document.getElementById(id);if(el)el.textContent=(items||[]).slice().reverse().map(x=>new Date(x.at).toLocaleTimeString()+" — "+x.text).join("\n");}
function startPolling(host){clearInterval(pollTimer);pollTimer=setInterval(async()=>{try{const qs=new URLSearchParams({code:sessionCode});if(host)qs.set("instructorKey",instructorKey);else qs.set("participantId",participantId);if(!host&&!sceneImageData)qs.set("includeSceneImage","1");const r=await fetch(API+"?"+qs.toString(),{cache:"no-store"});if(!r.ok)return;const state=await r.json();host?renderHost(state):renderPlayer(state);}catch(e){}},2000);}
function setError(t){document.getElementById("entryError").textContent=t;}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
