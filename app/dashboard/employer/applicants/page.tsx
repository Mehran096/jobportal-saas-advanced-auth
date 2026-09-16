"use client";
export const dynamic = 'force-dynamic';

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardHeader from "@/app/components/DashboardHeader";
import {
  useGetApplicationsByJobQuery,
  useGetEmployerApplicantsQuery,
  useUpdateApplicationStatusMutation
} from "@/lib/redux/api/employerApi";
import { ArrowLeft, User, Mail, Calendar, Check, X, Filter, Phone, MapPin, FileText, ExternalLink, Download, Briefcase, Star } from "lucide-react";

type Status = "all" | "pending" | "reviewed" | "shortlisted" | "accepted" | "rejected";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  shortlisted: "bg-purple-100 text-purple-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800"
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
  const [selectedApp, setSelectedApp] = useState<{
    _id: string;
    job: { title: string };
    snapshot?: {
      firstName: string; lastName: string; email: string; headline?: string; bio?: string;
      phone?: string; location?: string; profileImage?: string; resumeUrl: string;
      resumeName?: string; skills?: string[];
    };
    status: string;
  } | null>(null);

  // FIXED: Use new correct endpoints from your folder structure
  const { data: jobData, isLoading: isLoadingJob } = useGetApplicationsByJobQuery(jobId!, { skip:!jobId });
  const { data: allData, isLoading: isLoadingAll } = useGetEmployerApplicantsQuery(undefined, { skip:!!jobId });

  const isLoading = jobId? isLoadingJob : isLoadingAll;
  const applications = jobId? jobData?.applications || [] : allData?.applications || [];

  const [updateStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation();

  const filteredApps = filter === "all"? applications : applications.filter(app => app.status === filter);

  const getCount = (status: Status) => {
    return status === "all"? applications.length : applications.filter(a => a.status === status).length;
  };

  const handleUpdateStatus = async (appId: string, newStatus: "accepted" | "rejected" | "shortlisted" | "reviewed") => {
    if (!confirm(`Are you sure you want to mark as ${newStatus}?`)) return;
    try {
      await updateStatus({ id: appId, status: newStatus }).unwrap();
      setSelectedApp(null);
    } catch (err: unknown) {
      const message = err instanceof Error? err.message : (err as { data?: { message?: string } })?.data?.message || "Failed to update";
      alert(message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-6xl mx-auto p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="space-y-4">{[1,2,3].map(i => <ApplicationSkeleton key={i} />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{jobId? "Job Applicants" : "All Applicants"}</h1>
            <p className="text-gray-500 text-sm">Click card to view full candidate profile + CV</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 p-3 bg-white rounded-xl shadow-sm border overflow-x-auto">
          <Filter size={16} className="text-gray-500 flex-shrink-0" />
          {(["all", "pending", "reviewed", "shortlisted", "accepted", "rejected"] as Status[]).map((status) => (
            <button key={status} onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap ${filter === status? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {status} ({getCount(status)})
            </button>
          ))}
        </div>

        {filteredApps.length === 0? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
            <User size={40} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-semibold">No applications found</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map((app) => {
              const s = app.snapshot || { firstName: app.applicant?.firstName || "", lastName: app.applicant?.lastName || "", email: app.applicant?.email || "", resumeUrl: app.resumeUrl || "" } as never;
              return (
                <div key={app._id} onClick={() => setSelectedApp(app as never)} className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition cursor-pointer">
                  <div className="flex gap-4">
                    <img src={s.profileImage || `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}&background=random`} className="w-14 h-14 rounded-full object-cover" alt="" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{app.job?.title}</h3>
                          <p className="flex items-center gap-1.5 text-gray-700 text-sm"><User size={14}/> {s.firstName} {s.lastName} • {s.headline || "No headline"}</p>
                          <p className="flex items-center gap-2 text-gray-500 text-xs mt-1"><Mail size={12}/> {s.email} <Phone size={12}/> {s.phone || "No phone"} <MapPin size={12}/> {s.location || "No location"}</p>
                          <div className="flex gap-1 mt-2 flex-wrap">{s.skills?.slice(0,4).map((sk: string) => <span key={sk} className="bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5 rounded-full">{sk}</span>)}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[app.status]}`}>{app.status}</span>
                          {app.status === "pending" && (
                            <div className="flex gap-2">
                              <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(app._id, "accepted"); }} className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1"><Check size={12}/> Accept</button>
                              <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(app._id, "rejected"); }} className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1"><X size={12}/> Reject</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* WHOLE PROFILE MODAL */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedApp(null)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between mb-4">
                  <h2 className="text-xl font-bold">Candidate Full Profile</h2>
                  <button onClick={() => setSelectedApp(null)} className="p-1 hover:bg-gray-100 rounded"><X size={20}/></button>
                </div>
                {(() => {
                  const s = selectedApp.snapshot!;
                  return (
                    <>
                      <div className="flex gap-4 mb-5">
                        <img src={s.profileImage || `https://ui-avatars.com/api/?name=${s.firstName}`} className="w-20 h-20 rounded-full" alt="" />
                        <div>
                          <h3 className="text-xl font-bold">{s.firstName} {s.lastName}</h3>
                          <p className="text-blue-600 text-sm">{s.headline}</p>
                          <p className="text-gray-600 text-sm mt-1">{s.bio || "No bio provided"}</p>
                          <div className="text-sm mt-2 space-y-1 text-gray-600">
                            <p className="flex gap-2"><Mail size={14}/> {s.email}</p>
                            <p className="flex gap-2"><Phone size={14}/> {s.phone}</p>
                            <p className="flex gap-2"><MapPin size={14}/> {s.location}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <h4 className="font-semibold flex gap-2 mb-2"><Briefcase size={16}/> Skills</h4>
                        <div className="flex flex-wrap gap-2">{s.skills?.map(sk => <span key={sk} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{sk}</span>)}</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center">
                        <span className="flex items-center gap-2 font-medium"><FileText size={18} className="text-blue-600"/> {s.resumeName || "Resume.pdf"}</span>
                        <div className="flex gap-2">
                          <a href={s.resumeUrl} target="_blank" className="bg-white border px-4 py-2 rounded-lg text-sm flex items-center gap-1"><ExternalLink size={14}/> View</a>
                          <a href={s.resumeUrl} download className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><Download size={14}/> Download</a>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-6">
                        <button onClick={() => handleUpdateStatus(selectedApp._id, "shortlisted")} className="bg-purple-600 text-white py-2.5 rounded-xl text-sm flex justify-center gap-1"><Star size={14}/> Shortlist</button>
                        <button onClick={() => handleUpdateStatus(selectedApp._id, "accepted")} className="bg-green-600 text-white py-2.5 rounded-xl text-sm">Accept</button>
                        <button onClick={() => handleUpdateStatus(selectedApp._id, "rejected")} className="bg-red-600 text-white py-2.5 rounded-xl text-sm">Reject</button>
                      </div>
                    </>
                  );
                })()}
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
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50"><DashboardHeader /><div className="p-10 text-center">Loading...</div></div>
    }>
      <ApplicantsContent />
    </Suspense>
  )
}