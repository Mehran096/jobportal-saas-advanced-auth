"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

function AuthErrorContent() {
  const params = useSearchParams();
  const router = useRouter();
  const error = params.get("error");

  useEffect(() => {
    if (error === "BANNED") {
      router.replace("/banned");
    }
  }, [error, router]);

  const msg =
    error === "GOOGLE_ONLY"
      ? "This account uses Google login only. Please login with Google."
      : error || "Auth error";

  if (error === "BANNED") {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <h1 className="font-bold">Account Banned</h1>
          <p className="text-xs text-gray-500 mt-1">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="bg-white border rounded-2xl p-6 text-sm">
        <h1 className="font-bold">Login Error</h1>
        <p className="text-xs text-red-600 mt-2">{msg}</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-4 bg-black text-white rounded-xl px-4 py-2 text-xs"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen grid place-items-center">
        <div className="text-xs text-gray-500">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}