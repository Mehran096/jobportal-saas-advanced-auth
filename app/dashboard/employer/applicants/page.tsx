"use client";
export const dynamic = 'force-dynamic';

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import DashboardHeader from "@/app/components/DashboardHeader";
import { useGetApplicationsByJobQuery, useGetAllApplicationsQuery } from "@/lib/redux/api/employerApi";
import { ArrowLeft, User, Mail, Filter, Phone, MapPin } from "lucide-react";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";

type Status = "all" | "pending" | "shortlisted" | "accepted" | "rejected";

interface Snapshot {
  firstName: string; lastName: string; email: string; headline?: string; bio?: string;
  phone?: string; location?: string; profileImage?: string; resumeUrl?: string; resumeName?: string; skills?: string[];
}
interface EmployerApplication {
  _id: string; job?: { title: string }; applicant?: { firstName: string; lastName: string; email: string };
  snapshot?: Snapshot; status: Status; resumeUrl?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-100",
  accepted: "bg-green-50 text-green-700 border-green-100",
  rejected: "bg-red-50 text-red-700 border-red-100",
};

const ApplicationSkeleton = () => (
  <div className="bg-white p-3.5 rounded-xl border border-gray-100 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
  </div>
);

function ApplicantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const [filter, setFilter] = useState<Status>("all");

  const { data: jobData, isLoading: isLoadingJob } = useGetApplicationsByJobQuery(jobId!, { skip:!jobId });
  const { data: allData, isLoading: isLoadingAll } = useGetAllApplicationsQuery(undefined, { skip:!!jobId });

  const isLoading = jobId? isLoadingJob : isLoadingAll;
  const applications = (jobId? jobData?.applications : allData?.applications) as EmployerApplication[] | undefined?? [];

  const filteredApps = filter === "all"? applications : applications.filter((app) => app.status === filter);
  const getCount = (s: Status) => (s === "all"? applications.length : applications.filter((a) => a.status === s).length);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white sm:bg-gray-50">
        <DashboardHeader />
        <div className="max-w-6xl mx-auto p-3 sm:p-6">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
          <div className="space-y-2.5">{[1,2,3].map((i) => <ApplicationSkeleton key={i} />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white sm:bg-gray-50">
      <DashboardHeader />
      <main className="w-full max-w-6xl mx-auto pb-24 sm:pb-6 p-3 sm:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-5">
          <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-full shrink-0"><ArrowLeft size={16} /></button>
          <div className="min-w-0">
            <h1 className="text-[15px] sm:text-[20px] font-bold leading-tight truncate">{jobId? "Job Applicants" : "All Applicants"}</h1>
            <p className="text-gray-500 text-[11px] sm:text-[12px] leading-tight">Tap card to view profile + CV</p>
          </div>
        </div>

        {/* Filter - compact */}
        <div className="flex items-center gap-1.5 mb-3 sm:mb-4 p-2 bg-white sm:bg-white rounded-xl sm:shadow-sm border border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Filter size={12} className="text-gray-400 shrink-0 ml-1" />
          {(["all", "pending", "shortlisted", "accepted", "rejected"] as Status[]).map((status) => (
            <button key={status} onClick={() => setFilter(status)} className={`px-2.5 py-1 rounded-full text-[11px] sm:text-[12px] font-semibold capitalize shrink-0 transition ${filter === status? "bg-blue-600 text-white" : "bg-gray-50 text-gray-600 border border-gray-100"}`}>
              {status} ({getCount(status)})
            </button>
          ))}
        </div>

        {filteredApps.length === 0? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-200"><User size={28} className="mx-auto text-gray-300 mb-2" /><h3 className="text-[13px] font-semibold">No applications found</h3></div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {filteredApps.map((app) => {
              const s = app.snapshot;
              if (!s) return null;
              return (
                <div key={app._id} onClick={() => router.push(`/dashboard/employer/applicants/${app._id}`)} className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 hover:shadow-md cursor-pointer transition-all">
                  <div className="flex gap-2.5">
                    <Image src={s.profileImage || `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}&background=random`} width={40} height={40} unoptimized alt="avatar" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[13px] sm:text-[14px] truncate leading-tight">{app.job?.title || "Job"}</h3>
                          <p className="flex items-center gap-1 text-gray-800 text-[12px] sm:text-[13px] truncate leading-tight mt-0.5"><User size={11} className="shrink-0 text-gray-400" /> <span className="truncate font-medium">{s.firstName} {s.lastName}</span> <span className="text-gray-400 text-[11px]">•</span> <span className="truncate text-gray-500 text-[11px]">{s.headline || "No headline"}</span></p>

                          <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-[11px] text-gray-500 mt-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-50 border truncate max-w-35"><Mail size={10} /> <span className="truncate">{s.email}</span></span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-50 border"><Phone size={10} /> {s.phone || "No phone"}</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-50 border truncate max-w-25"><MapPin size={10} /> <span className="truncate">{s.location || "No loc"}</span></span>
                          </div>

                          <div className="flex gap-1 mt-2 flex-wrap">
                            {s.skills?.slice(0, 3).map((sk) => <span key={sk} className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full font-medium">{sk}</span>)}
                            {(s.skills?.length||0) > 3 && <span className="text-[10px] text-gray-400 px-1 py-0.5">+{s.skills!.length - 3}</span>}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize h-fit shrink-0 border ${statusColors[app.status] || "bg-gray-50 text-gray-600 border-gray-100"}`}>{app.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <DashboardMobileNav />
    </div>
  );
}

export default function EmployerApplicantsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white"><DashboardHeader /><div className="p-6 text-center text-[12px]">Loading...</div></div>}>
      <ApplicantsContent />
    </Suspense>
  );
}