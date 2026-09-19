"use client";
export const dynamic = 'force-dynamic';

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import DashboardHeader from "@/app/components/DashboardHeader";
import {
  useGetApplicationsByJobQuery,
  useGetAllApplicationsQuery,
  useUpdateApplicationStatusMutation,
} from "@/lib/redux/api/employerApi";
import {
  ArrowLeft,
  User,
  Mail,
  X,
  Filter,
  Phone,
  MapPin,
  FileText,
  ExternalLink,
  Download,
  Briefcase,
  CheckCircle2,
  Loader2,
} from "lucide-react";

type Status = "all" | "pending" | "shortlisted" | "accepted" | "rejected";
type FinalStatus = Exclude<Status, "all" | "pending">;

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
  reviewed: "bg-blue-100 text-blue-800",
  shortlisted: "bg-purple-100 text-purple-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const FINAL_STATUSES: Status[] = ["accepted", "rejected", "shortlisted"];

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
  const [selectedApp, setSelectedApp] = useState<EmployerApplication | null>(null);
  const [loadingAction, setLoadingAction] = useState<FinalStatus | null>(null);

  const { data: jobData, isLoading: isLoadingJob } = useGetApplicationsByJobQuery(jobId!, { skip:!jobId });
  const { data: allData, isLoading: isLoadingAll } = useGetAllApplicationsQuery(undefined, { skip:!!jobId });

  const isLoading = jobId? isLoadingJob : isLoadingAll;
  const applications = (jobId? jobData?.applications : allData?.applications) as EmployerApplication[] | undefined?? [];

  const [updateStatus] = useUpdateApplicationStatusMutation();

  const filteredApps = filter === "all"? applications : applications.filter((app) => app.status === filter);
  const getCount = (s: Status) => (s === "all"? applications.length : applications.filter((a) => a.status === s).length);

useEffect(() => {
  if (selectedApp) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => {
    document.body.style.overflow = '';
  };
}, [selectedApp]);

  const handleUpdateStatus = async (appId: string, newStatus: FinalStatus) => {
    if (!confirm(`Are you sure you want to mark as ${newStatus}? This cannot be changed.`)) return;
    setLoadingAction(newStatus);
    try {
      await updateStatus({ id: appId, status: newStatus }).unwrap();
      setSelectedApp(null);
    } catch (err: unknown) {
      const apiMsg = (err as { data?: { message?: string } })?.data?.message;
      const message = apiMsg || (err instanceof Error? err.message : "Failed to update");
      alert(message);
    } finally {
      setLoadingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="space-y-4">{[1, 2, 3].map((i) => <ApplicationSkeleton key={i} />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      {/* FIXED: w-full overflow-x-hidden + responsive padding */}
      <main className="w-full max-w-6xl mx-auto p-3 sm:p-6 overflow-x-hidden">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg shrink-0"><ArrowLeft size={20} /></button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{jobId? "Job Applicants" : "All Applicants"}</h1>
            <p className="text-gray-500 text-xs sm:text-sm">Click card to view full candidate profile + CV</p>
          </div>
        </div>

        {/* FIXED: scrollable tabs on mobile */}
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
                <div key={app._id} onClick={() => setSelectedApp(app)} className="bg-white p-4 rounded-xl border hover:shadow-md cursor-pointer w-full max-w-full overflow-hidden">
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
                        <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold capitalize h-fit shrink-0 ${statusColors[app.status]}`}>{app.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FIXED MODAL: bottom sheet on mobile, centered on desktop */}
        {selectedApp?.snapshot && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain" onClick={() => setSelectedApp(null)}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-bold">Candidate Full Profile</h2>
                  <button onClick={() => setSelectedApp(null)} className="p-1.5 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                </div>

                {/* FIXED: flex-col on mobile */}
                <div className="flex flex-col sm:flex-row gap-4 mb-5">
                  <Image src={selectedApp.snapshot.profileImage || `https://ui-avatars.com/api/?name=${selectedApp.snapshot.firstName}`} width={80} height={80} unoptimized alt="profile" className="w-20 h-20 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold truncate">{selectedApp.snapshot.firstName} {selectedApp.snapshot.lastName}</h3>
                    <p className="text-blue-600 text-sm truncate">{selectedApp.snapshot.headline}</p>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2 wrap-break-word">{selectedApp.snapshot.bio || "No bio"}</p>
                    <div className="text-sm mt-2 space-y-1 text-gray-600">
                      <p className="flex gap-2 items-center truncate"><Mail size={14} className="shrink-0" /> <span className="truncate">{selectedApp.snapshot.email}</span></p>
                      <p className="flex gap-2 items-center"><Phone size={14} className="shrink-0" /> {selectedApp.snapshot.phone}</p>
                      <p className="flex gap-2 items-center truncate"><MapPin size={14} className="shrink-0" /> <span className="truncate">{selectedApp.snapshot.location}</span></p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold flex gap-2 mb-2 text-sm"><Briefcase size={16} /> Skills</h4>
                  <div className="flex flex-wrap gap-2">{selectedApp.snapshot.skills?.map((sk) => <span key={sk} className="bg-gray-100 px-3 py-1 rounded-full text-xs sm:text-sm">{sk}</span>)}</div>
                </div>

                {/* FIXED: CV row with truncate */}
                <div className="bg-blue-50 p-3 rounded-xl flex gap-2 items-center">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <FileText size={18} className="text-blue-600 shrink-0" />
                    <span className="font-medium text-sm truncate">{selectedApp.snapshot.resumeName || "Resume.pdf"}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={selectedApp.snapshot.resumeUrl} target="_blank" className="bg-white border px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1"><ExternalLink size={14} /> View</a>
                    <a href={selectedApp.snapshot.resumeUrl} download className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1"><Download size={14} /></a>
                  </div>
                </div>

                {FINAL_STATUSES.includes(selectedApp.status)? (
                  <div className="mt-6 p-4 bg-gray-50 border border-dashed rounded-xl text-center">
                    <div className="flex justify-center items-center gap-2 text-gray-700 font-semibold text-sm">
                      <CheckCircle2 size={18} className="text-green-600" />
                      Already {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
                    </div>
                    <span className={`mt-2 inline-block px-4 py-1 rounded-full text-sm font-bold capitalize ${statusColors[selectedApp.status]}`}>{selectedApp.status}</span>
                    <p className="text-xs text-gray-500 mt-2">Status is locked. You cannot change it again.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mt-6">
                    <button onClick={() => handleUpdateStatus(selectedApp._id, "shortlisted")} disabled={!!loadingAction} className="bg-purple-600 text-white py-3 rounded-xl text-xs sm:text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap">
                      {loadingAction === "shortlisted" && <Loader2 size={14} className="animate-spin" />}{loadingAction === "shortlisted"? "..." : "Shortlist"}
                    </button>
                    <button onClick={() => handleUpdateStatus(selectedApp._id, "accepted")} disabled={!!loadingAction} className="bg-green-600 text-white py-3 rounded-xl text-xs sm:text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap">
                      {loadingAction === "accepted" && <Loader2 size={14} className="animate-spin" />}{loadingAction === "accepted"? "..." : "Accept"}
                    </button>
                    <button onClick={() => handleUpdateStatus(selectedApp._id, "rejected")} disabled={!!loadingAction} className="bg-red-600 text-white py-3 rounded-xl text-xs sm:text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap">
                      {loadingAction === "rejected" && <Loader2 size={14} className="animate-spin" />}{loadingAction === "rejected"? "..." : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            </div>
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