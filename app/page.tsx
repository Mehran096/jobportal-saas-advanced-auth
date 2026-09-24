"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    const role = (session.user as { role?: string })?.role;

    if (role === "admin") {
      router.replace("/dashboard/admin");
    } else {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
        <p className="text-gray-600">Loading JobPortal...</p>
      </div>
    </div>
  );
}