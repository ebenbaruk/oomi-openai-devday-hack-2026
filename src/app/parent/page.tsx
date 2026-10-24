import type { Metadata } from "next";
import { connection } from "next/server";
import { ParentApp } from "@/components/parent/parent-app";
import { parseView } from "@/components/parent/views";
import { buildJournal } from "@/server/journal";

export const metadata: Metadata = {
  title: "Parent journal",
};

export default async function ParentPage({ searchParams }: PageProps<"/parent">) {
  await connection();
  const [journal, { view }] = await Promise.all([buildJournal(), searchParams]);
  return <ParentApp initialJournal={journal} initialView={parseView(view)} />;
}
