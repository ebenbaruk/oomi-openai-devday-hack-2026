import "server-only";
import {
  DEFAULT_MASCOT,
  MascotConfig,
  type MascotPortrait,
  type MascotState,
} from "@/lib/contracts";
import { CHILD_ID, query, queryOne } from "./db";
import { env } from "./env";
import { imageUrl } from "./images";
import { openai } from "./openai";

/** A stored config may predate newer options: anything missing or invalid falls back to the default. */
export function parseMascot(stored: unknown): MascotConfig {
  const merged = { ...DEFAULT_MASCOT, ...(typeof stored === "object" && stored ? stored : {}) };
  const parsed = MascotConfig.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_MASCOT;
}

type PortraitRow = { id: string; image_id: string; species: string; created_at: Date };

function toPortrait(row: PortraitRow): MascotPortrait {
  return { id: row.id, imageUrl: imageUrl(row.image_id) as string, species: row.species, createdAt: row.created_at.toISOString() };
}

export async function loadMascot(): Promise<MascotState> {
  const [settings, portraits] = await Promise.all([
    queryOne<{ mascot: unknown }>(`SELECT mascot FROM oomi_app.settings WHERE child_id = $1`, [CHILD_ID]),
    query<PortraitRow>(
      `SELECT id, image_id, species, created_at FROM oomi_app.mascot_portrait WHERE child_id = $1 ORDER BY created_at DESC LIMIT 24`,
      [CHILD_ID],
    ),
  ]);
  const config = parseMascot(settings?.mascot);
  const gallery = portraits.map(toPortrait);
  const chosen = gallery.find((portrait) => portrait.id === config.portraitId);
  return { config, portraitUrl: chosen?.imageUrl ?? null, portraits: gallery };
}

export async function saveMascot(config: MascotConfig): Promise<MascotState> {
  await query(`UPDATE oomi_app.settings SET mascot = $2, updated_at = now() WHERE child_id = $1`, [CHILD_ID, JSON.stringify(config)]);
  return loadMascot();
}

export async function deletePortrait(id: string): Promise<void> {
  const row = await queryOne<{ image_id: string }>(
    `DELETE FROM oomi_app.mascot_portrait WHERE id = $1 AND child_id = $2 RETURNING image_id`,
    [id, CHILD_ID],
  );
  if (row) await query(`DELETE FROM oomi_app.image WHERE id = $1`, [row.image_id]);
}

// ---------- Portrait generation, following the ip-as-logo method (third_party/ip-as-logo, MIT) ----------

const SUBJECTS: Record<MascotConfig["species"], string> = {
  pebble: "small round pebble-shaped explorer creature whose whole face is one big dark rounded screen",
  cat: "kitten with two big rounded ears",
  bear: "bear cub with two round ears",
  bunny: "bunny with two long rounded ears",
  frog: "frog with two big round eye bumps on top of its head",
  ghost: "little ghost with a soft wavy rounded bottom",
  cloud: "fluffy cloud creature made of three big round puffs",
  octopus: "baby octopus with a big round head and short rounded arms",
  axolotl: "axolotl with three soft rounded gill fronds on each side",
  robot: "small robot with one short rounded antenna and a broad visor face",
  dino: "baby dinosaur with three soft rounded back plates",
  penguin: "penguin chick with a round belly patch",
};

const ACCESSORIES: Record<MascotConfig["accessory"], string> = {
  none: "",
  scarf: " wearing one chunky rounded scarf",
  cap: " wearing one small rounded explorer cap",
  bow: " wearing one big rounded bow",
  headphones: " wearing one pair of big rounded headphones",
  leaf: " with one small rounded leaf sprouting on top",
  crown: " wearing one tiny rounded crown",
  glasses: " wearing one pair of big round glasses",
};

const EYES: Record<MascotConfig["eyes"], string> = {
  round: "two big round eyes",
  dots: "two small dot eyes",
  ovals: "two tall oval eyes",
  sleepy: "two calm closed curved eyes",
  sparkle: "two big round eyes with one tiny sparkle each",
};

const MOUTHS: Record<MascotConfig["mouth"], string> = {
  none: "no mouth",
  smile: "one tiny smile",
  open: "one tiny open happy mouth",
  cat: "one tiny cat-like mouth",
};

/** Image models read color names better than hex codes, so both are given. */
export function colorName(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => channel / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const saturation = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1));
  const tone = lightness < 0.25 ? "deep " : lightness > 0.78 ? "pale " : "";
  if (saturation < 0.12) return lightness < 0.2 ? "near-black" : lightness > 0.9 ? "off-white" : `${tone}gray`;
  let hue = 0;
  if (max === r) hue = ((g - b) / (max - min)) % 6;
  else if (max === g) hue = (b - r) / (max - min) + 2;
  else hue = (r - g) / (max - min) + 4;
  hue = (hue * 60 + 360) % 360;
  const names: [number, string][] = [
    [15, "red"], [40, "orange"], [65, "yellow"], [95, "lime"], [160, "green"], [190, "teal"],
    [215, "sky blue"], [250, "blue"], [285, "violet"], [330, "pink"], [360, "red"],
  ];
  return `${tone}${names.find(([limit]) => hue < limit)?.[1] ?? "red"}`;
}

/** The ip-as-logo prompt skeleton, filled with the family's choices. */
export function portraitPrompt(config: MascotConfig): string {
  const background = `${colorName(config.backgroundColor)} (${config.backgroundColor})`;
  const body = `${colorName(config.bodyColor)} (${config.bodyColor})`;
  const accent = `${colorName(config.accentColor)} (${config.accentColor})`;
  const corner = config.corner === "left" ? "lower-left" : "lower-right";
  const subject = `${SUBJECTS[config.species]}${ACCESSORIES[config.accessory]}`;
  const face = `${EYES[config.eyes]}, ${MOUTHS[config.mouth]}${config.cheeks ? ", two small round cheeks in the second color" : ""}`;
  return `Create one complete full-bleed 1:1 square image.
Background: fill the entire square with solid ${background}. Keep ${background} visible in every open area and in the corners not occupied by the character; the assigned emergence corner must be occupied by the character.
Subject: place one extremely simplified, cute, endearing ${subject} IP character on the background, reduced to one soft rounded continuous silhouette and one defining feature. Face: ${face}.
Complexity: use only 4–7 large basic shapes and at most two broad internal color regions. Remove every nonessential line, outline, anatomical detail, texture, and decoration. Keep the character readable at 32 × 32.
Color behavior: use exactly three semantic colors in the complete image: the main body color ${body}, the second color ${accent}, plus the background color. Organize both character colors into broad purposeful masses, and reuse them for facial marks. Keep the character, facial marks, and background clearly separated.
Composition: keep the character upright and emerging from the ${corner} corner, filling about 85–95% of the square so it remains visually dominant. Cropping at the bottom or that side is welcome when it strengthens the corner emergence. Preserve both paired identifying features. Never center or bottom-center the character.
Style: make simplification, cuteness, and lovable baby-like appeal the strongest qualities. Use large soft forms, compact proportions, thick rounded contours, and an ultra-clean graphic treatment. Prefer one clear shape over several explanatory details. Add an extremely, extremely subtle, almost imperceptible sense of depth through a barely-there neo-skeuomorphic treatment.
Finish: show only the character on the full-canvas background, with clean surfaces and normal square outer corners.
Constraints: Use no text or watermark. Add no borders, frames, cards, or presentation masks. Include one character only, with no extra subjects or scenery. Use no fragile lines, sharp tips, unnecessary outlines, tiny details, or decorative marks. Add no photorealistic material, dramatic bevel, glossy hotspot, deep occlusion, extrusion, strong three-dimensional rendering, or external cast shadow. Keep the background solid and uniform, with no texture, vignette, or lighting variation.`;
}

/** One stochastic draw (ip-as-logo: every result is kept, never filtered or retried). */
export async function createPortrait(config: MascotConfig): Promise<MascotPortrait> {
  const result = await openai((client) =>
    client.images.generate({
      model: env().OOMI_MODEL_IMAGE,
      prompt: portraitPrompt(config),
      size: "1024x1024",
      quality: "medium",
      output_format: "webp",
      output_compression: 85,
      n: 1,
    }),
  );
  const base64 = result.data?.[0]?.b64_json;
  if (!base64) throw new Error("Portrait generation returned no data");
  const image = await queryOne<{ id: string }>(`INSERT INTO oomi_app.image (mime, data) VALUES ($1, $2) RETURNING id`, [
    "image/webp",
    Buffer.from(base64, "base64"),
  ]);
  if (!image) throw new Error("Failed to store portrait");
  const row = await queryOne<PortraitRow>(
    `INSERT INTO oomi_app.mascot_portrait (child_id, image_id, species, config) VALUES ($1, $2, $3, $4)
     RETURNING id, image_id, species, created_at`,
    [CHILD_ID, image.id, config.species, JSON.stringify(config)],
  );
  if (!row) throw new Error("Failed to save portrait");
  return toPortrait(row);
}
