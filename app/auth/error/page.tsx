"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ShieldAlert } from "lucide-react";

export const dynamic = 'force-dynamic';

function AuthErrorContent() {
  const params = useSearchParams();
  const router = useRouter();
  const error = params.get("error") || "";

  useEffect(() => {
     document.cookie = "desired_role=; path=/; max-age=0; SameSite=Lax; path=/";
    if (error === "BANNED") {
      router.replace("/banned");
    }
  }, [error, router]);

  const isRoleMismatch = error.startsWith("ROLE_MISMATCH");
  const existingRole = error.replace("ROLE_MISMATCH_", "").toLowerCase();
  const isJobSeeker = existingRole === "jobseeker";
  const otherRole = isJobSeeker? "employer" : "jobseeker";

  if (error === "BANNED") {
    return (
      <div className="min-h-dvh grid place-items-center bg-gray-50">
        <div className="text-center">
          <ShieldAlert className="mx-auto text-red-500 mb-2" size={24} />
          <h1 className="font-bold text-[14px]">Account Banned</h1>
          <p className="text-[11px] text-gray-500 mt-1">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-3">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-90 text-center">

        {isRoleMismatch? (
          <>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={18} className="text-yellow-600" />
            </div>
            <h1 className="font-bold text-[14px] sm:text-[15px]">Wrong role selected</h1>
            <p className="text-[11px] sm:text-xs text-gray-600 mt-2 leading-relaxed">
              You are registered as <b className="capitalize text-gray-900">{existingRole}</b>.<br/>
              You tried to login as <b className="capitalize">{otherRole}</b>.<br/>
              <span className="mt-2 block">Please login as <b className="capitalize">{existingRole}</b> to continue.</span>
            </p>
            <div className="mt-4 space-y-2">
              <Link href={`/login?role=${existingRole}`} className="w-full block bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-[12px] font-semibold">
                Login as {isJobSeeker? "Job Seeker" : "Employer"}
              </Link>
              <button onClick={() => router.push("/register")} className="w-full text-[11px] text-gray-500 hover:text-gray-700">
                Back to register
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-bold text-[14px]">Login Error</h1>
            <p className="text-[11px] sm:text-xs text-red-600 mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error === "GOOGLE_ONLY"
               ? "This account uses Google login only. Please use Continue with Google."
                : error || "Authentication failed"}
            </p>
            <button onClick={() => router.push("/login")} className="mt-4 w-full bg-black text-white rounded-lg px-4 py-2 text-[12px] font-medium">
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh grid place-items-center">
        <div className="text-[11px] text-gray-500">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}