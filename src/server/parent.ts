import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import { getPool, DEMO_OWNER } from "./db";

export type ParentDashboard = {
  child: { name: string; age: number; language: "fr" | "en" };
  settings: { dailyMinutes: number; quietStart: string | null; quietEnd: string | null; bedtimeStoryEnabled: boolean; parentNotificationsEnabled: boolean };
  careTopics: Array<{ id: string; kind: "family_change" | "adoption" | "grief" | "other"; privateNote: string | null; active: boolean }>;
  discoveries: Array<{ id: string; topic: string; summary: string; activityTitle: string | null; activitySteps: string[]; parentTip: string | null; status: "suggested" | "completed" | "saved"; createdAt: string }>;
  memories: Array<{ id: string; discoveryId: string | null; kind: "interest" | "challenge" | "fact" | "preference"; content: string; weight: number; createdAt: string }>;
  stories: Array<{ id: string; title: string; summary: string; status: "draft" | "ready" | "failed"; createdAt: string }>;
  alerts: Array<{ id: string; title: string; summary: string; status: "new" | "read" | "dismissed"; createdAt: string }>;
  today: { sessions: number; approvedTurns: number; grownUpTurns: number; newAlerts: number };
};

type ParentRow = { display_name: string; age: number; language: "fr" | "en"; daily_minutes: number; quiet_start: string | null; quiet_end: string | null; bedtime_story_enabled: boolean; parent_notifications_enabled: boolean };

export async function parentDashboard(): Promise<ParentDashboard | null> {
  const pool = getPool();
  const profile = await pool.query<ParentRow>(`
    SELECT p.display_name,p.age,p.language,COALESCE(s.daily_minutes,15) daily_minutes,
      s.quiet_start::text,s.quiet_end::text,COALESCE(s.bedtime_story_enabled,true) bedtime_story_enabled,
      COALESCE(s.parent_notifications_enabled,true) parent_notifications_enabled
    FROM demo_profiles p LEFT JOIN parent_settings s ON s.owner_id=p.id WHERE p.id=$1`, [DEMO_OWNER]);
  const owner = profile.rows[0];
  if (!owner) return null;
  await pool.query("INSERT INTO parent_settings(owner_id) VALUES($1) ON CONFLICT(owner_id) DO NOTHING", [DEMO_OWNER]);
  const [topics, discoveries, memories, stories, alerts, stats] = await Promise.all([
    pool.query(`SELECT id,kind,private_note,active FROM parent_care_topics WHERE owner_id=$1 ORDER BY created_at`, [DEMO_OWNER]),
    pool.query(`SELECT id,topic,summary,activity_title,activity_steps,parent_tip,status,created_at FROM discoveries WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 30`, [DEMO_OWNER]),
    pool.query(`SELECT id,discovery_id,kind,content,weight,created_at FROM memories WHERE owner_id=$1 AND status='active' ORDER BY created_at DESC LIMIT 50`, [DEMO_OWNER]),
    pool.query(`SELECT id,title,summary,status,created_at FROM stories WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 12`, [DEMO_OWNER]),
    pool.query(`SELECT id,title,summary,status,created_at FROM parent_alerts WHERE owner_id=$1 AND status <> 'dismissed' ORDER BY created_at DESC LIMIT 20`, [DEMO_OWNER]),
    pool.query(`SELECT
      (SELECT count(*)::int FROM voice_sessions WHERE owner_id=$1 AND created_at >= date_trunc('day', now())) sessions,
      (SELECT count(*)::int FROM turn_audits a JOIN voice_sessions s ON s.id=a.session_id WHERE s.owner_id=$1 AND a.created_at >= date_trunc('day', now()) AND a.verdict='answer') approved_turns,
      (SELECT count(*)::int FROM turn_audits a JOIN voice_sessions s ON s.id=a.session_id WHERE s.owner_id=$1 AND a.created_at >= date_trunc('day', now()) AND a.verdict='grown_up') grown_up_turns,
      (SELECT count(*)::int FROM parent_alerts WHERE owner_id=$1 AND status='new') new_alerts`, [DEMO_OWNER]),
  ]);
  const metrics = stats.rows[0] ?? { sessions: 0, approved_turns: 0, grown_up_turns: 0, new_alerts: 0 };
  return {
    child: { name: owner.display_name, age: owner.age, language: owner.language },
    settings: { dailyMinutes: owner.daily_minutes, quietStart: owner.quiet_start, quietEnd: owner.quiet_end, bedtimeStoryEnabled: owner.bedtime_story_enabled, parentNotificationsEnabled: owner.parent_notifications_enabled },
    careTopics: topics.rows.map(row => ({ id: row.id, kind: row.kind, privateNote: row.private_note, active: row.active })),
    discoveries: discoveries.rows.map(row => ({ id: row.id, topic: row.topic, summary: row.summary, activityTitle: row.activity_title, activitySteps: row.activity_steps, parentTip: row.parent_tip, status: row.status, createdAt: row.created_at.toISOString() })),
    memories: memories.rows.map(row => ({ id: row.id, discoveryId: row.discovery_id, kind: row.kind, content: row.content, weight: row.weight, createdAt: row.created_at.toISOString() })),
    stories: stories.rows.map(row => ({ id: row.id, title: row.title, summary: row.summary, status: row.status, createdAt: row.created_at.toISOString() })),
    alerts: alerts.rows.map(row => ({ id: row.id, title: row.title, summary: row.summary, status: row.status, createdAt: row.created_at.toISOString() })),
    today: { sessions: metrics.sessions, approvedTurns: metrics.approved_turns, grownUpTurns: metrics.grown_up_turns, newAlerts: metrics.new_alerts },
  };
}

export async function saveSettings(settings: ParentDashboard["settings"]) {
  await getPool().query(`INSERT INTO parent_settings(owner_id,daily_minutes,quiet_start,quiet_end,bedtime_story_enabled,parent_notifications_enabled,updated_at)
    VALUES($1,$2,$3,$4,$5,$6,now()) ON CONFLICT(owner_id) DO UPDATE SET daily_minutes=$2,quiet_start=$3,quiet_end=$4,bedtime_story_enabled=$5,parent_notifications_enabled=$6,updated_at=now()`,
    [DEMO_OWNER, settings.dailyMinutes, settings.quietStart, settings.quietEnd, settings.bedtimeStoryEnabled, settings.parentNotificationsEnabled]);
}

export async function saveCareTopic(input: { kind: string; active: boolean; privateNote: string | null }) {
  await getPool().query(`INSERT INTO parent_care_topics(id,owner_id,kind,active,private_note,updated_at) VALUES($1,$2,$3,$4,$5,now())
    ON CONFLICT(owner_id,kind) DO UPDATE SET active=$4,private_note=$5,updated_at=now()`, [randomUUID(), DEMO_OWNER, input.kind, input.active, input.privateNote]);
}

export async function addDiscovery(input: { topic: string; summary: string; activityTitle: string | null; activitySteps: string[]; parentTip: string | null; status: string; sessionId?: string | null; turnAuditId?: string | null }) {
  const id = randomUUID();
  await getPool().query(`INSERT INTO discoveries(id,owner_id,session_id,turn_audit_id,topic,summary,activity_title,activity_steps,parent_tip,status)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [id, DEMO_OWNER, input.sessionId ?? null, input.turnAuditId ?? null, input.topic, input.summary, input.activityTitle, JSON.stringify(input.activitySteps), input.parentTip, input.status]);
  return id;
}

export async function addMemory(input: { discoveryId: string | null; kind: string; content: string; weight: number }) {
  const id = randomUUID();
  await getPool().query("INSERT INTO memories(id,owner_id,discovery_id,kind,content,weight) VALUES($1,$2,$3,$4,$5,$6)", [id, DEMO_OWNER, input.discoveryId, input.kind, input.content, input.weight]);
  return id;
}

export async function addStory(input: { title: string; summary: string; sourceDiscoveryIds: string[]; status: string }) {
  const id = randomUUID();
  await getPool().query("INSERT INTO stories(id,owner_id,title,summary,source_discovery_ids,status) VALUES($1,$2,$3,$4,$5,$6)", [id, DEMO_OWNER, input.title, input.summary, JSON.stringify(input.sourceDiscoveryIds), input.status]);
  return id;
}

export async function deleteMemory(id: string) {
  const result = await getPool().query("UPDATE memories SET status='deleted',deleted_at=now() WHERE id=$1 AND owner_id=$2 AND status='active'", [id, DEMO_OWNER]);
  return result.rowCount === 1;
}

export async function setAlertStatus(id: string, status: "new" | "read" | "dismissed") {
  const result = await getPool().query("UPDATE parent_alerts SET status=$3,read_at=CASE WHEN $3='read' THEN now() ELSE read_at END WHERE id=$1 AND owner_id=$2", [id, DEMO_OWNER, status]);
  return result.rowCount === 1;
}

export async function recordParentSignal(input: { turnAuditId: string; kind: "family_change" | "adoption" | "grief" | "none" }) {
  if (input.kind === "none") return null;
  const topic = await getPool().query<{ id: string }>("SELECT id FROM parent_care_topics WHERE owner_id=$1 AND kind=$2 AND active=true", [DEMO_OWNER, input.kind]);
  if (!topic.rows[0]) return null;
  const id = randomUUID();
  const title = "Un moment à reprendre avec vous";
  const summary = "Une question de votre enfant a rejoint un sujet que vous avez choisi de suivre. Oomi a répondu avec douceur sans citer votre note privée.";
  await getPool().query("INSERT INTO parent_alerts(id,owner_id,turn_audit_id,care_topic_id,title,summary) VALUES($1,$2,$3,$4,$5,$6)", [id, DEMO_OWNER, input.turnAuditId, topic.rows[0].id, title, summary]);
  return id;
}

export async function createChildProfile(input: { name: string; age: number; language: "fr" | "en"; deviceName: string; pairingCode: string }) {
  const profileId = randomUUID(); const deviceId = randomUUID();
  const pairingCodeHash = createHash("sha256").update(input.pairingCode).digest("hex"); const pool = getPool(); const client = await pool.connect();
  try { await client.query("BEGIN");
    await client.query("INSERT INTO demo_profiles(id,parent_id,display_name,age,language) VALUES($1,'00000000-0000-4000-8000-000000000010',$2,$3,$4)", [profileId, input.name, input.age, input.language]);
    await client.query("INSERT INTO devices(id,owner_id,name,pairing_code_hash) VALUES($1,$2,$3,$4)", [deviceId, profileId, input.deviceName, pairingCodeHash]);
    await client.query("INSERT INTO parent_settings(owner_id) VALUES($1)", [profileId]); await client.query("COMMIT"); return { profileId, deviceId };
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
