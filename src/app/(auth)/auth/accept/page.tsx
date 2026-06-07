"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AcceptInvitePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read the hash BEFORE creating the client (so nothing consumes it first).
    const hash = typeof window !== "undefined" && window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";
    const hashParams = new URLSearchParams(hash);
    const access_token = hashParams.get("access_token");
    const refresh_token = hashParams.get("refresh_token");
    const code = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("code")
      : null;

    (async () => {
      const supabase = createClient();
      try {
        if (access_token && refresh_token) {
          // Invite/magic-link implicit flow — tokens arrive in the URL hash.
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // The SSR client may have already auto-detected the session from the URL.
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            throw new Error("This invite link is invalid or has expired. Ask your admin to resend the invite or reset your password.");
          }
        }
        // Clean the tokens out of the URL, then go set a password.
        router.replace("/set-password");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not accept the invite.");
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl gradient-indigo flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-white tracking-tight">Autoplay</h1>
            <p className="text-slate-400 text-xs">Client Operations Platform</p>
          </div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 shadow-2xl">
          {error ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Couldn&apos;t accept invite</h2>
              <p className="text-sm text-slate-400">{error}</p>
              <a href="/login" className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium">Go to login</a>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
              <p className="text-sm text-slate-300">Accepting your invite…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
