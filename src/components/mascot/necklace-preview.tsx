"use client";

import { OomiEyes } from "@/components/device/oomi-eyes";
import type { Face, MascotConfig } from "@/lib/contracts";
import { mix, screenColor } from "./colors";

type Props = {
  config: Pick<MascotConfig, "bodyColor" | "accentColor" | "backgroundColor" | "eyes">;
  face?: Face;
  className?: string;
};

/** A small necklace pebble in the mascot's colors, so parents see how the device itself will look. */
export function NecklacePreview({ config, face = "idle", className = "w-28" }: Props) {
  const shade = mix(config.bodyColor, "#1b1f3b", 0.28);
  return (
    <div className={`relative flex flex-col items-center ${className}`} aria-hidden>
      <svg viewBox="0 0 40 30" className="-mb-[7%] w-[22%]">
        <path d="M7 30 V19 a13 13 0 0 1 26 0 V30" fill="none" stroke={config.bodyColor} strokeWidth="8" />
      </svg>
      <div
        className="relative flex aspect-[5/6.2] w-full flex-col items-center pt-[12%]"
        style={{
          borderRadius: "50% 50% 47% 47% / 56% 56% 44% 44%",
          background: `linear-gradient(135deg, ${mix(config.bodyColor, "#ffffff", 0.3)}, ${config.bodyColor} 55%, ${shade})`,
          boxShadow: `inset -6px -8px 14px ${mix(config.bodyColor, "#000000", 0.3)}66, inset 5px 6px 10px rgb(255 255 255 / 0.35), 0 18px 28px -16px ${shade}`,
        }}
      >
        <div className="aspect-square w-[60%] rounded-full p-[3.5%]" style={{ background: screenColor(config.backgroundColor) }}>
          <div className="h-full w-full overflow-hidden rounded-full">
            <OomiEyes face={face} eyeStyle={config.eyes} />
          </div>
        </div>
        <span
          className="mt-[9%] aspect-square w-[27%] rounded-full shadow-[inset_0_-3px_5px_rgb(0_0_0/0.18),inset_0_3px_4px_rgb(255_255_255/0.6)]"
          style={{ background: config.accentColor }}
        />
      </div>
    </div>
  );
}
