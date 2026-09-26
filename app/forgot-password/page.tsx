"use client";

import { useState } from "react";
import Link from "next/link";
import { useForgotPasswordMutation } from "@/lib/redux/api/authApi";
import { Mail, Loader2, Briefcase, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await forgotPassword({ email: email.toLowerCase().trim() }).unwrap();
      setMessage(res.message);
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || "Something went wrong";
      setError(msg);
    }
  };

  const isGoogleError = error.toLowerCase().includes("google");

  return (
    <div className="min-h-dvh bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-90 sm:max-w-md">
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl mb-2 sm:mb-3 shadow-lg">
            <Briefcase size={20} className="text-blue-600 sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">JobPortal</h1>
          <p className="text-blue-100 text-[11px] sm:text-sm mt-1">Reset your password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-7">
          <h2 className="text-[16px] sm:text-xl font-bold text-gray-900 mb-1 text-center">Forgot Password</h2>
          <p className="text-[11px] sm:text-[13px] text-gray-500 text-center mb-4 sm:mb-5">Enter your email to get reset link</p>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 rounded-xl mb-4 text-[12px] flex items-center gap-2">
              <CheckCircle size={14} className="shrink-0" /> {message}
            </div>
          )}
          {error && (
            <div className={`px-3 py-2.5 rounded-xl mb-4 text-[12px] flex flex-col gap-2 border ${isGoogleError? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-red-50 border-red-200 text-red-700"}`}>
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
              {isGoogleError && (
                <Link href="/login" className="mt-1 w-full bg-black text-white text-center py-2.5 rounded-xl text-[12px] font-medium">
                  Continue with Google
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="email" className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-3 sm:py-2.5 border border-gray-300 rounded-xl text-[16px] sm:text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold h-11 sm:h-10.5 rounded-xl transition-all text-[13px] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading? <Loader2 size={14} className="animate-spin" /> : null}
              {isLoading? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <Link href="/login" className="mt-4 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-gray-600 hover:text-blue-600 font-medium">
            <ArrowLeft size={14} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}