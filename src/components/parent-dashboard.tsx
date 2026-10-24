"use client";

import { useEffect, useState } from "react";

type Topic = "family_change" | "adoption" | "grief" | "other";
type Dashboard = {
  child: { name: string; age: number; language: "fr" | "en" };
  settings: { dailyMinutes: number; quietStart: string | null; quietEnd: string | null; bedtimeStoryEnabled: boolean; parentNotificationsEnabled: boolean };
  careTopics: Array<{ id: string; kind: Topic; privateNote: string | null; active: boolean }>;
  discoveries: Array<{ id: string; topic: string; summary: string; activityTitle: string | null; activitySteps: string[]; parentTip: string | null; status: "suggested" | "completed" | "saved"; createdAt: string }>;
  memories: Array<{ id: string; discoveryId: string | null; kind: string; content: string; weight: number; createdAt: string }>;
  stories: Array<{ id: string; title: string; summary: string; status: string; createdAt: string }>;
  alerts: Array<{ id: string; title: string; summary: string; status: "new" | "read" | "dismissed"; createdAt: string }>;
  today: { sessions: number; approvedTurns: number; grownUpTurns: number; newAlerts: number };
};

const demo: Dashboard = {
  child: { name: "Léo", age: 7, language: "fr" },
  settings: { dailyMinutes: 15, quietStart: "19:30", quietEnd: "07:30", bedtimeStoryEnabled: true, parentNotificationsEnabled: true },
  careTopics: [{ id: "demo-family", kind: "family_change", privateNote: null, active: true }, { id: "demo-adoption", kind: "adoption", privateNote: "Prévenir avec douceur, sans interpréter.", active: true }],
  discoveries: [{ id: "demo-plane", topic: "Les avions en papier", summary: "Léo a exploré comment les ailes poussent l’air vers le bas.", activityTitle: "Le défi des grandes ailes", activitySteps: ["Plier deux avions", "Tester une aile large et une aile fine", "Observer lequel plane le plus loin"], parentTip: "Demandez-lui ce qu’il voudrait changer pour le prochain essai.", status: "suggested", createdAt: new Date().toISOString() }],
  memories: [{ id: "demo-memory", discoveryId: "demo-plane", kind: "interest", content: "Léo aime comprendre comment les objets volent.", weight: 3, createdAt: new Date().toISOString() }],
  stories: [{ id: "demo-story", title: "Léo et le nuage qui faisait des boucles", summary: "Une histoire du soir inspirée de ses essais d’avions.", status: "draft", createdAt: new Date().toISOString() }],
  alerts: [{ id: "demo-alert", title: "Un moment à reprendre avec vous", summary: "Une question de Léo a rejoint un sujet que vous avez choisi de suivre. Oomi a répondu avec douceur et sans évoquer votre note privée.", status: "new", createdAt: new Date().toISOString() }],
  today: { sessions: 1, approvedTurns: 3, grownUpTurns: 1, newAlerts: 1 },
};

const topicNames: Record<Topic, string> = { family_change: "Changements dans la famille", adoption: "Adoption et origines", grief: "Deuil et grands chagrins", other: "Autre sujet privé" };
const icons = { today: "☀", discovery: "✦", alert: "◌", story: "☾", memory: "⌁", settings: "⚙" };

export function ParentDashboard() {
  const [data, setData] = useState<Dashboard>(demo); const [live, setLive] = useState(false); const [tab, setTab] = useState("today"); const [notice, setNotice] = useState("");
  useEffect(() => { void fetch("/api/parent/dashboard", { cache: "no-store" }).then(async response => { if (!response.ok) return; setData(await response.json() as Dashboard); setLive(true); }).catch(() => undefined); }, []);
  async function updateCare(kind: Topic, active: boolean) {
    setData(current => ({ ...current, careTopics: [...current.careTopics.filter(topic => topic.kind !== kind), { id: `draft-${kind}`, kind, active, privateNote: null }] }));
    const response = await fetch("/api/parent/care-topics", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, active, privateNote: null }) });
    setNotice(response.ok ? "Vos repères sont enregistrés." : "Connectez l’espace parent pour enregistrer ce choix.");
  }
  async function saveSettings() {
    const response = await fetch("/api/parent/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data.settings) });
    setNotice(response.ok ? "Réglages enregistrés." : "Connectez l’espace parent pour enregistrer les réglages.");
  }
  async function removeMemory(id: string) {
    setData(current => ({ ...current, memories: current.memories.filter(memory => memory.id !== id) }));
    if (live) await fetch(`/api/parent/memory/${id}`, { method: "DELETE" });
  }
  async function readAlert(id: string) {
    setData(current => ({ ...current, alerts: current.alerts.map(alert => alert.id === id ? { ...alert, status: "read" } : alert), today: { ...current.today, newAlerts: Math.max(0, current.today.newAlerts - 1) } }));
    if (live) await fetch(`/api/parent/alerts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "read" }) });
  }
  const activeTopics = data.careTopics.filter(topic => topic.active);
  return <main className="parent-shell">
    <aside className="parent-sidebar">
      <a href="/" className="parent-brand">oomi<span /></a>
      <button className="child-picker" type="button"><span className="child-avatar">{data.child.name[0]}</span><span><small>VOTRE ENFANT</small><b>{data.child.name}</b></span><i>⌄</i></button>
      <nav aria-label="Navigation parent">{[["today", "Aujourd’hui"], ["discovery", "Découvertes"], ["alert", "À reprendre avec vous"], ["story", "Histoires du soir"], ["memory", "Ce qu’Oomi retient"], ["settings", "Réglages"]].map(([id, label]) => <button type="button" key={id} className={tab === id ? "nav-active" : ""} onClick={() => setTab(id)}><span>{icons[id as keyof typeof icons]}</span>{label}{id === "alert" && data.today.newAlerts > 0 && <em>{data.today.newAlerts}</em>}</button>)}</nav>
      <p className="privacy-note">Les notes privées restent dans l’espace parent. Oomi ne les répète jamais à {data.child.name}.</p>
    </aside>
    <section className="parent-content">
      <header className="parent-topbar"><div><p className="kicker">ESPACE PARENT</p><h1>{tab === "today" ? "Un petit aperçu de sa journée." : tab === "alert" ? "Les moments à reprendre ensemble." : tab === "settings" ? "Les repères de votre famille." : "L’univers de " + data.child.name + "."}</h1></div><div className="device-chip"><span className="device-dot" />Oomi est au repos</div></header>
      {!live && <div className="demo-banner"><span>Mode aperçu</span> Connectez-vous avec le code adulte pour consulter les données enregistrées.</div>}
      {notice && <div className="parent-notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
      {tab === "today" && <Today data={data} openAlerts={() => setTab("alert")} />}
      {tab === "discovery" && <Discoveries data={data} />}
      {tab === "alert" && <Alerts data={data} onRead={readAlert} />}
      {tab === "story" && <Stories data={data} />}
      {tab === "memory" && <Memories data={data} onRemove={removeMemory} />}
      {tab === "settings" && <Settings data={data} update={setData} care={updateCare} save={saveSettings} />}
    </section>
  </main>;
}

function Today({ data, openAlerts }: { data: Dashboard; openAlerts: () => void }) { const discovery = data.discoveries[0]; return <div className="dashboard-flow"><section className="signal-card"><div><p className="kicker">UN SIGNAL EN DOUCEUR</p><h2>Une question mérite peut-être votre présence.</h2><p>Oomi a détecté un sujet choisi par vous. Il a répondu avec calme, sans jamais citer votre contexte privé.</p><button className="coral-button" onClick={openAlerts}>Voir le moment</button></div><div className="signal-orbit"><span>♡</span></div></section><section className="metric-grid">{[["Sessions", data.today.sessions], ["Questions explorées", data.today.approvedTurns], ["Moments pour vous", data.today.grownUpTurns]].map(([label, value]) => <article key={String(label)}><strong>{value}</strong><span>{label}</span></article>)}</section>{discovery && <section className="journal-card"><div className="journal-heading"><p className="kicker">AUJOURD’HUI · DÉCOUVERTE</p><h2>{discovery.topic}</h2><p>{discovery.summary}</p></div><div className="activity-box"><span>LE PETIT DÉFI</span><h3>{discovery.activityTitle}</h3><ol>{discovery.activitySteps.map(step => <li key={step}>{step}</li>)}</ol><small>{discovery.parentTip}</small></div></section>}</div> }
function Discoveries({ data }: { data: Dashboard }) { return <div className="dashboard-flow"><div className="section-lead"><p>Les explorations qui ont transformé une question en activité.</p></div><div className="discovery-list">{data.discoveries.map(discovery => <article key={discovery.id}><span className="discovery-date">AUJOURD’HUI</span><h2>{discovery.topic}</h2><p>{discovery.summary}</p>{discovery.activityTitle && <b>{discovery.activityTitle} · {discovery.status === "completed" ? "Terminé" : "À essayer"}</b>}</article>)}</div></div> }
function Alerts({ data, onRead }: { data: Dashboard; onRead: (id: string) => void }) { return <div className="dashboard-flow"><section className="context-intro"><p>Ces repères viennent de vous. Ils n’apparaissent jamais dans les échanges avec votre enfant.</p></section>{data.alerts.length ? data.alerts.map(alert => <article className={`alert-card ${alert.status}`} key={alert.id}><span>UN SIGNAL D’ATTENTION</span><h2>{alert.title}</h2><p>{alert.summary}</p>{alert.status === "new" && <button className="quiet-button" onClick={() => onRead(alert.id)}>J’ai vu ce moment</button>}</article>) : <div className="empty-state">Aucun moment à reprendre pour l’instant.</div>}<article className="conversation-card"><span>POUR COMMENCER</span><h3>« J’ai entendu que tu te posais des questions sur les familles. Tu veux m’en parler ? »</h3><p>Un point de départ simple, sans supposer ce que {data.child.name} ressent.</p></article></div> }
function Stories({ data }: { data: Dashboard }) { return <div className="dashboard-flow"><p className="section-lead">Des récits issus des découvertes choisies ensemble.</p>{data.stories.map(story => <article className="story-card" key={story.id}><span>HISTOIRE DU SOIR · {story.status === "draft" ? "À PRÉPARER" : "PRÊTE"}</span><h2>{story.title}</h2><p>{story.summary}</p><button className="quiet-button">Préparer pour ce soir</button></article>)}</div> }
function Memories({ data, onRemove }: { data: Dashboard; onRemove: (id: string) => void }) { return <div className="dashboard-flow"><section className="context-intro"><p>Vous voyez et effacez tout ce qu’Oomi garde pour personnaliser les prochaines explorations.</p></section><div className="memory-list">{data.memories.map(memory => <article key={memory.id}><span>{memory.kind}</span><p>{memory.content}</p><button aria-label="Effacer ce souvenir" onClick={() => onRemove(memory.id)}>×</button></article>)}</div></div> }
function Settings({ data, update, care, save }: { data: Dashboard; update: (updater: (current: Dashboard) => Dashboard) => void; care: (kind: Topic, active: boolean) => void; save: () => void }) { const topics = new Map(data.careTopics.map(topic => [topic.kind, topic])); return <div className="dashboard-flow settings-flow"><section><p className="kicker">CADRE DU QUOTIDIEN</p><label>Durée par jour<input type="number" min="1" max="60" value={data.settings.dailyMinutes} onChange={event => update(current => ({ ...current, settings: { ...current.settings, dailyMinutes: Number(event.target.value) } }))} /><small>minutes d’exploration</small></label><label className="switch-row">Histoires du soir<input type="checkbox" checked={data.settings.bedtimeStoryEnabled} onChange={event => update(current => ({ ...current, settings: { ...current.settings, bedtimeStoryEnabled: event.target.checked } }))} /><i /></label></section><section><p className="kicker">VOS SUJETS DE VIGILANCE</p><p className="field-help">Oomi redirige la conversation avec douceur et vous laisse un signal privé.</p>{(Object.keys(topicNames) as Topic[]).map(kind => <label className="topic-row" key={kind}><input type="checkbox" checked={topics.get(kind)?.active ?? false} onChange={event => care(kind, event.target.checked)} /><span><b>{topicNames[kind]}</b><small>Signal parent discret</small></span></label>)}</section><button className="coral-button save-settings" onClick={save}>Enregistrer les réglages</button></div> }
