"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Briefcase, Bookmark, FileText, User, Building2, Users } from "lucide-react";
import { useGetSavedJobsQuery } from "@/lib/redux/api/jobseekerApi";
import type { LucideIcon } from "lucide-react";

type UserRole = "jobseeker" | "employer" | "admin";
interface SessionUser { id: string; name?: string | null; email?: string | null; role?: UserRole; image?: string | null; }
type NavLink = { href: string; label: string; icon: LucideIcon; showBadge?: boolean; };

const jobseekerLinks: NavLink[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Find Jobs", icon: Briefcase },
  { href: "/dashboard/saved", label: "Saved", icon: Bookmark, showBadge: true },
  { href: "/dashboard/applications", label: "Apps", icon: FileText },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

const employerLinks: NavLink[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/employer/jobs", label: "My Jobs", icon: Building2 },
  { href: "/dashboard/employer/applicants", label: "Applicants", icon: Users },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export default function DashboardMobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  const role = sessionUser?.role;

  const { data: savedData } = useGetSavedJobsQuery(undefined, { skip: role!== "jobseeker" });
  const savedCount = savedData?.savedJobs?.length || 0;

  if (!role) return null;
  const links = role === "employer"? employerLinks : jobseekerLinks;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-50">
      <div className="flex justify-around items-center h-14 px-1 pt-1 pb-[max(6px,env(safe-area-inset-bottom))]">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 relative ${isActive? "text-blue-600" : "text-gray-500"}`}
            >
              {isActive && <span className="absolute -top-2 w-6 h-1 bg-blue-600 rounded-full" />}
              <div className="relative">
                <Icon size={19} strokeWidth={isActive? 2.5 : 2} />
                {link.showBadge && savedCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-bold min-w-4 h-4 px-0.5 rounded-full flex items-center justify-center">
                    {savedCount > 9? "9+" : savedCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] leading-none ${isActive? "font-bold" : "font-medium"}`}>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}