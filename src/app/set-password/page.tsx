import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "./set-password-form";

export default async function SetPasswordPage() {
  // In demo mode there is no real auth — just show the form shell.
  let email: string | null = null;
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    email = user.email ?? null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl gradient-indigo flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Autoplay</h1>
            <p className="text-slate-400 text-xs">Client Operations Platform</p>
          </div>
        </div>

        <SetPasswordForm email={email} />

        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} Autoplay · All rights reserved
        </p>
      </div>
    </div>
  );
}
