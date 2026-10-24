import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";

export async function parseJson<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T> | NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 400 });
  return parsed.data;
}

/** Turns unexpected failures into a clean 500 instead of leaking stack traces to the device. */
export async function handle(label: string, run: () => Promise<Response>): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    console.error(`[${label}]`, error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
