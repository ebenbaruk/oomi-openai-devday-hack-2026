import { NextResponse } from "next/server";
import { z } from "zod";
import { loadExplainer } from "@/server/explainers";
import { handle } from "@/server/http";

export function GET(_request: Request, { params }: RouteContext<"/api/explainers/[id]">) {
  return handle("explainer", async () => {
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    const explainer = await loadExplainer(id);
    if (!explainer) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(explainer);
  });
}
