"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRegisterMutation } from "@/lib/redux/api/authApi";
import { Mail, Lock, User, Briefcase, Loader2, Users, AlertCircle } from "lucide-react";
import Image from "next/image";

type UserRole = "jobseeker" | "employer";
interface ApiError { data?: { message?: string }; message?: string; }

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("jobseeker");
  const [error, setError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [register, { isLoading }] = useRegisterMutation();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      await register({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.toLowerCase().trim(), password, role }).unwrap();
      await signIn("credentials", { email: email.toLowerCase().trim(), password, redirect: false });
      router.push("/dashboard");
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.data?.message || apiErr.message || "Registration failed");
    }
  };

  const handleGoogleRegister = async () => {
    setError(""); setIsGoogleLoading(true);
    document.cookie = `desired_role=${role}; path=/; max-age=300; SameSite=Lax`;
    try { await signIn("google", { callbackUrl: "/dashboard" }); }
    catch { setError("Google sign up failed"); setIsGoogleLoading(false); }
  };

  const isGoogleError = error.toLowerCase().includes("google");

  return (
    <div className="min-h-[100dvh] bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-[360px] sm:max-w-md">
        {/* Header - compact */}
        <div className="text-center mb-3 sm:mb-5">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl mb-2 sm:mb-3 shadow">
            <Briefcase size={20} className="text-blue-600 sm:w-6 sm:h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-none">JobPortal</h1>
          <p className="text-blue-100 text-[11px] sm:text-xs mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-[15px] sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 text-center">Create Account</h2>

          {error && (
            <div className={`px-3 py-2 rounded-lg mb-3 text-[11px] sm:text-xs flex flex-col gap-1.5 border ${isGoogleError? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-red-50 border-red-200 text-red-700"}`}>
              <div className="flex items-center gap-1.5"><AlertCircle size={12} />{error}</div>
              {isGoogleError && <Link href="/login" className="w-full bg-black text-white text-center py-1.5 rounded-md text-[11px] font-medium">Continue with Google</Link>}
            </div>
          )}

          <button onClick={handleGoogleRegister} disabled={isGoogleLoading || isLoading}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[13px] flex items-center justify-center gap-2 mb-3 disabled:opacity-50">
            {isGoogleLoading? <Loader2 size={14} className="animate-spin" /> : <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={16} height={16} className="w-4 h-4" unoptimized />}
            {isGoogleLoading? "Connecting..." : `Google as ${role === "employer"? "Employer" : "Job Seeker"}`}
          </button>

          <div className="flex items-center gap-2 mb-3">
            <div className="h-px bg-gray-200 flex-1" /><span className="text-[10px] text-gray-400">or</span><div className="h-px bg-gray-200 flex-1" />
          </div>

          <form onSubmit={handleRegister} className="space-y-3 sm:space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="firstName" className="block text-[11px] font-medium text-gray-700 mb-1">First Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input id="firstName" type="text" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full pl-8 pr-3 py-2 text-[12px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" required disabled={isLoading} />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-[11px] font-medium text-gray-700 mb-1">Last Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input id="lastName" type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full pl-8 pr-3 py-2 text-[12px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" required disabled={isLoading} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-[11px] font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-8 pr-3 py-2 text-[12px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" required disabled={isLoading} />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="password" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className="w-full pl-8 pr-3 py-2 text-[12px] border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" required disabled={isLoading} />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRole("jobseeker")} className={`p-2 sm:p-2.5 border rounded-lg flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium transition-all ${role === "jobseeker"? "border-blue-600 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-600"}`} disabled={isLoading}>
                  <Users size={12} /> Job Seeker
                </button>
                <button type="button" onClick={() => setRole("employer")} className={`p-2 sm:p-2.5 border rounded-lg flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium transition-all ${role === "employer"? "border-blue-600 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-600"}`} disabled={isLoading}>
                  <Briefcase size={12} /> Employer
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[13px] flex items-center justify-center gap-2 disabled:opacity-50" disabled={isLoading || isGoogleLoading}>
              {isLoading? <Loader2 size={14} className="animate-spin" /> : null}
              {isLoading? "Creating..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-[11px] sm:text-xs text-gray-600 mt-3 sm:mt-4">
            Already have account? <Link href="/login" className="text-blue-600 font-semibold">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}