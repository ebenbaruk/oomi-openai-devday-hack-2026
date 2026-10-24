"use client";

import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useId, useState } from "react";
import type { Face, MascotConfig } from "@/lib/contracts";
import { Accessory } from "./accessories";
import { blushOn, inkOn, mix, screenColor } from "./colors";
import { MascotFace, RESTING_POSE, type FacePose } from "./face";
import { SPECIES, type Anchors, type Paint } from "./species";

export type MascotLook = Pick<
  MascotConfig,
  "species" | "bodyColor" | "accentColor" | "backgroundColor" | "eyes" | "mouth" | "cheeks" | "accessory" | "corner"
>;

type Props = {
  config: MascotLook;
  /** Animated expression. Without it the mascot is a still picture (cheap enough for big grids). */
  face?: Face;
  /** Voice loudness, 0–1, read every frame while speaking. */
  level?: () => number;
  /** Only the character, without its square background tile. */
  bare?: boolean;
  /** Rounds the tile's corners (the character is cropped by them). */
  rounded?: boolean;
  className?: string;
  label?: string;
  /** "face" zooms a bare character on its face (eye and mouth pickers). */
  focus?: "face";
};

/** How far up an accessory reaches above the head top, so the character is never cropped at the top. */
const ACCESSORY_RISE: Record<MascotConfig["accessory"], number> = {
  none: 0,
  scarf: 0,
  cap: 34,
  bow: 18,
  headphones: 26,
  leaf: 46,
  crown: 40,
  glasses: 0,
};

/** Highest point of each silhouette, ears and antennas included. */
const SPECIES_TOP: Record<MascotConfig["species"], number> = {
  pebble: 34,
  cat: 18,
  bear: 36,
  bunny: 0,
  frog: 44,
  ghost: 32,
  cloud: 22,
  octopus: 32,
  axolotl: 50,
  robot: 4,
  dino: 6,
  penguin: 24,
};

const GROUND = 198;
const WHOLE_IN_TILE = new Set<MascotConfig["species"]>(["ghost", "octopus", "penguin", "axolotl"]);
const TILT_SPRING = { type: "spring", stiffness: 200, damping: 18 } as const;

/** Highest point of the character with its accessory, so nothing is ever cropped at the top. */
function topOf(config: MascotLook): number {
  return Math.min(SPECIES_TOP[config.species], SPECIES[config.species].top.y - ACCESSORY_RISE[config.accessory]);
}

/** Scale and offset of the bare placement, so a point of the drawing can be found on the canvas. */
function bareFit(config: MascotLook) {
  const top = topOf(config);
  const scale = Math.min(1, 194 / (GROUND - top));
  return { scale, x: 100 - 100 * scale, y: GROUND + 1 - GROUND * scale };
}

function faceViewBox(config: MascotLook): string {
  const { scale, x, y } = bareFit(config);
  const { face } = SPECIES[config.species];
  const cx = x + face.x * scale;
  const cy = y + ((face.eyeY + face.mouthY) / 2) * scale;
  const width = Math.max(112, (2 * face.eyeDx + 5 * face.eyeR) * scale + 24);
  return `${cx - width / 2} ${cy - width * 0.375} ${width} ${width * 0.75}`;
}

/** Tile: big, emerging from the lower corner and cropped by it. Bare: the whole character, fitted. */
function placement(config: MascotLook, bare: boolean): string {
  if (bare) {
    const fit = bareFit(config);
    return `translate(${fit.x} ${fit.y}) scale(${fit.scale})`;
  }
  const top = topOf(config);
  const { neck } = SPECIES[config.species];
  // Characters whose identity sits at the bottom (scallops, tentacles, flippers) are shown whole.
  const whole = WHOLE_IN_TILE.has(config.species);
  const marginTop = whole ? 16 : 22;
  let scale = whole ? Math.min(1.05, 178 / (GROUND - top)) : Math.min(1.22, 198 / (GROUND - top));
  // A scarf sits low: keep it inside the tile rather than cropped away.
  if (config.accessory === "scarf") scale = Math.min(scale, (194 - marginTop) / (neck.y + 14 - top));
  return `translate(${(whole ? 108 : 112) - 100 * scale} ${marginTop - top * scale}) scale(${scale})`;
}

export function MascotArt({ face, ...props }: Props) {
  return face ? <LiveMascot face={face} {...props} /> : <MascotSvg {...props} pose={RESTING_POSE} />;
}

type Motion = {
  bounce?: MotionValue<number>;
  squash?: MotionValue<number>;
  idle?: { animate: Record<string, number | number[]>; transition: Record<string, unknown> };
  tilt?: number;
  extra?: "thinking" | "sleep" | null;
};

function MascotSvg({
  config,
  bare = false,
  rounded = false,
  className = "",
  label,
  focus,
  pose,
  motionState,
}: Omit<Props, "face" | "level"> & { pose: FacePose; motionState?: Motion }) {
  const uid = useId().replace(/:/g, "");
  const art = SPECIES[config.species];
  const screen = screenColor(config.backgroundColor);
  const surface = art.face.surface === "screen" ? screen : art.face.surface === "accent" ? config.accentColor : config.bodyColor;
  const ink = inkOn(surface, config.backgroundColor);
  const paint: Paint = { body: config.bodyColor, accent: config.accentColor, screen, ink: inkOn(config.bodyColor, config.backgroundColor) };
  const mirrored = config.corner === "left";
  const shadeId = `${uid}-shade`;
  const clipId = `${uid}-tile`;
  const bodyId = `${uid}-body`;

  const character = (
    <g transform={placement(config, bare)}>
      <motion.g
        style={{ y: motionState?.bounce, scaleY: motionState?.squash, originX: 0.5, originY: 1 }}
        animate={{ rotate: motionState?.tilt ?? 0, ...motionState?.idle?.animate }}
        transition={{ ...motionState?.idle?.transition, rotate: TILT_SPRING }}
      >
        {art.back?.(paint)}
        {art.shape(config.bodyColor)}
        <clipPath id={bodyId}>{art.shape("#000")}</clipPath>
        <rect y={-20} width={200} height={240} fill={`url(#${shadeId})`} clipPath={`url(#${bodyId})`} />
        {art.front?.(paint)}
        <MascotFace
          look={config}
          anchors={art}
          pose={pose}
          ink={ink}
          light={mix(surface, "#ffffff", 0.85)}
          blush={blushOn(surface)}
        />
        <Accessory accessory={config.accessory} anchors={art} accent={config.accentColor} ink={paint.ink} />
        {motionState?.extra && <Extra kind={motionState.extra} anchors={art} color={config.accentColor} mirrored={mirrored} />}
      </motion.g>
    </g>
  );

  return (
    <svg viewBox={focus === "face" ? faceViewBox(config) : "0 0 200 200"} className={`block ${className}`} role="img" aria-label={label ?? `${art.label} mascot`} overflow={bare ? "visible" : "hidden"}>
      <defs>
        {/* The "barely-there" depth: a soft light from the top left, nothing more. */}
        <radialGradient id={shadeId} gradientUnits="userSpaceOnUse" cx={70} cy={60} r={180}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.18} />
          <stop offset="50%" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.12} />
        </radialGradient>
        {!bare && (
          <clipPath id={clipId}>
            <rect width={200} height={200} rx={rounded ? 44 : 0} />
          </clipPath>
        )}
      </defs>
      <g clipPath={bare ? undefined : `url(#${clipId})`}>
        {!bare && <rect width={200} height={200} fill={config.backgroundColor} />}
        {mirrored ? <g transform="translate(200 0) scale(-1 1)">{character}</g> : character}
      </g>
    </svg>
  );
}

/** Thinking dots or sleepy z's, floating by the head. */
function Extra({ kind, anchors, color, mirrored }: { kind: "thinking" | "sleep"; anchors: Anchors; color: string; mirrored: boolean }) {
  const x = anchors.top.x + anchors.top.w * 0.55;
  const y = anchors.top.y + 6;
  if (kind === "thinking") {
    return (
      <g>
        {[0, 1, 2].map((index) => (
          <motion.circle
            key={index}
            cx={x + index * 13}
            cy={y - index * 9}
            r={4 + index * 1.5}
            fill={color}
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.2 }}
          />
        ))}
      </g>
    );
  }
  return (
    <g fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      {[0, 1, 2].map((index) => {
        const size = 7 + index * 3;
        const zx = x + index * 14;
        const zy = y - index * 14;
        return (
          <motion.path
            key={index}
            d={`M${zx} ${zy} h${size} l${-size} ${size} h${size}`}
            transform={mirrored ? `translate(${2 * zx + size} 0) scale(-1 1)` : undefined}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.6 }}
          />
        );
      })}
    </g>
  );
}

const BREATHE = { animate: { scaleY: [1, 1.018, 1] }, transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } };

function LiveMascot({ face, level, ...props }: Props & { face: Face }) {
  const [blinking, setBlinking] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (face !== "idle") return;
    const interval = setInterval(() => {
      setGaze({ x: Math.round((Math.random() - 0.5) * 9), y: Math.round((Math.random() - 0.5) * 5) });
    }, 2100);
    return () => clearInterval(interval);
  }, [face]);

  useEffect(() => {
    if (face === "sleep" || face === "happy") return;
    let timer: ReturnType<typeof setTimeout>;
    let reopen: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlinking(true);
        reopen = setTimeout(() => setBlinking(false), 140);
        schedule();
      }, 2400 + Math.random() * 3000);
    };
    schedule();
    return () => {
      clearTimeout(timer);
      clearTimeout(reopen);
    };
  }, [face]);

  // Speaking: the body bounces and the mouth opens with the voice; without a level it chatters on its own.
  const loudness = useMotionValue(0);
  const smooth = useSpring(loudness, { stiffness: 420, damping: 20 });
  const bounce = useTransform(smooth, (value) => -value * 9);
  const squash = useTransform(smooth, (value) => 1 + value * 0.05);
  const talk = useTransform(smooth, (value) => 0.25 + value * 0.9);
  useAnimationFrame((time) => {
    if (face !== "speaking") return loudness.set(0);
    loudness.set(level ? level() : 0.35 + 0.35 * Math.sin(time / 90) * Math.sin(time / 230));
  });

  const pose: FacePose = { ...RESTING_POSE, blinking, gaze: face === "idle" ? gaze : RESTING_POSE.gaze };
  const motionState: Motion = { bounce, squash, idle: BREATHE, extra: null };
  switch (face) {
    case "listening":
      Object.assign(pose, { leftScale: 1.18, rightScale: 1.18 });
      motionState.idle = { animate: { scale: [1, 1.03, 1] }, transition: { duration: 1.2, repeat: Infinity } };
      break;
    case "thinking":
      Object.assign(pose, { gaze: { x: 4, y: -4 } });
      motionState.extra = "thinking";
      motionState.tilt = 4;
      break;
    case "speaking":
      Object.assign(pose, { talk, blush: true });
      break;
    case "happy":
      Object.assign(pose, { left: "happy", right: "happy", smile: true, blush: true });
      motionState.idle = { animate: { y: [0, -7, 0] }, transition: { duration: 0.7, repeat: Infinity, repeatDelay: 0.9 } };
      break;
    case "curious":
      Object.assign(pose, { leftScale: 1.22, rightScale: 0.85, gaze: { x: 3, y: -2 } });
      motionState.tilt = -7;
      break;
    case "grown_up":
      Object.assign(pose, { right: "happy", smile: true, blush: true });
      motionState.tilt = 4;
      break;
    case "sleep":
      Object.assign(pose, { left: "closed", right: "closed" });
      motionState.idle = { animate: { scaleY: [1, 0.975, 1] }, transition: { duration: 3.8, repeat: Infinity, ease: "easeInOut" } };
      motionState.extra = "sleep";
      break;
    case "idle":
      break;
  }

  return <MascotSvg {...props} pose={pose} motionState={motionState} />;
}
