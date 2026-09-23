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
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  }

  if (isError ||!job) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Job not found</h2>
        <button onClick={() => router.push("/dashboard/employer/jobs")} className="text-blue-600 hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-28 lg:pb-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Job Details</h1>
        </div>

        <div className="bg-white rounded-[20px] shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{job.title}</h2>
                {job.type && <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">{job.type}</span>}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-gray-600 text-sm">
                <div className="flex items-center gap-2"><Building size={16} className="text-gray-400" /> {job.company || companyProfile?.companyName || "N/A"}</div>
                <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> {job.location || companyProfile?.location || "N/A"}</div>
                <div className="flex items-center gap-2 text-green-700 font-semibold">Rs. {Number(job.salary).toLocaleString("en-PK")} / month</div>
                <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> Posted {new Date(job.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="flex gap-3 self-start">
              <Link href={`/dashboard/employer/jobs/${job._id}/edit`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition shadow-sm">
                <Edit size={18} /> Edit
              </Link>
              <button onClick={() => setShowDeleteModal(true)} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition shadow-sm disabled:opacity-50">
                <Trash2 size={18} /> {isDeleting? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

          <div className="border-t pt-5 mt-5">
            <h3 className="font-semibold text-lg mb-3 text-gray-900">Job Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line wrap-break-word">{job.description || "No description provided"}</p>
          </div>

          {/* COMPANY PROFILE CARD - MOBILE RESPONSIVE FIXED */}
<div className="border-t pt-6 mt-6">
  <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Building2 size={16} className="text-blue-600" /> Company Profile</h3>

  <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border">
    {/* Mobile: column | Desktop: row */}
    <div className="flex flex-col sm:flex-row gap-4 sm:items-start">

      {/* 1. LOGO DIV FIRST - always on top on mobile */}
      <div className="w-16 h-16 sm:w-16 sm:h-16 rounded-2xl bg-white overflow-hidden relative flex-shrink-0 ring-1 ring-gray-200 self-start">
        {companyProfile?.companyLogo? (
          <Image src={companyProfile.companyLogo} alt={companyProfile.companyName || "logo"} fill className="object-cover" unoptimized priority />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400"><Building2 size={28} /></div>
        )}
      </div>

      {/* 2. UNDER LOGO - FULL DETAILS ON MOBILE */}
      <div className="flex-1 min-w-0 w-full">
        <p className="font-bold text-[16px] sm:text-[15px] text-gray-900 leading-tight">{companyProfile?.companyName || job.company || job.postedBy?.company || "ITBS - IT Business Solutions"}</p>

        <div className="flex flex-col gap-1.5 mt-3 text-[13px] text-gray-600">
          <span className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /> {companyProfile?.location || job.location || "Lahore"}</span>
          <span className="flex items-center gap-2"><Users size={14} className="text-gray-400" /> {companyProfile?.companySize? `${companyProfile.companySize} employees` : "500+ employees"}</span>
          {companyProfile?.companyWebsite? (
            <a href={`https://${companyProfile.companyWebsite.replace(/^https?:\/\//, '')}`} target="_blank" className="flex items-center gap-2 text-blue-600 hover:underline break-all"><Globe size={14} /> {companyProfile.companyWebsite}</a>
          ) : (
            <span className="flex items-center gap-2"><Globe size={14} /> Website not set</span>
          )}
          {companyProfile?.phone && <span className="flex items-center gap-2">📞 {companyProfile.phone}</span>}
        </div>

        <p className="text-[13px] text-gray-600 mt-4 leading-[1.7] whitespace-pre-line">
          {companyProfile?.companyDescription || "ITBS is a leading IT services and software development company based in Lahore, Pakistan. We specialize in web development, mobile applications, e-commerce solutions, and digital transformation."}
        </p>
      </div>
    </div>
  </div>
</div>
        </div>

        <div className="bg-white rounded-[20px] shadow-sm border p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold flex items-center gap-2"><Users size={20} className="text-blue-600" /> Applicants ({applicationCount})</h3>
            <Link href={`/dashboard/employer/applicants?jobId=${job._id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-sm">
              View All Applicants
            </Link>
          </div>

          {appLoading? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" size={24} /></div>
          ) : applications.length === 0? (
            <div className="text-center py-10 text-gray-500">No applicants yet</div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => {
                const s = app.snapshot;
                if (!s) return null;
                return (
                  <div key={app._id} className="border rounded-xl p-4 flex justify-between items-center hover:shadow-sm transition">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${app.status === 'pending'? 'bg-yellow-100 text-yellow-800' : app.status === 'accepted'? 'bg-green-100 text-green-800' : app.status === 'shortlisted'? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                      {app.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold mb-2">Delete Job?</h3>
              <p className="text-gray-600 mb-5 text-sm">Are you sure you want to delete &quot;{job.title}&quot;? This cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-xl hover:bg-gray-50 transition text-sm">Cancel</button>
                <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50 transition flex items-center gap-2 text-sm">
                  {isDeleting && <Loader2 size={16} className="animate-spin" />}
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