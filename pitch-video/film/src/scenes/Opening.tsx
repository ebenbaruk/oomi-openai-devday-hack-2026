import React from "react";
import { interpolate, staticFile, useCurrentFrame, Easing } from "remotion";
import { Leo, Oomi } from "../components/characters";
import { Arrow, Bubble, ScribbleOut, Star, Sun, Tablet } from "../components/doodles";
import { Hand, Ink, Sheet, TapedPhoto, useProgress } from "../components/ink";
import { C } from "../theme";
import { E, T } from "../timeline";

/** 1 · Hook: a child's question, then the page fills with more questions. */
export const Hook: React.FC = () => {
  const q = T("leo01");
  const more = [
    { text: "Why is the sky blue?", x: 1110, y: 150, w: 640, at: q + 50 },
    { text: "Do fish sleep?", x: 1280, y: 470, w: 470, at: q + 64 },
    { text: "Where does the sun go at night?", x: 860, y: 760, w: 960, at: q + 78 },
    { text: "Why?", x: 330, y: 640, w: 200, at: q + 90 },
  ];
  return (
    <>
      <Sheet>
        <Leo x={760} y={470} at={4} pose="ask" mouth="o" scale={0.95} />
        <Bubble x={240} y={150} w={820} h={150} tail={[640, 360]} at={q - 4} side="right" />
        {more.map((b, i) => (
          <Bubble key={i} x={b.x} y={b.y} w={b.w} h={120} tail={[b.x + (i % 2 ? 40 : b.w - 60), b.y + 170]} at={b.at} side={i % 2 ? "left" : "right"} />
        ))}
        <Star x={1050} y={120} at={q + 56} r={26} />
        <Star x={210} y={600} at={q + 84} r={22} color={C.coral} />
        <Star x={1740} y={470} at={q + 96} r={20} color={C.sky} />
      </Sheet>
      <Hand at={q + 2} dur={24} x={280} y={180} size={82}>
        How do airplanes fly?
      </Hand>
      {more.map((b, i) => (
        <Hand key={i} at={b.at + 6} dur={16} x={b.x + 26} y={b.y + 22} size={64}>
          {b.text}
        </Hand>
      ))}
    </>
  );
};

/** 2 · Problem: answers come from a screen, the world gets scribbled out. */
export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const s = T("problem");
  const out = T("n03", 1.2);
  // Little question marks fly into the tablet while the narrator speaks.
  const marks = [0, 1, 2, 3, 4, 5].map((i) => {
    const p = interpolate(frame, [s + 20 + i * 12, s + 62 + i * 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
    const sx = i % 2 ? 300 + i * 40 : 1600 - i * 50;
    const sy = 160 + (i % 3) * 120;
    return { p, x: sx + (930 - sx) * p, y: sy + (640 - sy) * p - Math.sin(p * Math.PI) * 120, r: (1 - p) * 30 * (i % 2 ? 1 : -1) };
  });
  return (
    <>
      <Sheet>
        <Sun x={1560} y={190} at={s + 2} />
        {/* tree */}
        <Ink d="M330 840 C334 760 326 700 332 620 M300 640 C220 640 200 540 260 510 C240 430 340 400 370 450 C430 410 500 480 460 540 C520 580 470 660 390 640 C370 660 330 650 300 640" at={s + 6} dur={22} />
        {/* kite */}
        <Ink d="M1440 420 L1500 520 L1440 640 L1380 520 Z M1440 640 C1420 700 1470 740 1440 800 C1420 840 1450 880 1430 920" at={s + 10} dur={20} color={C.coral} />
        <Ink d="M120 880 C600 870 1300 890 1800 876" at={s + 4} dur={20} />
        <Leo x={930} y={470} at={s + 2} pose="hunch" mouth="flat" lookDown scale={1} pendant={false} />
        <Tablet x={940} y={600} at={s + 14} s={0.9} />
        <ScribbleOut x={1480} y={120} w={170} h={150} at={out} color={C.ink} />
        <ScribbleOut x={200} y={420} w={300} h={260} at={out + 12} color={C.ink} />
        <ScribbleOut x={1360} y={420} w={170} h={260} at={out + 24} color={C.ink} />
      </Sheet>
      {marks.map((m, i) =>
        m.p > 0 && m.p < 1 ? (
          <div key={i} style={{ position: "absolute", left: m.x, top: m.y, fontFamily: "Caveat", fontWeight: 700, fontSize: 84, color: C.ink, transform: `rotate(${m.r}deg) scale(${1 - m.p * 0.7})` }}>
            ?
          </div>
        ) : null,
      )}
      <Hand at={T("n03", 0.2)} dur={20} x={260} y={130} size={70} rotate={-3}>
        questions go in…
      </Hand>
      <Hand at={T("n03", 1.7)} dur={20} x={1080} y={950} size={70} rotate={-2} color={C.red}>
        …the world stays outside.
      </Hand>
    </>
  );
};

const Grownup: React.FC<{ x: number; y: number; at: number; s?: number }> = ({ x, y, at, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Ink d="M0 -80 C46 -82 66 -44 64 -4 C62 40 30 62 -2 60 C-40 58 -64 30 -62 -6 C-60 -48 -34 -78 6 -78" at={at} dur={12} />
    <Ink d="M-20 -4 l0 8 M20 -4 l0 8 M-16 30 C-4 24 6 24 18 30" at={at + 8} dur={8} width={6} />
    <Ink d="M0 60 L0 280 M0 110 L-70 220 M0 110 C40 80 60 20 30 -40 M0 280 L-50 440 M0 280 L52 440" at={at + 10} dur={14} />
  </g>
);

/** 3 · Origin + reveal: Eli's cousins, then Oomi draws itself and the real object is taped in. */
export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const s = T("reveal");
  const built = T("n05");
  const cousinsOut = built - 4;
  const slide = interpolate(frame, [T("n06", -0.2), T("n06", 0.6)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const bob = Math.sin((frame - built) / 9) * 8;
  const showCousins = frame < cousinsOut + 10;
  const cousinsFade = 1 - useProgress(cousinsOut, 10);
  return (
    <>
      {showCousins && (
        <div style={{ opacity: cousinsFade }}>
          <Sheet>
            <Grownup x={1240} y={420} at={s + 6} s={1.1} />
            <Leo x={560} y={560} at={s + 10} pose="ask" mouth="big" scale={0.62} pendant={false} bounce={10} />
            <Leo x={760} y={600} at={s + 16} pose="cheer" mouth="o" scale={0.55} pendant={false} bounce={14} />
            <Leo x={940} y={570} at={s + 22} pose="ask" mouth="smile" scale={0.6} pendant={false} flip bounce={8} />
            <Bubble x={380} y={300} w={190} h={100} tail={[540, 470]} at={s + 26} side="right" />
            <Bubble x={640} y={250} w={200} h={100} tail={[740, 520]} at={s + 34} side="right" />
            <Bubble x={890} y={290} w={270} h={100} tail={[950, 470]} at={s + 42} />
            <Bubble x={1340} y={170} w={190} h={100} tail={[1300, 330]} at={s + 70} />
            <Arrow d="M380 150 C330 190 330 240 390 290" head={[390, 290, 60]} at={s + 18} color={C.red} />
          </Sheet>
          <Hand at={s + 30} dur={8} x={410} y={312} size={64}>why?</Hand>
          <Hand at={s + 38} dur={8} x={672} y={262} size={64}>why?!</Hand>
          <Hand at={s + 46} dur={8} x={928} y={302} size={64}>but why?</Hand>
          <Hand at={s + 74} dur={8} x={1378} y={182} size={64}>uhhh…</Hand>
          <Hand at={s + 8} dur={18} x={430} y={86} size={64} color={C.red} rotate={-3}>Eli's little cousins</Hand>
        </div>
      )}
      {frame >= built - 2 && (
        <>
          <Sheet>
            <g transform={`translate(${-430 * slide} ${bob})`}>
              <Oomi x={960} y={500} scale={1.9} at={built} face={frame > built + 40 ? "happy" : "idle"} />
            </g>
            <Star x={620} y={240} at={built + 26} r={28} />
            <Star x={1330} y={210} at={built + 32} r={22} color={C.coral} />
            <Star x={1280} y={760} at={built + 38} r={18} color={C.sky} />
            {slide > 0.9 && <Arrow d="M820 760 C900 860 1040 880 1110 830" head={[1110, 830, -30]} at={T("n06", 0.8)} dashed="2 16" />}
          </Sheet>
          <Hand at={built + 22} dur={18} x={810 - 430 * slide} y={820} size={120} color={C.ink}>
            oomi
          </Hand>
          <TapedPhoto src={staticFile("img/oomi-necklace.png")} at={T("n06", 0.5)} x={1050} y={170} w={760} h={507} rotate={3} caption="48 mm · one button · zero screens to scroll" />
        </>
      )}
    </>
  );
};
