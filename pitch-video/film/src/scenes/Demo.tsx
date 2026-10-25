import React from "react";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { alongCubic, Leo, Oomi, OomiFace, Plane } from "../components/characters";
import { Bubble, Check, Star, ZoomCircle } from "../components/doodles";
import { Hand, Ink, PostIt, Sheet, TapedPhoto, useProgress } from "../components/ink";
import { C } from "../theme";
import { E, T } from "../timeline";

/** 4a · Leo asks, Oomi answers, the answer becomes a mission, then the real simulator is taped in. */
const Ask: React.FC = () => {
  const frame = useCurrentFrame();
  const s = T("demo");
  const press = T("leo02", -0.5);
  const real = T("oomi01", 7.2);
  const face: OomiFace =
    frame < press ? "idle" : frame < E("leo02") ? "listening" : frame < T("oomi01") ? "thinking" : frame < E("oomi01", -1.5) ? "speaking" : "curious";
  const listening = frame >= press && frame < E("leo02");
  return (
    <>
      <Sheet>
        <Leo x={430} y={430} at={s} pose={frame >= press ? "press" : "idle"} mouth={frame >= T("leo02") && frame < E("leo02") ? "o" : "smile"} scale={1.15} led={listening} />
        <ZoomCircle cx={430} cy={610} rx={58} ry={62} at={s + 18} />
        <Ink d="M490 600 C700 590 860 560 1040 540" at={s + 26} dur={14} color={C.red} width={5} dashed="2 16" />
        <g opacity={1 - useProgress(real, 8)}>
          <Oomi x={1270} y={560} scale={1.55} at={s + 30} face={face} led={listening} />
        </g>
        <Bubble x={100} y={60} w={830} h={140} tail={[420, 290]} at={T("leo02", -0.2)} side="right" />
        <Bubble x={960} y={46} w={860} h={210} tail={[1190, 330]} at={T("oomi01", -0.1)} fill={C.white} outAt={real - 6} />
      </Sheet>
      <Hand at={T("leo02")} dur={22} x={136} y={92} size={64}>
        Oomi, how do airplanes fly?
      </Hand>
      <Hand at={T("oomi01", 0.2)} dur={60} x={1000} y={70} size={62} width={800} outAt={real - 6}>
        Wings push the air down… so the air pushes the plane up!
      </Hand>
      <PostIt at={T("oomi01", 4.3)} x={600} y={650} w={470} rotate={-5}>
        <div style={{ fontSize: 34, letterSpacing: 3, color: C.red }}>TODAY'S MISSION ✈</div>
        Fold 2 paper planes: big wings vs. small wings. Which flies farther?
      </PostIt>
      <TapedPhoto
        src={staticFile("screens/rec-necklace-thinking-speaking.mp4")}
        videoFrom={1.5}
        at={real}
        x={1000}
        y={290}
        w={860}
        h={538}
        rotate={2.5}
        caption="the real thing · live voice · this weekend"
      />
      <Hand at={real + 14} dur={16} x={1240} y={150} size={58} color={C.red} rotate={-4}>
        it actually works ↓
      </Hand>
    </>
  );
};

const BIG: [number, number][] = [[430, 540], [900, 230], [1420, 360], [1690, 820]];
const SMALL: [number, number][] = [[430, 560], [680, 440], [880, 700], [1010, 850]];

/** 4b · The paper-plane race, Leo's result, Oomi's follow-up and the memory note. */
const Race: React.FC = () => {
  const frame = useCurrentFrame();
  const r = T("race");
  const cheer = frame >= T("leo03", -0.3);
  const followUpOut = useProgress(T("n07", 0.2), 8);
  return (
    <>
      <Sheet>
        <Ink d="M120 900 C700 890 1300 906 1820 892" at={r} dur={16} />
        {Array.from({ length: 8 }, (_, i) => (
          <Ink key={i} d={`M${560 + i * 160} 880 l0 36`} at={r + 4 + i * 2} dur={4} width={5} />
        ))}
        <Leo x={300} y={500} at={r} pose={cheer ? "cheer" : "throw"} mouth={cheer ? "big" : "smile"} bounce={cheer ? 16 : 0} />
        <DottedFlight path={BIG} at={r + 10} dur={84} color={C.coralLight} scale={1.25} />
        <DottedFlight path={SMALL} at={r + 22} dur={56} color={C.white} scale={0.8} />
        <Star x={1700} y={700} r={40} at={r + 96} />
        {frame >= T("leo03") && <Bubble x={90} y={60} w={680} h={130} tail={[300, 300]} at={T("leo03", -0.1)} side="right" outAt={T("n07", 0.2)} />}
        {frame >= T("oomi02", -0.4) && (
          <g opacity={1 - followUpOut}>
            <ZoomCircle cx={300} cy={680} rx={52} ry={56} at={T("oomi02", -0.4)} />
            <Ink d="M350 660 C600 560 900 470 1150 440" at={T("oomi02", -0.3)} dur={10} color={C.red} width={5} dashed="2 16" />
            <Oomi x={1260} y={420} scale={0.95} at={T("oomi02", -0.4)} face={frame < E("oomi02", -0.6) ? "speaking" : "happy"} />
            <Bubble x={960} y={60} w={900} h={150} tail={[1180, 300]} at={T("oomi02", -0.2)} fill={C.white} />
          </g>
        )}
        {frame >= T("n07", 2.2) && <Check x={1300} y={668} at={T("n07", 2.4)} s={0.9} />}
      </Sheet>
      <Hand at={r + 70} dur={12} x={1560} y={940} size={50} color={C.coralDeep}>big wings</Hand>
      <Hand at={r + 70} dur={12} x={900} y={940} size={50}>small wings</Hand>
      <Hand at={T("leo03")} dur={18} x={124} y={84} size={70} outAt={T("n07", 0.2)}>
        The big wings won!
      </Hand>
      <Hand at={T("oomi02")} dur={30} x={1014} y={86} size={64} outAt={T("n07", 0.2)}>
        Whoa, real scientist! Why?
      </Hand>
      <Hand at={T("n07", 0.1)} dur={34} x={0} y={70} width={1920} align="center" size={110} color={C.ink}>
        Every answer ends in a mission.
      </Hand>
      {frame >= T("n07", 0.6) && (
        <Sheet>
          <Ink d="M520 200 C800 186 1150 190 1420 198" at={T("n07", 1.0)} dur={14} color={C.coral} width={10} />
        </Sheet>
      )}
      <PostIt at={T("n07", 2.0)} x={1080} y={430} w={520} rotate={3} color={C.mint}>
        <div style={{ fontSize: 34, letterSpacing: 3 }}>OOMI REMEMBERS</div>
        ✈ paper-plane mission: done! Big wings won.
      </PostIt>
    </>
  );
};

/** A paper plane flying a cubic path, leaving a dotted trail behind it. */
const DottedFlight: React.FC<{ path: [number, number][]; at: number; dur: number; color: string; scale: number }> = ({ path, at, dur, color, scale }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const p = interpolate(frame, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  const dots = Array.from({ length: Math.floor(p * 40) }, (_, i) => alongCubic(i / 40, path));
  const pos = alongCubic(Math.max(0.001, p), path);
  return (
    <g>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={4.5} fill={C.sky} />
      ))}
      <Plane x={pos.x} y={pos.y} rotate={p >= 1 ? 6 : pos.angle} scale={scale} color={color} />
    </g>
  );
};

export const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const r = T("race");
  const askOut = useProgress(r - 8, 8);
  return (
    <>
      {frame < r && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - askOut }}>
          <Ask />
        </div>
      )}
      {frame >= r - 2 && <Race />}
    </>
  );
};

