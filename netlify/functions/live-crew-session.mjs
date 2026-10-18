import { neon } from "@neondatabase/serverless";
import { roles as scenarioRoles, visualCopy, resolveEvent, instructorInjects, roleSceneImages, sceneSizeup, sceneBoardImage, sceneSides, roleIntel, rolePhotoUpdates, arrivalSchedule, arrivalEvents } from "./live-crew-content.mjs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const roles = ["command", "engine", "truck", "rit", "engine2"];
const forecastOptions = {
  instructor: ["Offensive attack with a second line", "Hold and reassess before committing", "Withdraw and account for all crews"],
  command: ["Continue the current attack", "Reinforce the attack with another line", "Withdraw and account for all crews"],
  engine: ["Continue the initial line and report progress", "Request another line or water supply", "Hold position and reassess conditions"],
  truck: ["Continue primary search", "Request occupant location or search support", "Exit the search area and report conditions"],
  rit: ["Remain staged and monitor radio traffic", "Prepare for rapid intervention deployment", "Request a crew accountability and conditions check"],
  engine2: ["Expect a second-line or water-supply assignment", "Stage until Command gives an assignment", "Prepare to support a withdrawal"]
};
const branchChoices = {
  "Send a second line to Division 2": "reinforced-attack",
  "Continue current attack": "delayed-reinforcement",
  "Order withdrawal": "withdrawal",
  "Request additional alarm": "additional-alarm",
  "Defensive operations": "defensive",
  "Offensive operations": "offensive",
  "Continue offensive operations": "offensive",
  "Reassess strategy": "delayed-reinforcement",
  "Commit the initial line under the selected strategy": "offensive",
  "Hold at the entry and request an updated report": "delayed-reinforcement",
  "Request Engine 184 to prepare a second line": "reinforced-attack",
  "Recommend withdraw / defensive transition": "withdrawal",
  "Prepare for Mayday or RIT activation": "withdrawal"
};
const radioResponses = [
  "Continue current action",
  "Modify assignment over radio",
  "Request clarification",
  "Emergency support or withdrawal direction"
];
const unexpectedCategories = [
  "Different tactical action",
  "Delayed action",
  "Missed radio report",
  "Incomplete report",
  "Assignment change",
  "New hazard",
  "New occupant information",
  "Resource problem",
  "Accountability issue",
  "Emergency traffic",
  "Other"
];
const branchOptions = ["initial", "offensive", "reinforced-attack", "delayed-reinforcement", "withdrawal", "additional-alarm", "defensive"];
const json = (statusCode, body) => ({ statusCode, headers: { "content-type": "application/json", "cache-control": "no-store" }, body: JSON.stringify(body) });
const token = (bytes = 24) => randomBytes(bytes).toString("hex");
const hash = value => createHash("sha256").update(String(value)).digest("hex");
const equalHash = (secret, digest) => {
  const a = Buffer.from(hash(secret), "hex"), b = Buffer.from(String(digest || ""), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
};
const validCode = code => /^[A-F0-9]{6}$/.test(code);
const db = () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(process.env.DATABASE_URL);
};
const eventRow = (session, type, text, role = null) =>
  db()`INSERT INTO live_events (session_code, type, text, role) VALUES (${session}, ${type}, ${text}, ${role})`;

async function getSession(code) {
  if (!validCode(code)) return null;
  const sql = db();
  const rows = await sql`SELECT code, instructor_key_hash, status, phase, branch, created_at, updated_at FROM live_sessions WHERE code = ${code}`;
  if (!rows.length) return null;
  const p = await sql`SELECT id, name, role, joined_at, last_action FROM live_participants WHERE session_code = ${code} ORDER BY joined_at`;
  const events = await sql`SELECT at, type, text, role FROM (SELECT id, at, type, text, role FROM live_events WHERE session_code = ${code} ORDER BY id DESC LIMIT 120) recent ORDER BY id`;
  return { ...rows[0], participants: p, events };
}
function publicState(s, participantId, instructor, includeSceneImage = false) {
  const own = s.participants.find(p => p.id === participantId);
  const role = instructor ? "command" : own?.role;
  const definition = role ? scenarioRoles[role] : null;
  const arrivedRoles = new Set(s.events.filter(e => e.type === "arrival").map(e => e.role));
  const onScene = Boolean(instructor || (s.status !== "lobby" && role === "engine") || arrivedRoles.has(role));
  const event = instructor ? null : (!onScene && arrivalEvents[role]) ? arrivalEvents[role] : (role === "engine2" && Number(s.phase) === 0 ? scenarioRoles.engine2.events[1] : resolveEvent(role, s.phase, s.branch));
  const injects = instructor ? [] : s.events.filter(e => e.type === "inject" && (e.role === role || e.role === null)).slice(-5).map(e => ({at:e.at,text:e.text}));
  const sceneKey = visualCopy[s.branch] ? s.branch : "initial";
  const scene = !role ? null : !onScene ? ["Responding", "Awaiting arrival", "Your role-specific scene view appears when you arrive. Use dispatch and radio traffic only while responding."] : (visualCopy[sceneKey]?.[role] || visualCopy.initial[role]);
  const commandParticipant = s.participants.find(p => p.role === "command");
  const assignments = s.events.filter(e => e.type === "assignment" && (instructor || e.role === role || role === "command" || role === "engine"));
  const viewedSides = (instructor || role === "engine") ? [...new Set(s.events.filter(e => e.type === "discovery" && e.role === "engine").map(e => e.text.split(": ").pop()))] : [];
  const activeCrew = s.participants.filter(p => p.role === "engine" || arrivedRoles.has(p.role));
  const actionForPhase = p => Number(p.last_action?.phase) === Number(s.phase) ? p.last_action : null;
  const stageFor = p => {
    const action = actionForPhase(p);
    if (!action) return "needs-decision";
    return action.stage || "complete";
  };
  const actedCount = activeCrew.filter(p => Boolean(actionForPhase(p))).length;
  const completedCount = activeCrew.filter(p => stageFor(p) === "complete").length;
  const handoff = s.events.find(e => e.type === "handoff") || null;
  const handoffAccepted = s.events.some(e => e.type === "handoff-accepted");
  const leadOverride = [...s.events].reverse().find(e => e.type === "lead-change");
  const leaderRole = leadOverride?.role || (handoffAccepted ? "command" : "engine");
  const pendingReports = activeCrew
    .filter(p => p.role !== leaderRole && stageFor(p) === "awaiting-command")
    .map(p => ({participantId:p.id,role:p.role,name:p.name,reportedAt:p.last_action.reportedAt || p.last_action.at,choice:p.last_action.choice || null}));
  const visiblePending = (instructor || role === leaderRole) ? pendingReports : [];
  const radioTraffic = s.events.filter(e => ["radio-confirmed","command-response","radio-acknowledged","handoff-accepted","unexpected","loop-override","benchmark","missed-step"].includes(e.type)).slice(-30).map(e => ({at:e.at,role:e.role,text:e.text}));
  const arrivals = roles.map(unitRole => ({role:unitRole,title:scenarioRoles[unitRole]?.title || unitRole,onScene:unitRole === "engine" ? s.status !== "lobby" : arrivedRoles.has(unitRole),arrivedAt:s.events.find(e=>e.type==="arrival"&&e.role===unitRole)?.at || null}));
  const roleImage = includeSceneImage && onScene && role ? roleSceneImages[role] : null;
  const scenePhotos = includeSceneImage && onScene && role ? (rolePhotoUpdates[role] || []) : [];
  const latestForecasts = {};
  for (const item of s.events.filter(e => e.type === "forecast")) latestForecasts[item.role] = item;
  const ownForecast = latestForecasts[instructor ? "instructor" : role] || null;
  const roleStatuses = instructor ? s.participants.map(p => {
    const unitOnScene = p.role === "engine" ? s.status !== "lobby" : arrivedRoles.has(p.role);
    const stage = stageFor(p);
    const action = actionForPhase(p);
    const stalled = Boolean(unitOnScene && s.status === "active" && stage !== "complete" && stage !== "needs-decision" && action?.at && (Date.now() - new Date(action.at).getTime()) > 90000);
    return {
      id: p.id, name: p.name, role: p.role, joinedAt: p.joined_at, lastAction: p.last_action,
      onScene: unitOnScene, stage, stalled,
      assignment: [...assignments].reverse().find(e => e.role === p.role)?.text || null
    };
  }) : [];
  const missingBenchmarks = [];
  if (instructor && s.status === "active") {
    if (Number(s.phase) === 0 && viewedSides.length < 4) missingBenchmarks.push("Engine 181 360 incomplete (" + viewedSides.length + "/4 sides)");
    if (Number(s.phase) === 0 && !s.events.some(e => e.type === "mode")) missingBenchmarks.push("Initial attack mode not recorded");
    if (arrivedRoles.has("command") && !handoffAccepted) missingBenchmarks.push(handoff ? "Command handoff awaiting acceptance" : "Command arrived — handoff not sent");
    activeCrew.forEach(p => {
      const stage = stageFor(p);
      if (stage === "decision") missingBenchmarks.push((scenarioRoles[p.role]?.title || p.role) + " owes a radio report");
      if (stage === "awaiting-command") missingBenchmarks.push((scenarioRoles[p.role]?.title || p.role) + " waiting for incident lead response");
      if (stage === "awaiting-ack") missingBenchmarks.push((scenarioRoles[p.role]?.title || p.role) + " acknowledgement required");
    });
  }
  return {
    event,
    injects,
    scene,
    sceneImage: roleImage,
    scenePhotos,
    sceneBoard: (instructor || (role === "engine" && onScene)) && includeSceneImage ? sceneBoardImage : null,
    sceneSides: (instructor || (role === "engine" && onScene)) ? sceneSides : null,
    roleBrief: !onScene && role ? "You are responding. Use dispatch and radio reports only; your role-specific scene view unlocks on arrival." : role === "engine2" && onScene ? "Engine 184 is on scene. Review your assigned staging view and Engine 181’s assignment; read it back and clarify before deployment." : (definition?.brief || null),
    roleIntel: !onScene && role ? "No additional scene-specific information is available while responding. Listen to radio traffic and ask for clarification when needed." : role === "command" ? "Alpha-side view: a two-story residence with smoke venting from a Division 2 window. Interior conditions and the other sides are known only from radio reports you actually hear." : (role ? roleIntel[role] : null),
    sceneSizeup: !onScene ? "No on-scene size-up is available yet. Use radio reports only." : (role ? sceneSizeup[role] : null),
    photoPrompt: !onScene ? null : "What can you directly observe? What are you inferring? What should you confirm? What information should Command receive?",
    listenFor: !onScene && role ? "Listen for first-due size-up, strategy, and any assignment to your unit." : role === "engine" ? "Listen for incoming unit status, search findings, and Command arrival." : role === "truck" ? "Listen for attack progress, secondary search assignments, and Command direction." : role === "rit" ? "Listen for crew locations, Mayday cues, deteriorating conditions, and accountability traffic." : role === "engine2" ? "Listen for water-supply or second-line assignment and any change to staging." : role === "command" ? "Listen for handoff content, progress reports, and incomplete or conflicting traffic." : null,
    nextStepHint: own ? (stageFor(own) === "needs-decision" ? "Review your private information and choose your next action." : stageFor(own) === "decision" ? "Radio report required before the scenario can credit this action." : stageFor(own) === "awaiting-command" ? "Waiting for the incident lead to answer on the department radio." : stageFor(own) === "awaiting-ack" ? "Acknowledge the direction over the radio, then record the acknowledgement." : stageFor(own) === "complete" ? "Communication loop complete. Continue operating and monitor the radio." : null) : null,
    assignments: assignments.map(e => ({ at:e.at, role:e.role, text:e.text })),
    viewedSides,
    attackMode: s.events.find(e => e.type === "mode")?.text.replace(/^Attack mode: /, "") || null,
    forecastOptions: forecastOptions[instructor ? "instructor" : role] || [],
    forecast: ownForecast ? { at:ownForecast.at, role:ownForecast.role, text:ownForecast.text } : null,
    forecasts: instructor ? Object.entries(latestForecasts).map(([forecastRole,item]) => ({at:item.at,role:forecastRole,text:item.text})) : [],
    actionProgress: { acted:actedCount, completed:completedCount, total:activeCrew.length },
    radioProtocol: { stage: own ? stageFor(own) : null, pendingReports: visiblePending, responseOptions: radioResponses },
    arrivals, onScene, leaderRole, canDirect: role === leaderRole && onScene && s.status === "active",
    handoff: handoff ? {at:handoff.at,text:handoff.text,accepted:handoffAccepted} : null,
    radioTraffic,
    unexpectedCategories: instructor ? unexpectedCategories : undefined,
    branchOptions: instructor ? branchOptions : undefined,
    missingBenchmarks: instructor ? missingBenchmarks : undefined,
    roleStatuses: instructor ? roleStatuses : undefined,
    code: s.code, status: s.status, phase: s.phase, branch: s.branch,
    participants: instructor ? s.participants.map(p => ({ id:p.id, name:p.name, role:p.role, joinedAt:p.joined_at, lastAction:p.last_action, onScene:p.role === "engine" ? s.status !== "lobby" : arrivedRoles.has(p.role) })) : [],
    timeline: instructor ? s.events : s.events.filter(e => ["system", "instructor"].includes(e.type) || ((e.type === "inject" || e.type === "assignment") && (e.role === own?.role || ((role === "command" || role === "engine") && e.type === "assignment") || e.role === null))),
    participant: own ? { id: own.id, name: own.name, role: own.role, joinedAt: own.joined_at, lastAction: own.last_action } : null,
    createdAt: s.created_at, updatedAt: s.updated_at
  };
}
async function autoAdvanceIfReady(code, phase) {
  if (phase >= 4) return false;
  const sql = db();
  const ready = await sql`UPDATE live_sessions
    SET phase = phase + 1, updated_at = now()
    WHERE code = ${code} AND phase = ${phase} AND status = 'active'
      AND (SELECT COUNT(*) FROM live_participants p WHERE p.session_code = ${code} AND (p.role = 'engine' OR EXISTS (SELECT 1 FROM live_events a WHERE a.session_code = ${code} AND a.type = 'arrival' AND a.role = p.role))) > 0
      AND (SELECT COUNT(*) FROM live_participants p WHERE p.session_code = ${code} AND (p.role = 'engine' OR EXISTS (SELECT 1 FROM live_events a WHERE a.session_code = ${code} AND a.type = 'arrival' AND a.role = p.role)) AND p.last_action->>'phase' = ${String(phase)} AND COALESCE(p.last_action->>'stage', 'complete') = 'complete') =
          (SELECT COUNT(*) FROM live_participants p WHERE p.session_code = ${code} AND (p.role = 'engine' OR EXISTS (SELECT 1 FROM live_events a WHERE a.session_code = ${code} AND a.type = 'arrival' AND a.role = p.role)))
      AND (${phase} <> 0 OR ((SELECT COUNT(DISTINCT text) FROM live_events WHERE session_code = ${code} AND type = 'discovery' AND role = 'engine') >= 4 AND EXISTS (SELECT 1 FROM live_events WHERE session_code = ${code} AND type = 'mode')))
      AND (NOT EXISTS (SELECT 1 FROM live_events WHERE session_code = ${code} AND type = 'arrival' AND role = 'command') OR EXISTS (SELECT 1 FROM live_events WHERE session_code = ${code} AND type = 'handoff-accepted'))
    RETURNING phase`;
  if (!ready.length) return false;
  await eventRow(code, "system", `Required communication loops and benchmarks complete; incident automatically advanced to phase ${Number(ready[0].phase) + 1}`);
  return true;
}

async function recordDueArrivals(session) {
  if (session.status !== "active" && session.status !== "paused") return;
  const start = session.events.find(e => e.type === "incident-start");
  if (!start) return;
  const startedAt = new Date(start.at).getTime();
  const clock = session.events.filter(e => e.type === "instructor" && new Date(e.at).getTime() >= startedAt);
  let pausedAt = null, pausedMs = 0;
  for (const item of clock) {
    const at = new Date(item.at).getTime();
    if (item.text.includes(": pause ")) pausedAt = at;
    else if (item.text.includes(": resume ") && pausedAt !== null) { pausedMs += at - pausedAt; pausedAt = null; }
  }
  if (pausedAt !== null) pausedMs += Date.now() - pausedAt;
  const elapsed = Math.max(0, (Date.now() - startedAt - pausedMs) / 1000);
  if (session.status === "paused") return;
  const already = new Set(session.events.filter(e => e.type === "arrival").map(e => e.role));
  for (const role of roles) {
    if (role === "engine" || already.has(role)) continue;
    if (elapsed >= (arrivalSchedule[role] ?? Infinity)) {
      await eventRow(session.code, "arrival", `${scenarioRoles[role]?.title || role} arrived on scene`, role);
    }
  }
}
const authorize = (s, body, query) => {
  const instructor = equalHash(body.instructorKey || query.instructorKey || "", s.instructor_key_hash);
  const participantId = body.participantId || query.participantId || "";
  const participant = s.participants.find(p => p.id === participantId);
  return { instructor, participantId, participant };
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return json(204, {});
  if (!["GET", "POST"].includes(event.httpMethod)) return json(405, { error: "Method not allowed" });
  try {
    const sql = db();
    const query = event.queryStringParameters || {};
    const body = event.httpMethod === "POST" ? JSON.parse(event.body || "{}") : {};
    const action = body.action;
    if (action === "create" && event.httpMethod === "POST") {
      const instructorKey = token();
      let code;
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = token(3).toUpperCase();
        const inserted = await sql`INSERT INTO live_sessions (code, instructor_key_hash) VALUES (${candidate}, ${hash(instructorKey)}) ON CONFLICT DO NOTHING RETURNING code`;
        if (inserted.length) { code = candidate; break; }
      }
      if (!code) return json(503, { error: "Could not allocate a session code" });
      await eventRow(code, "system", "Instructor created the live incident");
      return json(200, { code, instructorKey, state: publicState(await getSession(code), "", true, true) });
    }
    const code = String(body.code || query.code || "").toUpperCase();
    const s = await getSession(code);
    if (!s) return json(404, { error: "Session not found" });
    const auth = authorize(s, body, query);
    if (event.httpMethod === "GET") {
      if (!auth.instructor && !auth.participant) return json(403, { error: "Session authentication required" });
      await recordDueArrivals(s);
      const fresh = await getSession(code);
      if (fresh?.status === "active") await autoAdvanceIfReady(code, Number(fresh.phase));
      return json(200, publicState(await getSession(code), auth.participantId, auth.instructor, query.includeSceneImage === "1"));
    }
    if (action === "join") {
      if (s.status !== "lobby") return json(409, { error: "Session already started" });
      const name = String(body.name || "").trim().slice(0, 60);
      const role = String(body.role || "");
      if (!name || !roles.includes(role)) return json(400, { error: "Valid name and role required" });
      const participantId = token(24);
      const inserted = await sql`INSERT INTO live_participants (id, session_code, name, role)
        SELECT ${participantId}, ${code}, ${name}, ${role}
        WHERE EXISTS (SELECT 1 FROM live_sessions WHERE code = ${code} AND status = 'lobby')
        ON CONFLICT DO NOTHING RETURNING id`;
      if (!inserted.length) return json(409, { error: "Role taken or session started" });
      await eventRow(code, "join", `${name} joined as ${role}`, role);
      return json(200, { participantId, state: publicState(await getSession(code), participantId, false, false) });
    }
    if (action === "inject") {
      if (!auth.instructor) return json(403, { error: "Instructor authorization required" });
      if (s.status === "ended" || s.status === "lobby") return json(409, { error: "Incident must be running or paused" });
      const customText = String(body.customText || "").trim().slice(0, 500);
      const preset = instructorInjects[String(body.injectId || "")];
      if (!customText && !preset) return json(400, { error: "Enter a live prompt or choose an update" });
      const target = String(body.targetRole || "");
      if (!roles.includes(target)) return json(400, { error: "Choose one recipient role" });
      if (preset && !customText && !preset.roles.includes(target)) return json(400, { error: "Invalid target role for this update" });
      const message = customText || (preset.title + ": " + preset.text);
      await eventRow(code, "inject", customText ? "Instructor prompt: " + message : message, target);
      return json(200, { state: publicState(await getSession(code), "", true) });
    }
    if (action === "discover") {
      if (!auth.participant || auth.participant.role !== "engine") return json(403, { error: "Engine 181 first-due authorization required" });
      if (s.status !== "active") return json(409, { error: "Scenario is not active" });
      if (s.events.some(e=>e.type==="handoff-accepted")) return json(403,{error:"Engine 181 has transferred tactical control"});
      const side = String(body.side || "");
      if (!Object.hasOwn(sceneSides, side)) return json(400, { error: "Unknown 360 side" });
      await eventRow(code, "discovery", "Engine 181 viewed 360: " + side, "engine");
      await autoAdvanceIfReady(code, Number(s.phase));
      return json(200, { state: publicState(await getSession(code), auth.participantId, false) });
    }
    if (action === "assignment") {
      if (!auth.participant || !["engine","command"].includes(auth.participant.role)) return json(403, { error: "Acting command authorization required" });
      if (s.status !== "active") return json(409, { error: "Scenario is not active" });
      if (auth.participant.role !== (s.events.some(e=>e.type==="handoff-accepted") ? "command" : "engine")) return json(403, { error: "Tactical control belongs to the current incident lead" });
      const target = String(body.targetRole || "");
      const assignment = String(body.assignment || "").trim().slice(0, 160);
      if (!roles.includes(target) || target === "command" || !assignment) return json(400, { error: "Choose a unit and enter its assignment" });
      await eventRow(code, "assignment", assignment, target);
      return json(200, { state: publicState(await getSession(code), auth.participantId, false) });
    }
    if (action === "mode") {
      if (!auth.participant || auth.participant.role !== "engine") return json(403, { error: "Engine 181 first-due authorization required" });
      if (s.status !== "active") return json(409, { error: "Scenario is not active" });
      if (s.events.some(e=>e.type==="handoff-accepted")) return json(403,{error:"Incident Command has accepted tactical control"});
      const mode = String(body.mode || "");
      if (Number(s.phase) !== 0 || s.events.some(e=>e.type==="mode")) return json(409, { error: "Initial attack mode has already been set" });
      const choices = { offensive:"offensive", investigate:"delayed-reinforcement", defensive:"defensive" };
      if (!Object.hasOwn(choices, mode)) return json(400, { error: "Choose a valid attack mode" });
      await sql.transaction([
        sql`UPDATE live_sessions SET branch = ${choices[mode]}, updated_at = now() WHERE code = ${code}`,
        sql`INSERT INTO live_events (session_code, type, text, role) VALUES (${code}, 'mode', ${"Attack mode: " + mode}, 'engine')`
      ]);
      await autoAdvanceIfReady(code, Number(s.phase));
      return json(200, { state: publicState(await getSession(code), auth.participantId, false) });
    }
    if (action === "instructor") {
      if (!auth.instructor) return json(403, { error: "Instructor authorization required" });
      const command = String(body.command || "");
      const transitions = {
        start: ["active", 0], next: ["active", Math.min(4, s.phase + 1)],
        previous: [s.status, Math.max(0, s.phase - 1)],
        pause: ["paused", s.phase], resume: ["active", s.phase], end: ["ended", s.phase]
      };
      if (command === "reassign") {
        const participantId = String(body.participantId || "");
        const targetRole = String(body.targetRole || "");
        const participant = s.participants.find(p => p.id === participantId);
        if (!participant) return json(404, { error: "Participant not found" });
        if (!roles.includes(targetRole)) return json(400, { error: "Choose a valid crew role" });
        if (targetRole === participant.role) return json(400, { error: "Choose a different role" });
        if (s.status === "ended") return json(409, { error: "Session ended" });
        const changed = await sql`WITH session_lock AS MATERIALIZED (
          SELECT code FROM live_sessions WHERE code = ${code} FOR UPDATE
        ), moved AS (
          UPDATE live_participants p SET role = ${targetRole}, last_action = NULL
          FROM session_lock
          WHERE p.id = ${participantId} AND p.session_code = ${code}
            AND NOT EXISTS (SELECT 1 FROM live_participants occupied WHERE occupied.session_code = ${code} AND occupied.role = ${targetRole} AND occupied.id <> p.id)
          RETURNING p.id
        )
        INSERT INTO live_events (session_code, type, text, role)
        SELECT ${code}, 'role-change', ${"Instructor reassigned " + participant.name + " from " + (scenarioRoles[participant.role]?.title || participant.role) + " to " + (scenarioRoles[targetRole]?.title || targetRole)}, ${targetRole}
        FROM moved RETURNING id`;
        if (!changed.length) return json(409, { error: "That role is already assigned to another participant" });
        return json(200, { state: publicState(await getSession(code), "", true) });
      }
      if (command === "arrival") {
        const target = String(body.targetRole || "");
        if (!roles.includes(target) || target === "engine") return json(400, { error: "Choose a responding unit" });
        if (s.status !== "active" && s.status !== "paused") return json(409, { error: "Start the incident before advancing arrivals" });
        if (!s.events.some(e => e.type === "arrival" && e.role === target)) await eventRow(code, "arrival", `${scenarioRoles[target]?.title || target} arrived on scene by instructor override`, target);
        return json(200, { state: publicState(await getSession(code), "", true) });
      }
      if (command === "set-lead") {
        const target = String(body.targetRole || "");
        if (!["engine", "command"].includes(target)) return json(400, { error: "Incident lead must be Engine 181 or Incident Command" });
        if (s.status === "ended" || s.status === "lobby") return json(409, { error: "Incident must be running or paused" });
        if (target === "command" && !s.participants.some(p => p.role === "command")) return json(409, { error: "Incident Command has not joined" });
        await eventRow(code, "lead-change", "Instructor set incident lead to " + (scenarioRoles[target]?.title || target), target);
        return json(200, { state: publicState(await getSession(code), "", true) });
      }
      if (command === "set-branch") {
        const branch = String(body.branch || "");
        if (!branchOptions.includes(branch)) return json(400, { error: "Choose a valid tactical branch" });
        if (s.status === "ended" || s.status === "lobby") return json(409, { error: "Incident must be running or paused" });
        await sql.transaction([
          sql`UPDATE live_sessions SET branch = ${branch}, updated_at = now() WHERE code = ${code}`,
          sql`INSERT INTO live_events (session_code, type, text) VALUES (${code}, 'instructor', ${"Instructor redirected tactical branch to " + branch})`
        ]);
        return json(200, { state: publicState(await getSession(code), "", true) });
      }
      if (command === "override-loop") {
        const participantId = String(body.participantId || "");
        const resolution = String(body.resolution || "complete");
        const participant = s.participants.find(p => p.id === participantId);
        if (!participant) return json(404, { error: "Participant not found" });
        if (s.status === "ended" || s.status === "lobby") return json(409, { error: "Incident must be running or paused" });
        if (!["complete", "reset", "missed-radio"].includes(resolution)) return json(400, { error: "Choose complete, reset, or missed-radio" });
        const current = Number(participant.last_action?.phase) === Number(s.phase) ? participant.last_action : { phase: s.phase, choice: participant.last_action?.choice || "Instructor override", at: new Date().toISOString() };
        let updated;
        let eventType = "loop-override";
        let eventText;
        if (resolution === "reset") {
          updated = null;
          eventText = "Instructor reset the communication loop for " + (scenarioRoles[participant.role]?.title || participant.role);
        } else if (resolution === "missed-radio") {
          updated = { ...current, stage: "complete", commandResponse: current.commandResponse || "Instructor recorded missed radio step", acknowledgedAt: new Date().toISOString(), override: "missed-radio" };
          eventType = "missed-step";
          eventText = "Instructor recorded a missed communication step for " + (scenarioRoles[participant.role]?.title || participant.role) + " and continued the scenario";
        } else {
          updated = { ...current, stage: "complete", reportedAt: current.reportedAt || new Date().toISOString(), commandResponse: current.commandResponse || "Instructor override", respondedAt: current.respondedAt || new Date().toISOString(), acknowledgedAt: new Date().toISOString(), override: "complete" };
          eventText = "Instructor overrode a stalled communication loop for " + (scenarioRoles[participant.role]?.title || participant.role);
        }
        if (updated === null) {
          await sql`UPDATE live_participants SET last_action = NULL WHERE id = ${participantId} AND session_code = ${code}`;
        } else {
          await sql`UPDATE live_participants SET last_action = ${JSON.stringify(updated)}::jsonb WHERE id = ${participantId} AND session_code = ${code}`;
        }
        await eventRow(code, eventType, eventText, participant.role);
        if (resolution !== "reset") await autoAdvanceIfReady(code, Number(s.phase));
        return json(200, { state: publicState(await getSession(code), "", true) });
      }
      if (command === "benchmark") {
        const note = String(body.note || "").trim().slice(0, 200);
        if (!note) return json(400, { error: "Enter a short benchmark note" });
        if (s.status === "ended" || s.status === "lobby") return json(409, { error: "Incident must be running or paused" });
        await eventRow(code, "benchmark", "Benchmark: " + note, body.targetRole && roles.includes(body.targetRole) ? body.targetRole : null);
        return json(200, { state: publicState(await getSession(code), "", true) });
      }
      if (command === "unexpected") {
        const target = String(body.targetRole || "");
        const category = String(body.category || "");
        const consequence = String(body.consequence || "").trim().slice(0, 500);
        const shareWith = String(body.shareWith || "private");
        const changeBranch = Boolean(body.changeBranch);
        const nextBranch = String(body.branch || s.branch);
        const communicationSatisfied = Boolean(body.communicationSatisfied);
        if (!roles.includes(target)) return json(400, { error: "Select a role" });
        if (!unexpectedCategories.includes(category)) return json(400, { error: "Select an unexpected-action category" });
        if (!consequence) return json(400, { error: "Enter a short consequence" });
        if (s.status === "ended" || s.status === "lobby") return json(409, { error: "Incident must be running or paused" });
        if (changeBranch && !branchOptions.includes(nextBranch)) return json(400, { error: "Choose a valid branch when redirecting the scenario" });
        const participant = s.participants.find(p => p.role === target);
        const ops = [];
        if (changeBranch) ops.push(sql`UPDATE live_sessions SET branch = ${nextBranch}, updated_at = now() WHERE code = ${code}`);
        ops.push(sql`INSERT INTO live_events (session_code, type, text, role) VALUES (${code}, 'unexpected', ${"Unexpected action (" + category + ") for " + (scenarioRoles[target]?.title || target) + ": " + consequence + (changeBranch ? " [branch → " + nextBranch + "]" : "") + (communicationSatisfied ? " [radio requirement satisfied]" : "")}, ${target})`);
        if (shareWith === "private" || shareWith === "shared") {
          const injectText = shareWith === "shared" ? "Scene update: " + consequence : "Instructor prompt: " + consequence;
          const injectRole = shareWith === "shared" ? null : target;
          ops.push(sql`INSERT INTO live_events (session_code, type, text, role) VALUES (${code}, 'inject', ${injectText}, ${injectRole})`);
        }
        if (communicationSatisfied && participant) {
          const current = Number(participant.last_action?.phase) === Number(s.phase) ? participant.last_action : { phase: s.phase, choice: category, at: new Date().toISOString() };
          const updated = { ...current, stage: "complete", reportedAt: current.reportedAt || new Date().toISOString(), commandResponse: current.commandResponse || "Unexpected action accepted", respondedAt: current.respondedAt || new Date().toISOString(), acknowledgedAt: new Date().toISOString(), override: "unexpected" };
          ops.push(sql`UPDATE live_participants SET last_action = ${JSON.stringify(updated)}::jsonb WHERE id = ${participant.id} AND session_code = ${code}`);
        }
        await sql.transaction(ops);
        if (communicationSatisfied) await autoAdvanceIfReady(code, Number(s.phase));
        return json(200, { state: publicState(await getSession(code), "", true) });
      }
      if (!transitions[command]) return json(400, { error: "Unknown instructor command" });
      if (s.status === "ended") return json(409, { error: "Session ended" });
      const [status, phase] = transitions[command];
      await sql.transaction([
        sql`UPDATE live_sessions SET status = ${status}, phase = ${phase}, updated_at = now() WHERE code = ${code}`,
        sql`INSERT INTO live_events (session_code, type, text) VALUES (${code}, ${command === "start" ? "incident-start" : "instructor"}, ${"Instructor: " + command + " (phase " + (phase + 1) + ")"})`
      ]);
      return json(200, { state: publicState(await getSession(code), "", true) });
    }
    if (action === "handoff") {
      if (!auth.participant || auth.participant.role !== "engine") return json(403, { error: "Only Engine 181 can send the command handoff" });
      if (s.status !== "active" && s.status !== "paused") return json(409, { error: "Incident must be running or paused" });
      if (!s.events.some(e => e.type === "arrival" && e.role === "command")) return json(409, { error: "Incident Command has not arrived yet" });
      if (s.events.some(e => e.type === "handoff")) return json(409, { error: "Handoff was already sent" });
      const discoveries = s.events.filter(e=>e.type==="discovery"&&e.role==="engine").map(e=>e.text.split(": ").pop());
      const mode = s.events.find(e=>e.type==="mode")?.text.replace(/^Attack mode: /, "") || "not yet selected";
      const assignments = s.events.filter(e=>e.type==="assignment").map(e=>`${scenarioRoles[e.role]?.title || e.role}: ${e.text}`);
      const report = `Engine 181 handoff — 360 completed: ${discoveries.join(", ") || "not completed"}. Initial strategy: ${mode}. Unit assignments: ${assignments.join("; ") || "none recorded"}. Confirm current conditions and outstanding assignments.`;
      await eventRow(code,"handoff",report,"engine");
      return json(200,{state:publicState(await getSession(code),auth.participantId,false)});
    }
    if (action === "accept-handoff") {
      if (!auth.participant || auth.participant.role !== "command") return json(403,{error:"Only incoming Incident Command can accept the handoff"});
      if (!s.events.some(e=>e.type==="arrival"&&e.role==="command")) return json(409,{error:"Incident Command has not arrived yet"});
      if (!s.events.some(e=>e.type==="handoff")) return json(409,{error:"Engine 181 has not sent the radio handoff"});
      if (!s.events.some(e=>e.type==="handoff-accepted")) await eventRow(code,"handoff-accepted","Incident Command accepted Engine 181’s radio handoff","command");
      return json(200,{state:publicState(await getSession(code),auth.participantId,false)});
    }
    if (action === "forecast") {
      const forecastRole = auth.instructor ? "instructor" : auth.participant?.role;
      if (!auth.instructor && !auth.participant) return json(403, { error: "Participant authorization required" });
      if (s.status !== "active") return json(409, { error: "Forecasts are available while the scenario is active" });
      const choice = String(body.choice || "").slice(0, 160);
      if (!forecastOptions[forecastRole]?.includes(choice)) return json(400, { error: "Forecast choice is not available" });
      await eventRow(code, "forecast", choice, forecastRole);
      return json(200, { state: publicState(await getSession(code), auth.participantId, Boolean(auth.instructor)) });
    }
    if (action === "confirm-radio") {
      if (!auth.participant) return json(403, { error: "Participant authorization required" });
      if (s.status !== "active") return json(409, { error: "Scenario is not active" });
      const current = auth.participant.last_action;
      if (Number(current?.phase) !== Number(s.phase) || current?.stage !== "decision") return json(409, { error: "Make your current tactical decision before confirming the radio report" });
      const handoffAccepted = s.events.some(e => e.type === "handoff-accepted");
      const leadOverride = [...s.events].reverse().find(e => e.type === "lead-change");
      const leaderRole = leadOverride?.role || (handoffAccepted ? "command" : "engine");
      const isLeader = auth.participant.role === leaderRole;
      const updated = JSON.stringify({ ...current, stage:isLeader ? "complete" : "awaiting-command", reportedAt:new Date().toISOString() });
      await sql.transaction([
        sql`UPDATE live_participants SET last_action = ${updated}::jsonb WHERE id = ${auth.participantId} AND session_code = ${code} AND last_action->>'stage' = 'decision'`,
        sql`INSERT INTO live_events (session_code, type, text, role) VALUES (${code}, 'radio-confirmed', ${auth.participant.name + " confirmed a radio report was transmitted"}, ${auth.participant.role})`
      ]);
      if (isLeader && branchChoices[current.choice]) {
        await sql`UPDATE live_sessions SET branch = ${branchChoices[current.choice]}, updated_at = now() WHERE code = ${code}`;
      }
      await autoAdvanceIfReady(code, Number(s.phase));
      return json(200, { state: publicState(await getSession(code), auth.participantId, false) });
    }
    if (action === "command-response") {
      if (!auth.participant && !auth.instructor) return json(403, { error: "Incident lead authorization required" });
      if (s.status !== "active") return json(409, { error: "Scenario is not active" });
      const handoffAccepted = s.events.some(e => e.type === "handoff-accepted");
      const leadOverride = [...s.events].reverse().find(e => e.type === "lead-change");
      const leaderRole = leadOverride?.role || (handoffAccepted ? "command" : "engine");
      if (!auth.instructor && auth.participant?.role !== leaderRole) return json(403, { error: "Only the current incident lead can record the radio response" });
      const targetId = String(body.targetParticipantId || "");
      const response = String(body.response || "");
      if (!radioResponses.includes(response)) return json(400, { error: "Choose the radio response that best matches what you transmitted" });
      const target = s.participants.find(p => p.id === targetId);
      if (!target || target.role === leaderRole || Number(target.last_action?.phase) !== Number(s.phase) || target.last_action?.stage !== "awaiting-command") return json(409, { error: "That unit does not have a radio report awaiting a response" });
      const updated = JSON.stringify({ ...target.last_action, stage:"awaiting-ack", commandResponse:response, respondedAt:new Date().toISOString() });
      const changed = await sql`UPDATE live_participants SET last_action = ${updated}::jsonb WHERE id = ${targetId} AND session_code = ${code} AND last_action->>'stage' = 'awaiting-command' RETURNING id`;
      if (!changed.length) return json(409, { error: "That radio report was already handled" });
      const responder = auth.instructor ? "Instructor (for incident lead)" : (scenarioRoles[leaderRole]?.title || leaderRole);
      await eventRow(code, "command-response", responder + " confirmed a radio response to " + (scenarioRoles[target.role]?.title || target.role) + ": " + response, target.role);
      return json(200, { state: publicState(await getSession(code), auth.participantId, Boolean(auth.instructor)) });
    }
    if (action === "acknowledge-radio") {
      if (!auth.participant) return json(403, { error: "Participant authorization required" });
      if (s.status !== "active") return json(409, { error: "Scenario is not active" });
      const current = auth.participant.last_action;
      if (Number(current?.phase) !== Number(s.phase) || current?.stage !== "awaiting-ack") return json(409, { error: "No current Command response is waiting for acknowledgement" });
      const updated = JSON.stringify({ ...current, stage:"complete", acknowledgedAt:new Date().toISOString() });
      const changed = await sql`UPDATE live_participants SET last_action = ${updated}::jsonb WHERE id = ${auth.participantId} AND session_code = ${code} AND last_action->>'stage' = 'awaiting-ack' RETURNING id`;
      if (!changed.length) return json(409, { error: "Acknowledgement was already recorded" });
      await eventRow(code, "radio-acknowledged", auth.participant.name + " confirmed the radio assignment was acknowledged", auth.participant.role);
      await autoAdvanceIfReady(code, Number(s.phase));
      return json(200, { state: publicState(await getSession(code), auth.participantId, false) });
    }
    if (action === "participant") {
      if (!auth.participant) return json(403, { error: "Participant authorization required" });
      if (s.status !== "active") return json(409, { error: "Scenario is not active" });
      const choice = String(body.choice || "").slice(0, 120);
      const arrived = auth.participant.role === "engine" || s.events.some(e=>e.type==="arrival"&&e.role===auth.participant.role);
      const leadOverride = [...s.events].reverse().find(e => e.type === "lead-change");
      const handoffAccepted = s.events.some(e=>e.type==="handoff-accepted");
      const leaderRole = leadOverride?.role || (handoffAccepted ? "command" : "engine");
      const waitingForHandoff = auth.participant.role === "command" && leaderRole !== "command" && !handoffAccepted;
      if (waitingForHandoff && arrived) return json(409,{error:"Accept Engine 181’s handoff before directing the incident"});
      const current = auth.participant.last_action;
      if (Number(current?.phase) === Number(s.phase) && ["decision", "awaiting-command", "awaiting-ack"].includes(current?.stage)) {
        return json(409, { error: "Complete the current radio communication loop before selecting another action" });
      }
      const currentEvent = (!arrived && arrivalEvents[auth.participant.role])
        ? arrivalEvents[auth.participant.role]
        : (auth.participant.role === "engine2" && Number(s.phase) === 0 ? scenarioRoles.engine2.events[1] : resolveEvent(auth.participant.role, s.phase, s.branch));
      const available = currentEvent?.[2] || [];
      if (!available.includes(choice)) return json(400, { error: "Choice is not available for your current role and phase" });
      const lastAction = JSON.stringify({ phase:s.phase, choice, stage:"decision", at:new Date().toISOString() });
      await sql.transaction([
        sql`UPDATE live_participants SET last_action = ${lastAction}::jsonb WHERE id = ${auth.participantId} AND session_code = ${code}`,
        sql`INSERT INTO live_events (session_code, type, text, role) VALUES (${code}, 'decision', ${auth.participant.name + " selected a tactical action and must report it by department radio"}, ${auth.participant.role})`
      ]);
      return json(200, { state: publicState(await getSession(code), auth.participantId, false) });
    }
    return json(400, { error: "Unknown action" });
  } catch (err) {
    console.error("Live crew session error", err);
    const missingDatabase = !process.env.DATABASE_URL;
    const message = String(err?.message || "").toLowerCase();
    const connection = String(process.env.DATABASE_URL || "");
    const formatValid = /^postgres(?:ql)?:\/\//i.test(connection);
    const isFetch = /fetch failed|failed to fetch|network|enotfound|econnreset|timeout|timed out|certificate|tls|ssl/i.test(message);
    const isAuth = /password authentication|authentication failed|invalid password|unauthorized/i.test(message);
    const isDatabase = /database .* does not exist|unknown database/i.test(message);
    const isSchema = /relation .* does not exist|undefined table/i.test(message);
    const code = typeof err?.code === "string" && /^[A-Z0-9]{5}$/.test(err.code) ? err.code : null;
    const reason = code === "42P01" ? "Required database table is missing." :
      code === "42501" ? "Database user lacks required table permissions." :
      code === "23502" ? "Database schema is missing a required default value." :
      code === "3D000" ? "Database name in the connection string does not exist." :
      code === "28P01" ? "Database credentials were rejected." :
      code === "08006" ? "Database connection could not be established." :
      !formatValid ? "DATABASE_URL is not a PostgreSQL connection string." :
      isAuth ? "Neon rejected the database credentials." :
      isDatabase ? "The database named in DATABASE_URL was not found." :
      isSchema ? "The connected database is missing the Live Crew tables." :
      isFetch ? "The serverless database network request failed." :
      "Database request failed.";
    return json(503, { error: missingDatabase ? "DATABASE_URL is unavailable to this deployment." : reason + (code ? " (PostgreSQL " + code + ")" : " Check the Netlify function logs."), diagnosticCode: code, diagnosticType: !formatValid ? "url-format" : isAuth ? "authentication" : isDatabase ? "database" : isSchema ? "schema" : isFetch ? "network" : "unknown" });
  }
}

