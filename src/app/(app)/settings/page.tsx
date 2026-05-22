import { getCurrentProfile } from "@/app/actions/auth";
import { SettingsView } from "./settings-view";
import type { Profile } from "@/lib/supabase/types";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  return <SettingsView profile={profile as Profile | null} />;
}
