import type { ReactNode } from "react";
import type { MascotConfig } from "@/lib/contracts";

// Every character is drawn on a 200×200 canvas, centered on x = 100 and standing on y ≈ 198,
// from a handful of big rounded shapes (the ip-as-logo complexity budget: 4–7 shapes, one defining feature).

export type Species = MascotConfig["species"];

export type Paint = { body: string; accent: string; screen: string; ink: string };

/** Where the face and accessories sit on a character. */
export type Anchors = {
  face: {
    x: number;
    eyeY: number;
    eyeDx: number;
    /** Base eye radius. */
    eyeR: number;
    mouthY: number;
    cheekDx: number;
    cheekY: number;
    /** What the eyes are drawn on, so the ink always contrasts. */
    surface: "body" | "accent" | "screen";
  };
  /** Top of the head (hats, crowns, leaves) and its width there. */
  top: { x: number; y: number; w: number };
  /** Sides of the head, for headphone cups. */
  sides: { dx: number; y: number };
  neck: { y: number; w: number };
};

export type SpeciesArt = Anchors & {
  label: string;
  /** Shapes behind the silhouette (ears, plates, puffs). */
  back?: (paint: Paint) => ReactNode;
  /** The one continuous silhouette, painted in the body color (and once more with the soft depth gradient). */
  shape: (fill: string) => ReactNode;
  /** Accent regions and screens on top of the silhouette. */
  front?: (paint: Paint) => ReactNode;
};

/** A polygon whose corners are rounded by a thick stroke of the same color: blunt tips, never sharp ones. */
export function Rounded({ points, fill, radius }: { points: string; fill: string; radius: number }) {
  return <polygon points={points} fill={fill} stroke={fill} strokeWidth={radius * 2} strokeLinejoin="round" />;
}

const EGG = "M100 40 C160 40 186 90 186 138 C186 180 150 198 100 198 C50 198 14 180 14 138 C14 90 40 40 100 40 Z";

export const SPECIES: Record<Species, SpeciesArt> = {
  pebble: {
    label: "Pebble",
    shape: (fill) => (
      <path d="M100 34 C158 34 184 88 184 136 C184 178 148 198 100 198 C52 198 16 178 16 136 C16 88 42 34 100 34 Z" fill={fill} />
    ),
    front: ({ accent, screen }) => (
      <>
        <circle cx={100} cy={112} r={52} fill={screen} />
        <circle cx={100} cy={179} r={11} fill={accent} />
      </>
    ),
    face: { x: 100, eyeY: 110, eyeDx: 22, eyeR: 12, mouthY: 136, cheekDx: 38, cheekY: 134, surface: "screen" },
    top: { x: 100, y: 36, w: 110 },
    sides: { dx: 84, y: 120 },
    neck: { y: 168, w: 168 },
  },
  cat: {
    label: "Cat",
    back: ({ body, accent }) => (
      <>
        <Rounded points="22,104 36,26 92,62" fill={body} radius={12} />
        <Rounded points="178,104 164,26 108,62" fill={body} radius={12} />
        <Rounded points="38,86 44,46 72,64" fill={accent} radius={7} />
        <Rounded points="162,86 156,46 128,64" fill={accent} radius={7} />
      </>
    ),
    shape: (fill) => <path d={EGG} fill={fill} transform="translate(0 6)" />,
    face: { x: 100, eyeY: 122, eyeDx: 34, eyeR: 12, mouthY: 146, cheekDx: 56, cheekY: 146, surface: "body" },
    top: { x: 100, y: 48, w: 100 },
    sides: { dx: 86, y: 128 },
    neck: { y: 182, w: 160 },
  },
  bear: {
    label: "Bear",
    back: ({ body, accent }) => (
      <>
        <circle cx={44} cy={66} r={30} fill={body} />
        <circle cx={156} cy={66} r={30} fill={body} />
        <circle cx={44} cy={66} r={14} fill={accent} />
        <circle cx={156} cy={66} r={14} fill={accent} />
      </>
    ),
    shape: (fill) => <path d={EGG} fill={fill} transform="translate(0 6)" />,
    front: ({ accent, ink }) => (
      <>
        <ellipse cx={100} cy={152} rx={34} ry={26} fill={accent} />
        <ellipse cx={100} cy={142} rx={9} ry={6.5} fill={ink} />
      </>
    ),
    face: { x: 100, eyeY: 116, eyeDx: 38, eyeR: 11, mouthY: 156, cheekDx: 60, cheekY: 146, surface: "body" },
    top: { x: 100, y: 48, w: 96 },
    sides: { dx: 86, y: 126 },
    neck: { y: 184, w: 160 },
  },
  bunny: {
    label: "Bunny",
    back: ({ body, accent }) => (
      <>
        <rect x={44} y={2} width={40} height={112} rx={20} fill={body} transform="rotate(-10 64 100)" />
        <rect x={116} y={2} width={40} height={112} rx={20} fill={body} transform="rotate(10 136 100)" />
        <rect x={55} y={16} width={18} height={70} rx={9} fill={accent} transform="rotate(-10 64 100)" />
        <rect x={127} y={16} width={18} height={70} rx={9} fill={accent} transform="rotate(10 136 100)" />
      </>
    ),
    shape: (fill) => <path d="M100 74 C160 74 184 110 184 146 C184 182 150 198 100 198 C50 198 16 182 16 146 C16 110 40 74 100 74 Z" fill={fill} />,
    face: { x: 100, eyeY: 134, eyeDx: 34, eyeR: 11, mouthY: 156, cheekDx: 56, cheekY: 156, surface: "body" },
    top: { x: 100, y: 76, w: 90 },
    sides: { dx: 86, y: 140 },
    neck: { y: 186, w: 160 },
  },
  frog: {
    label: "Frog",
    back: ({ body }) => (
      <>
        <circle cx={56} cy={80} r={36} fill={body} />
        <circle cx={144} cy={80} r={36} fill={body} />
      </>
    ),
    shape: (fill) => <path d="M100 76 C168 76 194 116 194 152 C194 184 156 198 100 198 C44 198 6 184 6 152 C6 116 32 76 100 76 Z" fill={fill} />,
    front: ({ accent }) => <ellipse cx={100} cy={178} rx={58} ry={30} fill={accent} />,
    face: { x: 100, eyeY: 78, eyeDx: 44, eyeR: 13, mouthY: 132, cheekDx: 66, cheekY: 128, surface: "body" },
    top: { x: 100, y: 78, w: 70 },
    sides: { dx: 94, y: 128 },
    neck: { y: 176, w: 176 },
  },
  ghost: {
    label: "Ghost",
    back: ({ accent }) => (
      <>
        <ellipse cx={20} cy={130} rx={18} ry={14} fill={accent} transform="rotate(-24 20 130)" />
        <ellipse cx={180} cy={130} rx={18} ry={14} fill={accent} transform="rotate(24 180 130)" />
      </>
    ),
    shape: (fill) => (
      <>
        <path d="M22 122 C22 66 56 32 100 32 C144 32 178 66 178 122 L178 170 L22 170 Z" fill={fill} />
        <circle cx={48} cy={170} r={26} fill={fill} />
        <circle cx={100} cy={174} r={26} fill={fill} />
        <circle cx={152} cy={170} r={26} fill={fill} />
      </>
    ),
    face: { x: 100, eyeY: 106, eyeDx: 30, eyeR: 12, mouthY: 132, cheekDx: 52, cheekY: 130, surface: "body" },
    top: { x: 100, y: 34, w: 104 },
    sides: { dx: 78, y: 110 },
    neck: { y: 156, w: 156 },
  },
  cloud: {
    label: "Cloud",
    back: ({ accent }) => <circle cx={156} cy={52} r={30} fill={accent} />,
    shape: (fill) => (
      <>
        <circle cx={60} cy={124} r={44} fill={fill} />
        <circle cx={104} cy={100} r={58} fill={fill} />
        <circle cx={148} cy={128} r={42} fill={fill} />
        <rect x={16} y={124} width={172} height={64} rx={32} fill={fill} />
      </>
    ),
    face: { x: 102, eyeY: 120, eyeDx: 30, eyeR: 11, mouthY: 144, cheekDx: 52, cheekY: 144, surface: "body" },
    top: { x: 104, y: 44, w: 90 },
    sides: { dx: 86, y: 132 },
    neck: { y: 176, w: 168 },
  },
  octopus: {
    label: "Octopus",
    back: ({ body }) => (
      <g fill="none" stroke={body} strokeWidth={26} strokeLinecap="round">
        <path d="M52 150 C40 170 24 176 18 190" />
        <path d="M148 150 C160 170 176 176 182 190" />
      </g>
    ),
    shape: (fill) => (
      <>
        <ellipse cx={100} cy={102} rx={76} ry={70} fill={fill} />
        <rect x={34} y={110} width={132} height={64} rx={30} fill={fill} />
        <g fill="none" stroke={fill} strokeWidth={26} strokeLinecap="round">
          <path d="M76 160 C74 176 68 184 64 190" />
          <path d="M124 160 C126 176 132 184 136 190" />
        </g>
      </>
    ),
    front: ({ accent }) => (
      <>
        <circle cx={72} cy={58} r={11} fill={accent} />
        <circle cx={100} cy={48} r={13} fill={accent} />
        <circle cx={128} cy={58} r={11} fill={accent} />
      </>
    ),
    face: { x: 100, eyeY: 108, eyeDx: 32, eyeR: 12, mouthY: 136, cheekDx: 54, cheekY: 134, surface: "body" },
    top: { x: 100, y: 34, w: 104 },
    sides: { dx: 80, y: 108 },
    neck: { y: 158, w: 140 },
  },
  axolotl: {
    label: "Axolotl",
    back: ({ accent }) => (
      <g fill="none" stroke={accent} strokeWidth={20} strokeLinecap="round">
        <path d="M38 96 L14 64" />
        <path d="M30 116 L4 108" />
        <path d="M34 136 L8 152" />
        <path d="M162 96 L186 64" />
        <path d="M170 116 L196 108" />
        <path d="M166 136 L192 152" />
      </g>
    ),
    shape: (fill) => <path d="M100 58 C162 58 184 96 184 134 C184 178 150 198 100 198 C50 198 16 178 16 134 C16 96 38 58 100 58 Z" fill={fill} />,
    face: { x: 100, eyeY: 118, eyeDx: 42, eyeR: 11, mouthY: 142, cheekDx: 62, cheekY: 142, surface: "body" },
    top: { x: 100, y: 60, w: 100 },
    sides: { dx: 84, y: 124 },
    neck: { y: 184, w: 164 },
  },
  robot: {
    label: "Robot",
    back: ({ body, accent }) => (
      <>
        <rect x={93} y={18} width={14} height={40} rx={7} fill={body} />
        <circle cx={100} cy={20} r={16} fill={accent} />
        <rect x={8} y={98} width={26} height={46} rx={13} fill={accent} />
        <rect x={166} y={98} width={26} height={46} rx={13} fill={accent} />
      </>
    ),
    shape: (fill) => <rect x={22} y={48} width={156} height={150} rx={52} fill={fill} />,
    front: ({ screen }) => <rect x={44} y={80} width={112} height={74} rx={37} fill={screen} />,
    face: { x: 100, eyeY: 114, eyeDx: 26, eyeR: 11, mouthY: 138, cheekDx: 62, cheekY: 170, surface: "screen" },
    top: { x: 100, y: 50, w: 110 },
    sides: { dx: 82, y: 120 },
    neck: { y: 186, w: 156 },
  },
  dino: {
    label: "Dino",
    back: ({ accent }) => (
      <>
        <Rounded points="52,70 58,30 84,54" fill={accent} radius={11} />
        <Rounded points="84,50 100,14 116,50" fill={accent} radius={12} />
        <Rounded points="148,70 142,30 116,54" fill={accent} radius={11} />
      </>
    ),
    shape: (fill) => <path d={EGG} fill={fill} />,
    face: { x: 100, eyeY: 112, eyeDx: 36, eyeR: 12, mouthY: 140, cheekDx: 58, cheekY: 140, surface: "body" },
    top: { x: 100, y: 42, w: 100 },
    sides: { dx: 86, y: 124 },
    neck: { y: 180, w: 164 },
  },
  penguin: {
    label: "Penguin",
    back: ({ body }) => (
      <>
        <ellipse cx={22} cy={150} rx={16} ry={34} fill={body} transform="rotate(18 22 150)" />
        <ellipse cx={178} cy={150} rx={16} ry={34} fill={body} transform="rotate(-18 178 150)" />
      </>
    ),
    shape: (fill) => <path d="M100 24 C158 24 182 84 182 136 C182 180 148 198 100 198 C52 198 18 180 18 136 C18 84 42 24 100 24 Z" fill={fill} />,
    front: ({ accent, body }) => (
      <>
        <circle cx={76} cy={110} r={34} fill={accent} />
        <circle cx={124} cy={110} r={34} fill={accent} />
        <ellipse cx={100} cy={160} rx={56} ry={40} fill={accent} />
        <Rounded points="92,124 108,124 100,134" fill={body} radius={4} />
      </>
    ),
    face: { x: 100, eyeY: 108, eyeDx: 26, eyeR: 10, mouthY: 144, cheekDx: 46, cheekY: 132, surface: "accent" },
    top: { x: 100, y: 26, w: 104 },
    sides: { dx: 82, y: 112 },
    neck: { y: 178, w: 150 },
  },
};
