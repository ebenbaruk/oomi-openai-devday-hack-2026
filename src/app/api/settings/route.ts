import { NextResponse } from "next/server";
import { SettingsInput } from "@/lib/contracts";
import { saveSettings } from "@/server/child";
import { handle, parseJson } from "@/server/http";

export function PUT(request: Request) {
  return handle("settings", async () => {
    const body = await parseJson(request, SettingsInput);
    if (body instanceof NextResponse) return body;
    await saveSettings(body);
    return NextResponse.json({ ok: true });
  });
}
