const API="/.netlify/functions/live-crew-session";
const STORAGE_KEY="fireopssim-live-crew-session";
const roles = {
  command:{title:"Incident Command"}, engine:{title:"Engine 181 — First-Due"},
  truck:{title:"Truck 182 — Search"}, rit:{title:"RIT 186"}, engine2:{title:"Engine 184 — Second-Due"}
};
let sessionCode="",instructorKey="",participantId="",role="",pollTimer=null,isHost=false;
let injectBusy=false,unexpectedBusy=false,lastInjectKey="",lastInjectAt=0;
let sceneImageData="",sceneImageAlt="",sceneBoardData="",sceneSidesData={},viewedSidesData=[],scenePhotoUpdates=[],scenePhotoIndex=0,sceneRoleCached="";
document.addEventListener("DOMContentLoaded",()=>{
  setupResponsiveReferences();
  window.matchMedia("(max-width: 700px)").addEventListener("change",setupResponsiveReferences);
  renderRoleButtons();
  const q=new URLSearchParams(location.search);
  if(q.get("code")){showJoin();document.getElementById("joinCode").value=q.get("code").toUpperCase();}
  restoreSession();
});
function setupResponsiveReferences(){
  const mobile=window.matchMedia("(max-width: 700px)").matches;
  document.querySelectorAll("#sim details.crew-reference").forEach(section=>{section.open=!mobile;});
  document.querySelectorAll("#sim details.scene-reference").forEach(section=>{if(mobile && !section.dataset.userToggled) section.open=false;});
}
function saveSession(){
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify({
      sessionCode,instructorKey,participantId,role,isHost,savedAt:Date.now()
    }));
  }catch(e){}
}
function clearSession(){try{localStorage.removeItem(STORAGE_KEY);}catch(e){}}
async function restoreSession(){
  let saved=null;
  try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");}catch(e){return;}
  if(!saved?.sessionCode||Date.now()-(saved.savedAt||0)>1000*60*60*12)return;
  sessionCode=saved.sessionCode;instructorKey=saved.instructorKey||"";participantId=saved.participantId||"";role=saved.role||"";isHost=Boolean(saved.isHost);
  try{
    const qs=new URLSearchParams({code:sessionCode,includeSceneImage:"1"});
    if(isHost&&instructorKey)qs.set("instructorKey",instructorKey);
    else if(participantId)qs.set("participantId",participantId);
    else return;
    const r=await fetch(API+"?"+qs.toString(),{cache:"no-store"});
    if(!r.ok){clearSession();return;}
    const state=await r.json();
    document.getElementById("entry").classList.add("hidden");
    if(isHost){
      document.getElementById("lobby").classList.toggle("hidden",state.status!=="lobby");
      document.getElementById("instructorPanel").classList.remove("hidden");
      document.getElementById("sessionCode").textContent=sessionCode;
      history.replaceState(null,"","?code="+sessionCode);
      cacheSceneImage(state,true);
      renderHost(state);startPolling(true);
    }else{
      role=state.participant?.role||role;
      document.getElementById("sim").classList.remove("hidden");
      document.getElementById("roleTitle").textContent=roles[role]?.title||role;
      cacheSceneImage(state,true);
      renderPlayer(state);startPolling(false);
    }
  }catch(e){clearSession();}
}
function renderRoleButtons(){const el=document.getElementById("roles");el.innerHTML="";Object.entries(roles).forEach(([k,v])=>{const b=document.createElement("button");b.className="btn alt";b.textContent=v.title;b.onclick=()=>joinSession(k);el.appendChild(b);});}
function showJoin(){document.getElementById("joinBox").classList.remove("hidden");}
async function api(body){const r=await fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||"Session service error (HTTP "+r.status+")");return data;}
async function createSession(){setError("");try{const d=await api({action:"create"});sessionCode=d.code;instructorKey=d.instructorKey;participantId="";role="";isHost=true;cacheSceneImage(d.state,true);document.getElementById("entry").classList.add("hidden");document.getElementById("lobby").classList.remove("hidden");document.getElementById("instructorPanel").classList.remove("hidden");document.getElementById("sessionCode").textContent=sessionCode;history.replaceState(null,"","?code="+sessionCode);saveSession();renderHost(d.state);startPolling(true);}catch(e){setError(e.message);}}
async function joinSession(selectedRole){setError("");const code=document.getElementById("joinCode").value.trim().toUpperCase(),name=document.getElementById("name").value.trim();if(!code||!name){setError("Enter the session code and your name/unit first.");return;}try{const d=await api({action:"join",code,name,role:selectedRole});sessionCode=code;participantId=d.participantId;role=selectedRole;isHost=false;instructorKey="";cacheSceneImage(d.state,true);document.getElementById("entry").classList.add("hidden");document.getElementById("sim").classList.remove("hidden");document.getElementById("roleTitle").textContent=roles[role].title;document.getElementById("roleBrief").textContent=d.state.roleBrief||"Follow your assigned role and relay important information by radio.";document.getElementById("roleIntel").textContent=d.state.roleIntel||"Your first role-specific information appears here.";document.getElementById("commandTools").classList.toggle("hidden",role!=="engine");document.getElementById("assignments").classList.remove("hidden");saveSession();renderPlayer(d.state);startPolling(false);}catch(e){setError(e.message);}}
async function instructorCommand(command,extra={}){try{const d=await api({action:"instructor",code:sessionCode,instructorKey,command,...extra});renderHost(d.state);}catch(e){alert(e.message);}}
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
  injectBusy=true;button.disabled=true;button.textContent="Sending…";
  status.textContent="Sending private "+(customText?"prompt":"update")+" to "+target+"…";
  try {
    const payload={action:"inject",code:sessionCode,instructorKey,targetRole};
    if(customText)payload.customText=customText;else payload.injectId=injectId;
    const d=await api(payload);
    lastInjectKey=key;lastInjectAt=Date.now();
    document.getElementById("customPrompt").value="";
    status.textContent="Private "+(customText?"prompt":"update")+" sent to "+target+".";
    renderHost(d.state);
  } catch(e) {status.textContent="Update not sent: "+e.message;}
  finally {injectBusy=false;button.disabled=false;button.textContent="Send private prompt / update";}
}
async function sendUnexpectedAction(){
  const status=document.getElementById("unexpectedResult");
  const button=document.getElementById("unexpectedButton");
  if(unexpectedBusy)return;
  const targetRole=document.getElementById("unexpectedRole").value;
  const category=document.getElementById("unexpectedCategory").value;
  const consequence=document.getElementById("unexpectedConsequence").value.trim();
  const shareWith=document.getElementById("unexpectedShare").value;
  const changeBranch=document.getElementById("unexpectedChangeBranch").checked;
  const branch=document.getElementById("unexpectedBranch").value;
  const communicationSatisfied=document.getElementById("unexpectedCommSatisfied").checked;
  if(!consequence){status.textContent="Enter a short private or shared consequence.";return;}
  unexpectedBusy=true;button.disabled=true;button.textContent="Recording…";status.textContent="Recording unexpected action…";
  try{
    const d=await api({action:"instructor",code:sessionCode,instructorKey,command:"unexpected",targetRole,category,consequence,shareWith,changeBranch,branch,communicationSatisfied});
    document.getElementById("unexpectedConsequence").value="";
    status.textContent="Unexpected action recorded for "+(roles[targetRole]?.title||targetRole)+".";
    renderHost(d.state);
  }catch(e){status.textContent="Not recorded: "+e.message;}
  finally{unexpectedBusy=false;button.disabled=false;button.textContent="Record unexpected action";}
}
async function recordBenchmark(){
  const note=document.getElementById("benchmarkNote").value.trim();
  const status=document.getElementById("benchmarkResult");
  try{
    const d=await api({action:"instructor",code:sessionCode,instructorKey,command:"benchmark",note});
    document.getElementById("benchmarkNote").value="";
    status.textContent="Benchmark recorded.";
    renderHost(d.state);
  }catch(e){status.textContent="Benchmark not saved: "+e.message;}
}
async function choose(choice){try{const d=await api({action:"participant",code:sessionCode,participantId,choice});renderPlayer(d.state);}catch(e){alert(e.message);}}
async function confirmRadio(){try{const d=await api({action:"confirm-radio",code:sessionCode,participantId});renderPlayer(d.state);}catch(e){alert(e.message);}}
async function acknowledgeRadio(){try{const d=await api({action:"acknowledge-radio",code:sessionCode,participantId});renderPlayer(d.state);}catch(e){alert(e.message);}}
async function respondToRadio(targetParticipantId,response){
  try{
    const payload={action:"command-response",code:sessionCode,targetParticipantId,response};
    if(isHost)payload.instructorKey=instructorKey;else payload.participantId=participantId;
    const d=await api(payload);
    if(isHost)renderHost(d.state);else renderPlayer(d.state);
  }catch(e){alert(e.message);}
}
function stageLabel(stage){
  return ({
    "needs-decision":"Needs decision",
    "decision":"Radio report required",
    "awaiting-command":"Waiting for incident lead",
    "awaiting-ack":"Acknowledgement required",
    "complete":"Communication loop complete"
  })[stage]||stage;
}
function renderDecisionControls(container,state,event){
  container.innerHTML="";
  if(state.status==="lobby"){container.innerHTML='<p class="muted">Waiting for the instructor to start the incident.</p>';return;}
  if(state.status==="paused"){container.innerHTML='<p class="muted">Scenario paused by instructor.</p>';return;}
  if(state.status==="ended"){container.innerHTML='<p class="muted">Scenario ended. Keep your phone available for the AAR.</p>';return;}
  if(role==="command"&&state.onScene&&!state.handoff?.accepted&&state.leaderRole!=="command"){container.innerHTML='<div class="radio-step waiting"><h3>Waiting to accept command</h3><p>On scene. Engine 181 is acting lead. Receive the radio handoff, then accept command before directing units.</p></div>';return;}
  const action=state.participant?.lastAction;
  const current=Number(action?.phase)===Number(state.phase);
  const stage=current?(action.stage||"complete"):"needs-decision";
  if(stage==="decision"){
    container.innerHTML='<div class="radio-step urgent"><h3>Radio report required</h3><p>Communicate your location, conditions, needs, and intended action when applicable.</p><p class="muted">Do not type a scripted message. The app does not send your radio traffic to other phones.</p><button class="btn good" type="button">I transmitted the radio report</button></div>';
    container.querySelector("button").onclick=confirmRadio;return;
  }
  if(stage==="awaiting-command"){
    container.innerHTML='<div class="radio-step waiting"><h3>Waiting for Command</h3><p>Your transmission is recorded as a milestone only. Listen on the department radio for the incident lead’s reply.</p></div>';return;
  }
  if(stage==="awaiting-ack"){
    container.innerHTML='<div class="radio-step urgent"><h3>Acknowledge over the radio</h3><p>Incident lead response recorded: <b>'+escapeHtml(action.commandResponse||"Direction was given over the radio")+'</b></p><p>Acknowledge the direction on the department radio, then tap below.</p><button class="btn good" type="button">I acknowledged over the radio</button></div>';
    container.querySelector("button").onclick=acknowledgeRadio;return;
  }
  if(stage==="complete"){
    container.innerHTML='<div class="radio-step complete"><h3>Communication loop complete</h3><p>Decision, radio report, lead response, and acknowledgement are recorded. Continue operating and monitor the radio.</p></div>';return;
  }
  const intro=document.createElement("p");intro.className="muted";intro.textContent="Choose your next action from the evidence you have. A radio report will be required after you decide.";
  container.appendChild(intro);
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
function visualFor(state){return state.scene || ["Incident briefing","Awaiting information","Follow your assignment and use department radios."];}
function cacheSceneImage(state,force=false){
  const image=state?.sceneImage;
  const roleKey=state?.participant?.role||(isHost?"instructor":role)||"";
  if(force||roleKey!==sceneRoleCached){sceneImageData="";scenePhotoUpdates=[];scenePhotoIndex=0;sceneRoleCached=roleKey;}
  if(image?.dataUrl){sceneImageData=image.dataUrl;sceneImageAlt=image.alt||"Assigned role scene view";}
  if(Array.isArray(state?.scenePhotos)&&state.scenePhotos.length&&state.scenePhotos[0]?.dataUrl){
    if(force||scenePhotoUpdates[0]?.dataUrl!==state.scenePhotos[0].dataUrl){scenePhotoUpdates=state.scenePhotos;scenePhotoIndex=0;}
  }
  if(state?.sceneBoard)sceneBoardData=state.sceneBoard;
  if(state?.sceneSides)sceneSidesData=state.sceneSides;
  viewedSidesData=state?.viewedSides||[];
}
function renderScene(id,state){
  const el=document.getElementById(id);
  if(!el)return;
  const v=visualFor(state);
  const cls=state.branch==="reinforced-attack"?"branch-good":state.branch==="delayed-reinforcement"?"branch-bad":state.branch==="withdrawal"?"branch-withdraw":"";
  const photo=sceneImageData?'<img class="scene-photo" src="'+escapeHtml(sceneImageData)+'" alt="'+escapeHtml(sceneImageAlt)+'">':"";
  const sizeup=state.sceneSizeup||"Review the photos and radio traffic. Separate what you observe from what you infer.";
  const prompt=state.photoPrompt||"What can you directly observe? What are you inferring? What should you confirm? What information should Command receive?";
  const current=scenePhotoUpdates[scenePhotoIndex]||scenePhotoUpdates[0];
  const gallery=current?'<section class="photo-gallery" aria-label="Private role photo evidence"><div class="photo-gallery-title">Private photo evidence</div><img id="sceneEvidencePhoto" class="scene-evidence" src="'+escapeHtml(current.dataUrl)+'" alt="'+escapeHtml(current.alt)+'"><div class="photo-tabs">'+scenePhotoUpdates.map((item,index)=>'<button class="photo-tab" type="button" aria-pressed="'+String(index===scenePhotoIndex)+'" onclick="showScenePhoto('+index+')">Photo '+(index+1)+'</button>').join("")+'</div><p class="photo-question">'+escapeHtml(prompt)+'</p></section>':"";
  el.className="card scene "+cls;
  const openAttr=window.matchMedia("(max-width: 700px)").matches?"":" open";
  el.innerHTML='<details class="scene-reference"'+openAttr+'><summary class="scene-summary"><span class="tag">Assigned role view</span> <span class="scene-state">'+escapeHtml(v[0])+'</span> — '+escapeHtml(v[1])+'</summary><div class="scene-visual">'+photo+'</div>'+gallery+'<div class="scene-caption"><strong>Your scene read</strong><p>'+escapeHtml(sizeup)+'</p><p>'+escapeHtml(v[2])+'</p></div></details>';
  const details=el.querySelector("details");
  if(details)details.addEventListener("toggle",()=>{details.dataset.userToggled="1";},{once:true});
}
function showScenePhoto(index){const photo=scenePhotoUpdates[index];if(!photo)return;scenePhotoIndex=index;const image=document.getElementById("sceneEvidencePhoto");if(image){image.src=photo.dataUrl;image.alt=photo.alt;}document.querySelectorAll(".photo-tab").forEach((button,i)=>button.setAttribute("aria-pressed",String(i===index)));}
function renderTaskStatus(state){
  const bar=document.getElementById("taskStatusBar");if(!bar)return;
  const action=state.participant?.lastAction;
  const current=Number(action?.phase)===Number(state.phase);
  const stage=current?(action.stage||"complete"):"needs-decision";
  const arrival=state.onScene?"ON SCENE":"RESPONDING";
  const lead=state.leaderRole==="command"?"Incident Command":"Engine 181 (acting)";
  bar.innerHTML='<div class="task-chip"><span class="master-label">Arrival</span><strong>'+arrival+'</strong></div>'+
    '<div class="task-chip"><span class="master-label">Assignment</span><strong>'+escapeHtml(roles[role]?.title||role)+'</strong></div>'+
    '<div class="task-chip '+(stage==="complete"?"done":"needed")+'"><span class="master-label">Comms loop</span><strong>'+escapeHtml(stageLabel(stage))+'</strong></div>'+
    '<div class="task-chip"><span class="master-label">Incident lead</span><strong>'+escapeHtml(lead)+'</strong></div>';
  const next=document.getElementById("nextStepHint");
  if(next)next.textContent=state.nextStepHint||state.listenFor||"";
}
function renderPlayer(state){
  cacheSceneImage(state);
  document.getElementById("roleBrief").textContent=role==="engine2"&&(state.onScene||state.event?.[0]==="On-scene assignment")?"Engine 184 has arrived. Compare the approach, hydrant, driveway, and side-entry photos. What support appears useful? Confirm the assignment with the acting lead.":(state.roleBrief||"Follow your assigned role and relay important details by radio.");
  document.getElementById("roleIntel").textContent=state.roleIntel||"";
  document.getElementById("arrivalStatus").textContent=state.onScene?"ON SCENE — private role view available":"RESPONDING — dispatch and radio traffic only; scene photos unlock on arrival";
  document.getElementById("playerStatus").textContent=state.status.toUpperCase();
  document.getElementById("syncState").textContent="Synced "+new Date().toLocaleTimeString();
  const listen=document.getElementById("listenFor");
  if(listen)listen.textContent=state.listenFor||"";
  renderTaskStatus(state);
  const e=state.event || ["Awaiting instructor","Wait for the instructor to start the scenario.",[]];
  document.getElementById("eventTitle").textContent=e[0];
  document.getElementById("eventText").textContent=branchText(state,e[1]);
  const inbox=document.getElementById("injectInbox");
  inbox.innerHTML=(state.injects||[]).map(x=>'<div class="card private"><b>Private instructor update</b><p>'+escapeHtml(x.text)+'</p></div>').join("");
  renderDecisionControls(document.getElementById("choices"),state,e);
  renderScene("playerScene",state);
  renderCommandTools(state);
  renderAssignments(state);
  renderHandoff(state);
  renderRadio(state.radioTraffic);
  renderForecastPanel("playerForecast",state.forecastOptions,state.forecast,state.status,false);
  renderTimeline("timeline",state.timeline);
  saveSession();
}
function renderRoleControlPanel(state){
  const el=document.getElementById("roleStatusPanel");if(!el)return;
  const order=["engine","truck","rit","engine2","command"];
  const arrivals=state.arrivals||[];
  const crew=state.roleStatuses||state.participants||[];
  const occupied=new Set((state.participants||[]).map(p=>p.role));
  el.innerHTML=order.map(roleKey=>{
    const title=roles[roleKey]?.title||roleKey;
    const participant=crew.find(p=>p.role===roleKey);
    const arrival=arrivals.find(a=>a.role===roleKey);
    const onScene=Boolean(participant?.onScene||arrival?.onScene);
    const stage=participant?.stage||((participant?.lastAction&&Number(participant.lastAction.phase)===Number(state.phase))?(participant.lastAction.stage||"complete"):"needs-decision");
    const phaseText=state.status==="lobby"?"Waiting to start":!participant?"Role unfilled":!onScene?"Responding · radio only":stageLabel(stage);
    const choice=(participant?.lastAction&&Number(participant.lastAction.phase)===Number(state.phase))?participant.lastAction.choice:"";
    const assignment=participant?.assignment||"";
    const done=stage==="complete";
    const stalled=Boolean(participant?.stalled);
    const actionLine='<div class="role-action-cell"><span class="master-label">Communication loop</span><span class="'+(done?"role-action-done":stalled?"role-action-stalled":participant&&onScene&&state.status==="active"?"role-action-needed":"muted")+'">'+(stalled?"⚠ STALLED · ":"")+(done?"✓ ":"")+escapeHtml(phaseText)+'</span>'+(choice?'<small class="muted">Last decision: '+escapeHtml(choice)+'</small>':"")+(assignment?'<small class="muted">Assignment: '+escapeHtml(assignment)+'</small>':"")+'</div>';
    let controls='<div class="reassign-control muted">—</div>';
    if(participant){
      const targets=order.filter(target=>target!==roleKey&&!occupied.has(target));
      const select='<select class="field reassign-select" data-participant-id="'+escapeHtml(participant.id)+'" aria-label="Reassign '+escapeHtml(participant.name)+' from '+escapeHtml(title)+'">'+
        '<option value="">Move to open role</option>'+targets.map(target=>'<option value="'+target+'">'+escapeHtml(roles[target]?.title||target)+'</option>').join("")+
        '</select>';
      const override='<select class="field override-select" aria-label="Override loop for '+escapeHtml(participant.name)+'"><option value="">Loop override</option><option value="complete">Force complete</option><option value="missed-radio">Record missed radio / continue</option><option value="reset">Reset loop</option></select>';
      controls='<div class="reassign-control">'+select+'<button type="button" class="btn alt reassign-role" '+(targets.length&&state.status!=="ended"?"":"disabled")+'>Move role</button>'+override+'<button type="button" class="btn warn override-loop" '+(state.status==="ended"?"disabled":"")+'>Apply override</button></div>';
    }
    const arrivalText=state.status==="lobby"?"Lobby":onScene?"On scene":"Responding";
    const leadMark=state.leaderRole===roleKey?' <span class="lead-badge">LEAD</span>':"";
    return '<div class="role-control-row'+(stalled?" stalled":"")+'" data-role="'+roleKey+'"><div><span class="master-label">Role</span><div class="role-cell-title">'+escapeHtml(title)+leadMark+'</div></div><div><span class="master-label">Assigned firefighter</span><div>'+escapeHtml(participant?.name||"Unfilled")+'</div></div><div><span class="master-label">Arrival</span><div>'+escapeHtml(arrivalText)+'</div></div>'+actionLine+'<div><span class="master-label">Controls</span>'+controls+'</div></div>';
  }).join("");
  el.querySelectorAll(".reassign-role").forEach(button=>{button.onclick=async()=>{
    const row=button.closest(".role-control-row");
    const select=row?.querySelector(".reassign-select");
    const targetRole=select?.value;
    const participantIdLocal=select?.dataset.participantId;
    const participant=(state.participants||[]).find(p=>p.id===participantIdLocal);
    if(!participant||!targetRole)return;
    const status=document.getElementById("roleControlResult");
    button.disabled=true;status.textContent="Reassigning "+participant.name+"…";
    try{const d=await api({action:"instructor",code:sessionCode,instructorKey,command:"reassign",participantId:participant.id,targetRole});status.textContent=participant.name+" moved to "+(roles[targetRole]?.title||targetRole)+". Their new private role view will follow its arrival status.";renderHost(d.state);}
    catch(e){status.textContent="Role not changed: "+e.message;button.disabled=false;}
  };});
  el.querySelectorAll(".override-loop").forEach(button=>{button.onclick=async()=>{
    const row=button.closest(".role-control-row");
    const select=row?.querySelector(".override-select");
    const participantSelect=row?.querySelector(".reassign-select");
    const resolution=select?.value;
    const participantIdLocal=participantSelect?.dataset.participantId;
    if(!resolution||!participantIdLocal)return;
    const status=document.getElementById("roleControlResult");
    button.disabled=true;status.textContent="Applying communication-loop override…";
    try{const d=await api({action:"instructor",code:sessionCode,instructorKey,command:"override-loop",participantId:participantIdLocal,resolution});status.textContent="Override applied.";renderHost(d.state);}
    catch(e){status.textContent="Override failed: "+e.message;button.disabled=false;}
  };});
}
function renderMissingBenchmarks(state){
  const el=document.getElementById("missingBenchmarks");if(!el)return;
  const items=state.missingBenchmarks||[];
  el.innerHTML=items.length?items.map(x=>'<div class="stall-item">'+escapeHtml(x)+'</div>').join(""):'<p class="muted">No stalled communication steps or missing benchmarks right now.</p>';
}
function renderHostPendingReports(state){
  const list=document.getElementById("hostPendingRadioList");if(!list)return;
  const reports=state.radioProtocol?.pendingReports||[];
  if(!reports.length){list.innerHTML='<p class="muted">No crew radio reports waiting for a lead response.</p>';return;}
  list.innerHTML="";
  reports.forEach(report=>{
    const item=document.createElement("div");item.className="radio-step waiting";
    item.innerHTML='<h4>'+escapeHtml(roles[report.role]?.title||report.role)+'</h4><p>'+escapeHtml(report.name)+' confirmed a radio report. Record the response type only after the lead replies on the department radio.</p><div class="radio-response-grid"></div>';
    const grid=item.querySelector(".radio-response-grid");
    (state.radioProtocol?.responseOptions||[]).forEach(response=>{const b=document.createElement("button");b.type="button";b.className="btn alt";b.textContent=response;b.onclick=()=>respondToRadio(report.participantId,response);grid.appendChild(b);});
    list.appendChild(item);
  });
}
function renderUnexpectedControls(state){
  const cat=document.getElementById("unexpectedCategory");
  const branch=document.getElementById("unexpectedBranch");
  if(cat&&!cat.options.length){
    (state.unexpectedCategories||[]).forEach(item=>{const o=document.createElement("option");o.value=item;o.textContent=item;cat.appendChild(o);});
  }
  if(branch){
    const current=branch.value;
    branch.innerHTML="";
    (state.branchOptions||[]).forEach(item=>{const o=document.createElement("option");o.value=item;o.textContent=item;branch.appendChild(o);});
    branch.value=current||state.branch||"initial";
  }
  const lead=document.getElementById("leadRoleSelect");
  if(lead)lead.value=state.leaderRole||"engine";
  const branchSelect=document.getElementById("branchRedirect");
  if(branchSelect){
    const current=branchSelect.value||state.branch;
    branchSelect.innerHTML="";
    (state.branchOptions||[]).forEach(item=>{const o=document.createElement("option");o.value=item;o.textContent=item;branchSelect.appendChild(o);});
    branchSelect.value=current;
  }
}
function renderHost(state){
  cacheSceneImage(state);
  renderArrivalTracker(state);
  renderRoleControlPanel(state);
  renderMissingBenchmarks(state);
  renderHostPendingReports(state);
  renderUnexpectedControls(state);
  document.getElementById("hostStatus").textContent=state.status.toUpperCase();
  document.getElementById("hostPhase").textContent=(Number(state.phase||0)+1)+" / 5";
  document.getElementById("hostBranch").textContent=state.branch;
  document.getElementById("hostLead").textContent=state.leaderRole==="command"?"Incident Command":"Engine 181 (acting)";
  document.getElementById("hostProgress").textContent=`Communication loops complete: ${state.actionProgress?.completed||0}/${state.actionProgress?.total||0}. Decisions made: ${state.actionProgress?.acted||0}/${state.actionProgress?.total||0}. Phase advances only after required radio loops, 360/mode (phase 1), and Command handoff gates are satisfied.`;
  renderHostSides(state);
  renderScene("hostScene",state);
  renderCrew("hostCrew",state.participants);
  renderCrew("lobbyCrew",state.participants);
  renderHostForecasts(state);
  renderTimeline("hostTimeline",state.timeline);
  if(state.status!=="lobby")document.getElementById("lobby").classList.add("hidden");
  saveSession();
}
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
  const panel=document.getElementById("commandTools");if(!panel)return;
  const hasControl=role==="engine"||(role==="command"&&(state.handoff?.accepted||state.leaderRole==="command"));
  panel.classList.toggle("hidden",!hasControl);if(!hasControl)return;
  const firstDue=document.getElementById("firstDueTools");if(firstDue)firstDue.classList.toggle("hidden",role!=="engine");
  const tag=panel.querySelector(".tag");if(tag)tag.textContent=role==="engine"?"Engine 181 — acting lead":"Incident Command — tactical control";
  const heading=document.getElementById("assignmentToolsHeading");if(heading)heading.textContent=role==="engine"?"Assign a unit":"Direct a unit";
  const progress=state.viewedSides||viewedSidesData;viewedSidesData=progress;
  const sides=Object.keys(state.sceneSides||sceneSidesData||{});
  renderSideButtons("sceneSides",sides,progress,side=>recordDiscovery(side));
  const image=document.getElementById("sideBoard");if(image&&sceneBoardData)image.src=sceneBoardData;
  const mode=document.getElementById("attackMode");if(mode&&state.attackMode)mode.value=state.attackMode;
  if(mode)mode.disabled=state.status!=="active"||Boolean(state.attackMode)||Number(state.phase)>0;
  const record=document.querySelector("#commandTools button[onclick=\"setAttackMode()\"]");if(record)record.disabled=state.status!=="active"||Boolean(state.attackMode)||Number(state.phase)>0;
  const first=sides.find(x=>progress.includes(x))||sides[0];if(first)showSideIntel("sideIntel",first,state.sceneSides||sceneSidesData,progress);
  const sideCount=document.getElementById("sideProgress");
  if(sideCount)sideCount.textContent="360 progress: "+progress.length+"/4 sides recorded. Each side is a separate observation—decide what matters and radio it.";
}
function renderHostSides(state){
  const sides=Object.keys(state.sceneSides||{});const image=document.getElementById("hostBoard");if(image&&sceneBoardData)image.src=sceneBoardData;
  renderSideButtons("hostSides",sides,state.viewedSides||[],side=>showSideIntel("hostSideIntel",side,state.sceneSides||{},state.viewedSides||[]));
  const first=sides[0];if(first)showSideIntel("hostSideIntel",first,state.sceneSides||{},state.viewedSides||[]);
}
function renderSideButtons(id,sides,viewed,onPick){const el=document.getElementById(id);if(!el)return;el.innerHTML="";sides.forEach(side=>{const b=document.createElement("button");b.className="btn alt side-btn";b.textContent=side+(viewed.includes(side)?" ✓":"");b.setAttribute("aria-pressed","false");b.onclick=()=>{el.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed","false"));b.setAttribute("aria-pressed","true");showSideIntel(id==="hostSides"?"hostSideIntel":"sideIntel",side,sceneSidesData,viewed);onPick(side);};el.appendChild(b);});}
function showSideIntel(id,side,data,viewed){const el=document.getElementById(id);if(el)el.innerHTML="<strong>"+escapeHtml(side)+" side · "+(viewed.includes(side)?"recorded":"not yet recorded")+"</strong><p>"+escapeHtml(data?.[side]||"Review this exterior view and report useful changes.")+"</p><p class=\"muted\">What can you directly observe? What are you inferring? What should Command receive?</p>";}
function renderRadio(items){const el=document.getElementById("radioTraffic");if(!el)return;el.textContent=(items||[]).slice().reverse().map(x=>new Date(x.at).toLocaleTimeString()+" — "+x.text).join("\n")||"No radio communication milestones recorded yet. Listen to the department radio for incident details.";}
function renderHandoff(state){const box=document.getElementById("handoffCard"),text=document.getElementById("handoffText"),actions=document.getElementById("handoffActions");if(!box||!actions)return;const handoff=state.handoff;const show=(role==="engine"&&state.arrivals?.find(x=>x.role==="command")?.onScene)||role==="command";box.classList.toggle("hidden",!show);actions.innerHTML="";text.textContent=handoff?.text||"Incident Command is on scene. Engine 181 can now deliver its size-up, 360, strategy and assignment handoff over the radio.";if(role==="engine"&&!handoff&&show){const b=document.createElement("button");b.className="btn good";b.textContent="Transmit radio handoff to Incident Command";b.onclick=async()=>{try{const d=await api({action:"handoff",code:sessionCode,participantId});renderPlayer(d.state);}catch(e){alert(e.message);}};actions.appendChild(b);}if(role==="command"&&handoff&&!handoff.accepted){const b=document.createElement("button");b.className="btn good";b.textContent="Acknowledge and accept command";b.onclick=async()=>{try{const d=await api({action:"accept-handoff",code:sessionCode,participantId});renderPlayer(d.state);}catch(e){alert(e.message);}};actions.appendChild(b);}if(role==="command"&&handoff?.accepted)text.textContent+="\n\nYou have accepted command. Use your radio picture to direct the incident.";}
function renderArrivalTracker(state){const el=document.getElementById("arrivalTracker");if(!el)return;el.innerHTML="";(state.arrivals||[]).filter(x=>x.role!=="engine").forEach(a=>{const wrap=document.createElement("div");const b=document.createElement("button");b.className="btn "+(a.onScene?"good":"alt");b.textContent=(a.onScene?"On scene · ":"Responding · ")+a.title;if(!a.onScene&&["active","paused"].includes(state.status)){b.onclick=async()=>{try{const d=await api({action:"instructor",code:sessionCode,instructorKey,command:"arrival",targetRole:a.role});renderHost(d.state);}catch(e){alert(e.message);}};}else b.disabled=true;wrap.appendChild(b);el.appendChild(wrap);});}
async function recordDiscovery(side){try{const d=await api({action:"discover",code:sessionCode,participantId,side});renderPlayer(d.state);}catch(e){alert(e.message);}}
async function setAttackMode(){const mode=document.getElementById("attackMode").value;const status=document.getElementById("modeResult");try{const d=await api({action:"mode",code:sessionCode,participantId,mode});status.textContent="Attack mode recorded. Complete required radio loops for automatic progression.";renderPlayer(d.state);}catch(e){status.textContent="Mode not recorded: "+e.message;}}
async function assignUnit(){const targetRole=document.getElementById("assignmentRole").value;const assignment=document.getElementById("assignmentText").value.trim();const status=document.getElementById("assignmentResult");try{const d=await api({action:"assignment",code:sessionCode,participantId,targetRole,assignment});status.textContent="Assignment sent to "+(roles[targetRole]?.title||targetRole)+". Confirm receipt over the department radio.";document.getElementById("assignmentText").value="";renderPlayer(d.state);}catch(e){status.textContent="Assignment not sent: "+e.message;}}
function renderAssignments(state){const el=document.getElementById("assignmentList");if(!el)return;const isLead=role==="command"||role==="engine";const list=isLead?(state.assignments||[]):(state.assignments||[]).filter(x=>x.role===role);el.innerHTML=list.length?list.slice().reverse().map(x=>'<div class="assignment"><b>'+(isLead?escapeHtml(roles[x.role]?.title||x.role):"Your assignment")+'</b><p>'+escapeHtml(x.text)+'</p></div>').join(""):'<p class="muted">No unit assignment has been sent yet.</p>';}
function renderCrew(id,crew){const el=document.getElementById(id);if(!el)return;el.innerHTML=crew.length?crew.map(p=>'<div class="crew"><b>'+escapeHtml(p.name)+'</b> — '+escapeHtml(roles[p.role]?.title||p.role)+'</div>').join(""):'<p class="muted">Waiting for crew members to join.</p>';}
function renderTimeline(id,items){const el=document.getElementById(id);if(el)el.textContent=(items||[]).slice().reverse().map(x=>new Date(x.at).toLocaleTimeString()+" — "+x.text).join("\n");}
function startPolling(host){
  clearInterval(pollTimer);
  pollTimer=setInterval(async()=>{
    try{
      const qs=new URLSearchParams({code:sessionCode});
      if(host)qs.set("instructorKey",instructorKey);
      else qs.set("participantId",participantId);
      const needImages=host?!sceneBoardData:!sceneImageData||sceneRoleCached!==role;
      if(needImages)qs.set("includeSceneImage","1");
      const r=await fetch(API+"?"+qs.toString(),{cache:"no-store"});
      if(!r.ok){const sync=document.getElementById(host?"hostProgress":"syncState");if(sync&&!host)sync.textContent="Sync interrupted — retrying";return;}
      const state=await r.json();
      if(!host&&state.participant?.role&&state.participant.role!==role){role=state.participant.role;document.getElementById("roleTitle").textContent=roles[role]?.title||role;cacheSceneImage(state,true);}
      host?renderHost(state):renderPlayer(state);
    }catch(e){}
  },2000);
}
function setError(t){document.getElementById("entryError").textContent=t;}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
