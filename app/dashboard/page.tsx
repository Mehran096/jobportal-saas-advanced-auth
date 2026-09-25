"use client";
export const dynamic = 'force-dynamic';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useGetJobseekerStatsQuery } from "@/lib/redux/api/jobseekerApi";
import { useGetEmployerStatsQuery } from "@/lib/redux/api/employerApi";
import DashboardHeader from "@/app/components/DashboardHeader";
import DashboardMobileNav from "../components/DashboardMobileNav";
import { Briefcase, Users, FileText, CheckCircle, Clock, Bookmark, Plus, Eye } from "lucide-react";

const StatCard = ({ icon, label, value, color, href }: { icon: React.ReactNode, label: string, value: number, color: string, href?: string }) => {
  const content = (
    <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition flex items-center gap-3">
      <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${color} shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] sm:text-[13px] text-gray-500 leading-tight truncate">{label}</p>
        <p className="text-[18px] sm:text-[22px] font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
};

const StatSkeleton = () => (
  <div className="bg-white p-3.5 rounded-xl border animate-pulse flex items-center gap-3">
    <div className="p-2 bg-gray-200 rounded-lg w-10 h-10"></div>
    <div className="flex-1">
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-5 bg-gray-200 rounded w-1/4"></div>
    </div>
  </div>
);

type SessionUser = { firstName?: string; lastName?: string; name?: string; role?: string; email?: string; image?: string; id?: string; };
type RecentApp = { _id: string; status: string; job?: { title?: string }; snapshot?: { firstName?: string; lastName?: string }; };

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user as SessionUser | undefined;

  const { data: seekerStats, isLoading: seekerLoading } = useGetJobseekerStatsQuery(undefined, { skip: user?.role!== "jobseeker" });
  const { data: empStats, isLoading: empLoading } = useGetEmployerStatsQuery(undefined, { skip: user?.role!== "employer" });

  const isLoading = status === "loading" || seekerLoading || empLoading;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white sm:bg-gray-50">
        <header className="bg-white shadow h-14" />
        <main className="max-w-7xl mx-auto p-3 sm:p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {[1,2,3,4].map(i => <StatSkeleton key={i} />)}
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const fullName = user.firstName && user.lastName? `${user.firstName} ${user.lastName}` : user.name || "User";

  const seekerCards = [
    { icon: <FileText size={16} />, label: "Applications", value: seekerStats?.totalApplications || 0, color: "bg-blue-50 text-blue-600", href: "/dashboard/applications" },
    { icon: <CheckCircle size={16} />, label: "Interviews", value: seekerStats?.interviews || 0, color: "bg-green-50 text-green-600", href: "/dashboard/applications" },
    { icon: <Bookmark size={16} />, label: "Saved Jobs", value: seekerStats?.savedJobs || 0, color: "bg-purple-50 text-purple-600", href: "/dashboard/saved" },
  ];

  const employerCards = [
    { icon: <Briefcase size={16} />, label: "Total Jobs", value: empStats?.totalJobs || 0, color: "bg-blue-50 text-blue-600" },
    { icon: <Users size={16} />, label: "Applicants", value: empStats?.totalApplicants || 0, color: "bg-purple-50 text-purple-600" },
    { icon: <Clock size={16} />, label: "Pending", value: empStats?.pendingApplicants || 0, color: "bg-yellow-50 text-yellow-600" },
    { icon: <CheckCircle size={16} />, label: "Hired", value: empStats?.hired || 0, color: "bg-green-50 text-green-600" },
  ];

  const cards = user.role === "employer"? employerCards : seekerCards;
  const recentApplications = (empStats?.recentApplications || []) as RecentApp[];

  return (
    <div className="min-h-screen bg-white sm:bg-gray-50">
       <DashboardHeader />
      <main className="max-w-7xl mx-auto pb-24 sm:pb-6 p-3 sm:p-6">
        {/* Welcome - compact */}
        <div className="bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-2xl sm:rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-[15px] sm:text-[20px] font-semibold leading-tight">Welcome back, {fullName}!</h2>
          <p className="text-blue-100 text-[11px] sm:text-[13px] mt-1">Role: <span className="capitalize font-medium">{user.role}</span></p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5 mb-5 sm:mb-8">
          {cards.map((card) => <StatCard key={card.label} {...card} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-[13px] sm:text-[16px] font-bold mb-2.5 sm:mb-4 text-gray-900">Quick Actions</h2>
            {user.role === "employer"? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
                <Link href="/dashboard/employer/jobs" className="bg-white p-3.5 sm:p-5 rounded-xl border border-gray-200 hover:shadow-md transition">
                  <h3 className="font-semibold text-[13px] sm:text-[14px] text-gray-900">My Jobs</h3>
                  <p className="text-[11px] sm:text-[13px] text-gray-500 mt-1 leading-snug">View and manage your posted jobs</p>
                </Link>
                <Link href="/dashboard/employer/applicants" className="bg-white p-3.5 sm:p-5 rounded-xl border border-gray-200 hover:shadow-md transition">
                  <h3 className="font-semibold text-[13px] sm:text-[14px] text-gray-900">Applicants</h3>
                  <p className="text-[11px] sm:text-[13px] text-gray-500 mt-1 leading-snug">See who applied</p>
                </Link>
                <Link href="/dashboard/employer/post-job" className="bg-white p-3.5 sm:p-5 rounded-xl border border-gray-200 hover:shadow-md transition flex items-center gap-2">
                  <Plus size={14} className="text-blue-600 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-[13px] sm:text-[14px] text-gray-900">Post Job</h3>
                    <p className="text-[11px] sm:text-[13px] text-gray-500 leading-snug">Create listing</p>
                  </div>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                <Link href="/dashboard/jobs" className="bg-white p-3.5 sm:p-5 rounded-xl border border-gray-200 hover:shadow-md transition">
                  <h3 className="font-semibold text-[12px] sm:text-[14px] text-gray-900">Find Jobs</h3>
                  <p className="text-[11px] sm:text-[13px] text-gray-500 mt-1 leading-snug">Browse new</p>
                </Link>
                <Link href="/dashboard/applications" className="bg-white p-3.5 sm:p-5 rounded-xl border border-gray-200 hover:shadow-md transition">
                  <h3 className="font-semibold text-[12px] sm:text-[14px] text-gray-900">My Applications</h3>
                  <p className="text-[11px] sm:text-[13px] text-gray-500 mt-1 leading-snug">Track status</p>
                </Link>
                <Link href="/dashboard/saved" className="bg-white p-3.5 sm:p-5 rounded-xl border border-gray-200 hover:shadow-md transition relative">
                  <div className="absolute top-2 right-2 bg-purple-50 text-purple-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {seekerStats?.savedJobs || 0}
                  </div>
                  <h3 className="font-semibold text-[12px] sm:text-[14px] text-gray-900 flex items-center gap-1"><Bookmark size={12} /> Saved</h3>
                  <p className="text-[11px] sm:text-[13px] text-gray-500 mt-1 leading-snug">Saved for later</p>
                </Link>
                <Link href="/dashboard/profile" className="bg-white p-3.5 sm:p-5 rounded-xl border border-gray-200 hover:shadow-md transition col-span-2 sm:col-span-1">
                  <h3 className="font-semibold text-[12px] sm:text-[14px] text-gray-900">My Profile</h3>
                  <p className="text-[11px] sm:text-[13px] text-gray-500 mt-1 leading-snug">Update CV & skills</p>
                </Link>
              </div>
            )}
          </div>

          {user.role === "employer" && (
            <div>
              <h2 className="text-[13px] sm:text-[16px] font-bold mb-2.5 sm:mb-4 text-gray-900">Recent Applications</h2>
              <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                {empLoading? (
                  <div className="flex justify-center py-5 text-[11px] text-gray-400">Loading...</div>
                ) : recentApplications.length === 0? (
                  <p className="text-gray-500 text-[12px] text-center py-6">No applications yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {recentApplications.slice(0,5).map((app) => (
                      <div key={app._id} className="border border-gray-50 bg-gray-50/50 rounded-xl p-2.5">
                        <p className="font-semibold text-gray-900 text-[12px] truncate">
                          {app.snapshot?.firstName} {app.snapshot?.lastName}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">{app.job?.title}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full font-medium capitalize ${
                          app.status === "pending"? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                          app.status === "accepted"? "bg-green-50 text-green-700 border border-green-100" :
                          "bg-red-50 text-red-700 border border-red-100"
                        }`}>{app.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/dashboard/employer/applicants" className="mt-3 text-blue-600 text-[12px] font-semibold hover:underline flex items-center gap-1">
                  View All <Eye size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <DashboardMobileNav/>
    </div>
  )
}