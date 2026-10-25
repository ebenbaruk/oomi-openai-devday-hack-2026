import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Soundtrack } from "./Soundtrack";
import { PageTurn, ScribbleWipe } from "./components/doodles";
import { BoilDefs, Paper } from "./components/ink";
import { Close, Weekend } from "./scenes/Ending";
import { Demo } from "./scenes/Demo";
import { Hook, Problem, Reveal } from "./scenes/Opening";
import { Parents, Trust } from "./scenes/Family";
import { C } from "./theme";
import { T } from "./timeline";

type Exit = "turn" | "wipe" | "cut";
type Scene = { id: string; C: React.FC; until: number; exit: Exit; wipeColor?: string };

const TURN = 22;
const WIPE = 26;

export const SCENES: Scene[] = [
  { id: "hook", C: Hook, until: T("problem"), exit: "wipe", wipeColor: C.sky },
  { id: "problem", C: Problem, until: T("reveal"), exit: "turn" },
  { id: "reveal", C: Reveal, until: T("demo"), exit: "wipe", wipeColor: C.coral },
  { id: "demo", C: Demo, until: T("parents"), exit: "turn" },
  { id: "parents", C: Parents, until: T("trust"), exit: "turn" },
  { id: "trust", C: Trust, until: T("weekend"), exit: "wipe", wipeColor: C.sun },
  { id: "weekend", C: Weekend, until: T("close"), exit: "turn" },
  { id: "close", C: Close, until: T("end"), exit: "cut" },
];

const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    <Paper />
    {children}
  </AbsoluteFill>
);

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <BoilDefs />
      {SCENES.map((scene, i) => {
        const from = i === 0 ? 0 : SCENES[i - 1].until;
        // A scene stays mounted (and on top) while it peels away during its page turn.
        const visibleUntil = scene.exit === "turn" ? scene.until + TURN : scene.until;
        if (frame < from || frame >= visibleUntil) return null;
        const body = (
          <Page>
            <scene.C />
          </Page>
        );
        return (
          <AbsoluteFill key={scene.id} style={{ zIndex: 40 - i }}>
            {scene.exit === "turn" && frame >= scene.until ? <PageTurn at={scene.until} dur={TURN}>{body}</PageTurn> : body}
          </AbsoluteFill>
        );
      })}
      <AbsoluteFill style={{ zIndex: 50, pointerEvents: "none" }}>
        {SCENES.filter((s) => s.exit === "wipe").map((s) => (
          <ScribbleWipe key={s.id} at={s.until - WIPE / 2} dur={WIPE} color={s.wipeColor} />
        ))}
      </AbsoluteFill>
      <Soundtrack />
    </AbsoluteFill>
  );
};
