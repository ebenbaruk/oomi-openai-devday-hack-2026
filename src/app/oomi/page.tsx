import type { Metadata } from "next";
import { Simulator } from "@/components/device/simulator";

export const metadata: Metadata = { title: "Necklace" };

export default function OomiPage() {
  return <Simulator />;
}
