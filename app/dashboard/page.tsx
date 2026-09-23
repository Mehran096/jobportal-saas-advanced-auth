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
import { Briefcase, Users, FileText, CheckCircle, Clock, Bookmark, Plus, Eye, Loader2 } from "lucide-react";


const StatCard = ({ icon, label, value, color, href }: { icon: React.ReactNode, label: string, value: number, color: string, href?: string }) => {
  const content = (
    <div className="bg-white p-5 rounded-xl shadow-sm border flex items-center gap-4 hover:shadow-md transition">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
};

const StatSkeleton = () => (
  <div className="bg-white p-5 rounded-xl shadow-sm border animate-pulse flex items-center gap-4">
    <div className="p-3 bg-gray-200 rounded-lg w-12 h-12"></div>
    <div className="flex-1">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-7 bg-gray-200 rounded w-1/4"></div>
    </div>
  </div>
);

type SessionUser = {
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string;
  email?: string;
  image?: string;
  id?: string;
};

type RecentApp = {
  _id: string;
  status: string;
  job?: { title?: string };
  snapshot?: { firstName?: string; lastName?: string };
};

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
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow h-16" />
        <main className="max-w-7xl mx-auto p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => <StatSkeleton key={i} />)}
          </div>
        </main>
      </div>
    );
  }
  
  if (!user) return null;

  const fullName = user.firstName && user.lastName 
   ? `${user.firstName} ${user.lastName}` 
    : user.name || "User";

  const seekerCards = [
    { icon: <FileText size={24} />, label: "Total Applications", value: seekerStats?.totalApplications || 0, color: "bg-blue-100 text-blue-600", href: "/dashboard/applications" },
    { icon: <CheckCircle size={24} />, label: "Interviews", value: seekerStats?.interviews || 0, color: "bg-green-100 text-green-600", href: "/dashboard/applications" },
    { icon: <Bookmark size={24} />, label: "Saved Jobs", value: seekerStats?.savedJobs || 0, color: "bg-purple-100 text-purple-600", href: "/dashboard/saved" },
  ];

  const employerCards = [
    { icon: <Briefcase size={24} />, label: "Total Jobs", value: empStats?.totalJobs || 0, color: "bg-blue-100 text-blue-600" },
    { icon: <Users size={24} />, label: "Total Applicants", value: empStats?.totalApplicants || 0, color: "bg-purple-100 text-purple-600" },
    { icon: <Clock size={24} />, label: "Pending Review", value: empStats?.pendingApplicants || 0, color: "bg-yellow-100 text-yellow-600" },
    { icon: <CheckCircle size={24} />, label: "Hired", value: empStats?.hired || 0, color: "bg-green-100 text-green-600" },
  ];

  const cards = user.role === "employer"? employerCards : seekerCards;
  const recentApplications = (empStats?.recentApplications || []) as RecentApp[];

  return (
    <div className="min-h-screen bg-gray-50">
       <DashboardHeader />
      <main className="max-w-7xl mx-auto mb-12 p-4 sm:p-6">
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-1">Welcome back, {fullName}!</h2>
          <p className="text-blue-100">Role: <span className="capitalize font-medium">{user.role}</span></p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {cards.map((card) => <StatCard key={card.label} {...card} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h2>
            {user.role === "employer"? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/dashboard/employer/jobs" className="bg-white p-5 rounded-xl border hover:shadow-md transition">
                  <h3 className="font-semibold mb-1 text-gray-900">My Jobs</h3>
                  <p className="text-sm text-gray-500">View and manage your posted jobs</p>
                </Link>
                <Link href="/dashboard/employer/applicants" className="bg-white p-5 rounded-xl border hover:shadow-md transition">
                  <h3 className="font-semibold mb-1 text-gray-900">Job Applicants</h3>
                  <p className="text-sm text-gray-500">See who applied to your jobs</p>
                </Link>
                <Link href="/dashboard/employer/post-job" className="bg-white p-5 rounded-xl border hover:shadow-md transition flex items-center gap-2">
                  <Plus size={18} className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold mb-1 text-gray-900">Post New Job</h3>
                    <p className="text-sm text-gray-500">Create a new job listing</p>
                  </div>
                </Link>
                {/* <Link href="/dashboard/profile" className="bg-white p-5 rounded-xl border hover:shadow-md transition">
                  <h3 className="font-semibold mb-1 text-gray-900">My Profile</h3>
                  <p className="text-sm text-gray-500">Update photo, CV & skills</p>
                </Link> */}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/dashboard/jobs" className="bg-white p-5 rounded-xl border hover:shadow-md transition">
                  <h3 className="font-semibold mb-1 text-gray-900">Find Jobs</h3>
                  <p className="text-sm text-gray-500">Browse new opportunities</p>
                </Link>
                <Link href="/dashboard/applications" className="bg-white p-5 rounded-xl border hover:shadow-md transition">
                  <h3 className="font-semibold mb-1 text-gray-900">My Applications</h3>
                  <p className="text-sm text-gray-500">Track your application status</p>
                </Link>
                <Link href="/dashboard/saved" className="bg-white p-5 rounded-xl border hover:shadow-md transition relative">
                  <div className="absolute top-3 right-3 bg-purple-100 text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {seekerStats?.savedJobs || 0}
                  </div>
                  <h3 className="font-semibold mb-1 text-gray-900 flex items-center gap-2"><Bookmark size={16} /> Saved Jobs</h3>
                  <p className="text-sm text-gray-500">View jobs you saved for later</p>
                </Link>
                <Link href="/dashboard/profile" className="bg-white p-5 rounded-xl border hover:shadow-md transition">
                  <h3 className="font-semibold mb-1 text-gray-900">My Profile</h3>
                  <p className="text-sm text-gray-500">Update photo, CV & skills</p>
                </Link>
              </div>
            )}
          </div>

          {user.role === "employer" && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Recent Applications</h2>
              <div className="bg-white rounded-xl border p-4">
                {empLoading? (
                  <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-600" size={20} /></div>
                ) : recentApplications.length === 0? (
                  <p className="text-gray-500 text-sm text-center py-6">No applications yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentApplications.slice(0,5).map((app) => (
                      <div key={app._id} className="border-b pb-3 last:border-0">
                        <p className="font-semibold text-gray-900 text-sm">
                          {app.snapshot?.firstName} {app.snapshot?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{app.job?.title}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium capitalize ${
                          app.status === "pending"? "bg-yellow-100 text-yellow-800" :
                          app.status === "accepted"? "bg-green-100 text-green-800" :
                          "bg-red-100 text-red-800"
                        }`}>{app.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/dashboard/employer/applicants" className="mt-4 text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                  View All <Eye size={14} />
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