"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { Mail, Lock, Loader2, Briefcase, AlertCircle } from "lucide-react";
import Image from "next/image";

export const dynamic = 'force-dynamic';

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleOnlyMode, setGoogleOnlyMode] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errParam = searchParams.get("error");
    if (errParam === "BANNED") {
      const emailParam = searchParams.get("email") || "";
      router.replace(`/banned?email=${encodeURIComponent(emailParam)}`);
    }
  }, [searchParams, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        const lowerError = res.error.toLowerCase();

        if (lowerError.includes("banned")) {
          router.push(`/banned?email=${encodeURIComponent(email.toLowerCase().trim())}`);
          return;
        }

        if (lowerError.includes("google_only")) {
          setError("This account uses Google login. Please use Continue with Google.");
          setGoogleOnlyMode(true);
          setIsLoading(false);
          return;
        }

        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      const session = await getSession();
      const sessionUser = session?.user as { role?: string; isBanned?: boolean } | undefined;

      if (sessionUser?.isBanned) {
        router.push(`/banned?email=${encodeURIComponent(email.toLowerCase().trim())}`);
        return;
      }

      const role = sessionUser?.role;

      if (role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(message);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Google login failed");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <Briefcase size={32} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">JobPortal</h1>
          <p className="text-blue-100 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Welcome Back</h2>

          {error && (
            <div className="px-4 py-3 rounded-lg mb-5 text-sm flex items-center gap-2 border bg-red-50 border-red-200 text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mb-5 disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Image
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                width={20}
                height={20}
                className="w-5 h-5"
                unoptimized
              />
            )}
            {isGoogleLoading ? "Connecting..." : "Continue with Google"}
          </button>

          {!googleOnlyMode ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-sm text-gray-400">or</span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setGoogleOnlyMode(false);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="text-right mt-2">
                    <Link href="/forgot-password" className="text-sm text-blue-600 font-medium hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {isLoading ? "Signing In..." : "Login"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">This email is linked to Google. Password login disabled.</p>
              <button onClick={() => setGoogleOnlyMode(false)} className="text-sm text-blue-600 font-medium hover:underline">
                Try different email
              </button>
            </div>
          )}

          <p className="text-center text-sm text-gray-600 mt-6">
            Do not have an account?{" "}
            <Link href="/register" className="text-blue-600 font-semibold hover:underline">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin" size={24} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}