// Usage: node tools/tts.mjs <lines.json> <outDir>
// lines.json: [{ "id": "n01", "voice": "marin", "text": "...", "instructions": "..." }]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const [linesPath, outDir] = process.argv.slice(2);
const key = process.env.OPENAI_API_KEY;
if (!key) throw new Error("OPENAI_API_KEY missing");
const lines = JSON.parse(await readFile(linesPath, "utf8"));
await mkdir(outDir, { recursive: true });

await Promise.all(
  lines.map(async (line) => {
    const file = path.join(outDir, `${line.id}.wav`);
    if (existsSync(file) && !process.env.FORCE) return;
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: line.model ?? "gpt-4o-mini-tts",
        voice: line.voice,
        input: line.text,
        instructions: line.instructions,
        response_format: "wav",
      }),
    });
    if (!res.ok) throw new Error(`${line.id}: ${res.status} ${await res.text()}`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    console.log("ok", line.id);
  }),
);
