import { NextResponse } from "next/server";
import { z } from "zod";
import { ActivityDoneRequest } from "@/lib/contracts";
import { handle, parseJson } from "@/server/http";
import { setActivityDone } from "@/server/journal";

/** The family marks (or unmarks) the activity of a discovery as done together. */
export function PATCH(request: Request, { params }: RouteContext<"/api/discoveries/[id]">) {
  return handle("discoveries", async () => {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    const body = await parseJson(request, ActivityDoneRequest);
    if (body instanceof NextResponse) return body;
    if (!(await setActivityDone(id, body.done))) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  });
}
