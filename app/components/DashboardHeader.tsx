"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import NotificationBell from "@/app/components/NotificationBell";
import { Briefcase } from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/jobs", label: "Find Jobs", role: "jobseeker" },
  { href: "/dashboard/applications", label: "My Applications", role: "jobseeker" },
  { href: "/dashboard/employer/jobs", label: "My Jobs", role: "employer" },
  { href: "/dashboard/employer/applicants", label: "Applications", role: "employer" },
];

export default function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const user = session?.user as any;
  const fullName = user?.name || "User";
  const role = user?.role;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Briefcase className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-gray-900">JobPortal</h1>
          </Link>
          
          <nav className="hidden md:flex gap-4">
            {navLinks
             .filter(link => !link.role || link.role === role)
             .map(link => {
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={`font-medium transition ${
                      isActive 
                       ? "text-blue-600" 
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
          </nav>
        </div>

        {/* Right: User + Notifications + Logout */}
        <div className="flex items-center gap-4">
          <span className="font-medium hidden sm:block text-gray-700">Hi, {fullName}</span>
          <NotificationBell />
          <button 
            onClick={handleLogout} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}