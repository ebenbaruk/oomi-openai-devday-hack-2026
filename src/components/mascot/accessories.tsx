import type { MascotConfig } from "@/lib/contracts";
import { mix } from "./colors";
import { Rounded, type Anchors } from "./species";

type Props = {
  accessory: MascotConfig["accessory"];
  anchors: Anchors;
  accent: string;
  /** Face ink, for glasses drawn on the body. */
  ink: string;
};

/** One chunky accessory, in the accent color, placed on the character's anchors. */
export function Accessory({ accessory, anchors, accent, ink }: Props) {
  const { top, sides, neck, face } = anchors;
  const shade = mix(accent, "#1b1f3b", 0.18);
  switch (accessory) {
    case "none":
      return null;
    case "scarf":
      return (
        <g>
          <rect x={neck.w / -2 + 100} y={neck.y - 13} width={neck.w} height={26} rx={13} fill={accent} />
          <rect x={100 + neck.w * 0.14} y={neck.y - 2} width={26} height={44} rx={13} fill={shade} transform={`rotate(-10 ${100 + neck.w * 0.14 + 13} ${neck.y})`} />
        </g>
      );
    case "cap": {
      const rx = top.w * 0.46;
      const base = top.y + 16;
      return (
        <g>
          <path d={`M${top.x - rx} ${base} A${rx} ${rx * 0.78} 0 0 1 ${top.x + rx} ${base} Z`} fill={accent} />
          <rect x={top.x - rx * 0.4} y={base - 8} width={rx * 1.9} height={16} rx={8} fill={shade} />
          <circle cx={top.x} cy={base - rx * 0.78} r={7} fill={shade} />
        </g>
      );
    }
    case "bow": {
      const x = top.x + top.w * 0.34;
      const y = top.y + 8;
      return (
        <g>
          <Rounded points={`${x - 30},${y - 16} ${x - 30},${y + 16} ${x},${y}`} fill={accent} radius={7} />
          <Rounded points={`${x + 30},${y - 16} ${x + 30},${y + 16} ${x},${y}`} fill={accent} radius={7} />
          <circle cx={x} cy={y} r={10} fill={shade} />
        </g>
      );
    }
    case "headphones":
      return (
        <g>
          <path
            d={`M${top.x - sides.dx} ${sides.y - 6} C${top.x - sides.dx} ${top.y - 28} ${top.x + sides.dx} ${top.y - 28} ${top.x + sides.dx} ${sides.y - 6}`}
            fill="none"
            stroke={shade}
            strokeWidth={10}
            strokeLinecap="round"
          />
          <rect x={top.x - sides.dx - 15} y={sides.y - 26} width={30} height={50} rx={15} fill={accent} />
          <rect x={top.x + sides.dx - 15} y={sides.y - 26} width={30} height={50} rx={15} fill={accent} />
        </g>
      );
    case "leaf":
      return (
        <g>
          <path d={`M${top.x} ${top.y + 6} L${top.x + 2} ${top.y - 12}`} stroke={shade} strokeWidth={8} strokeLinecap="round" />
          <path
            d={`M${top.x + 2} ${top.y - 10} C${top.x + 6} ${top.y - 40} ${top.x + 34} ${top.y - 46} ${top.x + 48} ${top.y - 40} C${top.x + 44} ${top.y - 14} ${top.x + 22} ${top.y - 4} ${top.x + 2} ${top.y - 10} Z`}
            fill={accent}
            stroke={accent}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        </g>
      );
    case "crown": {
      const { x, y } = top;
      return (
        <g>
          <Rounded points={`${x - 30},${y + 8} ${x - 32},${y - 22} ${x - 15},${y - 8} ${x},${y - 30} ${x + 15},${y - 8} ${x + 32},${y - 22} ${x + 30},${y + 8}`} fill={accent} radius={5} />
          <circle cx={x - 32} cy={y - 24} r={6} fill={accent} />
          <circle cx={x} cy={y - 32} r={6} fill={accent} />
          <circle cx={x + 32} cy={y - 24} r={6} fill={accent} />
        </g>
      );
    }
    case "glasses": {
      const r = Math.min(face.eyeR * 2, face.eyeDx - 3);
      const frame = face.surface === "screen" ? accent : ink;
      return (
        <g fill="none" stroke={frame} strokeWidth={6}>
          <circle cx={face.x - face.eyeDx} cy={face.eyeY} r={r} />
          <circle cx={face.x + face.eyeDx} cy={face.eyeY} r={r} />
          <path d={`M${face.x - face.eyeDx + r} ${face.eyeY - 2} Q${face.x} ${face.eyeY - 10} ${face.x + face.eyeDx - r} ${face.eyeY - 2}`} strokeLinecap="round" />
        </g>
      );
    }
  }
}
