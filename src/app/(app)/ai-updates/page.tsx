import { createClient } from "@/lib/supabase/server";
import { getClients } from "@/app/actions/clients";
import { getClientUpdates } from "@/app/actions/updates";
import { UpdatesView } from "./updates-view";
import type { Client } from "@/lib/supabase/types";
import { DEMO_PROFILE, DEMO_CLIENTS } from "@/lib/demo-data";

export default async function UpdatesPage() {
  let currentProfileId: string | null = null;
  let currentProfileName = "";

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    currentProfileId = DEMO_PROFILE.id;
    currentProfileName = DEMO_PROFILE.full_name;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("id, full_name").eq("auth_user_id", user.id).single();
      const p = data as { id: string; full_name: string } | null;
      currentProfileId = p?.id ?? null;
      currentProfileName = p?.full_name ?? "";
    }
  }

  const [clients, updates] = await Promise.all([
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? Promise.resolve(DEMO_CLIENTS) : getClients(),
    getClientUpdates(),
  ]);

  return (
    <UpdatesView
      clients={clients as Pick<Client, "id" | "company_name">[]}
      updates={updates as Parameters<typeof UpdatesView>[0]["updates"]}
      currentProfileId={currentProfileId}
      currentProfileName={currentProfileName}
    />
  );
}
