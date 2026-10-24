import { Simulator } from "../components/simulator";
import { configurationStatus } from "../server/config";

export const dynamic = "force-dynamic";
export default function Home() { return <Simulator configured={configurationStatus().ready} />; }
