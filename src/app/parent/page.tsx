import type { Metadata } from "next";
import { connection } from "next/server";
import { ParentDashboard } from "@/components/parent/parent-dashboard";
import { buildJournal } from "@/server/journal";

export const metadata: Metadata = {
  title: "Parent journal",
};

export default async function ParentPage() {
  await connection();
  const journal = await buildJournal();
  return <ParentDashboard initialJournal={journal} />;
}
