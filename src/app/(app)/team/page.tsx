import { getProfiles } from "@/app/actions/profiles";
import { getClients } from "@/app/actions/clients";
import { TeamView } from "./team-view";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Client } from "@/lib/supabase/types";
import { DEMO_PROFILE, DEMO_CLIENTS } from "@/lib/demo-data";

export default async function TeamPage() {
  let isAdmin = false;

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    isAdmin = DEMO_PROFILE.role === "admin";
    const profiles = await getProfiles();
    return (
      <TeamView
        profiles={profiles as Profile[]}
        clients={DEMO_CLIENTS.map(c => ({ id: c.id, company_name: c.company_name }))}
        isAdmin={isAdmin}
      />
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("auth_user_id", user.id).single();
    isAdmin = (data as { role: string } | null)?.role === "admin";
  }

  const [profiles, clients] = await Promise.all([
    getProfiles(),
    getClients(),
  ]);

  return (
    <TeamView
      profiles={profiles as Profile[]}
      clients={(clients as Pick<Client, "id" | "company_name">[]).map(c => ({ id: c.id, company_name: c.company_name }))}
      isAdmin={isAdmin}
    />
  );
}
