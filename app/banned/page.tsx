"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Ban, Mail, MessageSquare, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { useSubmitAppealMutation } from "@/lib/redux/api/authApi";

export const dynamic = 'force-dynamic';

function BannedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [submitAppeal, { isLoading, error }] = useSubmitAppealMutation();

  const apiError = error as { data?: { error?: string } } | undefined;
  const errorMsg = apiError?.data?.error || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      alert("Message must be at least 10 characters");
      return;
    }

    try {
      await submitAppeal({ email: email.toLowerCase().trim(), message: message.trim() }).unwrap();
      setSubmitted(true);
    } catch {
      // error handled by RTK
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h1 className="text-xl font-bold">Appeal Submitted</h1>
          <p className="text-sm text-gray-500 mt-2">
            Your appeal has been sent to our admin team. We will review it within 24-48 hours.
            You will be able to login if approved.
          </p>
          <button onClick={() => router.push("/login")} className="mt-6 w-full bg-black text-white py-2.5 rounded-xl text-sm font-medium">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-red-600 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <Ban size={28} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">Account Banned</h1>
          <p className="text-red-100 text-sm mt-2">Your account has been restricted by admin</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
            <p className="text-xs text-red-700 font-medium">Why was I banned?</p>
            <p className="text-xs text-red-600 mt-1">
              Your account violated our terms (spam, fake jobs, or abuse). If you think this is a mistake, submit an appeal below.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4">{errorMsg}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Mail size={12} /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MessageSquare size={12} /> Why should we unban you?
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain why your account should be restored..."
                required
                minLength={10}
                rows={4}
                className="w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">{message.length}/500 characters (min 10)</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white rounded-xl py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading? <Loader2 size={16} className="animate-spin" /> : null}
              {isLoading? "Submitting..." : "Submit Appeal"}
            </button>
          </form>

          <Link href="/login" className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-black">
            <ArrowLeft size={12} /> Back to login
          </Link>
        </div>

        <p className="text-center text-[11px] text-white/60 mt-4">Appeals are reviewed within 24-48 hours</p>
      </div>
    </div>
  );
}

export default function BannedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen grid place-items-center">
        <div className="text-xs text-gray-500">Loading...</div>
      </div>
    }>
      <BannedContent />
    </Suspense>
  );
}