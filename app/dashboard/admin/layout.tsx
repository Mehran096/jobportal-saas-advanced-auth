"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Briefcase, Shield, LogOut, Menu, X, Flag, AlertTriangle } from "lucide-react";
import { useGetAppealsQuery } from "@/lib/redux/api/adminApi";
import { useGetReportsQuery } from "@/lib/redux/api/reportApi";

export const dynamic = 'force-dynamic';

const menu = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
  { href: "/dashboard/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/admin/reports", label: "Reports", icon: AlertTriangle, badgeKey: "reports" },
  { href: "/dashboard/admin/appeals", label: "Appeals", icon: Flag, badgeKey: "appeals" },
];

interface SessionUser { role?: string }

function SidebarInner({ pathname, onClose, onLogout, loggingOut, appealsCount, reportsCount }: {
  pathname: string; onClose?: () => void; onLogout: () => void; loggingOut: boolean; appealsCount: number; reportsCount: number;
}) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-8 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center"><Shield size={16} className="text-black" /></div>
            <span className="font-bold text-sm">Admin Panel</span>
          </div>
          {onClose && <button onClick={onClose} className="lg:hidden"><X size={18} /></button>}
        </div>
        <nav className="space-y-1">
          {menu.map((m) => {
            const active = pathname === m.href;
            const count = m.badgeKey === "appeals"? appealsCount : m.badgeKey === "reports"? reportsCount : 0;
            return (
              <Link key={m.href} href={m.href} onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition ${active? "bg-white text-black" : "text-gray-400 hover:text-white hover:bg-zinc-800"}`}>
                <span className="flex items-center gap-3"><m.icon size={16} /> {m.label}</span>
                {count > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-red-500 text-white">{count}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="pt-4 border-t border-zinc-800 space-y-2">
        <button onClick={onLogout} disabled={loggingOut}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 text-left">
          <LogOut size={16} /> {loggingOut? "Logging out..." : "Logout"}
        </button>
        <Link href="/" className="flex items-center gap-2 text-xs text-gray-400 hover:text-white px-3">Back to site</Link>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const role = (session?.user as SessionUser | undefined)?.role;

  // IMPORTANT: Don't run admin auth on login page itself
  const isLoginPage = pathname === "/dashboard/admin/login";

  const { data: appealsData } = useGetAppealsQuery(undefined, { skip: role!== "admin" || isLoginPage });
  const { data: reportsData } = useGetReportsQuery(undefined, { skip: role!== "admin" || isLoginPage });

  const appealsCount = appealsData?.appeals?.filter((a: { status: string }) => a.status === "pending").length || 0;
  const reportsCount = reportsData?.reports?.filter((r: { status: string }) => r.status === "pending").length || 0;

  useEffect(() => {
    if (isLoginPage) return; // skip check on login page
    if (status === "loading") return;
    if (!session) {
      router.replace("/dashboard/admin/login");
      return;
    }
    if (role && role!== "admin") router.replace("/");
  }, [session, status, role, router, isLoginPage]);

  const handleLogout = async () => {
    setLoggingOut(true);
    document.cookie = "desired_role=; path=/; max-age=0; SameSite=Lax";
    await signOut({ callbackUrl: "/dashboard/admin/login" });
  };

  // If login page, render without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return <div className="min-h-dvh flex items-center justify-center text-sm">Checking admin access...</div>;
  }
  if (!session || role!== "admin") return null;

  return (
    <div className="min-h-dvh bg-[#f8f9fa] flex">
      <aside className="hidden lg:flex w-64 bg-black text-white p-4 fixed h-full flex-col justify-between">
        <SidebarInner pathname={pathname} onLogout={handleLogout} loggingOut={loggingOut} appealsCount={appealsCount} reportsCount={reportsCount} />
      </aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
          <div className="w-[260px] bg-black text-white p-4 flex flex-col justify-between">
            <SidebarInner pathname={pathname} onClose={() => setOpen(false)} onLogout={handleLogout} loggingOut={loggingOut} appealsCount={appealsCount} reportsCount={reportsCount} />
          </div>
        </div>
      )}
      <div className="flex-1 lg:ml-64 w-full">
        <div className="lg:hidden sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-30">
          <button onClick={() => setOpen(true)} className="p-2"><Menu size={20} /></button>
          <span className="text-sm font-bold">Admin</span>
          <button onClick={handleLogout} className="p-2 text-zinc-500"><LogOut size={18} /></button>
        </div>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}