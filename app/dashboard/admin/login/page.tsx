"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const { update } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });

    if (res?.error) {
      if (res.error === "BANNED") {
        setError("This account has been banned.");
      } else if (res.error === "GOOGLE_ONLY") {
        setError("This account uses Google login. Use Google to sign in.");
      } else {
        setError("Invalid credentials or not admin");
      }
      setLoading(false);
      return;
    }

    // Verify role after login
    try {
      await update();
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = (await sessionRes.json()) as {
        user?: { role?: string };
      };

      if (sessionData.user?.role !== "admin") {
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-90 rounded-3xl p-7">
        <h1 className="text-xl font-bold">Admin Login</h1>
        <p className="text-xs text-gray-500 mt-1">Only admin can access dashboard</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email"
            type="email"
            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            required
          />
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          <button
            disabled={loading}
            className="w-full bg-black text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-zinc-800 transition"
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}