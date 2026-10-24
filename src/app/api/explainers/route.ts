import { after, NextResponse } from "next/server";
import { CreateExplainerRequest } from "@/lib/contracts";
import { requestExplainer } from "@/server/explainers";
import { handle, parseJson } from "@/server/http";

export const maxDuration = 120;

/** Returns the Oomi TV explainer of a discovery, generating it in the background the first time. */
export function POST(request: Request) {
  return handle("explainers", async () => {
    const body = await parseJson(request, CreateExplainerRequest);
    if (body instanceof NextResponse) return body;
    const result = await requestExplainer(body.discoveryId);
    if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const { generate } = result;
    if (generate) after(() => generate().catch((error: unknown) => console.error("[explainer] generation failed:", error)));
    return NextResponse.json(result.explainer);
  });
}
