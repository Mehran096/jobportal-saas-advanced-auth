"use client";
export const dynamic = 'force-dynamic';

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import DashboardHeader from "@/app/components/DashboardHeader";
import {
  useGetApplicationsByJobQuery,
  useGetAllApplicationsQuery,
} from "@/lib/redux/api/employerApi";
import {
  ArrowLeft,
  User,
  Mail,
  Filter,
  Phone,
  MapPin,
} from "lucide-react";

type Status = "all" | "pending" | "shortlisted" | "accepted" | "rejected";

interface Snapshot {
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  bio?: string;
  phone?: string;
  location?: string;
  profileImage?: string;
  resumeUrl?: string;
  resumeName?: string;
  skills?: string[];
}

interface EmployerApplication {
  _id: string;
  job?: { title: string };
  applicant?: { firstName: string; lastName: string; email: string };
  snapshot?: Snapshot;
  status: Status;
  resumeUrl?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  shortlisted: "bg-purple-100 text-purple-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const ApplicationSkeleton = () => (
  <div className="bg-white p-5 rounded-xl shadow-sm border animate-pulse">
    <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
      <div className="min-h-screen bg-gray-50">
        {/* <DashboardHeader /> */}
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="space-y-4">{[1, 2, 3].map((i) => <ApplicationSkeleton key={i} />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <DashboardHeader /> */}
      <main className="w-full max-w-6xl mx-auto p-3 sm:p-6 overflow-x-hidden">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg shrink-0"><ArrowLeft size={20} /></button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{jobId? "Job Applicants" : "All Applicants"}</h1>
            <p className="text-gray-500 text-xs sm:text-sm">Click card to view full candidate profile + CV</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 p-2.5 bg-white rounded-xl shadow-sm border overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Filter size={16} className="text-gray-500 shrink-0" />
          {(["all", "pending", "shortlisted", "accepted", "rejected"] as Status[]).map((status) => (
            <button key={status} onClick={() => setFilter(status)} className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium capitalize whitespace-nowrap shrink-0 ${filter === status? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {status} ({getCount(status)})
            </button>
          ))}
        </div>

        {filteredApps.length === 0? (
          <div className="text-center py-16 bg-white rounded-xl border"><User size={40} className="mx-auto text-gray-400 mb-3" /><h3 className="text-lg font-semibold">No applications found</h3></div>
        ) : (
          <div className="space-y-3">
            {filteredApps.map((app) => {
              const s = app.snapshot;
              if (!s) return null;
              return (
                <div key={app._id} onClick={() => router.push(`/dashboard/employer/applicants/${app._id}`)} className="bg-white p-4 rounded-xl border hover:shadow-md cursor-pointer w-full max-w-full overflow-hidden transition-shadow">
                  <div className="flex gap-3">
                    <Image src={s.profileImage || `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}&background=random`} width={56} height={56} unoptimized alt="avatar" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base truncate">{app.job?.title}</h3>
                          <p className="flex items-center gap-1.5 text-gray-700 text-xs sm:text-sm truncate"><User size={14} className="shrink-0" /> <span className="truncate">{s.firstName} {s.lastName} • {s.headline || "No headline"}</span></p>
                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-2 text-gray-500 text-[11px] sm:text-xs mt-1">
                            <span className="flex items-center gap-1 truncate"><Mail size={12} className="shrink-0" /> <span className="truncate">{s.email}</span></span>
                            <span className="flex items-center gap-1"><Phone size={12} className="shrink-0" /> {s.phone || "No phone"}</span>
                            <span className="flex items-center gap-1 truncate"><MapPin size={12} className="shrink-0" /> <span className="truncate">{s.location || "No location"}</span></span>
                          </div>
                          <div className="flex gap-1 mt-2 flex-wrap">{s.skills?.slice(0, 4).map((sk) => <span key={sk} className="bg-blue-50 text-blue-700 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full">{sk}</span>)}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold capitalize h-fit shrink-0 ${statusColors[app.status] || "bg-gray-100 text-gray-700"}`}>{app.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function EmployerApplicantsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"><DashboardHeader /><div className="p-10 text-center">Loading...</div></div>}>
      <ApplicantsContent />
    </Suspense>
  );
}