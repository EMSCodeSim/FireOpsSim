import { neon } from "@neondatabase/serverless";
import { roles as scenarioRoles, visualCopy, resolveEvent, instructorInjects } from "./live-crew-content.mjs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const roles = ["command", "engine", "truck", "rit", "engine2"];
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
function publicState(s, participantId, instructor) {
  const own = s.participants.find(p => p.id === participantId);
  const role = instructor ? "command" : own?.role;
  const definition = role ? scenarioRoles[role] : null;
  const event = instructor ? null : resolveEvent(role, s.phase, s.branch);
  const injects = instructor ? [] : s.events.filter(e => e.type === "inject" && (e.role === role || e.role === null)).slice(-5).map(e => ({at:e.at,text:e.text}));
  const sceneKey = visualCopy[s.branch] ? s.branch : "initial";
  const scene = role ? (visualCopy[sceneKey]?.[role] || visualCopy.initial[role]) : null;
  return {
    event,
    injects,
    scene,
    code: s.code, status: s.status, phase: s.phase, branch: s.branch,
    participants: instructor ? s.participants.map(p => ({ name: p.name, role: p.role, joinedAt: p.joined_at })) : [],
    timeline: instructor ? s.events : s.events.filter(e => ["system", "instructor"].includes(e.type) || (e.type === "inject" && (e.role === own?.role || e.role === null))),
    participant: own ? { id: own.id, name: own.name, role: own.role, joinedAt: own.joined_at, lastAction: own.last_action } : null,
    createdAt: s.created_at, updatedAt: s.updated_at
  };
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
      return json(200, { code, instructorKey, state: publicState(await getSession(code), "", true) });
    }
    const code = String(body.code || query.code || "").toUpperCase();
    const s = await getSession(code);
    if (!s) return json(404, { error: "Session not found" });
    const auth = authorize(s, body, query);
    if (event.httpMethod === "GET") {
      if (!auth.instructor && !auth.participant) return json(403, { error: "Session authentication required" });
      return json(200, publicState(s, auth.participantId, auth.instructor));
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
      return json(200, { participantId, state: publicState(await getSession(code), participantId, false) });
    }
    if (action === "inject") {
      if (!auth.instructor) return json(403, { error: "Instructor authorization required" });
      if (s.status === "ended" || s.status === "lobby") return json(409, { error: "Incident must be running or paused" });
      const inject = instructorInjects[String(body.injectId || "")];
      if (!inject) return json(400, { error: "Unknown inject" });
      const target = String(body.targetRole || "");
      if (!inject.roles.includes(target)) return json(400, { error: "Invalid target role" });
      await eventRow(code, "inject", inject.title + ": " + inject.text, target);
      return json(200, { state: publicState(await getSession(code), "", true) });
    }
    if (action === "instructor") {
      if (!auth.instructor) return json(403, { error: "Instructor authorization required" });
      const command = String(body.command || "");
      const transitions = {
        start: ["active", 0], next: ["active", Math.min(4, s.phase + 1)],
        previous: [s.status, Math.max(0, s.phase - 1)],
        pause: ["paused", s.phase], resume: ["active", s.phase], end: ["ended", s.phase]
      };
      if (!transitions[command]) return json(400, { error: "Unknown instructor command" });
      if (s.status === "ended") return json(409, { error: "Session ended" });
      const [status, phase] = transitions[command];
      await sql.transaction([
        sql`UPDATE live_sessions SET status = ${status}, phase = ${phase}, updated_at = now() WHERE code = ${code}`,
        sql`INSERT INTO live_events (session_code, type, text) VALUES (${code}, 'instructor', ${"Instructor: " + command + " (phase " + (phase + 1) + ")"})`
      ]);
      return json(200, { state: publicState(await getSession(code), "", true) });
    }
    if (action === "participant") {
      if (!auth.participant) return json(403, { error: "Participant authorization required" });
      if (s.status !== "active") return json(409, { error: "Scenario is not active" });
      const choice = String(body.choice || "").slice(0, 120);
      const available = resolveEvent(auth.participant.role, s.phase, s.branch)?.[2] || [];
      if (!available.includes(choice)) return json(400, { error: "Choice is not available for your current role and phase" });
      const branchChoices = {
        "Send a second line to Division 2": "reinforced-attack",
        "Continue current attack": "delayed-reinforcement",
        "Order withdrawal": "withdrawal",
        "Request additional alarm": "additional-alarm",
        "Defensive operations": "defensive",
        "Offensive operations": "offensive"
      };
      const branch = auth.participant.role === "command" ? branchChoices[choice] : null;
      const lastAction = JSON.stringify({ phase: s.phase, choice, at: new Date().toISOString() });
      const updates = [
        sql`UPDATE live_participants SET last_action = ${lastAction}::jsonb WHERE id = ${auth.participantId} AND session_code = ${code}`,
        sql`INSERT INTO live_events (session_code, type, text, role) VALUES (${code}, 'action', ${auth.participant.name + ": " + choice}, ${auth.participant.role})`
      ];
      if (branch) updates.push(sql`UPDATE live_sessions SET branch = ${branch}, updated_at = now() WHERE code = ${code}`);
      await sql.transaction(updates);
      return json(200, { state: publicState(await getSession(code), auth.participantId, false) });
    }
    return json(400, { error: "Unknown action" });
  } catch (err) {
    console.error("Live crew session error", err);
    const missingDatabase = !process.env.DATABASE_URL;
    return json(503, { error: missingDatabase ? "Database connection is not configured for this deployment. Check Netlify environment variable scopes and redeploy." : "Database request failed. Check Netlify function logs for the Live Crew database error." });
  }
}
