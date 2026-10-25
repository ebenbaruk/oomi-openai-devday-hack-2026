import React from "react";
import { Composition } from "remotion";
import { Film } from "./Film";
import { TeamBanner, TeamCard } from "./Stills";
import { FPS, H, W } from "./theme";
import { TOTAL } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="OomiLaunch" component={Film} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    <Composition id="ReadmeTeam" component={TeamBanner} durationInFrames={90} fps={FPS} width={W} height={H} />
    <Composition id="ReadmeTeamCard" component={TeamCard} defaultProps={{ kid: 0 }} durationInFrames={90} fps={FPS} width={640} height={720} />
  </>
);
