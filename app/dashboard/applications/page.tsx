"use client";
export const dynamic = 'force-dynamic';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/app/components/DashboardHeader";
import { useGetMyApplicationsQuery, type Application } from "@/lib/redux/api/jobseekerApi";
import { Briefcase, Calendar, Building2, Loader2, CheckCircle2, XCircle, Clock, Eye, Star } from "lucide-react";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";

const AppSkeleton = () => (
  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] animate-pulse">
    <div className="flex justify-between items-start gap-3">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div className="h-5 bg-gray-200 rounded-full w-20"></div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: Application['status'] }) => {
  const map = {
    pending: { icon: Clock, text: "Pending", class: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    reviewed: { icon: Eye, text: "Reviewed", class: "bg-blue-50 text-blue-700 border-blue-200" },
    shortlisted: { icon: Star, text: "Shortlisted", class: "bg-purple-50 text-purple-700 border-purple-200" },
    accepted: { icon: CheckCircle2, text: "Accepted", class: "bg-green-50 text-green-700 border-green-200" },
    rejected: { icon: XCircle, text: "Rejected", class: "bg-red-50 text-red-700 border-red-200" },
  } as const;
  const cfg = map[status as keyof typeof map] || map.pending;
  const Icon = cfg.icon;
  return (
    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold capitalize flex items-center gap-1 border ${cfg.class}`}>
      <Icon size={12} /> {cfg.text}
    </span>
  );
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-PK", { month: 'short', day: 'numeric', year: 'numeric' });
};

type MyApplicationsResponse = { applications: Application[] };

export default function ApplicationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user as { role?: string } | undefined;
  const userLoading = status === "loading";

  const { data: applicationsData, isLoading: appsLoading } = useGetMyApplicationsQuery(undefined, {
    skip:!user || user?.role!== "jobseeker"
  });

  const applications: Application[] = (() => {
    if (!applicationsData) return [];
    if (Array.isArray(applicationsData)) return applicationsData as Application[];
    if (typeof applicationsData === 'object' && 'applications' in applicationsData) {
      return (applicationsData as MyApplicationsResponse).applications || [];
    }
    return [];
  })();

  const isLoading = userLoading || appsLoading;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (user && user.role!== "jobseeker") router.push("/dashboard");
  }, [user, status, router]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-white sm:bg-gray-50">
        <DashboardHeader />
        <main className="max-w-4xl mx-auto p-3 sm:p-6 flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={26} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white sm:bg-gray-50">
      <DashboardHeader />
      <main className="max-w-4xl mx-auto px-3 sm:px-6 pb-24 sm:pb-6 pt-3 sm:pt-6">
        <div className="mb-3 sm:mb-6">
          <h1 className="text-[19px] sm:text-3xl font-bold leading-tight">My Applications</h1>
          <p className="text-[12px] sm:text-[15px] text-gray-500 mt-0.5">Track your applications — {applications.length} applied</p>
        </div>

        {isLoading? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <AppSkeleton key={i} />)}
          </div>
        ) : applications.length === 0? (
          <div className="bg-white sm:border sm:rounded-xl sm:shadow-sm p-8 sm:p-12 text-center mt-2">
            <Briefcase className="mx-auto text-gray-300 mb-3" size={36} />
            <h3 className="text-[14px] sm:text-base font-semibold">No Applications Yet</h3>
            <p className="text-[12px] sm:text-sm text-gray-500 mt-1 mb-4">Start applying to see them here</p>
            <Link href="/dashboard/jobs" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-[13px] font-semibold">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {applications.map((app) => (
              <Link key={app._id} href={`/dashboard/applications/${app._id}`} className="block bg-white p-4 sm:p-5 rounded-xl border border-gray-200/80 sm:border-gray-100 shadow-sm sm:shadow-sm hover:shadow-md hover:border-blue-200 transition">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[14px] sm:text-[15px] truncate leading-snug">{app.job?.title || "Job"}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] text-gray-600"><Building2 size={11} /> <span className="truncate max-w-27.5 sm:max-w-none">{app.job?.company || app.job?.title}</span></span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] text-gray-500"><Calendar size={11} /> {formatDate(app.createdAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <DashboardMobileNav />
    </div>
  );
}