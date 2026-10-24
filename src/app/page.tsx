import { Features } from "@/components/landing/features";
import { Hardware } from "@/components/landing/hardware";
import { Hero, Nav } from "@/components/landing/hero";
import { FinalCta, Footer, WhatItIsNot } from "@/components/landing/outro";
import { Safety } from "@/components/landing/safety";
import { HowItWorks, Problem } from "@/components/landing/story";
import { UnderTheHood } from "@/components/landing/tech";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="overflow-x-clip">
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Safety />
        <WhatItIsNot />
        <Hardware />
        <UnderTheHood />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
