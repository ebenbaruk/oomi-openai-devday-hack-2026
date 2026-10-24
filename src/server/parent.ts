import { createHash, randomInt, randomUUID } from "node:crypto";
import { getPool } from "./db";

export type ParentDashboard = {
  child: { id: string; name: string; age: number; language: "fr" | "en" };
  settings: { dailyMinutes: number; quietStart: string | null; quietEnd: string | null; bedtimeStoryEnabled: boolean; parentNotificationsEnabled: boolean };
  careTopics: Array<{ id: string; kind: "family_change" | "adoption" | "grief" | "other"; privateNote: string | null; active: boolean }>;
  discoveries: Array<{ id: string; topic: string; summary: string; activityTitle: string | null; activitySteps: string[]; parentTip: string | null; status: "suggested" | "completed" | "saved"; createdAt: string }>;
  memories: Array<{ id: string; discoveryId: string | null; kind: "interest" | "challenge" | "fact" | "preference"; content: string; weight: number; createdAt: string }>;
  stories: Array<{ id: string; title: string; summary: string; status: "draft" | "ready" | "failed"; createdAt: string }>;
  alerts: Array<{ id: string; title: string; summary: string; status: "new" | "read" | "dismissed"; createdAt: string }>;
  today: { sessions: number; approvedTurns: number; grownUpTurns: number; newAlerts: number };
};

type ChildRow = { id: string; first_name: string; age: number; language: "fr" | "en"; max_session_minutes: number | null; story_enabled: boolean | null };
type Activity = { title?: string; steps?: string[]; parentTip?: string };

async function firstChild() {
  const result = await getPool().query<ChildRow>(`SELECT c.id,c.first_name,c.age,c.language,s.max_session_minutes,s.story_enabled
    FROM child c LEFT JOIN settings s ON s.child_id=c.id ORDER BY c.created_at LIMIT 1`);
  return result.rows[0] ?? null;
}

export async function parentDashboard(): Promise<ParentDashboard | null> {
  const child = await firstChild();
  if (!child) return null;
  const [topics, discoveries, memories, stories, alerts, stats] = await Promise.all([
    getPool().query(`SELECT id,kind,private_note,active FROM parent_care_topics WHERE child_id=$1 ORDER BY created_at`, [child.id]),
    getPool().query(`SELECT id,topic,summary,activity,created_at FROM discovery WHERE child_id=$1 ORDER BY created_at DESC LIMIT 30`, [child.id]),
    getPool().query(`SELECT id,source_discovery_id,kind,content,weight,created_at FROM memory WHERE child_id=$1 AND status='active' ORDER BY created_at DESC LIMIT 50`, [child.id]),
    getPool().query(`SELECT id,title,text,created_at FROM story WHERE child_id=$1 ORDER BY created_at DESC LIMIT 12`, [child.id]),
    getPool().query(`SELECT id,title,summary,status,created_at FROM parent_alerts WHERE child_id=$1 AND status <> 'dismissed' ORDER BY created_at DESC LIMIT 20`, [child.id]),
    getPool().query(`SELECT
      (SELECT count(*)::int FROM voice_sessions WHERE owner_id=$1 AND created_at >= date_trunc('day', now())) sessions,
      (SELECT count(*)::int FROM turn_audits a JOIN voice_sessions s ON s.id=a.session_id WHERE s.owner_id=$1 AND a.created_at >= date_trunc('day', now()) AND a.verdict='answer') approved_turns,
      (SELECT count(*)::int FROM turn_audits a JOIN voice_sessions s ON s.id=a.session_id WHERE s.owner_id=$1 AND a.created_at >= date_trunc('day', now()) AND a.verdict='grown_up') grown_up_turns,
      (SELECT count(*)::int FROM parent_alerts WHERE child_id=$1 AND status='new') new_alerts`, [child.id]),
  ]);
  const metrics = stats.rows[0] ?? { sessions: 0, approved_turns: 0, grown_up_turns: 0, new_alerts: 0 };
  return {
    child: { id: child.id, name: child.first_name, age: child.age, language: child.language },
    settings: { dailyMinutes: child.max_session_minutes ?? 15, quietStart: null, quietEnd: null, bedtimeStoryEnabled: child.story_enabled ?? true, parentNotificationsEnabled: true },
    careTopics: topics.rows.map(row => ({ id: row.id, kind: row.kind, privateNote: row.private_note, active: row.active })),
    discoveries: discoveries.rows.map(row => {
      const activity = (row.activity && typeof row.activity === "object" ? row.activity : {}) as Activity;
      return { id: row.id, topic: row.topic ?? "Une découverte", summary: row.summary ?? "", activityTitle: activity.title ?? null, activitySteps: Array.isArray(activity.steps) ? activity.steps : [], parentTip: activity.parentTip ?? null, status: "saved" as const, createdAt: row.created_at.toISOString() };
    }),
    memories: memories.rows.map(row => ({ id: row.id, discoveryId: row.source_discovery_id, kind: row.kind, content: row.content, weight: row.weight, createdAt: row.created_at.toISOString() })),
    stories: stories.rows.map(row => ({ id: row.id, title: row.title, summary: row.text, status: "ready" as const, createdAt: row.created_at.toISOString() })),
    alerts: alerts.rows.map(row => ({ id: row.id, title: row.title, summary: row.summary, status: row.status, createdAt: row.created_at.toISOString() })),
    today: { sessions: metrics.sessions, approvedTurns: metrics.approved_turns, grownUpTurns: metrics.grown_up_turns, newAlerts: metrics.new_alerts },
  };
}

export async function saveSettings(settings: ParentDashboard["settings"]) {
  const child = await firstChild(); if (!child) throw new Error("No child");
  await getPool().query(`INSERT INTO settings(child_id,max_session_minutes,allowed_hours,story_enabled,updated_at)
    VALUES($1,$2,'{}'::jsonb,$3,now()) ON CONFLICT(child_id) DO UPDATE SET max_session_minutes=$2,story_enabled=$3,updated_at=now()`, [child.id, settings.dailyMinutes, settings.bedtimeStoryEnabled]);
}

export async function saveCareTopic(input: { kind: string; active: boolean; privateNote: string | null }) {
  const child = await firstChild(); if (!child) throw new Error("No child");
  await getPool().query(`INSERT INTO parent_care_topics(id,child_id,kind,active,private_note,updated_at) VALUES($1,$2,$3,$4,$5,now())
    ON CONFLICT(child_id,kind) DO UPDATE SET active=$4,private_note=$5,updated_at=now()`, [randomUUID(), child.id, input.kind, input.active, input.privateNote]);
}

export async function addDiscovery(input: { topic: string; summary: string; activityTitle: string | null; activitySteps: string[]; parentTip: string | null }) {
  const child = await firstChild(); if (!child) throw new Error("No child");
  const id = randomUUID();
  await getPool().query(`INSERT INTO discovery(id,child_id,verdict,question,topic,summary,activity,image_status)
    VALUES($1,$2,'answer','Journal parent',$3,$4,$5,'none')`, [id, child.id, input.topic, input.summary, JSON.stringify({ title: input.activityTitle, steps: input.activitySteps, parentTip: input.parentTip })]);
  return id;
}

export async function addMemory(input: { discoveryId: string | null; kind: string; content: string; weight: number }) {
  const child = await firstChild(); if (!child) throw new Error("No child");
  const id = randomUUID();
  await getPool().query("INSERT INTO memory(id,child_id,kind,content,weight,status,source_discovery_id) VALUES($1,$2,$3,$4,$5,'active',$6)", [id, child.id, input.kind, input.content, input.weight, input.discoveryId]);
  return id;
}

export async function addStory(input: { title: string; summary: string; sourceDiscoveryIds: string[] }) {
  const child = await firstChild(); if (!child) throw new Error("No child");
  const id = randomUUID();
  await getPool().query("INSERT INTO story(id,child_id,title,text,source_discovery_ids,image_urls,image_status) VALUES($1,$2,$3,$4,$5,'{}','none')", [id, child.id, input.title, input.summary, input.sourceDiscoveryIds]);
  return id;
}

export async function deleteMemory(id: string) {
  const child = await firstChild(); if (!child) return false;
  const result = await getPool().query("UPDATE memory SET status='deleted',updated_at=now() WHERE id=$1 AND child_id=$2 AND status='active'", [id, child.id]);
  return result.rowCount === 1;
}

export async function setAlertStatus(id: string, status: "new" | "read" | "dismissed") {
  const child = await firstChild(); if (!child) return false;
  const result = await getPool().query("UPDATE parent_alerts SET status=$3,read_at=CASE WHEN $3='read' THEN now() ELSE read_at END WHERE id=$1 AND child_id=$2", [id, child.id, status]);
  return result.rowCount === 1;
}

export async function recordParentSignal(input: { turnAuditId: string; kind: "family_change" | "adoption" | "grief" | "none" }) {
  if (input.kind === "none") return null;
  const owner = await getPool().query<{ owner_id: string }>("SELECT s.owner_id FROM turn_audits a JOIN voice_sessions s ON s.id=a.session_id WHERE a.id=$1", [input.turnAuditId]);
  const childId = owner.rows[0]?.owner_id; if (!childId) return null;
  const topic = await getPool().query<{ id: string }>("SELECT id FROM parent_care_topics WHERE child_id=$1 AND kind=$2 AND active=true", [childId, input.kind]);
  if (!topic.rows[0]) return null;
  const id = randomUUID();
  await getPool().query("INSERT INTO parent_alerts(id,child_id,turn_audit_id,care_topic_id,title,summary) VALUES($1,$2,$3,$4,$5,$6)", [id, childId, input.turnAuditId, topic.rows[0].id, "Un moment à reprendre avec vous", "Une question a rejoint un sujet que vous avez choisi de suivre. Oomi a répondu avec douceur sans citer votre note privée."]);
  return id;
}

export async function createChildProfile(input: { name: string; age: number; language: "fr" | "en"; deviceName: string; pairingCode?: string }) {
  const childId = randomUUID(); const deviceId = randomUUID();
  const pairingCode = input.pairingCode ?? String(randomInt(0, 1_000_000)).padStart(6, "0");
  const pairingCodeHash = createHash("sha256").update(pairingCode).digest("hex");
  const client = await getPool().connect();
  try { await client.query("BEGIN");
    await client.query("INSERT INTO child(id,first_name,age,language) VALUES($1,$2,$3,$4)", [childId, input.name, input.age, input.language]);
    await client.query("INSERT INTO settings(child_id,max_session_minutes,allowed_hours,story_enabled) VALUES($1,15,'{}'::jsonb,true)", [childId]);
    await client.query("INSERT INTO watch_devices(id,child_id,name,pairing_code_hash) VALUES($1,$2,$3,$4)", [deviceId, childId, input.deviceName, pairingCodeHash]);
    await client.query("COMMIT"); return { childId, deviceId, pairingCode };
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
