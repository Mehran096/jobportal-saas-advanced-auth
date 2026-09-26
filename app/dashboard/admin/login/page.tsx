"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { signIn, signOut, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    document.cookie = "desired_role=; path=/; max-age=0; SameSite=Lax";

    const res = await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });

    if (res?.error) {
      if (res.error === "BANNED") setError("This account has been banned.");
      else if (res.error === "GOOGLE_ONLY") setError("This account uses Google login. Use Google to sign in.");
      else setError("Invalid credentials or not admin");
      setLoading(false);
      return;
    }

    try {
      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;

      if (role!== "admin") {
        await signOut({ redirect: false });
        setError("Access denied. Admins only.");
        setLoading(false);
        return;
      }

      router.push("/dashboard/admin");
      router.refresh();
    } catch {
      setError("Failed to verify admin access");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield size={20} className="text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">Admin Login</h1>
          <p className="text-[13px] sm:text-sm text-zinc-500 mt-1">Only admin can access dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              type="email"
              inputMode="email"
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-[16px] sm:text-[14px] focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-zinc-700">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-[16px] sm:text-[14px] focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full bg-black text-white rounded-xl py-3 text-[14px] font-semibold disabled:opacity-50 hover:bg-zinc-800 active:bg-zinc-900 transition flex items-center justify-center gap-2 h-12"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading? "Logging in..." : "Login as Admin"}
          </button>
        </form>

        <p className="text-center text-[11px] text-zinc-400 mt-6">Secure admin access only</p>
      </div>
    </div>
  );
}