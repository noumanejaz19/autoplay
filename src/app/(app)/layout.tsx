import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ToastProvider } from "@/components/ui/toast";
import { DEMO_PROFILE } from "@/lib/demo-data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let profile: typeof DEMO_PROFILE | null = null;

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    profile = DEMO_PROFILE;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, profile_photo_url, availability_status")
      .eq("auth_user_id", user.id)
      .single();

    profile = data as typeof DEMO_PROFILE | null;
  }

  return (
    <ToastProvider>
      <div className="h-full flex bg-slate-50">
        <Sidebar profile={profile} />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Topbar profile={profile} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
