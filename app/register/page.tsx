"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRegisterMutation } from "@/lib/redux/api/authApi";
import { Mail, Lock, User, Briefcase, Loader2, Users, AlertCircle } from "lucide-react";
import Image from "next/image";

type ApiError = {
  data?: { message?: string };
  message?: string;
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"jobseeker" | "employer">("jobseeker");
  const [error, setError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const [register, { isLoading }] = useRegisterMutation();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      await register({ 
        firstName: firstName.trim(), 
        lastName: lastName.trim(), 
        email: email.toLowerCase().trim(), 
        password, 
        role 
      }).unwrap();

      await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      router.push("/dashboard"); 
      
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.data?.message || apiErr.message || "Registration failed. Please try again.");
      console.error("Register failed:", err);
    }
  }

  const handleGoogleRegister = async () => {
    setError("");
    setIsGoogleLoading(true);
    document.cookie = `register_role=${role}; path=/; max-age=300; SameSite=Lax`;
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Google sign up failed");
      setIsGoogleLoading(false);
    }
  };

  const isGoogleError = error.toLowerCase().includes("google");

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <Briefcase size={32} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">JobPortal</h1>
          <p className="text-blue-100 mt-2">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create Account</h2>
          
          {error && (
            <div className={`px-4 py-3 rounded-lg mb-5 text-sm flex flex-col gap-2 border ${isGoogleError ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-red-50 border-red-200 text-red-700"}`}>
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
              {isGoogleError && (
                <Link href="/login" className="mt-1 w-full bg-black text-white text-center py-2 rounded-lg text-sm font-medium">
                  Continue with Google
                </Link>
              )}
            </div>
          )}

          {/* GOOGLE BUTTON */}
          <button
            onClick={handleGoogleRegister}
            disabled={isGoogleLoading || isLoading}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mb-5 disabled:opacity-50"
          >
            {isGoogleLoading ? <Loader2 size={18} className="animate-spin" /> : (
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

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-sm text-gray-400">or</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
          
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input 
                    id="firstName"
                    type="text" 
                    placeholder="John" 
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                    required 
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input 
                    id="lastName"
                    type="text" 
                    placeholder="Doe" 
                    value={lastName} 
                    onChange={e => setLastName(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                    required 
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input 
                  id="email"
                  type="email" 
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                  required 
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input 
                  id="password"
                  type="password" 
                  placeholder="Min 6 characters" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                  required 
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("jobseeker")}
                  className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                    role === "jobseeker" 
                      ? "border-blue-600 bg-blue-50 text-blue-600" 
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                  disabled={isLoading}
                >
                  <Users size={16} /> Job Seeker
                </button>
                <button
                  type="button"
                  onClick={() => setRole("employer")}
                  className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                    role === "employer" 
                      ? "border-blue-600 bg-blue-50 text-blue-600" 
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                  disabled={isLoading}
                >
                  <Briefcase size={16} /> Employer
                </button>
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md" 
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}