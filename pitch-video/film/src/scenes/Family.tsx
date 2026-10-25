import React from "react";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { alongCubic, Oomi, Plane } from "../components/characters";
import { Arrow, Check, Cross, heartPath, ScribbleOut, Star, starPath, ZoomCircle } from "../components/doodles";
import { Hand, Ink, Sheet, TapedPhoto, useProgress, Wash } from "../components/ink";
import { C } from "../theme";
import { T } from "../timeline";

const MOON = "M1720 90 C1640 100 1600 190 1640 260 C1680 330 1780 330 1820 280 C1760 290 1700 250 1690 190 C1680 140 1700 110 1720 90";

/** 5 · Parents: the spark, the activity to do together, Oomi TV, bedtime, mascot colours. */
export const Parents: React.FC = () => {
  const frame = useCurrentFrame();
  const s = T("parents");
  const mine = T("n11", -0.3);
  return (
    <>
      <Sheet>
        <Wash d={MOON} at={s + 10} color={C.sun} opacity={0.5} />
        <Ink d={MOON} at={s + 2} dur={14} color={C.sun} />
        <Star x={1540} y={120} r={18} at={s + 12} />
        <Star x={1830} y={380} r={14} at={s + 16} color={C.sky} />
        <Star x={240} y={110} r={16} at={s + 20} />
      </Sheet>
      <TapedPhoto src={staticFile("screens/parent-today-viewport.png")} at={T("n08", 0.1)} x={260} y={110} w={380} h={824} rotate={-4} outAt={T("n10", -0.3)} />
      <Hand at={T("n08", 0.6)} dur={14} x={700} y={190} size={64} outAt={mine - 10}>
        a transcript
      </Hand>
      {frame >= T("n08", 1.7) && frame < mine && (
        <Sheet>
          <ScribbleOut x={690} y={200} w={330} h={70} at={T("n08", 1.8)} color={C.red} dur={10} />
        </Sheet>
      )}
      <Hand at={T("n08", 2.3)} dur={14} x={720} y={300} size={90} color={C.coralDeep} rotate={-4} outAt={mine - 10}>
        a spark ✨
      </Hand>
      <TapedPhoto src={staticFile("screens/parent-discovery-airplane.png")} at={T("n09", -0.2)} x={1120} y={70} w={390} h={880} rotate={3} outAt={mine - 10} />
      {frame >= T("n09", 1.6) && frame < mine - 10 && (
        <Sheet>
          <ZoomCircle cx={1300} cy={668} rx={225} ry={176} at={T("n09", 1.7)} />
          <Arrow d="M1700 470 C1640 520 1600 560 1550 600" head={[1550, 600, 140]} at={T("n09", 2.2)} />
        </Sheet>
      )}
      <Hand at={T("n09", 2.2)} dur={16} x={1560} y={380} size={62} color={C.red} rotate={6} outAt={mine - 10}>
        do it together!
      </Hand>
      <TapedPhoto src={staticFile("screens/rec-tv-explainer-playing.mp4")} at={T("n09", 3.0)} x={590} y={590} w={460} h={345} rotate={-6} caption="Oomi TV" outAt={mine - 10} />
      <TapedPhoto src={staticFile("screens/parent-bedtime-story-reader-p1.png")} at={T("n10", -0.2)} x={250} y={90} w={380} h={824} rotate={-3} outAt={mine - 10} />
      <Hand at={T("n10", 0.6)} dur={16} x={150} y={970} size={58} rotate={-2} outAt={mine - 10}>
        tonight's story stars… Leo ↑
      </Hand>
      <TapedPhoto src={staticFile("screens/studio-surprise-2.png")} at={mine} x={700} y={300} w={1060} h={662} rotate={2} />
      {["studio-preview-surprise-1", "studio-preview-surprise-3", "studio-preview-surprise-4"].map((name, i) => (
        <TapedPhoto key={name} src={staticFile(`screens/${name}.png`)} at={mine + 8 + i * 6} x={170 + i * 150} y={330 + i * 190} w={300} h={300} objectPosition="50% 6%" rotate={[-7, 4, -3][i]} border={12} />
      ))}
      <Hand at={mine + 10} dur={18} x={0} y={120} width={1920} align="center" size={110} rotate={-1}>
        make it yours!
      </Hand>
    </>
  );
};

const Row: React.FC<{ y: number; at: number; icon: "check" | "heart" | "cross"; label: string; q: string; color: string }> = ({ y, at, icon, label, q, color }) => (
  <>
    <Sheet>
      <Ink d={`M960 ${y} C1250 ${y - 8} 1560 ${y - 4} 1820 ${y + 4} L1816 ${y + 176} C1500 ${y + 184} 1220 ${y + 180} 964 ${y + 172} Z`} at={at} dur={14} color={color} width={6} />
      {icon === "check" && <Check x={1040} y={y + 92} at={at + 10} />}
      {icon === "cross" && <Cross x={1040} y={y + 90} at={at + 10} />}
      {icon === "heart" && (
        <>
          <Wash d={heartPath(1040, y + 92, 1.1)} at={at + 16} color={C.coralLight} />
          <Ink d={heartPath(1040, y + 92, 1.1)} at={at + 10} dur={10} color={C.coralDeep} />
        </>
      )}
    </Sheet>
    <Hand at={at + 8} dur={12} x={1110} y={y + 18} size={60} color={color}>
      {label}
    </Hand>
    <Hand at={at + 16} dur={18} x={1110} y={y + 92} size={52}>
      {q}
    </Hand>
  </>
);

/** 6 · Trust: push-to-talk, no audio kept, three verdicts, not a best friend. */
export const Trust: React.FC = () => {
  const frame = useCurrentFrame();
  const s = T("trust");
  const pressed = frame >= T("n12", 0.1) && frame < T("n12", 1.9);
  const launch = T("n14", -0.2);
  const clear = useProgress(launch - 8, 8);
  const lift = interpolate(frame, [T("n14", 1.2), T("n14", 3.0)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const plane = alongCubic(lift, [[860, 720], [1100, 700], [1400, 500], [2100, 120]]);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - clear }}>
        <Sheet>
          <Oomi x={480} y={620} scale={1.4} at={s} face={pressed ? "listening" : "idle"} led={pressed} />
          {pressed && <Ink d="M440 880 C460 850 510 850 530 880 M485 870 l0 -40" at={T("n12", 0.1)} dur={6} width={8} />}
          {/* the voice, crossed out */}
          <Ink d="M120 260 C140 220 160 300 180 260 C200 210 220 310 240 260 C260 230 280 290 300 260" at={T("n12", 2.0)} dur={12} color={C.sky} width={7} />
          {frame >= T("n12", 2.6) && <Cross x={210} y={260} s={1.6} at={T("n12", 2.6)} />}
        </Sheet>
        <Hand at={T("n12", 0.2)} dur={22} x={150} y={60} size={62}>
          listens only when you press
        </Hand>
        <Hand at={T("n12", 2.6)} dur={16} x={340} y={222} size={56} color={C.red}>
          no audio stored
        </Hand>
        {frame >= T("n13", -0.3) && (
          <>
            <Row y={110} at={T("n13", -0.3)} icon="check" label="answered" q="How do airplanes fly?" color="#2f9d6b" />
            <Row y={410} at={T("n13", 0.4)} icon="heart" label="ask a grown-up" q="Where do babies come from?" color={C.coralDeep} />
            <Row y={710} at={T("n13", 1.1)} icon="cross" label="declined, kindly" q="How do I light a fire?" color={C.red} />
          </>
        )}
      </div>
      {frame >= launch && (
        <>
          <Hand at={launch} dur={16} x={360} y={260} size={120} color={C.ink}>
            best friend
          </Hand>
          <Sheet>
            {frame >= T("n14", 0.5) && <ScribbleOut x={350} y={300} w={560} h={110} at={T("n14", 0.5)} color={C.red} dur={10} />}
            <Ink d="M120 790 C600 780 1200 800 1800 786" at={launch + 4} dur={14} />
            {lift < 1 && <Plane x={plane.x} y={plane.y} rotate={lift > 0 ? plane.angle : -8} scale={2.2} color={C.coralLight} />}
            {Array.from({ length: Math.floor(lift * 30) }, (_, i) => {
              const d = alongCubic(i / 30, [[860, 720], [1100, 700], [1400, 500], [2100, 120]]);
              return <circle key={i} cx={d.x} cy={d.y} r={6} fill={C.sky} />;
            })}
            <Ink d={starPath(1620, 200, 40)} at={T("n14", 2.4)} dur={10} color={C.sun} width={6} />
          </Sheet>
          <Hand at={T("n14", 1.0)} dur={18} x={1000} y={240} size={130} color={C.coralDeep} rotate={-5}>
            a launchpad!
          </Hand>
        </>
      )}
    </>
  );
};
