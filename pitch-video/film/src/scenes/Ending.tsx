import React from "react";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Leo, Oomi, Plane } from "../components/characters";
import { Star, Sun } from "../components/doodles";
import { Hand, Ink, Sheet, TapedPhoto, useProgress, Wash } from "../components/ink";
import { C, HAND } from "../theme";
import { E, T } from "../timeline";

/** Real commit times; each lands on the word that names it in n15/n15b. */
export const MILESTONES = [
  { day: "SAT 11:29", label: "a sketch", img: "img/01-oomi-sketchbook.png", cue: ["n15", 2.0] },
  { day: "SAT 13:43", label: "live voice", img: "screens/necklace-idle-no-console-full.png", cue: ["n15b", 1.0] },
  { day: "SAT 15:30", label: "family journal", img: "screens/parent-today-viewport.png", cue: ["n15b", 1.9] },
  { day: "SAT 18:36", label: "safety gate", img: "screens/console-grown-up-babies.png", cue: ["n15b", 2.9] },
  { day: "SAT 23:01", label: "Oomi TV + French", img: "screens/tv-explainer-frame-2.png", cue: ["n15b", 4.0] },
  { day: "SAT 23:52", label: "mascot studio", img: "screens/studio-surprise-2.png", cue: ["n15b", 4.9] },
  { day: "SUN 14:03", label: "on a real watch", img: null, cue: ["n15b", 5.9] },
] as const;

export const milestoneAt = (i: number) => T(MILESTONES[i].cue[0], MILESTONES[i].cue[1]);

const LINE_Y = 530;

const WatchDoodle: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const eyes = useProgress(at + 10, 4);
  return (
    <Sheet>
      <g transform={`translate(${x} ${y})`}>
        <Ink d="M-30 -110 L-30 -60 M30 -110 L30 -60 M-30 60 L-30 110 M30 60 L30 110" at={at + 2} dur={8} />
        <Wash d="M-56 -60 L56 -60 L56 60 L-56 60 Z" at={at + 8} color={C.ink} dx={3} dy={2} />
        <Ink d="M-56 -50 C-56 -62 -48 -64 -40 -64 L44 -64 C56 -64 60 -56 60 -46 L58 50 C58 60 50 64 40 64 L-44 62 C-54 62 -58 56 -58 46 Z" at={at + 2} dur={10} />
        <ellipse cx={-18} cy={-4} rx={10} ry={15} fill={C.cream} opacity={eyes} />
        <ellipse cx={18} cy={-4} rx={10} ry={15} fill={C.cream} opacity={eyes} />
      </g>
    </Sheet>
  );
};

const KIDS = [
  { name: "Eli", src: "img/team/eli.jpg", rotate: -5, pos: "50% 30%" },
  { name: "Ali", src: "img/team/ali.jpg", rotate: 2.5, pos: "50% 35%" },
  { name: "Akram", src: "img/team/akram.jpg", rotate: -3, pos: "50% 30%" },
];

/** 7 · The weekend: the 36-hour timeline from the real commit log, then the team as kids, then the necklace. */
export const Weekend: React.FC = () => {
  const frame = useCurrentFrame();
  const s = T("weekend");
  const team = T("team");
  const next = T("n16b", -0.1);
  const lineOut = useProgress(team - 8, 8);
  const teamOut = useProgress(next - 8, 8);
  const xs = MILESTONES.map((_, i) => 210 + i * 250);
  return (
    <>
      {frame < team && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - lineOut }}>
          <Hand at={s + 4} dur={20} x={220} y={24} size={84} rotate={-2}>
            36 hours · Paris
          </Hand>
          <Sheet>
            <Ink d={`M150 ${LINE_Y} C700 ${LINE_Y - 8} 1200 ${LINE_Y + 6} 1790 ${LINE_Y - 4}`} at={s + 8} dur={26} width={7} />
            {xs.map((x, i) => (
              <Ink key={x} d={`M${x - 12} ${LINE_Y} a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0`} at={milestoneAt(i)} dur={6} color={C.coral} width={10} />
            ))}
          </Sheet>
          {MILESTONES.map((m, i) => {
            const at = milestoneAt(i);
            const below = i % 2 === 0;
            return (
              <React.Fragment key={m.day}>
                <Hand at={at} dur={8} x={xs[i] - 190} y={below ? LINE_Y + 28 : LINE_Y - 92} width={380} align="center" size={38} color={C.red}>
                  {m.day}
                </Hand>
                <Hand at={at + 3} dur={10} x={xs[i] - 190} y={below ? LINE_Y + 70 : LINE_Y - 150} width={380} align="center" size={46}>
                  {m.label}
                </Hand>
                {m.img ? (
                  <TapedPhoto
                    src={staticFile(m.img)}
                    at={at + 2}
                    x={xs[i] - 115}
                    y={below ? LINE_Y + 150 : LINE_Y - 330}
                    w={230}
                    h={136}
                    objectPosition="50% 20%"
                    rotate={below ? -4 : 4}
                    border={10}
                  />
                ) : (
                  <WatchDoodle x={xs[i]} y={LINE_Y + 260} at={at + 2} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
      {frame >= team - 2 && frame < next && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - teamOut }}>
          <Hand at={team + 2} dur={22} x={0} y={36} width={1920} align="center" size={78} rotate={-1}>
            three kids who never stopped asking why
          </Hand>
          {KIDS.map((k, i) => (
            <TapedPhoto
              key={k.name}
              src={staticFile(k.src)}
              at={T("n16", 1.4) + i * 7}
              x={200 + i * 545}
              y={190}
              w={430}
              h={430}
              objectPosition={k.pos}
              rotate={k.rotate}
              caption={k.name}
            />
          ))}
          <Sheet>
            <Ink d="M120 330 C110 290 160 280 160 310 C160 330 136 334 138 356 M138 384 l0 2" at={T("n16", 2.6)} dur={10} color={C.sky} width={6} />
            <Ink d="M1790 260 C1780 220 1830 210 1830 240 C1830 260 1806 264 1808 286 M1808 314 l0 2" at={T("n16", 3.0)} dur={10} color={C.coral} width={6} />
          </Sheet>
          <Hand at={T("n16", 0.2)} dur={20} x={0} y={860} width={1920} align="center" size={64} color={C.red} rotate={-1}>
            55 commits · 3 builders · <span style={{ color: C.sky }}>#buildinpublic</span>
          </Hand>
        </div>
      )}
      {frame >= next - 2 && (
        <>
          <TapedPhoto src={staticFile("img/01-oomi-sketchbook.png")} at={next} x={360} y={90} w={1200} h={790} rotate={-1.5} />
          <Hand at={next + 10} dur={18} x={960} y={930} size={84} color={C.red} rotate={-3}>
            next stop: the necklace
          </Hand>
        </>
      )}
    </>
  );
};

/** 8 · Close: Leo runs out into the world, then the end card. */
export const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const s = T("close");
  const card = E("n17", 0.4);
  const run = interpolate(frame, [s + 6, card], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const runOut = useProgress(card - 10, 10);
  const stride = Math.floor(frame / 5) % 2 === 0;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - runOut }}>
        <Sheet>
          <Sun x={1640} y={210} r={70} at={s + 2} />
          <Ink d="M80 900 C600 886 1300 906 1860 890" at={s} dur={16} />
          <Ink d="M300 900 C304 840 296 800 302 760 M270 780 C210 780 200 700 250 680 C240 620 320 600 340 640 C390 620 430 680 400 720 C440 750 400 800 340 790" at={s + 6} dur={18} />
          <Leo x={360 + run * 1300} y={520} at={s + 4} pose={stride ? "run" : "throw"} mouth="big" bounce={12} />
          <Plane x={360 + run * 1300 + 150} y={440 - Math.sin(frame / 8) * 16} rotate={-10} scale={0.9} color={C.coralLight} />
          <Star x={1100} y={220} r={26} at={s + 30} />
          <Star x={1320} y={120} r={18} at={s + 40} color={C.coral} />
        </Sheet>
        <Hand at={T("n17", 0.2)} dur={26} x={120} y={110} size={84} rotate={-2}>
          Less time with AI.
        </Hand>
        <Hand at={T("n17", 3.0)} dur={34} x={120} y={210} size={84} rotate={-2} color={C.coralDeep}>
          More time discovering the world.
        </Hand>
      </div>
      {frame >= card - 2 && <EndCard at={card} />}
    </>
  );
};

const EndCard: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const chips = useProgress(at + 40, 10);
  return (
    <>
      <Sheet>
        <g transform={`translate(0 ${Math.sin((frame - at) / 10) * 8})`}>
          <Oomi x={960} y={330} scale={1.25} at={at} face={frame > at + 60 ? "happy" : "idle"} />
        </g>
        <Star x={760} y={220} r={22} at={at + 24} />
        <Star x={1170} y={190} r={18} at={at + 30} color={C.coral} />
      </Sheet>
      <Hand at={at + 18} dur={16} x={0} y={520} width={1920} align="center" size={180}>
        oomi
      </Hand>
      <Hand at={at + 30} dur={22} x={0} y={720} width={1920} align="center" size={72} color={C.coralDeep}>
        A little companion for big questions.
      </Hand>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 870,
          textAlign: "center",
          fontFamily: HAND,
          fontWeight: 700,
          fontSize: 44,
          color: C.ink,
          opacity: chips,
          transform: `translateY(${(1 - chips) * 20}px)`,
        }}
      >
        Built in 36 hours at the OpenAI DevDay Hackathon · Paris 2026
        <div style={{ fontSize: 40, marginTop: 8, color: "#5d6286" }}>Eli · Ali · Akram — Hardware · Impact · Build in Public</div>
      </div>
    </>
  );
};
