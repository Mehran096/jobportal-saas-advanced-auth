"use client";
export const dynamic = 'force-dynamic';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/app/components/DashboardHeader";
import { useGetMyApplicationsQuery, type Application } from "@/lib/redux/api/jobseekerApi";
import { Briefcase, Calendar, Building2, Loader2, CheckCircle2, XCircle, Clock, Eye, Star } from "lucide-react";

const AppSkeleton = () => (
  <div className="bg-white p-5 rounded-xl shadow border animate-pulse">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: Application['status'] }) => {
  const config: any = {
    pending: { icon: <Clock size={14} />, text: "Pending", class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    reviewed: { icon: <Eye size={14} />, text: "Reviewed", class: "bg-blue-100 text-blue-700 border-blue-200" },
    shortlisted: { icon: <Star size={14} />, text: "Shortlisted", class: "bg-purple-100 text-purple-700 border-purple-200" },
    accepted: { icon: <CheckCircle2 size={14} />, text: "Accepted", class: "bg-green-100 text-green-700 border-green-200" },
    rejected: { icon: <XCircle size={14} />, text: "Rejected", class: "bg-red-100 text-red-700 border-red-200" },
  }[status] || { icon: <Clock size={14} />, text: status, class: "bg-gray-100 text-gray-700" };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize flex items-center gap-1.5 border ${config.class}`}>
      {config.icon} {config.text}
    </span>
  );
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-PK", { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function ApplicationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const userLoading = status === "loading";

  const { data: applicationsData, isLoading: appsLoading } = useGetMyApplicationsQuery(undefined, {
    skip:!user || user?.role!== "jobseeker"
  });

  // FIXED: handles both array and {applications: []}
  const applications: Application[] = Array.isArray(applicationsData)
   ? applicationsData as Application[]
    : (applicationsData as any)?.applications || [];

  const isLoading = userLoading || appsLoading;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (user && user.role!== "jobseeker") router.push("/dashboard");
  }, [user, status, router]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 md:pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="text-gray-600">Track all your job applications here - {applications.length} applied</p>
        </div>

        {isLoading? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <AppSkeleton key={i} />)}
          </div>
        ) : applications.length === 0? (
          <div className="text-center py-20 bg-white rounded-xl shadow border">
            <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
            <p className="text-gray-500 mb-4">Start applying to jobs to see them here</p>
            <Link href="/dashboard/jobs" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app: any) => (
              <div key={app._id} className="bg-white p-5 rounded-xl shadow border hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{app.job?.title || "Job"}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600 text-sm mt-1">
                      <span className="flex items-center gap-1.5"><Building2 size={14} /> {app.job?.company || app.job?.title}</span>
                      <span className="flex items-center gap-1.5"><Calendar size={14} /> Applied: {formatDate(app.createdAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">
        <Link href="/dashboard/jobs" className="text-gray-500 text-xs flex flex-col items-center"><Briefcase size={20}/>Jobs</Link>
        <Link href="/dashboard/applications" className="text-blue-600 text-xs flex flex-col items-center"><Briefcase size={20}/>Applications</Link>
      </nav>
    </div>
  );
}