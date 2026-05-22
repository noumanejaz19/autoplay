import { getProfiles } from "@/app/actions/profiles";
import { TeamView } from "./team-view";
import type { Profile } from "@/lib/supabase/types";

export default async function TeamPage() {
  const profiles = await getProfiles();
  return <TeamView profiles={profiles as Profile[]} />;
}
