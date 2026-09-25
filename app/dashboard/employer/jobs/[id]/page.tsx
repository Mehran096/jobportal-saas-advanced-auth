"use client";
export const dynamic = 'force-dynamic';

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useGetJobByIdQuery, useDeleteJobMutation, useGetApplicationsByJobQuery } from "@/lib/redux/api/employerApi";
import { ArrowLeft, Building, MapPin, Calendar, Users, Edit, Trash2, Loader2, Globe, Building2 } from "lucide-react";
import Image from "next/image";

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const jobId = id;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const { data: jobData, isLoading: jobLoading, isError } = useGetJobByIdQuery(jobId, {
    skip:!jobId || isDeleted,
    refetchOnMountOrArgChange: true
  });
  const { data: appData, isLoading: appLoading } = useGetApplicationsByJobQuery(jobId, {
    skip:!jobId || isDeleted,
    refetchOnMountOrArgChange: true
  });
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();

  const job = jobData?.job;
  const companyProfile = jobData?.companyProfile;
  const applicationCount = jobData?.applicationCount?? 0;
  const applications = appData?.applications?? [];

  const handleDelete = async () => {
    try {
      setIsDeleted(true);
      await deleteJob(jobId).unwrap();
      router.push("/dashboard/employer/jobs");
    } catch {
      setIsDeleted(false);
    }
  };

  if (jobLoading) {
    return <div className="min-h-screen bg-white sm:bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={28} /></div>;
  }

  if (isError ||!job) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-[16px] font-bold mb-3">Job not found</h2>
        <button onClick={() => router.push("/dashboard/employer/jobs")} className="text-blue-600 text-[13px] hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white sm:bg-gray-50">
      <div className="max-w-5xl mx-auto px-0 sm:px-6 pb-24 sm:pb-6">
        <div className="flex items-center gap-2 px-3 sm:px-0 pt-3 sm:pt-6 mb-3">
          <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-[15px] sm:text-[20px] font-bold text-gray-900">Job Details</h1>
        </div>

        <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:border border-y sm:border-gray-100 p-4 sm:p-6 mb-3 sm:mb-5">
          <div className="flex flex-col gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-2 flex-wrap">
                <h2 className="text-[18px] sm:text-[24px] font-bold text-gray-900 leading-tight flex-1">{job.title}</h2>
                {job.type && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] sm:text-[12px] font-medium border border-blue-100 shrink-0">{job.type}</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-[13px] text-gray-600">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border"><Building size={11} /> {job.company || companyProfile?.companyName || "N/A"}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border"><MapPin size={11} /> {job.location || companyProfile?.location || "N/A"}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-100 text-green-700 font-semibold">Rs. {Number(job.salary).toLocaleString("en-PK")}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border"><Calendar size={11} /> {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href={`/dashboard/employer/jobs/${job._id}/edit`} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold text-[12px] sm:text-[13px] transition shadow-sm">
                <Edit size={14} /> Edit
              </Link>
              <button onClick={() => setShowDeleteModal(true)} disabled={isDeleting} className="flex-1 sm:flex-none bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold text-[12px] sm:text-[13px] transition disabled:opacity-50">
                <Trash2 size={14} /> {isDeleting? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <h3 className="font-bold text-[12px] sm:text-[14px] mb-2 text-gray-900">Job Description</h3>
            <p className="text-[12px] sm:text-[14px] text-gray-600 leading-[1.6] whitespace-pre-line wrap-break-words">{job.description || "No description provided"}</p>
          </div>

          {/* Company */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <h3 className="font-bold text-[11px] sm:text-[12px] tracking-wide text-gray-500 mb-3 flex items-center gap-1.5"><Building2 size={12} className="text-blue-600" /> COMPANY PROFILE</h3>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 flex flex-col sm:flex-row gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white overflow-hidden relative shrink-0 ring-1 ring-gray-200 self-start">
                {companyProfile?.companyLogo? (
                  <Image src={companyProfile.companyLogo} alt="logo" fill className="object-cover" unoptimized priority />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400"><Building2 size={18} /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] sm:text-[14px] leading-tight truncate">{companyProfile?.companyName || job.company || "ITBS"}</p>
                <div className="flex flex-col gap-1 mt-2 text-[11px] sm:text-[12px] text-gray-600">
                  <span className="flex items-center gap-1.5"><MapPin size={11} className="text-gray-400" /> {companyProfile?.location || job.location || "Lahore"}</span>
                  <span className="flex items-center gap-1.5"><Users size={11} className="text-gray-400" /> {companyProfile?.companySize? `${companyProfile.companySize} employees` : "500+ employees"}</span>
                  {companyProfile?.companyWebsite? (
                    <a href={`https://${companyProfile.companyWebsite.replace(/^https?:\/\//, '')}`} target="_blank" className="flex items-center gap-1.5 text-blue-600 hover:underline truncate"><Globe size={11} /> {companyProfile.companyWebsite}</a>
                  ) : <span className="flex items-center gap-1.5"><Globe size={11} /> Website not set</span>}
                </div>
                <p className="text-[11px] sm:text-[12px] text-gray-600 mt-2.5 leading-[1.6] line-clamp-3 sm:line-clamp-none whitespace-pre-line">{companyProfile?.companyDescription || "No description."}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white sm:rounded-2xl sm:shadow-sm sm:border border-y sm:border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-[13px] sm:text-[15px] font-bold flex items-center gap-1.5"><Users size={14} className="text-blue-600" /> Applicants ({applicationCount})</h3>
            <Link href={`/dashboard/employer/applicants?jobId=${job._id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-semibold transition shadow-sm">
              View All
            </Link>
          </div>

          {appLoading? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-600" size={20} /></div>
          ) : applications.length === 0? (
            <div className="text-center py-8 text-gray-500 text-[12px]">No applicants yet</div>
          ) : (
            <div className="space-y-2">
              {applications.slice(0, 5).map((app) => {
                const s = app.snapshot;
                if (!s) return null;
                return (
                  <div key={app._id} className="border border-gray-100 rounded-xl p-2.5 sm:p-3 flex justify-between items-center bg-gray-50/50">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-[12px] sm:text-[13px] truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{s.email}</p>
                    </div>
                    <span className={`ml-2 shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${app.status === 'pending'? 'bg-yellow-50 text-yellow-700 border-yellow-100' : app.status === 'accepted'? 'bg-green-50 text-green-700 border-green-100' : app.status === 'shortlisted'? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                      {app.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
            <div className="bg-white p-5 rounded-2xl max-w-sm w-full shadow-2xl">
              <h3 className="text-[14px] font-bold mb-1.5">Delete Job?</h3>
              <p className="text-gray-600 mb-4 text-[12px] leading-snug">Delete &quot;{job.title}&quot;? Cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-xl hover:bg-gray-50 transition text-[12px]">Cancel</button>
                <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50 transition flex items-center gap-1.5 text-[12px]">
                  {isDeleting && <Loader2 size={12} className="animate-spin" />}
                  {isDeleting? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}