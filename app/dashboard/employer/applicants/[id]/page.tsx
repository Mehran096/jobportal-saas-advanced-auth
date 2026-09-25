"use client";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import DashboardHeader from "@/app/components/DashboardHeader";
import { useGetApplicationByIdQuery, useUpdateApplicationStatusMutation } from "@/lib/redux/api/employerApi";
import { ArrowLeft, Mail, Phone, MapPin, FileText, ExternalLink, Download, Briefcase, Loader2, CheckCircle2, Building2, Globe, Building } from "lucide-react";
import { useState } from "react";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";

type FinalStatus = "shortlisted" | "accepted" | "rejected";
interface CompanyProfile { companyName: string; companyLogo?: string; companyWebsite?: string; companySize?: string; companyDescription?: string; location?: string; phone?: string; }
interface JobInfo { _id?: string; title?: string; company?: string; location?: string; }

export default function ApplicantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<FinalStatus | null>(null);
  const { data, isLoading } = useGetApplicationByIdQuery(id as string);
  const [updateStatus] = useUpdateApplicationStatusMutation();

  if (isLoading) return <div className="min-h-screen bg-white sm:bg-gray-50"><DashboardHeader /><div className="p-6 text-center text-[12px]">Loading candidate...</div></div>;
  if (!data?.application) return <div className="min-h-screen bg-white sm:bg-gray-50"><DashboardHeader /><div className="p-6 text-center text-[12px]">Applicant not found</div></div>;

  const app = data.application;
  const s = app.snapshot;
  const job = data.job as JobInfo | undefined;
  const jobFromApp = app.job as JobInfo | string | undefined;
  const jobTitle = job?.title || (typeof jobFromApp === 'object'? jobFromApp?.title : undefined) || "N/A";
  const jobCompany = job?.company || (typeof jobFromApp === 'object'? jobFromApp?.company : undefined);
  const companyProfile = data.companyProfile as CompanyProfile | undefined;

  if (!s) return <div className="p-6 text-center text-[12px]">No snapshot</div>;

  const handleUpdate = async (status: FinalStatus) => {
    if (!confirm(`Mark as ${status}? Email will be sent.`)) return;
    setLoadingAction(status);
    try { await updateStatus({ id: app._id, status }).unwrap(); router.refresh(); }
    catch (e: unknown) { const err = e as { data?: { message?: string } }; alert(err?.data?.message || "Failed"); }
    finally { setLoadingAction(null); }
  };
  const isFinal = ["accepted", "rejected", "shortlisted"].includes(app.status);

  return (
    <div className="min-h-screen bg-white sm:bg-gray-50">
      <DashboardHeader />
      <main className="max-w-6xl mx-auto px-0 sm:px-6 pb-24 sm:pb-6">
        <div className="px-3 sm:px-0 pt-3 sm:pt-6 mb-3">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white text-[12px] text-gray-700">
            <ArrowLeft size={14} /> Back to Applicants
          </button>
        </div>

        {/* Company - compact */}
        <div className="mx-3 sm:mx-0 bg-white sm:border border-y sm:border-gray-100 sm:rounded-2xl sm:shadow-sm p-3.5 sm:p-5 mb-3">
          <h4 className="font-bold text-[10px] tracking-wide text-gray-500 mb-2.5 flex items-center gap-1"><Building2 size={10} className="text-blue-600"/> YOUR COMPANY</h4>
          <div className="flex gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gray-50 relative overflow-hidden ring-1 ring-gray-200 shrink-0">
              {companyProfile?.companyLogo? <Image src={companyProfile.companyLogo} alt="logo" fill className="object-cover" unoptimized priority /> : <div className="flex items-center justify-center h-full text-gray-400"><Building size={16}/></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[13px] leading-tight truncate">{companyProfile?.companyName || jobCompany || "ITBS"}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px] text-gray-500">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-50 border"><MapPin size={10}/>{companyProfile?.location || "Lahore"}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-50 border"><Building size={10}/>{companyProfile?.companySize || "500+"}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 truncate max-w-30"><Globe size={10}/>{companyProfile?.companyWebsite || "website"}</span>
              </div>
              <p className="text-[11px] text-gray-600 mt-2 leading-snug line-clamp-2">{companyProfile?.companyDescription || "IT services company."}</p>
              <div className="mt-1.5 text-[10px] text-gray-400">Job: <span className="font-semibold text-gray-700">{jobTitle}</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-3 sm:px-0">
          {/* Candidate - compact */}
          <div className="lg:col-span-5 bg-white sm:border border-y sm:border-gray-100 sm:rounded-2xl sm:shadow-sm p-3.5 sm:p-5 h-fit">
            <div className="flex gap-2.5">
              <Image src={s.profileImage || `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}`} width={40} height={40} unoptimized alt="avatar" className="w-10 h-10 rounded-full object-cover border shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-[14px] font-bold leading-tight truncate">{s.firstName} {s.lastName}</h1>
                <p className="text-blue-600 text-[11px] font-medium leading-tight line-clamp-2">{s.headline || "No headline"}</p>
                <p className="text-[10px] text-gray-500 mt-1 truncate">Applied: <b>{jobTitle}</b></p>
              </div>
            </div>

            {s.bio && <p className="text-[12px] text-gray-600 mt-3 leading-normal whitespace-pre-wrap wrap-break-words">{s.bio}</p>}

            <div className="mt-3 space-y-1.5 text-[11px] text-gray-700 border-t border-gray-50 pt-3">
              <p className="flex gap-1.5 items-center truncate"><Mail size={12} className="shrink-0 text-gray-400"/><span className="truncate">{s.email}</span></p>
              <p className="flex gap-1.5 items-center"><Phone size={12} className="shrink-0 text-gray-400"/>{s.phone || "No phone"}</p>
              <p className="flex gap-1.5 items-center truncate"><MapPin size={12} className="shrink-0 text-gray-400"/><span className="truncate">{s.location || "No location"}</span></p>
            </div>

            <div className="mt-3">
              <h4 className="font-semibold flex gap-1 mb-1.5 text-[11px]"><Briefcase size={11}/> Skills</h4>
              <div className="flex flex-wrap gap-1">
                {s.skills?.length? s.skills.map((sk: string) => <span key={sk} className="bg-gray-50 border px-2 py-0.5 rounded-full text-[10px]">{sk}</span>) : <span className="text-[11px] text-gray-400">No skills</span>}
              </div>
            </div>

            <div className="mt-3 bg-blue-50/70 p-2.5 rounded-xl flex items-center justify-between gap-2 border border-blue-100">
              <span className="text-[11px] flex items-center gap-1.5 truncate min-w-0"><FileText size={12} className="shrink-0"/><span className="truncate">{s.resumeName || "resume.pdf"}</span></span>
              <div className="flex gap-1.5 shrink-0">
                <a href={s.resumeUrl} target="_blank" className="bg-white border px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1"><ExternalLink size={11}/> View</a>
                <a href={s.resumeUrl} download className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1"><Download size={11}/> DL</a>
              </div>
            </div>

            {isFinal? (
              <div className="mt-4 p-2.5 bg-gray-50 border border-dashed rounded-xl text-center">
                <CheckCircle2 size={14} className="mx-auto text-green-600 mb-1"/>
                <p className="font-semibold capitalize text-[12px]">Already {app.status}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 mt-4">
                <button onClick={() => handleUpdate("shortlisted")} disabled={!!loadingAction} className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl text-[11px] font-semibold flex justify-center items-center gap-1 disabled:opacity-50">{loadingAction==="shortlisted" && <Loader2 size={11} className="animate-spin"/>} Shortlist</button>
                <button onClick={() => handleUpdate("accepted")} disabled={!!loadingAction} className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-[11px] font-semibold flex justify-center items-center gap-1 disabled:opacity-50">{loadingAction==="accepted" && <Loader2 size={11} className="animate-spin"/>} Accept</button>
                <button onClick={() => handleUpdate("rejected")} disabled={!!loadingAction} className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-[11px] font-semibold flex justify-center items-center gap-1 disabled:opacity-50">{loadingAction==="rejected" && <Loader2 size={11} className="animate-spin"/>} Reject</button>
              </div>
            )}
          </div>

          {/* CV Preview */}
          <div className="lg:col-span-7 bg-white sm:border border-y sm:border-gray-100 sm:rounded-2xl overflow-hidden lg:h-[80vh] flex flex-col">
            <div className="p-2.5 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-[12px] truncate max-w-[65%]">CV - {jobTitle}</h2>
              <span className={`text-[10px] capitalize px-2.5 py-1 rounded-full font-bold border ${app.status==="rejected"? "bg-red-50 text-red-700 border-red-100" : app.status==="accepted"? "bg-green-50 text-green-700 border-green-100" : "bg-yellow-50 text-yellow-700 border-yellow-100"}`}>{app.status}</span>
            </div>
            {s.resumeUrl? (
              <>
                <div className="hidden sm:block flex-1"><iframe src={`${s.resumeUrl}#toolbar=0&navpanes=0`} className="w-full h-full min-h-150" title="CV"/></div>
                <div className="sm:hidden p-3">
                  <div className="rounded-xl border overflow-hidden bg-white">
                    <div className="p-5 text-center bg-gray-50">
                      <div className="w-12 h-12 mx-auto bg-blue-100 rounded-xl flex items-center justify-center mb-2.5"><FileText className="text-blue-600" size={22}/></div>
                      <p className="text-[12px] font-semibold truncate">{s.resumeName}</p>
                      <div className="flex gap-2 mt-3">
                        <a href={s.resumeUrl} target="_blank" className="flex-1 bg-blue-600 text-white text-[11px] font-medium py-2 rounded-xl text-center flex items-center justify-center gap-1"><ExternalLink size={12}/> Preview</a>
                        <a href={s.resumeUrl} download className="flex-1 bg-gray-900 text-white text-[11px] py-2 rounded-xl text-center flex items-center justify-center gap-1"><Download size={12}/> Download</a>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : <div className="flex-1 flex items-center justify-center text-[12px] text-gray-400 p-8">No CV</div>}
          </div>
        </div>
      </main>
      <DashboardMobileNav />
    </div>
  );
}