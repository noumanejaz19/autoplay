"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";

export function SetPasswordForm({ email }: { email: string | null }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError(error.message); return; }
      setDone(true);
      setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 1200);
    });
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 shadow-2xl">
      <div className="w-11 h-11 rounded-xl gradient-indigo flex items-center justify-center mb-4">
        <KeyRound className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-1">Set your password</h2>
      <p className="text-slate-400 text-sm mb-7">
        {email ? <>Create a password for <span className="text-slate-200">{email}</span> so you can log in next time.</> : "Create a password so you can log in next time."}
      </p>

      {error && (
        <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}

      {done ? (
        <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm">Password set! Taking you to your dashboard…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">New Password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button type="button" onClick={() => setShow((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Confirm Password</label>
            <input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              required
              autoComplete="new-password"
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !password || !confirm}
            className="w-full gradient-indigo text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "Saving…" : "Set Password & Continue"}
          </button>
        </form>
      )}
    </div>
  );
}
