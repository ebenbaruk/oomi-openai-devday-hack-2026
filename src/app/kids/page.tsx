import type { Metadata, Viewport } from "next";
import { OomiTv } from "@/components/kids/oomi-tv";

export const metadata: Metadata = {
  title: "Oomi TV",
};

export const viewport: Viewport = {
  themeColor: "#fff8ee",
};

export default function KidsPage() {
  return <OomiTv />;
}
