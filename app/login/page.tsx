"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, getSession, signOut } from "next-auth/react";
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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false
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

      // BLOCK ADMIN HERE - redirect to admin login
      if (sessionUser?.role === "admin") {
        await signOut({ redirect: false });
        document.cookie = "desired_role=; path=/; max-age=0; SameSite=Lax";
        router.replace("/dashboard/admin/login");
        router.refresh();
        return;
      }

      // Only jobseeker/employer allowed on /login
      if (sessionUser?.role === "jobseeker" || sessionUser?.role === "employer") {
        router.push("/dashboard");
      } else {
        router.push("/dashboard");
      }
      router.refresh();

    } catch (err: unknown) {
      const message = err instanceof Error? err.message : "Login failed.";
      setError(message);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      // Clear role cookie, let Google flow decide
      document.cookie = "desired_role=; path=/; max-age=0; SameSite=Lax";
      await signIn("google", { callbackUrl: "/dashboard" });
    }
    catch {
      setError("Google login failed");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-90 sm:max-w-md">
        <div className="text-center mb-3 sm:mb-5">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl mb-2 sm:mb-3 shadow">
            <Briefcase size={20} className="text-blue-600 sm:w-6 sm:h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-none">JobPortal</h1>
          <p className="text-blue-100 text-[11px] sm:text-xs mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-[15px] sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 text-center">Welcome Back</h2>

          {error && (
            <div className="px-3 py-2 rounded-lg mb-3 text-[11px] sm:text-xs flex items-center gap-1.5 border bg-red-50 border-red-200 text-red-700">
              <AlertCircle size={12} className="shrink-0" />{error}
            </div>
          )}

          <button onClick={handleGoogleLogin} disabled={isGoogleLoading || isLoading}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[13px] flex items-center justify-center gap-2 mb-3 disabled:opacity-50">
            {isGoogleLoading? <Loader2 size={14} className="animate-spin" /> : <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={16} height={16} className="w-4 h-4" unoptimized />}
            {isGoogleLoading? "Connecting..." : "Continue with Google"}
          </button>

          {!googleOnlyMode? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px bg-gray-200 flex-1" /><span className="text-[10px] text-gray-400">or</span><div className="h-px bg-gray-200 flex-1" />
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label htmlFor="email" className="block text-[11px] font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="email" type="email" placeholder="you@example.com" value={email}
                      onChange={(e) => { setEmail(e.target.value); setGoogleOnlyMode(false); }}
                      className="w-full pl-8 pr-3 py-2.5 text-[16px] sm:text-[13px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" required disabled={isLoading} />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-[11px] font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 text-[16px] sm:text-[13px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" required disabled={isLoading} />
                  </div>
                  <div className="text-right mt-1.5">
                    <Link href="/forgot-password" className="text-[11px] text-blue-600 font-medium hover:underline">Forgot password?</Link>
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-2.5 rounded-lg text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm" disabled={isLoading || isGoogleLoading}>
                  {isLoading? <Loader2 size={14} className="animate-spin" /> : null}
                  {isLoading? "Signing In..." : "Login"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-[11px] text-gray-600 mb-3">This email is linked to Google. Password login disabled.</p>
              <button onClick={() => setGoogleOnlyMode(false)} className="text-[11px] text-blue-600 font-medium hover:underline">Try different email</button>
            </div>
          )}

          <p className="text-center text-[11px] sm:text-xs text-gray-600 mt-3 sm:mt-4">
            Do not have an account? <Link href="/register" className="text-blue-600 font-semibold">Register now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin" size={20} /></div>}>
      <LoginContent />
    </Suspense>
  );
}