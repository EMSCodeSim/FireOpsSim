import { getStore } from "@netlify/blobs";

const store = getStore("live-crew-sessions");
const validRoles = ["command","engine","truck","rit","engine2"];

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS"
  },
  body: JSON.stringify(body)
});

const id = (n=18) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => (b % 36).toString(36)).join("");
const makeCode = () => id(6).toUpperCase();

async function getSession(code){
  if(!code) return null;
  return await store.get(`session:${code.toUpperCase()}`, { type: "json" });
}
async function saveSession(session){
  session.updatedAt = new Date().toISOString();
  await store.setJSON(`session:${session.code}`, session);
  return session;
}
function publicState(session, participantId){
  const participant = session.participants?.[participantId] || null;
  return {
    code: session.code,
    status: session.status,
    phase: session.phase,
    branch: session.branch,
    participants: Object.values(session.participants || {}).map(p => ({name:p.name,role:p.role,joinedAt:p.joinedAt})),
    roleClaims: session.roleClaims || {},
    timeline: session.timeline || [],
    participant,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}
function log(session, type, text, role=null){
  session.timeline = session.timeline || [];
  session.timeline.push({at:new Date().toISOString(),type,text,role});
  if(session.timeline.length > 120) session.timeline = session.timeline.slice(-120);
}

export async function handler(event){
  if(event.httpMethod === "OPTIONS") return json(204,{});
  try{
    if(event.httpMethod === "GET"){
      const code = event.queryStringParameters?.code?.toUpperCase();
      const participantId = event.queryStringParameters?.participantId || "";
      const session = await getSession(code);
      if(!session) return json(404,{error:"Session not found"});
      return json(200, publicState(session, participantId));
    }
    if(event.httpMethod !== "POST") return json(405,{error:"Method not allowed"});

    const body = JSON.parse(event.body || "{}");
    const action = body.action;

    if(action === "create"){
      let code = makeCode();
      while(await getSession(code)) code = makeCode();
      const instructorKey = id(24);
      const session = {
        code,
        instructorKey,
        status:"lobby",
        phase:0,
        branch:"initial",
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString(),
        participants:{},
        roleClaims:{},
        timeline:[]
      };
      log(session,"system","Instructor created the live incident");
      await saveSession(session);
      return json(200,{code,instructorKey,state:publicState(session,"")});
    }

    const code = String(body.code || "").toUpperCase();
    const session = await getSession(code);
    if(!session) return json(404,{error:"Session not found"});

    if(action === "join"){
      const name = String(body.name || "").trim().slice(0,60);
      const role = String(body.role || "");
      if(!name) return json(400,{error:"Name/unit is required"});
      if(!validRoles.includes(role)) return json(400,{error:"Choose a valid role"});
      if(session.roleClaims?.[role]) return json(409,{error:"That role is already assigned"});
      const participantId = id(20);
      session.participants[participantId] = {id:participantId,name,role,joinedAt:new Date().toISOString(),lastAction:null};
      session.roleClaims[role] = participantId;
      log(session,"join",`${name} joined as ${role}`,role);
      await saveSession(session);
      return json(200,{participantId,state:publicState(session,participantId)});
    }

    if(action === "instructor"){
      if(body.instructorKey !== session.instructorKey) return json(403,{error:"Instructor key rejected"});
      const cmd = body.command;
      if(cmd === "start"){
        session.status = "active";
        session.phase = 0;
        log(session,"instructor","Scenario started");
      } else if(cmd === "next"){
        session.status = "active";
        session.phase = Math.min(4, Number(session.phase || 0) + 1);
        log(session,"inject",`Instructor advanced scenario to phase ${session.phase + 1}`);
      } else if(cmd === "previous"){
        session.phase = Math.max(0, Number(session.phase || 0) - 1);
        log(session,"instructor",`Instructor returned scenario to phase ${session.phase + 1}`);
      } else if(cmd === "pause"){
        session.status = "paused";
        log(session,"instructor","Scenario paused");
      } else if(cmd === "resume"){
        session.status = "active";
        log(session,"instructor","Scenario resumed");
      } else if(cmd === "end"){
        session.status = "ended";
        log(session,"instructor","Scenario ended; begin AAR");
      } else {
        return json(400,{error:"Unknown instructor command"});
      }
      await saveSession(session);
      return json(200,{state:publicState(session,"")});
    }

    if(action === "participant"){
      const participantId = String(body.participantId || "");
      const p = session.participants?.[participantId];
      if(!p) return json(403,{error:"Participant not recognized"});
      const choice = String(body.choice || "").slice(0,120);
      if(!choice) return json(400,{error:"Choice/action is required"});
      p.lastAction = {phase:session.phase,choice,at:new Date().toISOString()};
      log(session,"action",`${p.name}: ${choice}`,p.role);
      if(p.role === "command"){
        if(choice === "Send a second line to Division 2") session.branch = "reinforced-attack";
        if(choice === "Continue current attack") session.branch = "delayed-reinforcement";
        if(choice === "Order withdrawal") session.branch = "withdrawal";
        if(choice === "Request additional alarm") session.branch = "additional-alarm";
        if(choice === "Defensive operations") session.branch = "defensive";
        if(choice === "Offensive operations") session.branch = "offensive";
      }
      await saveSession(session);
      return json(200,{state:publicState(session,participantId)});
    }

    return json(400,{error:"Unknown action"});
  } catch(err){
    console.error(err);
    return json(500,{error:"Live session service error"});
  }
}
