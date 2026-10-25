import React from "react";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";

/** The full mix is built offline by tools/mix.ts (ducked music, voice, effects) from src/cues.ts. */
export const Soundtrack: React.FC = () => <Audio src={staticFile("mix.wav")} />;
