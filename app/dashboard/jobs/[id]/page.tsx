"use client";
export const dynamic = 'force-dynamic';

import { useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useGetJobByIdQuery } from "@/lib/redux/api/employerApi";
import {
  useApplyForJobMutation,
  useGetMyApplicationsQuery,
  useGetSavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
} from "@/lib/redux/api/jobseekerApi";
import { useGetProfileQuery } from "@/lib/redux/api/profileApi";
import { ArrowLeft, Building, MapPin, Calendar, Users, Loader2, Bookmark, BookmarkCheck, FileText, Building2, Globe } from "lucide-react";
import toast from "react-hot-toast";
import DashboardHeader from "@/app/components/DashboardHeader";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";
import Image from "next/image";

type ApiError = { data?: { message?: string } };
type ProfileWithResume = { resumeUrl?: string; resumeName?: string; resumeOriginalName?: string };

function JobDetailContent() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const jobId = id as string;
  const justEdited = searchParams.get("edited") === "1";

  const { data, isLoading, isError } = useGetJobByIdQuery(jobId, { skip:!jobId, refetchOnMountOrArgChange: true });
  const { data: applications, isLoading: appsLoading } = useGetMyApplicationsQuery();
  const { data: profileData } = useGetProfileQuery();
  const { data: savedData } = useGetSavedJobsQuery();

  const profile = profileData as ProfileWithResume | undefined;

  const [applyForJob, { isLoading: isApplying }] = useApplyForJobMutation();
  const [saveJob, { isLoading: isSaving }] = useSaveJobMutation();
  const [unsaveJob, { isLoading: isUnsaving }] = useUnsaveJobMutation();

  const [showNoCvModal, setShowNoCvModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const job = data?.job;
  const companyProfile = data?.companyProfile;
  const applicationCount = data?.applicationCount || 0;
  const appliedJobIds = Array.isArray(applications)
   ? applications.map((a: { job?: { _id: string } | string }) => typeof a.job === 'object'? a.job?._id : a.job)
    : [];
  const alreadyApplied = appliedJobIds.includes(jobId);
  const isSaved = savedData?.savedJobs?.some((j) => j._id === jobId);

  const directApply = async () => {
    try {
      await applyForJob(jobId).unwrap();
      toast.success("Applied successfully!");
      if (justEdited) router.replace(`/dashboard/jobs/${jobId}`);
    } catch (err) {
      const apiErr = err as ApiError;
      if (!apiErr?.data?.message?.includes("Already applied")) {
        toast.error(apiErr?.data?.message || "Failed to apply");
      }
    }
  };

  const handleApplyClick = () => {
    if (alreadyApplied) return;
    if (!profile?.resumeUrl) {
      setShowNoCvModal(true);
    } else if (justEdited) {
      directApply();
    } else {
      setShowConfirmModal(true);
    }
  };

  const confirmApply = async () => {
    setShowConfirmModal(false);
    await directApply();
  };

  const handleToggleSave = async () => {
    try {
      if (isSaved) { await unsaveJob(jobId).unwrap(); toast.success("Removed from saved"); }
      else { await saveJob(jobId).unwrap(); toast.success("Job saved!"); }
    } catch { toast.error("Failed"); }
  };

  if (isLoading || appsLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
  }

  if (isError ||!job) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Job not found</h2>
        <button onClick={() => router.push("/dashboard/jobs")} className="text-blue-600 hover:underline">Go Back</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="max-w-5xl mb-16 mx-auto p-4 sm:p-6 pb-28 lg:pb-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-lg transition"><ArrowLeft size={20} /></button>
          <h1 className="text-2xl font-bold text-gray-900">Job Details</h1>
          {justEdited && <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">CV updated ✓ Ready to apply</span>}
        </div>

        <div className="bg-white rounded-[20px] shadow-sm border p-6 mb-6">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 flex-1">{job.title}</h2>
              <button onClick={handleToggleSave} disabled={isSaving || isUnsaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium border transition ${isSaved? "bg-purple-50 border-purple-200 text-purple-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                {isSaved? <BookmarkCheck size={18} /> : <Bookmark size={18} />} {isSaved? "Saved" : "Save"}
              </button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-gray-600 mb-4 text-sm">
              <div className="flex items-center gap-2"><Building size={16} className="text-gray-400" /> {companyProfile?.companyName || job.company}</div>
              <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> {companyProfile?.location || job.location}</div>
              <div className="flex items-center gap-2 text-green-700 font-semibold">Rs. {Number(job.salary).toLocaleString("en-PK")} / month</div>
              <div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> Posted {new Date(job.createdAt).toLocaleDateString()}</div>
              <div className="flex items-center gap-2"><Users size={16} className="text-gray-400" /> {applicationCount} Applicants</div>
            </div>
          </div>

          <div className="border-t pt-5 mt-5">
            <h3 className="font-semibold text-lg mb-3 text-gray-900">Job Description</h3>
            <p className="text-gray-700 leading-relaxed wrap-break-word overflow-hidden whitespace-pre-line">{job.description}</p>
          </div>

          {/* PROFESSIONAL COMPANY PROFILE - VISIBLE TO JOBSEEKER */}
          <div className="border-t pt-6 mt-6">
            <h3 className="font-bold text-[13px] tracking-wide text-gray-900 mb-3 flex items-center gap-2"><Building2 size={16} className="text-blue-600" /> ABOUT COMPANY</h3>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border">
              <div className="flex gap-4 items-start">
                <div className="w-14 h-14 rounded-xl bg-white overflow-hidden relative flex-shrink-0 ring-1 ring-gray-200">
                  {companyProfile?.companyLogo? (
                    <Image src={companyProfile.companyLogo} alt={companyProfile.companyName || "logo"} fill className="object-cover" unoptimized priority />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400"><Building2 size={24} /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[15px] text-gray-900">{companyProfile?.companyName || job.company || "Company"}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-gray-500 mt-1.5">
                    <span className="flex items-center gap-1"><MapPin size={12} />{companyProfile?.location || job.location || "Location not set"}</span>
                    <span className="flex items-center gap-1"><Users size={12} />{companyProfile?.companySize? `${companyProfile.companySize} employees` : "Size not specified"}</span>
                    {companyProfile?.companyWebsite && (
                      <a href={`https://${companyProfile.companyWebsite.replace(/^https?:\/\//, '')}`} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline"><Globe size={12} />{companyProfile.companyWebsite}</a>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-600 mt-3 leading-relaxed">
                    {companyProfile?.companyDescription || "This employer has not added a company description yet."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-5 mt-5">
            <button onClick={handleApplyClick} disabled={alreadyApplied || isApplying}
              className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${alreadyApplied? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"}`}>
              {isApplying && <Loader2 size={18} className="animate-spin" />}
              {alreadyApplied? "✓ Applied" : isApplying? "Applying..." : justEdited? "Apply Now (Updated CV)" : "Apply Now"}
            </button>
            {alreadyApplied && <p className="text-center text-sm text-green-600 mt-2">Your CV and profile were sent to employer</p>}
          </div>
        </div>
      </div>

      {showNoCvModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">CV Required</h3>
            <p className="text-gray-600 mt-2 text-sm">Please upload your CV in Profile first to apply for jobs.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowNoCvModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancel</button>
              <button onClick={() => { setShowNoCvModal(false); router.push(`/dashboard/profile?redirect=/dashboard/jobs/${jobId}`); }} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">Go to Profile</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal &&!justEdited && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Ready to Apply?</h3>
            <p className="text-gray-600 mt-2 text-sm">Your CV is ready for this job. Review before sending.</p>
            <div className="mt-4 bg-gray-50 border rounded-lg p-3 flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{profile?.resumeOriginalName || profile?.resumeName || "My_CV.pdf"}</p>
                <a href={profile?.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View CV</a>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Ready</span>
            </div>
            <div className="flex justify-between gap-3 mt-6">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancel</button>
              <div className="flex gap-2">
                <button onClick={() => { setShowConfirmModal(false); router.push(`/dashboard/profile?redirect=/dashboard/jobs/${jobId}`); }} className="px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-medium">Edit CV</button>
                <button onClick={confirmApply} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">Confirm & Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <DashboardMobileNav />
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
      <JobDetailContent />
    </Suspense>
  );
}