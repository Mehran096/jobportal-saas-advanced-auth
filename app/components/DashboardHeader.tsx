"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import NotificationBell from "@/app/components/NotificationBell";
import { Briefcase, Bookmark, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { baseApi } from "@/lib/redux/api/baseApi";
import { useGetSavedJobsQuery } from "@/lib/redux/api/jobseekerApi";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/jobs", label: "Find Jobs", role: "jobseeker" },
  { href: "/dashboard/saved", label: "Saved Jobs", role: "jobseeker" },
  { href: "/dashboard/applications", label: "My Applications", role: "jobseeker" },
  { href: "/dashboard/profile", label: "My Profile", role: "jobseeker" },
  { href: "/dashboard/employer/jobs", label: "My Jobs", role: "employer" },
  { href: "/dashboard/employer/applicants", label: "Applications", role: "employer" },
];

export default function DashboardHeader() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const fullName = user?.name || "User";
  const role = (user as { role?: string })?.role;

  const { data: savedData } = useGetSavedJobsQuery(undefined, {
    skip: role !== "jobseeker",
  });
  const savedCount = savedData?.savedJobs?.length || 0;

  const handleLogout = async () => {
    dispatch(baseApi.util.resetApiState());
    await signOut({ callbackUrl: "/login" });
  };

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Briefcase className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-gray-900">JobPortal</h1>
          </Link>
          <nav className="hidden md:flex gap-4">
            {navLinks
              .filter((link) => !link.role || link.role === role)
              .map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                const isSaved = link.href === "/dashboard/saved";
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`font-medium transition flex items-center gap-1.5 ${
                      isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    {isSaved && <Bookmark size={16} />}
                    {link.label}
                    {isSaved && savedCount > 0 && (
                      <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                        {savedCount}
                      </span>
                    )}
                  </Link>
                );
              })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />

          {/* My Account Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 font-medium text-gray-700 hover:text-black"
            >
              <span className="hidden sm:block">Hi, {fullName}</span>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={16} />
              </div>
              <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-56 bg-white border rounded-xl shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-semibold">{fullName}</p>
                  <p className="text-xs text-gray-500 capitalize">{role}</p>
                </div>

                <Link
                  href="/dashboard/myaccount"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
                >
                  <User size={16} /> My Account
                </Link>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50"
                >
                  <Settings size={16} /> Settings
                </Link>

                <div className="border-t my-1" />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}