// Server-only scenario definitions. Do not publish this file as a static asset.
import commandImage from "./live-crew-images/command.mjs";
import engineImage from "./live-crew-images/engine.mjs";
import truckImage from "./live-crew-images/truck.mjs";
import ritImage from "./live-crew-images/rit.mjs";
import engine2Image from "./live-crew-images/engine2.mjs";
import sceneBoardImage from "./live-crew-images/360.mjs";
import { photos as enginePhotoUpdates } from "./live-crew-photo-updates/engine.mjs";
import { photos as truckPhotoUpdates } from "./live-crew-photo-updates/truck.mjs";
import { photos as ritPhotoUpdates } from "./live-crew-photo-updates/rit.mjs";
import { photos as engine2PhotoUpdates } from "./live-crew-photo-updates/engine2.mjs";
import { photos as commandPhotoUpdates } from "./live-crew-photo-updates/command.mjs";

const rolePhotoUpdates={engine:enginePhotoUpdates,truck:truckPhotoUpdates,rit:ritPhotoUpdates,engine2:engine2PhotoUpdates,command:commandPhotoUpdates};

const roles={
command:{title:"Incident Command — Incoming",brief:"You are the incoming Incident Commander. While responding, use dispatch and radio traffic only; your photo set unlocks after arrival. Build the incident picture from what you hear, then accept Engine 181’s handoff before taking tactical control.",events:[["Command decisions","Use only reports transmitted over the radio. Engine 181 remains acting lead until you accept its handoff.",["Request an updated conditions report","Confirm the current strategy","Request an accountability report"]],["Interior update","Engine 181 is operating on Division 2. Decide from the radio picture you actually heard—not from private crew phones.",["Send a second line to Division 2","Continue current attack","Order withdrawal"]],["Resource decision","Dispatch advises additional resources are available if requested. Confirm crew locations before changing the plan.",["Request additional alarm","Hold current assignment","Request progress reports from all committed crews"]],["Changing incident","Review accountability, search status, and fire conditions from radio traffic only.",["Continue offensive operations","Reassess strategy","Order withdrawal","Recommend withdraw / defensive transition"]],["AAR","Explain what information you had, what never reached you, and how radio gaps affected your decisions.",[]]]},
engine:{title:"Engine 181 — First-Due Engine",brief:"You are Engine 181, first on scene at Alpha. Complete arrival size-up, water/apparatus decisions, a four-side 360, initial strategy, crew action, and incoming assignments while you are acting lead. Separate observation from inference.",events:[["First-due size-up","Engine 181 is first on scene. Review Alpha photos, choose water supply and apparatus position implications, and report what matters over the radio. Complete all four 360 sides before the automatic phase advance.",["Transmit Alpha-side size-up over the radio","Establish water supply and report apparatus position","Request an occupancy update while completing the 360"]],["Initial attack","Use your recorded strategy, 360 observations, and radio traffic. Assign incoming units as needed.",["Commit the initial line under the selected strategy","Hold at the entry and request an updated report","Request Engine 184 to prepare a second line"]],["Division 2 conditions","Heavy heat, poor visibility, and fire extending from a bedroom into the hallway. Command only knows what you radio.",["Continue with line","Hold position","Withdraw","Request second line"]],["Conditions change","Heat is increasing overhead. Decide whether to advance, reinforce, or withdraw based on support you actually heard assigned.",["Advance","Request second line","Withdraw"]],["AAR","Identify what Engine 181 saw, what was transmitted, and what was handed off to Incident Command.",[]]]},
truck:{title:"Truck 182 — Search",brief:"Your search photos appear on arrival. Evaluate search area orientation, occupant clue reliability, smoke/heat, access/exit, hose-line support needs, and whether to continue, reposition, request help, or withdraw.",events:[["Search assignment","You are on scene. Confirm search area with the acting lead and decide how to start based on your private orientation photos.",["Begin primary search","Request the last known occupant location","Request hose-line support before entry"]],["Civilian report","A resident tells you: “My 8-year-old daughter might still be upstairs, back bedroom.” Only your role receives this information. Judge its reliability before you radio.",["Transmit the possible occupant location over the radio","Confirm the report before changing the search plan"]],["Search conditions","Smoke is banked to floor level near the rear bedroom. You hear a faint sound from that area. Exit path remains behind you.",["Continue toward sound","Reposition","Request assistance"]],["Victim area","You reach the rear bedroom area. Conditions are worsening. Decide whether findings justify continuing, calling for help, or withdrawing.",["Continue search","Request assistance","Withdraw"]],["AAR","Did the possible trapped-child information reach Incident Command? When? Did it change priorities?",[]]]},
rit:{title:"RIT 186 — Rescue Team",brief:"While responding, use dispatch and radio traffic only. On arrival, stage, ready tools, track crew locations from radio traffic, and watch Charlie-side access/removal routes. Anticipate problems without receiving every crew’s private findings.",events:[["RIT established","RIT 186 is on scene. Confirm staging location, tool readiness, and that you are monitoring radio traffic for crew locations.",["Report RIT ready over the radio","Confirm staging location and tool readiness","Request an exterior assignment"]],["Charlie-side observation","Smoke volume and velocity are increasing from the Charlie-side eaves. Access and removal routes look constrained. Command does not receive this automatically.",["Transmit the Charlie-side observation","Continue monitoring and request a status","Identify and report a preferred removal route"]],["Deterioration","Charlie-side conditions continue to worsen while crews remain committed inside. Decide whether to stay staged or push for reassessment.",["Maintain position","Recommend reassessment","Prepare for Mayday or RIT activation"]],["Crew status concern","Interior radio traffic is becoming less frequent. Accountability may be incomplete.",["Continue monitoring","Raise concern with Incident Command","Prepare for Mayday or RIT activation"]],["AAR","Discuss which exterior observations mattered and whether they changed Command’s picture.",[]]]},
engine2:{title:"Engine 184 — Second-Due Engine",brief:"Engine 184 responds with dispatch and radio traffic only—no on-scene photos until arrival. After arrival, decide apparatus placement, water supply, second/backup line options, exposure support, and assignment clarification before deploying.",events:[["Responding — Engine 184","Dispatch reports a two-story dwelling with smoke showing. Engine 181 is first due. You are about 1–2 minutes out; no scene photo is available yet.",["Report Engine 184 responding with ETA over the radio","Request an assignment before arrival","Monitor radio traffic and remain available"]],["On-scene assignment","Engine 184 has arrived. Compare approach, hydrant, driveway, and side-entry photos. Confirm placement and water supply before you deploy.",["Acknowledge and prepare the assigned second line","Report water supply and readiness","Position for backup line / exposure protection","Request assignment clarification"]],["Support assignment","Confirm whether you are supporting Engine 181, Truck search, water supply, or exposure work.",["Acknowledge assignment","Request clarification","Report ready for second-line advance"]],["Deployment","Carry out the assignment you believe you received. If unclear, resolve it over the radio rather than guessing.",["Assignment understood","Request clarification","Report change in apparatus position or water status"]],["AAR","Compare your understood assignment with what Engine 181 or Incident Command intended.",[]]]}}
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
  engine:"Private Alpha information: front entry is accessible. Confirm water source, apparatus position, and the first verified condition before you assume occupancy or fire location. Other phones will not show this view.",
  truck:"Private occupant lead: a resident reports an 8-year-old may be in the upstairs rear bedroom. Treat it as unconfirmed. Decide what to radio and what to verify by search.",
  rit:"Private Charlie information: smoke near the rear eaves; deck reached through a narrow side yard. Track access/removal routes and crew locations from radio traffic—do not assume you know every interior finding.",
  engine2:"Private Delta/staging information: driveway access is available. Choose placement and water-supply implications from your photos after arrival; remain staged until you acknowledge a clear assignment."
};
const sceneSides = {
  Alpha:"Observation — Street/front: smoke from a Division 2 window; front entry visible. Inference vs fact: fire floor, occupancy, and line needs are not proven from this side alone. Confirm what Command should hear.",
  Bravo:"Observation — Left side: intact ground-floor window; narrow side yard. Inference vs fact: exposure and interior involvement are uncertain. Decide whether access or exposure matters enough to radio.",
  Charlie:"Observation — Rear: smoke under second-floor eaves; deck and fence restrict access. Inference vs fact: extension or collapse risk is not confirmed. Report access limits and any roofline change.",
  Delta:"Observation — Right side: driveway and side-door access visible. Inference vs fact: utility or apparatus conflicts may exist. Keep the route clear for incoming units and radio what changes their plan."
};
const roleSceneImages = {
  command: {dataUrl:commandImage,alt:"Street-front command view of a two-story residence with smoke venting from a Division 2 window."},
  engine: {dataUrl:engineImage,alt:"Engine 181 Alpha-side first-arrival view of the front of a two-story residence with smoke venting from a Division 2 window."},
  truck: {dataUrl:truckImage,alt:"Truck/Search view of a second-floor hallway with a closed rear bedroom door and a small backpack nearby."},
  rit: {dataUrl:ritImage,alt:"RIT exterior view from the Charlie side showing smoke near the eaves and roofline."},
  engine2: {dataUrl:engine2Image,alt:"Engine 184 staging view looking toward the residence from beside the staged fire engine."}
};
const sceneSizeup = {
  command:"From the street: a two-story residence with smoke from a Division 2 window. What do you directly observe? What are you inferring? What must crews confirm by radio?",
  engine:"First-due evidence: entry, smoke, and line path cues. What can you directly observe? What are you inferring about occupancy and fire location? What should Command receive?",
  truck:"Search evidence: hallway orientation, closed door, and personal-item clue. What do you observe? What are you inferring about an occupant? What should you confirm before changing the search plan?",
  rit:"Charlie-side evidence: eaves smoke, access path, and removal constraints. What do you observe? What risk are you inferring? What should Command receive now?",
  engine2:"Arrival evidence: approach, hydrant/hose path, and driveway placement. What do you observe? What placement or water-supply action are you inferring? What must you confirm before deploying?"
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
export { instructorInjects, roles, visualCopy, branchEvents, resolveEvent, roleSceneImages, rolePhotoUpdates, sceneSizeup, sceneBoardImage, sceneSides, roleIntel, arrivalSchedule, arrivalEvents };

