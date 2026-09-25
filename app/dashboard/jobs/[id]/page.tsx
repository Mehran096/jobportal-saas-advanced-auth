"use client";
export const dynamic = 'force-dynamic';

import { useState, Suspense, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGetJobByIdQuery } from "@/lib/redux/api/employerApi";
import {
  useApplyForJobMutation,
  useGetMyApplicationsQuery,
  useGetSavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
  type Application,
} from "@/lib/redux/api/jobseekerApi";
import { useGetProfileQuery } from "@/lib/redux/api/profileApi";
import { useReportUserMutation, ReportReason } from "@/lib/redux/api/reportApi";
import { ArrowLeft, Building, MapPin, Calendar, Users, Loader2, Bookmark, BookmarkCheck, FileText, Building2, Globe, Flag, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import DashboardHeader from "@/app/components/DashboardHeader";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";
import Image from "next/image";

type ApiError = { data?: { message?: string } };
type ProfileWithResume = { resumeUrl?: string; resumeName?: string; resumeOriginalName?: string };
type JobRef = { _id: string } | string;

function getJobId(job: JobRef | undefined): string | undefined {
  if (!job) return undefined;
  if (typeof job === 'string') return job;
  return job._id;
}

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
  const [reportUser, { isLoading: isReporting }] = useReportUserMutation();

  const [showNoCvModal, setShowNoCvModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("fake_job");
  const [reportDetails, setReportDetails] = useState("");

  const job = data?.job;
  const companyProfile = data?.companyProfile;
  const applicationCount = data?.applicationCount || 0;

  const applicationsList: Application[] = useMemo(() => {
    if (!applications) return [];
    if (Array.isArray(applications)) return applications as Application[];
    const maybeObj = applications as unknown as { applications?: Application[] };
    return maybeObj.applications?? [];
  }, [applications]);

  const appliedApp = useMemo(() => {
    return applicationsList.find((a) => getJobId(a.job as JobRef) === jobId)?? null;
  }, [applicationsList, jobId]);

  const alreadyApplied = Boolean(appliedApp);
  const appliedAppId = appliedApp?._id;

  const isSaved = savedData?.savedJobs?.some((j) => j._id === jobId);

  const directApply = async () => {
    try {
      await applyForJob(jobId).unwrap();
      toast.success("Applied successfully!");
      if (justEdited) router.replace(`/dashboard/jobs/${jobId}`);
    } catch (err) {
      const apiErr = err as ApiError;
      if (!apiErr?.data?.message?.includes("Already applied")) toast.error(apiErr?.data?.message || "Failed to apply");
    }
  };

  const handleApplyClick = () => {
    if (alreadyApplied) return;
    if (!profile?.resumeUrl) setShowNoCvModal(true);
    else if (justEdited) directApply();
    else setShowConfirmModal(true);
  };
  const confirmApply = async () => { setShowConfirmModal(false); await directApply(); };

  const handleToggleSave = async () => {
    try {
      if (isSaved) { await unsaveJob(jobId).unwrap(); toast.success("Removed from saved"); }
      else { await saveJob(jobId).unwrap(); toast.success("Job saved!"); }
    } catch { toast.error("Failed"); }
  };

  const handleReportSubmit = async () => {
    try {
      const rawPostedBy = job?.postedBy as unknown;
      let postedById: string | undefined;
      if (typeof rawPostedBy === "string") postedById = rawPostedBy;
      else if (rawPostedBy && typeof rawPostedBy === "object" && rawPostedBy!== null && "_id" in rawPostedBy) {
        postedById = (rawPostedBy as { _id: string })._id;
      }
      if (!postedById) { toast.error("Cannot report, owner not found"); return; }
      await reportUser({ reportedUser: postedById, reason: reportReason, details: reportDetails, jobId }).unwrap();
      toast.success("Report sent to admin"); setShowReportModal(false); setReportDetails("");
    } catch (err) { const apiErr = err as ApiError; toast.error(apiErr?.data?.message || "Failed to report"); }
  };

  if (isLoading || appsLoading) return <div className="min-h-screen bg-white sm:bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
  if (isError ||!job) return <div className="max-w-4xl mx-auto p-6 text-center"><h2 className="text-lg font-bold mb-3">Job not found</h2><button onClick={() => router.push("/dashboard/jobs")} className="text-blue-600 text-sm">Go Back</button></div>

  return (
    <div className="min-h-screen bg-white sm:bg-gray-50">
      <DashboardHeader />
      <div className="max-w-3xl mx-auto px-0 sm:px-6 pb-28 sm:pb-6">
        <div className="flex items-center justify-between px-3 sm:px-0 pt-3 sm:pt-6 mb-3">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 p-1.5 rounded-lg text-[13px] text-gray-700 hover:bg-gray-100"><ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span></button>
          {justEdited && <span className="text-[11px] bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium shrink-0">CV updated ✓</span>}
        </div>

        {alreadyApplied && appliedAppId && (
          <div className="mx-3 sm:mx-0 mb-3 bg-green-50 border border-green-200 rounded-xl p-3 flex gap-2.5">
            <div className="shrink-0 w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center"><CheckCircle2 size={14} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-green-800 leading-tight">✓ You have applied for this job</p>
              <p className="text-[11px] sm:text-[12px] text-green-700/80 mt-1 leading-snug">
                Your CV and profile were sent to the employer. Track status in{" "}
                <Link href={`/dashboard/applications/${appliedAppId}`} className="font-semibold underline">
                  My Applications
                </Link>
              </p>
            </div>
          </div>
        )}

        <div className="bg-white sm:rounded-[20px] sm:shadow-sm sm:border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <h2 className="flex-1 min-w-0 text-[18px] sm:text-[22px] font-bold text-gray-900 leading-tight line-clamp-3">{job.title}</h2>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setShowReportModal(true)} className="shrink-0 flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl border bg-white border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 transition">
                  <Flag size={14} /><span className="hidden sm:inline ml-1.5 text-[13px]">Report</span>
                </button>
                <button onClick={handleToggleSave} disabled={isSaving || isUnsaving} className={`shrink-0 flex items-center justify-center gap-1 w-8 h-8 sm:w-auto sm:h-auto sm:px-3.5 sm:py-1.5 rounded-full sm:rounded-xl border font-medium transition ${isSaved? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {isSaving || isUnsaving? <Loader2 size={14} className="animate-spin" /> : isSaved? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                  <span className="hidden sm:inline text-[13px]">{isSaved? "Saved" : "Save"}</span>
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] sm:text-[13px] text-gray-600">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 border"><Building size={11} /> <span className="truncate max-w-30">{companyProfile?.companyName || job.company}</span></span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 border"><MapPin size={11} /> {companyProfile?.location || job.location}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 font-semibold">Rs. {Number(job.salary).toLocaleString("en-PK")}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 border"><Calendar size={11} /> {new Date(job.createdAt).toLocaleDateString()}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 border"><Users size={11} /> {applicationCount}</span>
            </div>
          </div>
          <div className="h-px bg-gray-100 mx-4 sm:mx-6"></div>
          <div className="p-4 sm:p-6">
            <h3 className="font-semibold text-[13px] sm:text-[15px] mb-2">Job Description</h3>
            <p className="text-[13px] sm:text-[14px] text-gray-600 leading-[1.6] whitespace-pre-line wrap-break-words">{job.description}</p>
          </div>
          <div className="h-px bg-gray-100 mx-4 sm:mx-6"></div>
          <div className="p-4 sm:p-6">
            <h3 className="font-bold text-[11px] sm:text-[12px] tracking-wide text-gray-900 mb-3 flex items-center gap-1.5"><Building2 size={14} className="text-blue-600" /> ABOUT COMPANY</h3>
            <div className="bg-gray-50 sm:bg-linear-to-br sm:from-gray-50 sm:to-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-gray-100">
              <div className="flex gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white overflow-hidden relative shrink-0 ring-1 ring-gray-200">
                  {companyProfile?.companyLogo? <Image src={companyProfile.companyLogo} alt="logo" fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full text-gray-400"><Building2 size={18} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px] sm:text-[15px] truncate">{companyProfile?.companyName || job.company}</p>
                  <div className="flex flex-col gap-1 mt-2 text-[11px] sm:text-[13px] text-gray-600">
                    <span className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400 shrink-0" /> <span className="truncate">{companyProfile?.location || job.location}</span></span>
                    <span className="flex items-center gap-1.5"><Users size={12} className="text-gray-400" /> {companyProfile?.companySize? `${companyProfile.companySize} employees` : "500+ employees"}</span>
                    {companyProfile?.companyWebsite && <a href={`https://${companyProfile.companyWebsite.replace(/^https?:\/\//,'')}`} target="_blank" className="flex items-center gap-1.5 text-blue-600 hover:underline truncate"><Globe size={12} /> {companyProfile.companyWebsite}</a>}
                  </div>
                </div>
              </div>
              <p className="text-[12px] sm:text-[13px] text-gray-600 mt-3 leading-[1.6] whitespace-pre-line">{companyProfile?.companyDescription || "No company description."}</p>
            </div>
          </div>
          <div className="hidden sm:block p-4 sm:p-6 pt-0">
            {alreadyApplied && appliedAppId? (
              <Link href={`/dashboard/applications/${appliedAppId}`} className="w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-center text-[13px] font-semibold block">
                ✓ Applied — View Application
              </Link>
            ) : (
              <button onClick={handleApplyClick} disabled={isApplying} className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px] flex items-center justify-center gap-2">
                {isApplying && <Loader2 size={16} className="animate-spin" />}{justEdited? "Apply Now (Updated CV)" : "Apply Now"}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="sm:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-2 z-20">
        <button onClick={handleToggleSave} className={`shrink-0 px-4 py-2.5 rounded-xl border text-[13px] font-semibold ${isSaved? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-gray-200 text-gray-700"}`}>{isSaved? "Saved" : "Save"}</button>
        {alreadyApplied && appliedAppId? (
          <Link href={`/dashboard/applications/${appliedAppId}`} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-center text-[13px] font-semibold">
            ✓ Applied — View
          </Link>
        ) : (
          <button onClick={handleApplyClick} disabled={isApplying} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-semibold flex items-center justify-center gap-1">
            {isApplying && <Loader2 size={14} className="animate-spin" />} Apply Now
          </button>
        )}
      </div>
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3"><div className="bg-white rounded-2xl max-w-md w-full p-5">
          <h3 className="text-[15px] font-bold flex items-center gap-2"><Flag size={16} className="text-red-500" /> Report this Job</h3>
          <div className="mt-3 space-y-2">{[{ value: "fake_job", label: "Fake Job / Fake Salary" },{ value: "spam", label: "Spam" },{ value: "scam", label: "Scam / Asking money" },{ value: "abuse", label: "Abuse" },{ value: "other", label: "Other" }].map((r) => (
            <label key={r.value} className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-[13px] ${reportReason === r.value? "border-red-500 bg-red-50" : "border-gray-200"}`}><input type="radio" checked={reportReason === r.value} onChange={() => setReportReason(r.value as ReportReason)} className="accent-red-600" />{r.label}</label>))}
          </div>
          <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Details (optional)" maxLength={500} rows={3} className="w-full mt-3 p-2.5 border rounded-xl text-[13px] outline-none focus:ring-2 focus:ring-red-500" />
          <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowReportModal(false)} className="px-4 py-2 rounded-xl border text-[13px]">Cancel</button><button onClick={handleReportSubmit} disabled={isReporting} className="px-4 py-2 rounded-xl bg-red-600 text-white text-[13px] flex items-center gap-1">{isReporting && <Loader2 size={14} className="animate-spin" />} Submit</button></div>
        </div></div>
      )}
      {showNoCvModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3"><div className="bg-white rounded-xl max-w-sm w-full p-5"><h3 className="text-[15px] font-semibold">CV Required</h3><p className="text-[13px] text-gray-600 mt-1">Upload CV in Profile first.</p><div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNoCvModal(false)} className="px-3 py-2 rounded-lg border text-[13px]">Cancel</button><button onClick={() => { setShowNoCvModal(false); router.push(`/dashboard/profile?redirect=/dashboard/jobs/${jobId}`); }} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-[13px]">Go to Profile</button></div></div></div>)}
      {showConfirmModal &&!justEdited && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3"><div className="bg-white rounded-xl max-w-md w-full p-5"><h3 className="text-[15px] font-semibold">Ready to Apply?</h3><div className="mt-3 bg-gray-50 border rounded-lg p-2.5 flex items-center gap-2"><div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><FileText size={16} /></div><div className="flex-1 min-w-0"><p className="text-[13px] font-medium truncate">{profile?.resumeOriginalName || profile?.resumeName || "My_CV.pdf"}</p><a href={profile?.resumeUrl} target="_blank" className="text-[11px] text-blue-600 hover:underline">View CV</a></div><span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ready</span></div><div className="flex justify-between gap-2 mt-4"><button onClick={() => setShowConfirmModal(false)} className="px-3 py-2 rounded-lg border text-[13px]">Cancel</button><div className="flex gap-2"><button onClick={() => { setShowConfirmModal(false); router.push(`/dashboard/profile?redirect=/dashboard/jobs/${jobId}`); }} className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[13px]">Edit CV</button><button onClick={confirmApply} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-[13px]">Confirm & Apply</button></div></div></div></div>)}
      <DashboardMobileNav />
    </div>
  );
}

export default function JobDetailPage() {
  return <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={28} /></div>}><JobDetailContent /></Suspense>
}