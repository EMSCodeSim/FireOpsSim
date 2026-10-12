const API="/.netlify/functions/live-crew-session";
const roles = {
  command:{title:"Incident Command"}, engine:{title:"Engine 181 — First-Due"},
  truck:{title:"Truck 182 — Search"}, rit:{title:"RIT 186"}, engine2:{title:"Engine 184 — Second-Due"}
};
let sessionCode="",instructorKey="",participantId="",role="",pollTimer=null;
let injectBusy=false,lastInjectKey="",lastInjectAt=0;
let sceneImageData="",sceneImageAlt="",sceneBoardData="",sceneSidesData={},viewedSidesData=[],scenePhotoUpdates=[],scenePhotoIndex=0;
document.addEventListener("DOMContentLoaded",()=>{setupResponsiveReferences();renderRoleButtons();const q=new URLSearchParams(location.search);if(q.get("code")){showJoin();document.getElementById("joinCode").value=q.get("code").toUpperCase();}});
function setupResponsiveReferences(){const mobile=window.matchMedia("(max-width: 700px)").matches;document.querySelectorAll("#sim details.crew-reference").forEach(section=>{section.open=!mobile;});}
function renderRoleButtons(){const el=document.getElementById("roles");el.innerHTML="";Object.entries(roles).forEach(([k,v])=>{const b=document.createElement("button");b.className="btn alt";b.textContent=v.title;b.onclick=()=>joinSession(k);el.appendChild(b);});}
function showJoin(){document.getElementById("joinBox").classList.remove("hidden");}
async function api(body){const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||"Session service error (HTTP "+r.status+")");return data;}
async function createSession(){setError("");try{const d=await api({action:"create"});sessionCode=d.code;instructorKey=d.instructorKey;cacheSceneImage(d.state);document.getElementById("entry").classList.add("hidden");document.getElementById("lobby").classList.remove("hidden");document.getElementById("instructorPanel").classList.remove("hidden");document.getElementById("sessionCode").textContent=sessionCode;history.replaceState(null,"","?code="+sessionCode);renderHost(d.state);startPolling(true);}catch(e){setError(e.message);}}
async function joinSession(selectedRole){setError("");const code=document.getElementById("joinCode").value.trim().toUpperCase(),name=document.getElementById("name").value.trim();if(!code||!name){setError("Enter the session code and your name/unit first.");return;}try{const d=await api({action:"join",code,name,role:selectedRole});sessionCode=code;participantId=d.participantId;role=selectedRole;cacheSceneImage(d.state);document.getElementById("entry").classList.add("hidden");document.getElementById("sim").classList.remove("hidden");document.getElementById("roleTitle").textContent=roles[role].title;document.getElementById("roleBrief").textContent=d.state.roleBrief||"Follow your assigned role and relay important information by radio.";document.getElementById("roleIntel").textContent=d.state.roleIntel||"Your first role-specific information appears here.";document.getElementById("commandTools").classList.toggle("hidden",role!=="engine");document.getElementById("assignments").classList.remove("hidden");renderPlayer(d.state);startPolling(false);}catch(e){setError(e.message);}}
async function instructorCommand(command){try{const d=await api({action:"instructor",code:sessionCode,instructorKey,command});renderHost(d.state);}catch(e){alert(e.message);}}
async function sendInject(){
  const button=document.getElementById("sendInjectButton");
  const injectId=document.getElementById("injectType").value;
  const customText=document.getElementById("customPrompt").value.trim();
  const targetRole=document.getElementById("injectRole").value;
  const status=document.getElementById("injectResult");
  const target=roles[targetRole]?.title||targetRole;
  const key=targetRole+":"+(customText||injectId);
  const now=Date.now();
  if(injectBusy)return;
  if(customText.length>500){status.textContent="Keep the live prompt to 500 characters or fewer.";return;}
  if(key===lastInjectKey&&now-lastInjectAt<2000){
    status.textContent="That update was just sent to "+target+". Choose another update or wait before sending it again.";
    return;
  }
  injectBusy=true;
  button.disabled=true;
  button.textContent="Sending…";
  status.textContent="Sending private "+(customText?"prompt":"update")+" to "+target+"…";
  try {
    const payload={action:"inject",code:sessionCode,instructorKey,targetRole};
    if(customText)payload.customText=customText;else payload.injectId=injectId;
    const d=await api(payload);
    lastInjectKey=key;
    lastInjectAt=Date.now();
    document.getElementById("customPrompt").value="";
    status.textContent="Private "+(customText?"prompt":"update")+" sent to "+target+".";
    renderHost(d.state);
  } catch(e) {
    status.textContent="Update not sent: "+e.message;
  } finally {
    injectBusy=false;
    button.disabled=false;
    button.textContent="Send private prompt / update";
  }
}
async function choose(choice){try{const d=await api({action:"participant",code:sessionCode,participantId,choice});renderPlayer(d.state);}catch(e){alert(e.message);}}
async function confirmRadio(){try{const d=await api({action:"confirm-radio",code:sessionCode,participantId});renderPlayer(d.state);}catch(e){alert(e.message);}}
async function acknowledgeRadio(){try{const d=await api({action:"acknowledge-radio",code:sessionCode,participantId});renderPlayer(d.state);}catch(e){alert(e.message);}}
async function respondToRadio(targetParticipantId,response){try{const d=await api({action:"command-response",code:sessionCode,participantId,targetParticipantId,response});renderPlayer(d.state);}catch(e){alert(e.message);}}
function renderDecisionControls(container,state,event){
  container.innerHTML="";
  if(state.status==="lobby"){container.innerHTML='<p class="muted">Waiting for the instructor to start the incident.</p>';return;}
  if(state.status==="paused"){container.innerHTML='<p class="muted">Scenario paused by instructor.</p>';return;}
  if(state.status==="ended"){container.innerHTML='<p class="muted">Scenario ended. Keep your phone available for the AAR.</p>';return;}
  if(role==="command"&&state.onScene&&!state.handoff?.accepted){container.innerHTML='<p class="muted">On scene. Engine 181 is acting lead; receive and accept the radio handoff before directing units.</p>';return;}
  const action=state.participant?.lastAction;
  const current=Number(action?.phase)===Number(state.phase);
  const stage=current?(action.stage||"complete"):"needs-decision";
  if(stage==="decision"){
    container.innerHTML='<div class="radio-step"><h3>Radio report required</h3><p>Use the department radio. Include your location, conditions, need, and intended action when they apply.</p><p class="muted">The app does not send or display your message.</p><button class="btn good" type="button">I transmitted the radio report</button></div>';
    container.querySelector("button").onclick=confirmRadio;return;
  }
  if(stage==="awaiting-command"){
    container.innerHTML='<div class="radio-step waiting"><h3>Monitor the radio</h3><p>Your transmission is recorded. Wait for the incident lead to answer over the department radio.</p></div>';return;
  }
  if(stage==="awaiting-ack"){
    container.innerHTML='<div class="radio-step"><h3>Command response received</h3><p><b>'+escapeHtml(action.commandResponse||"Direction was given over the radio")+'</b></p><p>Acknowledge the direction over the department radio, then record the acknowledgement.</p><button class="btn good" type="button">I acknowledged over the radio</button></div>';
    container.querySelector("button").onclick=acknowledgeRadio;return;
  }
  if(stage==="complete"){
    container.innerHTML='<div class="radio-step complete"><h3>Communication loop complete</h3><p>Decision, radio report, Command response, and acknowledgement are recorded. Continue operating and monitor the radio.</p></div>';return;
  }
  (event[2]||[]).forEach(choice=>{const b=document.createElement("button");b.className="btn";b.textContent=choice;b.onclick=()=>choose(choice);container.appendChild(b);});
}
async function submitForecast(choice,host){
  try{
    const payload={action:"forecast",code:sessionCode,choice};
    if(host)payload.instructorKey=instructorKey;else payload.participantId=participantId;
    const d=await api(payload);
    if(host)renderHost(d.state);else renderPlayer(d.state);
  }catch(e){const status=document.getElementById(host?"hostForecastStatus":"playerForecastStatus");if(status)status.textContent="Forecast not saved: "+e.message;}
}
function renderForecastPanel(id,options,current,status,host){
  const panel=document.getElementById(id);if(!panel)return;
  const buttons=panel.querySelector(".forecast-options");if(!buttons)return;
  buttons.innerHTML="";
  (options||[]).forEach(choice=>{
    const b=document.createElement("button");b.className="btn alt forecast-choice";b.textContent=choice;
    b.setAttribute("aria-pressed",String(current?.text===choice));
    b.disabled=status!=="active";b.onclick=()=>submitForecast(choice,host);buttons.appendChild(b);
  });
  const result=panel.querySelector(".forecast-current");
  if(result)result.textContent=current?.text?"Your current read: "+current.text:"No forecast recorded yet. Update it as the radio picture changes.";
}
function renderHostForecasts(state){
  renderForecastPanel("hostForecasts",state.forecastOptions,state.forecast,state.status,true);
  const list=document.getElementById("hostForecastList");if(!list)return;
  const labels={instructor:"Instructor",command:"Incident Command",engine:"Engine 181",truck:"Truck 182",rit:"RIT 186",engine2:"Engine 184"};
  list.innerHTML=(state.forecasts||[]).filter(x=>x.role!=="instructor").map(x=>"<p><b>"+escapeHtml(labels[x.role]||x.role)+"</b>: "+escapeHtml(x.text)+"</p>").join("")||'<p class="muted">Role predictions will appear here as crews submit them.</p>';
}
function branchText(state,text){if(state.branch==="reinforced-attack"&&role==="engine")return text+" A second line is moving toward your division and fire growth is slowing.";if(state.branch==="withdrawal")return "Command has selected withdrawal. Use the department radio and accountability process to confirm your crew's movement and status.";return text;}
function visualFor(state,r){return state.scene || ["Incident briefing","Awaiting information","Follow your assignment and use department radios."];}
function cacheSceneImage(state){const image=state?.sceneImage;if(image?.dataUrl){sceneImageData=image.dataUrl;sceneImageAlt=image.alt||"Assigned role scene view";}if(Array.isArray(state?.scenePhotos)&&state.scenePhotos.length&&state.scenePhotos[0]?.dataUrl){if(scenePhotoUpdates[0]?.dataUrl!==state.scenePhotos[0].dataUrl){scenePhotoUpdates=state.scenePhotos;scenePhotoIndex=0;}}if(state?.sceneBoard)sceneBoardData=state.sceneBoard;if(state?.sceneSides)sceneSidesData=state.sceneSides;viewedSidesData=state?.viewedSides||[];}
function renderScene(id,state,r){
  const el=document.getElementById(id);
  if(!el)return;
  const v=visualFor(state,r);
  const cls=state.branch==="reinforced-attack"?"branch-good":state.branch==="delayed-reinforcement"?"branch-bad":state.branch==="withdrawal"?"branch-withdraw":"";
  const photo=sceneImageData?'<img class="scene-photo" src="'+escapeHtml(sceneImageData)+'" alt="'+escapeHtml(sceneImageAlt)+'">':"";
  const sizeup=state.sceneSizeup||"Review the photos and radio traffic. Separate what you observe from what you infer.";
  const current=scenePhotoUpdates[scenePhotoIndex]||scenePhotoUpdates[0];
  const gallery=current?'<section class="photo-gallery" aria-label="Private role photo evidence"><div class="photo-gallery-title">Private photo evidence</div><img id="sceneEvidencePhoto" class="scene-evidence" src="'+escapeHtml(current.dataUrl)+'" alt="'+escapeHtml(current.alt)+'"><div class="photo-tabs">'+scenePhotoUpdates.map((item,index)=>'<button class="photo-tab" type="button" aria-pressed="'+String(index===scenePhotoIndex)+'" onclick="showScenePhoto('+index+')">Photo '+(index+1)+'</button>').join("")+'</div><p class="photo-question">What do you directly observe? What are you inferring? What would you confirm or radio?</p></section>':"";
  el.className="card scene "+cls;
  el.innerHTML='<div class="scene-visual">'+photo+'<div class="scene-copy"><div class="tag">Assigned role view</div><div class="scene-state">'+escapeHtml(v[0])+'</div><h2>'+escapeHtml(v[1])+'</h2></div></div>'+gallery+'<div class="scene-caption"><strong>Your scene read</strong><p>'+escapeHtml(sizeup)+'</p><p>'+escapeHtml(v[2])+'</p></div>';
}
function showScenePhoto(index){const photo=scenePhotoUpdates[index];if(!photo)return;scenePhotoIndex=index;const image=document.getElementById("sceneEvidencePhoto");if(image){image.src=photo.dataUrl;image.alt=photo.alt;}document.querySelectorAll(".photo-tab").forEach((button,i)=>button.setAttribute("aria-pressed",String(i===index)));}
function renderPlayer(state){cacheSceneImage(state);document.getElementById("roleBrief").textContent=role==="engine2"&&(state.onScene||state.event?.[0]==="On-scene assignment")?"Engine 184 has arrived. Compare the approach, hydrant, driveway, and side-entry photos. What support appears useful? Confirm the assignment with the acting lead.":(state.roleBrief||"Follow your assigned role and relay important details by radio.");document.getElementById("roleIntel").textContent=state.roleIntel||"";document.getElementById("arrivalStatus").textContent=state.onScene?"ON SCENE — role view available":"RESPONDING — dispatch and radio traffic only; scene photo unlocks on arrival";document.getElementById("playerStatus").textContent=state.status.toUpperCase();document.getElementById("syncState").textContent="Synced "+new Date().toLocaleTimeString();const e=state.event || ["Awaiting instructor","Wait for the instructor to start the scenario.",[]];renderScene("playerScene",state,role);document.getElementById("eventTitle").textContent=e[0];document.getElementById("eventText").textContent=branchText(state,e[1]);const inbox=document.getElementById("injectInbox");
inbox.innerHTML=(state.injects||[]).map(x=>'<div class="card private"><b>Instructor update</b><p>'+escapeHtml(x.text)+'</p></div>').join("");
renderCommandTools(state);renderAssignments(state);renderHandoff(state);renderRadio(state.radioTraffic);renderForecastPanel("playerForecast",state.forecastOptions,state.forecast,state.status,false);const c=document.getElementById("choices");renderDecisionControls(c,state,e);renderTimeline("timeline",state.timeline);}
function renderRoleControlPanel(state){
  const el=document.getElementById("roleStatusPanel");if(!el)return;
  const order=["engine","truck","rit","engine2","command"];
  const arrivals=state.arrivals||[];
  const crew=state.participants||[];
  const occupied=new Set(crew.map(p=>p.role));
  el.innerHTML=order.map(role=>{
    const title=roles[role]?.title||role;
    const participant=crew.find(p=>p.role===role);
    const arrival=arrivals.find(a=>a.role===role);
    const onScene=Boolean(participant?.onScene||arrival?.onScene);
    const phaseAction=participant?.lastAction;
    const current=Boolean(phaseAction&&Number(phaseAction.phase)===Number(state.phase));
    const stage=current?(phaseAction.stage||"complete"):"needs-decision";
    const stageLabels={"needs-decision":"Needs decision","decision":"Decision made · radio report needed","awaiting-command":"Report sent · Command response needed","awaiting-ack":"Direction given · crew acknowledgement needed","complete":"Communication loop complete"};
    const phaseText=state.status==="lobby"?"Waiting to start":!participant?"Role unfilled":!onScene?"Responding · radio only":stageLabels[stage]||"Needs action";
    const choice=current?phaseAction.choice:"";
    const done=stage==="complete";
    const actionLine='<div class="role-action-cell"><span class="master-label">Current phase</span><span class="'+(done?"role-action-done":participant&&onScene&&state.status==="active"?"role-action-needed":"muted")+'">'+(done?"✓ ":"")+escapeHtml(phaseText)+'</span>'+(choice?'<small class="muted">'+escapeHtml(choice)+'</small>':"")+'</div>';
    let controls='<div class="reassign-control muted">—</div>';
    if(participant){
      const targets=order.filter(target=>target!==role&&!occupied.has(target));
      const select='<select class="field reassign-select" aria-label="Reassign '+escapeHtml(participant.name)+' from '+escapeHtml(title)+'">'+
        '<option value="">Move to open role</option>'+targets.map(target=>'<option value="'+target+'">'+escapeHtml(roles[target]?.title||target)+'</option>').join("")+
        '</select>';
      controls='<div class="reassign-control">'+select+'<button type="button" class="btn alt reassign-role" '+(targets.length&&state.status!=="ended"?"":"disabled")+'>Move role</button></div>';
    }
    const arrivalText=state.status==="lobby"?"Lobby":onScene?"On scene":"Responding";
    return '<div class="role-control-row"><div><span class="master-label">Role</span><div class="role-cell-title">'+escapeHtml(title)+'</div></div><div><span class="master-label">Assigned firefighter</span><div>'+escapeHtml(participant?.name||"Unfilled")+'</div></div><div><span class="master-label">Arrival</span><div>'+escapeHtml(arrivalText)+'</div></div>'+actionLine+'<div><span class="master-label">Change assignment</span>'+controls+'</div></div>';
  }).join("");
  el.querySelectorAll(".reassign-role").forEach(button=>{button.onclick=async()=>{
    const row=button.closest(".role-control-row");
    const select=row?.querySelector(".reassign-select");
    const targetRole=select?.value;
    const roleName=row?.querySelector(".role-cell-title")?.textContent||"participant";
    const participant=crew.find(p=>p.role===order.find(role=>(roles[role]?.title||role)===roleName));
    if(!participant||!targetRole)return;
    const status=document.getElementById("roleControlResult");
    button.disabled=true;status.textContent="Reassigning "+participant.name+"…";
    try{const d=await api({action:"instructor",code:sessionCode,instructorKey,command:"reassign",participantId:participant.id,targetRole});status.textContent=participant.name+" moved to "+(roles[targetRole]?.title||targetRole)+". Their new private role view will follow its arrival status.";renderHost(d.state);}
    catch(e){status.textContent="Role not changed: "+e.message;}
  };});
}
function renderHost(state){cacheSceneImage(state);renderArrivalTracker(state);renderRoleControlPanel(state);document.getElementById("hostStatus").textContent=state.status.toUpperCase();document.getElementById("hostPhase").textContent=(Number(state.phase||0)+1)+" / 5";document.getElementById("hostBranch").textContent=state.branch;document.getElementById("hostProgress").textContent=`Communication loops complete: ${state.actionProgress?.completed||0}/${state.actionProgress?.total||0}. Decisions made: ${state.actionProgress?.acted||0}/${state.actionProgress?.total||0}. The phase advances after each arrived role completes its radio report, lead response, and acknowledgement. Required 360, strategy, and handoff gates still apply.`;renderHostSides(state);renderScene("hostScene",state,"command");renderCrew("hostCrew",state.participants);renderCrew("lobbyCrew",state.participants);renderHostForecasts(state);renderTimeline("hostTimeline",state.timeline);if(state.status!=="lobby")document.getElementById("lobby").classList.add("hidden");}
function renderPendingRadioReports(state){
  const panel=document.getElementById("pendingRadioReports"),list=document.getElementById("pendingRadioList");
  if(!panel||!list)return;
  const reports=state.radioProtocol?.pendingReports||[];
  panel.classList.toggle("hidden",!state.canDirect);
  if(!state.canDirect)return;
  if(!reports.length){list.innerHTML='<p class="muted">No crew radio reports are waiting for a response.</p>';return;}
  list.innerHTML="";
  reports.forEach(report=>{
    const item=document.createElement("div");item.className="radio-step waiting";
    item.innerHTML='<h4>'+escapeHtml(roles[report.role]?.title||report.role)+'</h4><p>'+escapeHtml(report.name)+' confirmed a radio report. Use what you actually heard on the department radio.</p><div class="radio-response-grid"></div>';
    const grid=item.querySelector(".radio-response-grid");
    (state.radioProtocol?.responseOptions||[]).forEach(response=>{const b=document.createElement("button");b.type="button";b.className="btn alt";b.textContent=response;b.onclick=()=>respondToRadio(report.participantId,response);grid.appendChild(b);});
    list.appendChild(item);
  });
}
function renderCommandTools(state){
  renderPendingRadioReports(state);
  const panel=document.getElementById("commandTools");if(!panel)return;const hasControl=role==="engine"||(role==="command"&&state.handoff?.accepted);panel.classList.toggle("hidden",!hasControl);if(!hasControl)return;const firstDue=document.getElementById("firstDueTools");if(firstDue)firstDue.classList.toggle("hidden",role!=="engine");const tag=panel.querySelector(".tag");if(tag)tag.textContent=role==="engine"?"Engine 181 — acting lead":"Incident Command — tactical control";const heading=document.getElementById("assignmentToolsHeading");if(heading)heading.textContent=role==="engine"?"Assign a unit":"Direct a unit";
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
