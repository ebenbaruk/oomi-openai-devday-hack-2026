import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Oomi, Plane } from "./components/characters";
import { Star, ZoomCircle } from "./components/doodles";
import { BoilDefs, Hand, Ink, Paper, Sheet, TapedPhoto } from "./components/ink";
import { C } from "./theme";

/** Still images for the repo README, rendered with `remotion still` at frame STILL_FRAME. */
export const STILL_FRAME = 60;

const KIDS = [
  { name: "Eli", src: "img/team/eli.jpg", rotate: -5, pos: "50% 30%" },
  { name: "Ali", src: "img/team/ali.jpg", rotate: 2.5, pos: "50% 35%" },
  { name: "Akram", src: "img/team/akram.jpg", rotate: -3, pos: "50% 30%" },
];

const Question: React.FC<{ x: number; y: number; color: string; s?: number }> = ({ x, y, color, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Ink d="M0 40 C-10 0 40 -10 40 20 C40 40 16 44 18 66 M18 94 l0 2" at={0} dur={10} color={color} width={7} />
  </g>
);

/** 1920×1080: the team as kids, taped into the notebook, with Oomi flying a paper plane past them. */
export const TeamBanner: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <BoilDefs />
    <Hand at={0} x={0} y={40} width={1920} align="center" size={96} rotate={-1}>
      the team, as the kids we were
    </Hand>
    {KIDS.map((k, i) => (
      <TapedPhoto
        key={k.name}
        src={staticFile(k.src)}
        at={0}
        x={190 + i * 540}
        y={210}
        w={460}
        h={460}
        objectPosition={k.pos}
        rotate={k.rotate}
        caption={k.name}
      />
    ))}
    <Sheet>
      <Question x={95} y={300} color={C.sky} s={1.3} />
      <Question x={1780} y={250} color={C.coral} s={1.2} />
      <Star x={150} y={820} r={26} at={0} />
      <Star x={1780} y={760} r={20} at={0} color={C.coral} />
      {[[448, 624], [980, 637], [1522, 624]].map(([cx, cy]) => (
        <ZoomCircle key={cx} cx={cx} cy={cy} rx={56} ry={60} at={0} color={C.red} width={5} />
      ))}
      <Ink d="M190 930 C330 900 450 960 590 915" at={0} dur={20} color={C.sky} width={5} dashed="2 18" />
      <Plane x={660} y={905} rotate={-12} scale={1.1} color={C.coralLight} />
      <Oomi x={1690} y={905} scale={0.5} at={0} face="happy" />
    </Sheet>
    <Hand at={0} x={0} y={800} width={1920} align="center" size={56} color={C.red} rotate={-1}>
      ↑ an Oomi on every one of us ↑
    </Hand>
    <Hand at={0} x={0} y={980} width={1920} align="center" size={54} rotate={-1}>
      36 hours · Paris · <span style={{ color: C.sky }}>#buildinpublic</span>
    </Hand>
  </AbsoluteFill>
);

/** 640×720: one kid's polaroid on a blank notebook corner, for the README team table. */
export const TeamCard: React.FC<{ kid: number }> = ({ kid }) => {
  const k = KIDS[kid];
  return (
    <AbsoluteFill>
      <Paper />
      <BoilDefs />
      <TapedPhoto src={staticFile(k.src)} at={0} x={90} y={70} w={460} h={460} objectPosition={k.pos} rotate={k.rotate * 0.7} caption={k.name} />
      <Sheet>
        <Question x={[30, 560, 40][kid]} y={[560, 580, 120][kid]} color={[C.sky, C.coral, C.sun][kid]} />
      </Sheet>
    </AbsoluteFill>
  );
};
