"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { faceStates, type FaceState } from "../lib/contracts";
import { initialDeviceState, OomiDevice } from "../lib/device";

const labels: Record<FaceState, string> = { idle: "Au repos", listening: "À l’écoute", thinking: "Une idée germe", speaking: "Je raconte", happy: "Bien joué !", curious: "Et si…", grown_up: "Ensemble", sleep: "À bientôt" };
function Spark({ className = "" }: { className?: string }) { return <svg className={className} width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M18 2v32M2 18h32M7 7l22 22M7 29 29 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>; }
function Mic() { return <svg viewBox="0 0 24 24" width="23" height="23" fill="none" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" /><path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3M8 22h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }

export function Simulator({ configured }: { configured: boolean }) {
  const [state, setState] = useState(initialDeviceState);
  const [preview, setPreview] = useState<FaceState>("idle");
  const [code, setCode] = useState("");
  const device = useRef<OomiDevice | null>(null);
  const face = state.connected || state.busy ? state.face : preview;
  useEffect(() => {
    const current = new OomiDevice(setState); device.current = current;
    const release = () => current.release();
    const visibility = () => { if (document.hidden) current.close("La session a été fermée pendant votre absence."); };
    const editable = (target: EventTarget | null) => target instanceof HTMLElement && (target.matches("input, textarea, select, button, a") || target.isContentEditable);
    const down = (event: KeyboardEvent) => { if (event.code === "Space" && !editable(event.target)) { event.preventDefault(); if (!event.repeat) current.press(); } };
    const up = (event: KeyboardEvent) => { if (event.code === "Space") release(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", release);
    window.addEventListener("pointerup", release); document.addEventListener("visibilitychange", visibility);
    return () => { current.close(); device.current = null; window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", release); window.removeEventListener("pointerup", release); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  return <div className="site-shell">
    <header className="site-header"><Link className="wordmark" href="/" aria-label="Oomi, accueil">oomi<span className="logo-dot" /></Link><span className="header-caption">Pour les petits curieux.</span><Link className="parent-link" href="/parent">Espace parent</Link><span className="prototype-pill"><span /> Le studio Oomi</span></header>
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy"><div className="eyebrow"><span /> UN PETIT COMPAGNON D’EXPLORATION</div>
          <h1 id="hero-title">Petites questions.<br /><span>Grandes<br className="desktop-break" /> découvertes.</span><Spark className="title-spark" /></h1>
          <p className="intro">Le monde est plein de « pourquoi ».<br />Oomi donne envie d’aller chercher les réponses.<br />Avec ses mains, ses idées, et les gens qu’on aime.</p>
          <div className="question-note"><svg viewBox="0 0 64 46" width="52" height="40" fill="none" aria-hidden="true"><path d="m4 21 54-16-17 35-11-14L4 21Zm26 5L58 5M30 26l-7 13 1-15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg><div><small>LA QUESTION DU JOUR</small><p>« Comment les avions volent ? »</p></div></div>
          <div className="principles"><span>Un bouton, une question</span><i /> <span>Et le monde à explorer</span></div>
        </div>
        <div className="device-panel">
          <div className="panel-topline"><span>RENCONTREZ OOMI</span><span className="live-label">{state.connected ? "Session ouverte" : "Simulateur"}<span className={state.connected ? "online-dot" : "offline-dot"} /></span></div>
          <div className={`device-scene face-${face}`}>
            <span className="orbit orbit-one" /><span className="orbit orbit-two" /><Spark className="scene-spark" />
            <span className="scene-caption">un petit curieux,<br />comme vous.</span>
            <div className="cord" /><div className="cord-loop" />
            <div className="pendant"><div className="pendant-screen"><div className="eyes" role="img" aria-label={`Expression : ${labels[face]}`}><span className="eye eye-left" /><span className="eye eye-right" /></div><div className="thought-dots"><b /><b /><b /></div><div className="cheek cheek-left" /><div className="cheek cheek-right" /></div>
              <div className="pendant-footer"><span className={`mic-led ${state.mic ? "active" : ""}`} aria-label={state.mic ? "Microphone actif" : "Microphone coupé"} /><span className="pendant-brand">oomi</span><span className="speaker-holes">•••</span></div>
              <button className={`talk-button ${state.mic ? "pressed" : ""}`} disabled={!state.connected} aria-label="Maintenir pour parler" aria-pressed={state.mic}
                onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); device.current?.press(); }}
                onPointerUp={() => device.current?.release()} onPointerCancel={() => device.current?.release()} onLostPointerCapture={() => device.current?.release()}
                onKeyDown={event => { if ([" ", "Enter"].includes(event.key)) { event.preventDefault(); if (!event.repeat) device.current?.press(); } }}
                onKeyUp={event => { if ([" ", "Enter"].includes(event.key)) { event.preventDefault(); device.current?.release(); } }}><Mic /></button>
            </div><span className="device-shadow" />
          </div>
          <div className="device-status"><span className={state.mic ? "status-light active" : "status-light"} /><span>{state.connected ? labels[face] : "Aperçu visuel · micro coupé"}</span></div>
          <div className="device-instructions" role="status" aria-live="polite">{state.connected || state.busy || state.face === "sleep" ? state.message : "Huit expressions, une même curiosité. Explorez-les ci-dessous."}</div>
          {state.connected ? <div className="session-actions"><p>Maintenez le bouton ou la touche <kbd>espace</kbd>.</p><button className="text-button" onClick={() => device.current?.close()}>Terminer la session ↗</button></div> : <form className="access-form" onSubmit={event => { event.preventDefault(); void device.current?.connect(code); }}>
            {configured && <label className="code-label"><span>Code de la démo</span><input type="password" value={code} onChange={event => setCode(event.target.value)} placeholder="Code d’accès" autoComplete="current-password" minLength={16} required disabled={state.busy} /></label>}
            <button className="connect-button" disabled={!configured || state.busy}>{state.busy ? "Connexion…" : configured ? "Ouvrir une session vocale ↗" : "Voix en attente de configuration"}</button>
            <small>Prototype pour démonstration par des adultes.</small>
          </form>}
        </div>
      </section>
      <section className="expressions" aria-label="Aperçu des huit expressions"><div className="section-intro"><span className="eyebrow">UN VISAGE QUI S’EXPRIME</span><p>Une petite fenêtre sur sa curiosité.</p></div><div className="expression-list">{faceStates.map(value => <button key={value} disabled={state.connected || state.busy} className={`expression-button ${preview === value ? "selected" : ""}`} aria-pressed={preview === value} onClick={() => setPreview(value)}><span className={`mini-face face-${value}`}><span className="eyes"><span className="eye eye-left" /><span className="eye eye-right" /></span></span><span>{labels[value]}</span></button>)}</div></section>
      <section className="promise"><Spark /><p>La meilleure découverte se passe<br /><strong>de l’autre côté de l’écran.</strong></p><span>QUESTION → EXPLORATION → MOMENT PARTAGÉ</span></section>
      <details className="developer-notes"><summary>État du prototype et vérifications</summary><p>Socle vocal et contrôle serveur en cours de validation. Le micro ne transmet que pendant l’appui. La voix générée reste en mémoire jusqu’à l’approbation de sa transcription. Les phrases de repli utilisent la synthèse vocale du navigateur.</p><p>{configured ? "Configuration serveur renseignée ; les services et les accès doivent encore être vérifiés en session réelle." : "Configuration requise : clé OpenAI, Postgres migré, code de démo et secret de session. Consultez le README du dépôt."}</p><p>Dernier verdict : {state.verdict || "aucun"}{state.elapsedMs !== null && ` · contrôle après relâchement : ${state.elapsedMs} ms`}. Les durées des services réels ne sont pas encore mesurées. Journal parent, mémoire et histoires : prochaine étape.</p></details>
    </main><footer><span className="footer-brand">oomi</span><span>Little questions. Big discoveries.</span><span>DEV DAY ’26 ↗</span></footer>
  </div>;
}
