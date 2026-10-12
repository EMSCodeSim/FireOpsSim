// Server-only scenario definitions. Do not publish this file as a static asset.
import commandImage from "./live-crew-images/command.mjs";
import engineImage from "./live-crew-images/engine.mjs";
import truckImage from "./live-crew-images/truck.mjs";
import ritImage from "./live-crew-images/rit.mjs";
import engine2Image from "./live-crew-images/engine2.mjs";
import sceneBoardImage from "./live-crew-images/360.mjs";

const roles={
command:{title:"Incident Command — Incoming",brief:"You are the incoming Incident Commander. While responding, you have dispatch and radio traffic only. Command arrives last and receives no scene photo until then. Listen to Engine 181 and accept its radio handoff before taking tactical control.",events:[["Command decisions","Use only reports transmitted over the radio. Engine 181 remains acting lead until you accept its handoff.",["Request an updated conditions report","Confirm the current strategy","Request an accountability report"]],["Interior update","Engine 181 is operating on Division 2. Use the radio reports you actually received to decide what to do next.",["Send a second line to Division 2","Continue current attack","Order withdrawal"]],["Resource decision","Dispatch advises additional resources are available if requested.",["Request additional alarm","Hold current assignment"]],["Changing incident","Review the radio picture, crew locations, and current conditions. Make the next command decision based on what your crews actually communicated.",["Continue offensive operations","Reassess strategy","Order withdrawal"]],["AAR","The incident is ending. Be ready to explain what information you had at each decision point and what information you never received.",[]]]},
engine:{title:"Engine 181 — First-Due Engine",brief:"You are first on scene at Alpha. Give a concise size-up over the radio, review the four-side 360, choose an initial attack mode, and assign incoming units. You remain acting lead until Incident Command arrives and accepts your handoff.",events:[["First-due size-up","Engine 181 is first on scene. Report the Alpha-side smoke, access, and initial conditions over the radio. Other units and Incident Command are still responding.",["Transmit Alpha-side size-up over the radio","Request an occupancy update while completing the 360","Request a second-due unit to prepare for assignment"]],["Initial attack","Select actions from your Alpha view, recorded strategy, and radio traffic. Engine 184 may still be responding.",["Commit the initial line under the selected strategy","Hold at the entry and request an updated report","Request Engine 184 to prepare a second line"]],["Division 2 conditions","You encounter heavy heat, poor visibility, and visible fire extending from a bedroom into the hallway. Command only knows what has been radioed.",["Continue with line","Hold position","Withdraw"]],["Conditions change","Heat is increasing overhead. Consider the reports and support actually available.",["Advance","Request second line","Withdraw"]],["AAR","Identify what Engine 181 saw, what was transmitted, and what was handed off to Incident Command.",[]]]},
truck:{title:"Truck 182 — Search",brief:"Your response begins with dispatch and radio information only. Your assigned search photo appears when Truck 182 arrives on scene. Treat the occupant lead as unconfirmed and relay its location and confidence.",events:[["Search assignment","You are on scene. Coordinate the search assignment with Engine 181 and report the occupant lead over the radio.",["Begin primary search","Request the last known occupant location"]],["Civilian report","A resident tells you: “My 8-year-old daughter might still be upstairs, back bedroom.” Only your role receives this information.",["Transmit the possible occupant location over the radio","Confirm the report before changing the search plan"]],["Search conditions","Smoke is banked to floor level near the rear bedroom. You hear a faint sound from that area.",["Continue toward sound","Reposition"]],["Victim area","You reach the rear bedroom area. Conditions are worsening and the search assignment is becoming more difficult.",["Continue search","Request assistance","Withdraw"]],["AAR","Did the possible trapped-child information reach Incident Command? When? Did it change the incident priorities?",[]]]},
rit:{title:"RIT 186 — Rescue Team",brief:"While responding, you have dispatch and radio traffic only. Your Charlie-side photo appears when RIT 186 arrives. Once on scene, monitor the roofline, access, and crew status; radio observations that change the risk picture.",events:[["RIT established","RIT 186 is on scene. Confirm staging and monitor the Charlie-side roofline and radio traffic.",["Report RIT ready over the radio","Request an exterior assignment"]],["Charlie-side observation","Smoke volume and velocity are increasing from the Charlie-side eaves. Command does not receive this automatically.",["Transmit the Charlie-side observation","Continue monitoring and request a status"]],["Deterioration","Charlie-side conditions continue to worsen while crews remain committed inside.",["Maintain position","Recommend reassessment"]],["Crew status concern","Interior radio traffic is becoming less frequent. Continue monitoring assignments, air, and conditions.",["Continue monitoring","Raise concern with Incident Command"]],["AAR","Discuss which exterior observations were important enough to transmit and whether they changed Incident Command's picture.",[]]]},
engine2:{title:"Engine 184 — Second-Due Engine",brief:"Engine 184 is responding and initially has dispatch and radio traffic only. Your scene photo and on-scene assignments appear only after arrival, normally about 90 seconds after the incident starts or when the instructor advances your arrival.",events:[["Responding — Engine 184","Dispatch reports a two-story dwelling with smoke showing. Engine 181 is first due. You are about 1–2 minutes out; no scene photo is available yet.",["Report Engine 184 responding with ETA over the radio","Request an assignment before arrival","Monitor radio traffic and remain available"]],["En route update","Use the transmissions you have heard. Do not self-deploy or assume a task that has not been assigned.",["Read back the assignment heard over the radio","Request location and task clarification","Report your updated ETA"]],["Support assignment","Confirm the assignment and location over the radio.",["Acknowledge assignment","Request clarification"]],["Deployment","Carry out the assignment you believe you received. If it is unclear, resolve that over the radio rather than guessing.",["Assignment understood","Request clarification"]],["AAR","Compare your understood assignment with the assignment Engine 181 or Incident Command intended.",[]]]}}
;

// Elapsed incident seconds until the assigned apparatus is on scene.
const arrivalSchedule = { engine:0, truck:60, engine2:90, rit:120, command:150 };
const arrivalEvents = {
  command:["Responding — Incident Command","Listen to Engine 181’s radio size-up, assignments, and updates. You have no scene photo until your arrival and Engine 181 remains acting lead until handoff.",["Acknowledge Engine 181’s size-up over the radio","Request current strategy and assignments","Request an updated conditions report"]],
  truck:["Responding — Truck 182","Dispatch and radio traffic only. Engine 181 is first due; do not assume a search location before arrival or assignment.",["Report Truck 182 responding with ETA over the radio","Request the occupant report over the radio","Monitor radio traffic and remain available"]],
  rit:["Responding — RIT 186","Dispatch and radio traffic only. Listen for crew locations and conditions; your Charlie-side view appears only after arrival.",["Report RIT 186 responding over the radio","Request an accountability update","Monitor radio traffic and remain available"]],
  engine2:["Responding — Engine 184","Dispatch and radio traffic only. You are about 1–2 minutes out; no scene photo is available until you arrive.",["Report Engine 184 responding with ETA over the radio","Request an assignment before arrival","Monitor radio traffic and remain available"]]
};

const roleIntel = {
  command:"En route: Dispatch reports a two-story dwelling with smoke showing. Your view is limited to information actually radioed to you.",
  engine:"Alpha approach: the front entry is accessible. Confirm your water source and line path, then report the first verified interior condition. The Command screen will not reveal this view automatically.",
  truck:"Private occupant lead: a resident reports an 8-year-old may be in the upstairs rear bedroom. The report is unconfirmed; provide the exact location and confidence over the radio.",
  rit:"Charlie view: smoke is issuing near the rear eaves and the deck is reached through a narrow side yard. Watch for changes; Command has no Charlie-side view until you report it.",
  engine2:"Delta view: driveway access is available but the unit remains staged. No assignment is active until Command gives one and you acknowledge it."
};
const sceneSides = {
  Alpha:"Street/front: smoke from a Division 2 window; front entry is visible. Confirm occupancy and choose an apparatus position that keeps the access route clear.",
  Bravo:"Left side: a ground-floor window is intact and the side yard is narrow. Check access and exposure conditions before assigning a crew there.",
  Charlie:"Rear: smoke is collecting under the second-floor eaves; a deck and fence restrict rear access. Report the roofline change and access limitation.",
  Delta:"Right side: driveway and side-door access are visible. Keep the route available for incoming apparatus and confirm any utility concern before assigning work."
};
const roleSceneImages = {
  command: {dataUrl:commandImage,alt:"Street-front command view of a two-story residence with smoke venting from a Division 2 window."},
  engine: {dataUrl:engineImage,alt:"Engine 1 interior approach showing a hose line, a dim hallway, and a smoky bedroom doorway."},
  truck: {dataUrl:truckImage,alt:"Truck/Search view of a second-floor hallway with a closed rear bedroom door and a small backpack nearby."},
  rit: {dataUrl:ritImage,alt:"RIT exterior view from the Charlie side showing smoke near the eaves and roofline."},
  engine2: {dataUrl:engine2Image,alt:"Engine 2 staging view looking toward the residence from beside the staged fire engine."}
};
const sceneSizeup = {
  command:"From the street: a two-story residence with smoke from a Division 2 window. Confirm conditions and assignments over the radio.",
  engine:"At the interior approach: visibility is reduced on Division 2. The hose line leads toward a smoke-filled hall; conditions beyond the doorway are uncertain.",
  truck:"Search view: a closed rear bedroom and a small backpack are visible on Division 2. No occupant has been located; treat the clue as unconfirmed.",
  rit:"Charlie-side exterior: smoke is issuing near the eaves. No collapse is visible in this view; watch for change and report observations.",
  engine2:"Staging view: the residence is visible from a safe standby position. No assignment is shown; remain staged until Command directs you."
};

const visualCopy={
initial:{command:["Arrival view","Smoke showing Division 2","Your command view shows the overall incident. Crew phones may contain observations you do not have."],engine:["Interior approach","Limited visibility ahead","Your phone represents Engine 1's perspective; use the radio to move important information."],truck:["Search assignment","Division 2 search","Your search perspective may reveal occupant information unavailable to Command."],rit:["Exterior monitoring","RIT established","Watch exterior conditions and radio traffic for changes."],engine2:["Staging","Awaiting assignment","Listen for a clear assignment before deploying."]},
offensive:{command:["Offensive strategy","Interior crews committed","Monitor progress reports and decide whether current resources match the conditions."],engine:["Interior advance","Heat and smoke increasing","Advance only within the scenario assignment and communicate meaningful changes."],truck:["Primary search","Search underway","Coordinate with Engine 1 while maintaining your search objective."],rit:["RIT ready","Interior crews committed","Maintain readiness and watch for exterior warning signs."],engine2:["Staged resource","Awaiting deployment","Listen for Command to give you a specific assignment."]},
"reinforced-attack":{command:["Second line assigned","Resources reinforced","Your decision has sent another line toward Division 2. Continue evaluating whether conditions respond."],engine:["Support arriving","Conditions beginning to stabilize","A second line is moving toward your division. Fire growth is slowing in this branch."],truck:["Search supported","Interior fire growth slowing","Improved suppression support gives the search group a better operating window."],rit:["Exterior conditions","Smoke growth slowing","Exterior indicators begin stabilizing, but RIT remains ready."],engine2:["Deploy second line","Move to Division 2","You have been assigned as the reinforcing line. Confirm the assignment over the radio."]},
"delayed-reinforcement":{command:["Current attack continued","Fire extension increasing","Without immediate reinforcement, conditions are worsening. New crew reports become increasingly important."],engine:["Conditions deteriorating","Fire extending overhead","Heat is increasing and extension is moving beyond the original room."],truck:["Search pressure increasing","Attic involvement developing","The search environment is worsening as fire extends."],rit:["Charlie side worsening","Smoke volume increasing","Exterior conditions suggest continued extension while crews remain inside."],engine2:["Still staged","No reinforcement assigned","You remain available while interior conditions worsen."]},
withdrawal:{command:["Withdrawal ordered","Accountability priority","Interior crews must withdraw and confirm status. The incident now shifts toward accountability and exterior strategy."],engine:["Withdraw","Exit the structure","Command has ordered withdrawal. Communicate crew status and movement over the radio."],truck:["Withdraw from search","Exit and report status","The search assignment is interrupted by the withdrawal order."],rit:["Withdrawal support","Track exiting crews","Be prepared for accountability problems or a missing crew."],engine2:["Hold exterior","Support withdrawal","Remain outside and be prepared for a reassignment."]},
"additional-alarm":{command:["Additional alarm requested","More resources en route","Additional companies are responding, but they are not instantly available."],engine:["Resources requested","Continue current assignment","Command has requested more resources; do not assume they have arrived."],truck:["Additional companies en route","Search continues","More resources are coming while your current assignment continues."],rit:["Additional resources","Maintain readiness","More companies are responding; continue monitoring current crews."],engine2:["Additional alarm","Current assignment unchanged","Do not change assignments until Command directs you."]},
defensive:{command:["Defensive strategy","Interior commitment avoided","The incident transitions to exterior operations and exposure priorities."],engine:["Exterior assignment","Do not enter","Command selected defensive operations. Await an exterior assignment."],truck:["Exterior operations","Search not initiated","Interior search is not initiated under this branch."],rit:["Exterior posture","Monitor collapse zone","Maintain readiness and observe changing structural conditions."],engine2:["Exterior resource","Await assignment","Prepare for exposure or water-supply tasks."]}}
;

const branchEvents = {
  "reinforced-attack": {
    command: {2:["Support assigned","Confirm Engine 2's assignment by radio.",["Confirm assignment","Request status report"]]},
    engine: {2:["Support approaching","Engine 2 has been assigned to support your crew.",["Report location","Coordinate support"]]},
    truck: {2:["Search priority","You still hold the unconfirmed occupant report.",["Share occupant information","Request assistance"]]},
    rit: {2:["Exterior conditions","Smoke volume appears to be stabilizing.",["Report observation","Continue monitoring"]]},
    engine2: {2:["Support assignment","Confirm the assignment and location over the radio.",["Acknowledge assignment","Request clarification"]]}
  },
  "delayed-reinforcement": {
    command: {2:["Information gap","No support crew has been assigned. Seek updated radio reports.",["Request conditions report","Assign support"]]},
    engine: {2:["Changing conditions","Interior heat and smoke have increased.",["Report change","Request assistance"]]},
    truck: {2:["Search uncertainty","You have an unconfirmed occupant location.",["Report search status","Request guidance"]]},
    rit: {2:["Exterior warning","You observe increasing smoke at the rear.",["Transmit observation","Request status"]]},
    engine2: {2:["Awaiting assignment","You hear indications that assistance may be needed.",["Request assignment","Remain available"]]}
  },
  withdrawal: {
    command: {2:["Accountability","Confirm acknowledgments and crew status.",["Request acknowledgments","Request crew status"]]},
    engine: {2:["Command update","Acknowledge the new strategy and report crew status.",["Acknowledge message","Report crew status"]]},
    truck: {2:["Search interrupted","Report unresolved search information and crew status.",["Report search status","Report crew status"]]},
    rit: {2:["Exterior monitoring","Observe crew movement and accountability.",["Report observation","Request clarification"]]},
    engine2: {2:["Assignment changed","Confirm the updated assignment over the radio.",["Acknowledge change","Request assignment"]]}
  },
  "additional-alarm": {
    command: {2:["Resources requested","Additional companies are responding but not yet on scene.",["Request ETA","Confirm assignments"]]},
    engine: {2:["Resources pending","Continue reporting your actual conditions.",["Report conditions","Request guidance"]]},
    truck: {2:["Search information","Your occupant report remains important.",["Share information","Request guidance"]]},
    rit: {2:["Exterior monitoring","Continue reporting exterior observations.",["Report observation","Continue monitoring"]]},
    engine2: {2:["No new assignment","Additional resources do not change your assignment.",["Confirm assignment","Remain available"]]}
  },
  defensive: {
    command: {1:["Strategy change","Confirm each unit understands the new strategy.",["Confirm assignments","Request reports"]]},
    engine: {1:["Strategy change","Confirm your new assignment.",["Acknowledge change","Request assignment"]]},
    truck: {1:["Search information","Report any occupant information to Command.",["Share information","Acknowledge strategy"]]},
    rit: {1:["Exterior monitoring","Continue exterior observations.",["Report observation","Continue monitoring"]]},
    engine2: {1:["Await assignment","Confirm instructions before proceeding.",["Request assignment","Remain available"]]}
  }
};
const resolveEvent = (role, phase, branch) => {
  const events = roles[role]?.events || [];
  const index = Math.max(0, Math.min(Number(phase) || 0, events.length - 1));
  return branchEvents[branch]?.[role]?.[index] || events[index] || null;
};
const instructorInjects = {
  conditions: {label:"Conditions change", title:"New conditions", text:"You observe a change in conditions in your assigned area. Communicate what you can verify.", roles:["engine","truck","rit"]},
  radio: {label:"Radio clarification", title:"Unclear radio traffic", text:"You heard a transmission that may concern your assignment, but some details were unclear. Confirm over the radio.", roles:["engine","truck","rit","engine2"]},
  occupant: {label:"Occupant information", title:"New occupant report", text:"A bystander reports that someone may still be inside. This report is not confirmed. Share it with Command.", roles:["truck"]},
  resources: {label:"Resource status", title:"Resource availability update", text:"Dispatch reports that an additional unit is responding but has not arrived. Confirm current assignments.", roles:["command","engine2"]},
  accountability: {label:"Accountability check", title:"Crew accountability", text:"Command is requesting a status and location report from assigned crews.", roles:["engine","truck","rit","engine2"]}
};
export { instructorInjects, roles, visualCopy, branchEvents, resolveEvent, roleSceneImages, sceneSizeup, sceneBoardImage, sceneSides, roleIntel, arrivalSchedule, arrivalEvents };

